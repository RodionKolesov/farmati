"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { WELCOME_BONUS, bonusExpiryFrom } from "@/lib/bonus";
import { isValidEmail, isValidPhone } from "@/lib/validate";
import { signIn, signOut, auth } from "@/auth";

export type PwState = { ok?: boolean; error?: string } | undefined;

export async function changePassword(_prev: PwState, formData: FormData): Promise<PwState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Не авторизованы" };
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 6) return { error: "Новый пароль не короче 6 символов" };
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !verifyPassword(current, user.passwordHash)) return { error: "Текущий пароль неверный" };
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(next) } });
  return { ok: true };
}

export type AuthState = { error?: string } | undefined;

export async function registerUser(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name) return { error: "Укажите имя" };
  if (!isValidEmail(email)) return { error: "Некорректный email" };
  if (!isValidPhone(phone)) return { error: "Некорректный номер телефона (10–15 цифр)" };
  if (!password || password.length < 6) return { error: "Пароль не короче 6 символов" };
  if (password !== password2) return { error: "Пароли не совпадают" };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Пользователь с таким email уже есть" };

  const user = await prisma.user.create({
    data: { email, name, phone, passwordHash: hashPassword(password), bonusBalance: WELCOME_BONUS },
  });
  await prisma.bonusTransaction.create({
    data: {
      userId: user.id,
      delta: WELCOME_BONUS,
      type: "earn",
      note: "Приветственные бонусы",
      remaining: WELCOME_BONUS,
      expiresAt: bonusExpiryFrom(new Date()),
    },
  });

  await signIn("credentials", { email, password, redirectTo: "/account" });
  return undefined;
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

export async function loginUser(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", { email, password, redirectTo: "/account" });
  } catch (err) {
    // signIn бросает redirect-исключение при успехе — пробрасываем его дальше.
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { error: "Неверный email или пароль" };
  }
  return undefined;
}
