// Создаёт администратора (email из ADMIN_EMAIL) с паролем для входа в /admin.
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();
const email = (process.env.ADMIN_EMAIL || "admin@farmati.ru").toLowerCase();
const password = "farmati2026";

function hash(p) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(p, salt, 64).toString("hex");
}

const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  console.log("Админ уже есть:", email);
} else {
  await prisma.user.create({ data: { email, name: "Татьяна (админ)", passwordHash: hash(password), bonusBalance: 0 } });
  console.log("Создан админ:", email, "| пароль:", password);
}
await prisma.$disconnect();
