// Проверка: создаём пользователя+заказ, дёргаем реальный вебхук, проверяем бонусы и идемпотентность.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const email = `e2e_${Date.now()}@farmati.ru`;
const user = await prisma.user.create({ data: { email, passwordHash: "x:y", name: "E2E", bonusBalance: 0 } });
const order = await prisma.order.create({
  data: { userId: user.id, status: "pending", subtotal: 2000, amount: 2000, bonusSpent: 0 },
});

async function hitWebhook() {
  const res = await fetch("http://localhost:3000/api/payments/webhook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event: "payment.succeeded", object: { id: "pay_test_1", metadata: { orderId: order.id } } }),
  });
  return res.status;
}

console.log("webhook #1:", await hitWebhook());
let u = await prisma.user.findUnique({ where: { id: user.id } });
let o = await prisma.order.findUnique({ where: { id: order.id } });
console.log(`после #1: статус=${o.status}, начислено=${o.bonusEarned}, баланс=${u.bonusBalance}`);

console.log("webhook #2 (дубль):", await hitWebhook());
u = await prisma.user.findUnique({ where: { id: user.id } });
console.log(`после #2 (идемпотентность): баланс=${u.bonusBalance}`);

const txs = await prisma.bonusTransaction.count({ where: { userId: user.id } });
console.log(`bonus-транзакций: ${txs}`);

// уборка
await prisma.bonusTransaction.deleteMany({ where: { userId: user.id } });
await prisma.order.deleteMany({ where: { userId: user.id } });
await prisma.user.delete({ where: { id: user.id } });
console.log(u.bonusBalance === 100 && txs === 1 ? "РЕЗУЛЬТАТ: OK ✅" : "РЕЗУЛЬТАТ: FAIL ❌");
await prisma.$disconnect();
