import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Текущий пользователь, если он администратор (email совпадает с ADMIN_EMAIL).
export async function getAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  return adminEmail && user.email.toLowerCase() === adminEmail ? user : null;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  return admin;
}
