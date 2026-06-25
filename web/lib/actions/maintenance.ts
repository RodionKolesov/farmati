"use server";

import "server-only";
import { promises as fs, type Dirent } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import { requireAdmin } from "@/lib/admin";

const pexec = promisify(exec);

export type ServerStats = {
  disk: { total: number; free: number; used: number; pct: number } | null;
  mem: { total: number; free: number; used: number; pct: number };
  cacheBytes: number;
};

export type CleanState = { ok?: boolean; freed?: number; steps?: string[]; error?: string } | undefined;

function appRoot() {
  return process.cwd();
}

function mb(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} МБ`;
}

// Рекурсивно считает размер папки. Молча пропускает исчезнувшие файлы.
async function dirSize(dir: string): Promise<number> {
  let total = 0;
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    try {
      if (e.isDirectory()) total += await dirSize(full);
      else if (e.isFile()) total += (await fs.stat(full)).size;
    } catch {
      // файл могли удалить во время обхода — игнорируем
    }
  }
  return total;
}

export async function getServerStats(): Promise<ServerStats> {
  await requireAdmin();

  let disk: ServerStats["disk"] = null;
  try {
    type StatFs = { bsize: number; blocks: number; bavail: number };
    const statfs = (fs as unknown as { statfs: (p: string) => Promise<StatFs> }).statfs;
    const s = await statfs(appRoot());
    const total = s.blocks * s.bsize;
    const free = s.bavail * s.bsize;
    disk = { total, free, used: total - free, pct: total ? Math.round(((total - free) / total) * 100) : 0 };
  } catch {
    disk = null;
  }

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const mem = {
    total: totalMem,
    free: freeMem,
    used: totalMem - freeMem,
    pct: totalMem ? Math.round(((totalMem - freeMem) / totalMem) * 100) : 0,
  };

  const cacheBytes = await dirSize(path.join(appRoot(), ".next", "cache"));

  return { disk, mem, cacheBytes };
}

// Безопасно освобождает место: только временные кэши и логи.
// НЕ трогает базу данных, загруженные файлы и сам сайт.
export async function cleanCache(_prev: CleanState, _form: FormData): Promise<CleanState> {
  await requireAdmin();
  const steps: string[] = [];
  let freed = 0;

  // 1) .next/cache — кэш сборки и оптимизации картинок. Next пересоздаёт сам.
  const cacheDir = path.join(appRoot(), ".next", "cache");
  try {
    const before = await dirSize(cacheDir);
    await fs.rm(cacheDir, { recursive: true, force: true });
    await fs.mkdir(cacheDir, { recursive: true });
    freed += before;
    steps.push(`Кэш сборки сайта: освобождено ${mb(before)}`);
  } catch {
    steps.push("Кэш сборки: не удалось очистить");
  }

  // 2) Кэш загрузок npm — нужен только при обновлении сайта.
  try {
    await pexec("npm cache clean --force", { timeout: 60000 });
    steps.push("Кэш npm очищен");
  } catch {
    steps.push("Кэш npm: пропущен (недоступен)");
  }

  // 3) Логи приложения pm2 (если установлен).
  try {
    await pexec("pm2 flush", { timeout: 30000 });
    steps.push("Логи приложения очищены");
  } catch {
    // pm2 может отсутствовать (например, локально) — не критично
  }

  return { ok: true, freed, steps };
}
