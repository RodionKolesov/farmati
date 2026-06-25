import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ authed: false });
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  const admin = !!adminEmail && (user?.email ?? "").toLowerCase() === adminEmail;
  return Response.json({ authed: true, admin, balance: user?.bonusBalance ?? 0, name: user?.name ?? "", phone: user?.phone ?? "", email: user?.email ?? "" });
}
