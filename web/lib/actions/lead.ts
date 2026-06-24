"use server";

import { prisma } from "@/lib/prisma";

export type LeadState = { ok?: boolean; error?: string } | undefined;

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!name || !phone) return { error: "Укажите имя и телефон" };
  await prisma.lead.create({ data: { name, phone, message } });
  return { ok: true };
}
