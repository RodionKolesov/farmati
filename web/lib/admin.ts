import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Список email-ов админов. Поддерживает несколько аккаунтов сразу:
// ADMIN_EMAILS="a@x.ru, b@x.ru" (через запятую) и/или старую переменную ADMIN_EMAIL.
function adminEmails(): string[] {
  return `${process.env.ADMIN_EMAILS || ""},${process.env.ADMIN_EMAIL || ""}`
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Текущий пользователь, если он администратор (email входит в список админов).
export async function getAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;
  return adminEmails().includes(user.email.toLowerCase()) ? user : null;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  return admin;
}
