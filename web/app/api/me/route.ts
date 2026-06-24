import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ authed: false });
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return Response.json({ authed: true, balance: user?.bonusBalance ?? 0, name: user?.name ?? "", phone: user?.phone ?? "" });
}
