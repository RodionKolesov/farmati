-- ============================================================================
-- Косметический бренд: схема личного кабинета и бонусной системы
-- Supabase (PostgreSQL). Применяется через `supabase db push` или SQL Editor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Таблицы
-- ---------------------------------------------------------------------------

-- Профиль пользователя. id совпадает с auth.users.id.
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text,
  phone         text,
  full_name     text,
  bonus_balance integer not null default 0 check (bonus_balance >= 0),
  created_at    timestamptz not null default now()
);

-- Нормализованный телефон для надёжного сопоставления с входящими заказами.
-- (только цифры; удобно искать по "хвосту" номера)
create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists profiles_phone_idx on public.profiles (phone);

-- Заказы, прилетевшие из вебхука сайта.
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles (id) on delete set null,
  external_order_id text unique,              -- идемпотентность: один заказ = одна строка
  email         text,
  phone         text,
  amount        numeric(12, 2) not null default 0,
  bonus_earned  integer not null default 0,
  bonus_spent   integer not null default 0,
  raw           jsonb,                         -- исходный payload заказа на всякий случай
  created_at    timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

-- История движений бонусов (источник истины для баланса).
create table if not exists public.bonus_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  order_id   uuid references public.orders (id) on delete set null,
  delta      integer not null,                 -- >0 начисление, <0 списание
  type       text not null check (type in ('earn', 'spend')),
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists bonus_tx_user_idx on public.bonus_transactions (user_id, created_at desc);

-- Промокоды, сгенерированные пользователем из баланса (для списания в корзине сайта).
create table if not exists public.promo_codes (
  code       text primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  amount     integer not null check (amount > 0),
  used       boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists promo_user_idx on public.promo_codes (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Триггер: автосоздание профиля при регистрации пользователя
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, phone, full_name)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RPC: начисление бонусов за заказ (вызывается Edge Function с service_role)
-- Идемпотентно по external_order_id. earn_rate — доля от суммы (например 0.05 = 5%).
-- ---------------------------------------------------------------------------
create or replace function public.accrue_order_bonus(
  p_external_order_id text,
  p_email          text,
  p_phone          text,
  p_amount         numeric,
  p_earn_rate      numeric default 0.05,
  p_raw            jsonb default '{}'::jsonb
)
returns table (order_id uuid, user_id uuid, bonus_earned integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_order_id uuid;
  v_earned integer;
  v_phone_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  -- Уже обрабатывали этот заказ? Возвращаем существующую строку.
  select o.id, o.user_id, o.bonus_earned
    into v_order_id, v_user_id, v_earned
  from public.orders o
  where o.external_order_id = p_external_order_id;

  if found then
    return query select v_order_id, v_user_id, v_earned;
    return;
  end if;

  -- Ищем пользователя сначала по email, затем по последним 10 цифрам телефона.
  select p.id into v_user_id
  from public.profiles p
  where lower(p.email) = lower(p_email)
  limit 1;

  if v_user_id is null and length(v_phone_digits) >= 10 then
    select p.id into v_user_id
    from public.profiles p
    where regexp_replace(coalesce(p.phone, ''), '\D', '', 'g')
          like '%' || right(v_phone_digits, 10)
    limit 1;
  end if;

  v_earned := floor(coalesce(p_amount, 0) * coalesce(p_earn_rate, 0))::integer;

  insert into public.orders (user_id, external_order_id, email, phone, amount, bonus_earned, raw)
  values (v_user_id, p_external_order_id, p_email, p_phone, p_amount, case when v_user_id is null then 0 else v_earned end, p_raw)
  returning id into v_order_id;

  -- Если пользователь не найден — заказ сохранён, но бонусы не начислены.
  if v_user_id is null then
    return query select v_order_id, null::uuid, 0;
    return;
  end if;

  insert into public.bonus_transactions (user_id, order_id, delta, type, note)
  values (v_user_id, v_order_id, v_earned, 'earn', 'Начисление за заказ ' || p_external_order_id);

  update public.profiles
    set bonus_balance = bonus_balance + v_earned
  where id = v_user_id;

  return query select v_order_id, v_user_id, v_earned;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: списание баланса в промокод (вызывает сам пользователь из кабинета)
-- Работает от имени текущего пользователя (auth.uid()).
-- ---------------------------------------------------------------------------
create or replace function public.redeem_bonus_to_promo(p_amount integer)
returns public.promo_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance integer;
  v_code text;
  v_row public.promo_codes;
begin
  if v_user_id is null then
    raise exception 'Не авторизован';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Сумма должна быть больше 0';
  end if;

  select bonus_balance into v_balance from public.profiles where id = v_user_id for update;

  if v_balance < p_amount then
    raise exception 'Недостаточно бонусов: доступно %, запрошено %', v_balance, p_amount;
  end if;

  -- Уникальный человекочитаемый код.
  v_code := 'BNS-' || upper(substr(md5(v_user_id::text || clock_timestamp()::text), 1, 8));

  update public.profiles set bonus_balance = bonus_balance - p_amount where id = v_user_id;

  insert into public.bonus_transactions (user_id, delta, type, note)
  values (v_user_id, -p_amount, 'spend', 'Списание в промокод ' || v_code);

  insert into public.promo_codes (code, user_id, amount)
  values (v_code, v_user_id, p_amount)
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.orders              enable row level security;
alter table public.bonus_transactions  enable row level security;
alter table public.promo_codes         enable row level security;

-- Пользователь видит/правит только свой профиль (баланс правит только сервер через RPC).
drop policy if exists "own profile read"  on public.profiles;
create policy "own profile read"  on public.profiles for select using (auth.uid() = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "own orders read" on public.orders;
create policy "own orders read" on public.orders for select using (auth.uid() = user_id);

drop policy if exists "own bonus tx read" on public.bonus_transactions;
create policy "own bonus tx read" on public.bonus_transactions for select using (auth.uid() = user_id);

drop policy if exists "own promo read" on public.promo_codes;
create policy "own promo read" on public.promo_codes for select using (auth.uid() = user_id);

-- Запись в orders/bonus_transactions/promo_codes идёт только через SECURITY DEFINER
-- функции (service_role в Edge Function или RPC), поэтому INSERT-политик для
-- обычных пользователей намеренно нет.
