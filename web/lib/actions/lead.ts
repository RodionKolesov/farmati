"use server";

import { prisma } from "@/lib/prisma";
import { isValidPhone } from "@/lib/validate";

export type LeadState = { ok?: boolean; error?: string } | undefined;

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!name) return { error: "Укажите имя" };
  if (!isValidPhone(phone)) return { error: "Укажите корректный номер телефона" };
  await prisma.lead.create({ data: { name, phone, message } });
  return { ok: true };
}
