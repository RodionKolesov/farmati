import "server-only";
import { prisma } from "@/lib/prisma";

// Купил ли пользователь курс (есть оплаченный заказ с этим курсом).
export async function hasPurchasedCourse(userId: string | undefined, courseId: string): Promise<boolean> {
  if (!userId) return false;
  const item = await prisma.orderItem.findFirst({
    where: { courseId, order: { userId, status: "paid" } },
  });
  return !!item;
}
