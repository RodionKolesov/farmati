"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/slug";
import { expireBonuses } from "@/lib/bonusLedger";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const IMG_EXTS = ["jpg", "jpeg", "png", "webp", "avif"];

// Универсальная загрузка файла в public/<subdir>, возвращает /<subdir>/<file> или null.
async function saveTo(
  file: FormDataEntryValue | null,
  slug: string,
  subdir: string,
  exts: string[],
  fallback: string,
): Promise<string | null> {
  if (!file || typeof file === "string") return null;
  const f = file as File;
  if (!f.size) return null;
  const ext = (f.name.split(".").pop() || fallback).toLowerCase();
  const safe = exts.includes(ext) ? ext : fallback;
  const fname = `${slug}-${Date.now().toString(36)}.${safe}`;
  const dir = path.join(process.cwd(), "public", subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fname), Buffer.from(await f.arrayBuffer()));
  return `/${subdir}/${fname}`;
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/courses");
}

// Сохраняет загруженное фото в public/products и возвращает путь вида /products/...,
// либо null, если файл не приложен.
async function saveImage(file: FormDataEntryValue | null, slug: string): Promise<string | null> {
  if (!file || typeof file === "string") return null;
  const f = file as File;
  if (!f.size) return null;
  const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
  const safe = ["jpg", "jpeg", "png", "webp", "avif"].includes(ext) ? ext : "jpg";
  const fname = `${slug}-${Date.now().toString(36)}.${safe}`;
  const dir = path.join(process.cwd(), "public", "products");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fname), Buffer.from(await f.arrayBuffer()));
  return `/products/${fname}`;
}

// ───────────── Товары ─────────────
export async function createProduct(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const slug = slugify(name);
  const uploaded = await saveImage(formData.get("imageFile"), slug);
  await prisma.product.create({
    data: {
      name,
      slug,
      category: String(formData.get("category") ?? "Уход").trim() || "Уход",
      price: parseInt(String(formData.get("price") ?? "0"), 10) || 0,
      image: uploaded ?? String(formData.get("image") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      stock: Math.max(0, parseInt(String(formData.get("stock") ?? "0"), 10) || 0),
    },
  });
  refresh();
  redirect("/admin/products");
}

export async function updateProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const pname = String(formData.get("name") ?? "").trim();
  const uploaded = await saveImage(formData.get("imageFile"), slugify(pname || id));
  await prisma.product.update({
    where: { id },
    data: {
      name: pname,
      category: String(formData.get("category") ?? "").trim(),
      price: parseInt(String(formData.get("price") ?? "0"), 10) || 0,
      image: uploaded ?? String(formData.get("image") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      stock: Math.max(0, parseInt(String(formData.get("stock") ?? "0"), 10) || 0),
    },
  });
  refresh();
  redirect("/admin/products");
}

// Быстрое изменение остатка из списка товаров.
export async function updateStock(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const stock = Math.max(0, parseInt(String(formData.get("stock") ?? "0"), 10) || 0);
  await prisma.product.update({ where: { id }, data: { stock } });
  refresh();
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  await prisma.product.delete({ where: { id: String(formData.get("id")) } });
  refresh();
  redirect("/admin/products");
}

// ───────────── Курсы ─────────────
export async function createCourse(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const slug = slugify(title);
  const uploaded = await saveImage(formData.get("imageFile"), slug);
  await prisma.course.create({
    data: {
      title,
      slug,
      price: parseInt(String(formData.get("price") ?? "0"), 10) || 0,
      oldPrice: formData.get("oldPrice") ? parseInt(String(formData.get("oldPrice")), 10) : null,
      duration: String(formData.get("duration") ?? "").trim(),
      lessonsCount: parseInt(String(formData.get("lessonsCount") ?? "0"), 10) || 0,
      image: uploaded ?? String(formData.get("image") ?? "").trim(),
      summary: String(formData.get("summary") ?? "").trim(),
    },
  });
  refresh();
  redirect("/admin/courses");
}

export async function updateCourse(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const ctitle = String(formData.get("title") ?? "").trim();
  const uploaded = await saveImage(formData.get("imageFile"), slugify(ctitle || id));
  await prisma.course.update({
    where: { id },
    data: {
      title: ctitle,
      price: parseInt(String(formData.get("price") ?? "0"), 10) || 0,
      oldPrice: formData.get("oldPrice") ? parseInt(String(formData.get("oldPrice")), 10) : null,
      duration: String(formData.get("duration") ?? "").trim(),
      lessonsCount: parseInt(String(formData.get("lessonsCount") ?? "0"), 10) || 0,
      image: uploaded ?? String(formData.get("image") ?? "").trim(),
      summary: String(formData.get("summary") ?? "").trim(),
    },
  });
  refresh();
  redirect("/admin/courses/" + id);
}

export async function deleteCourse(formData: FormData) {
  await requireAdmin();
  await prisma.course.delete({ where: { id: String(formData.get("id")) } });
  refresh();
  redirect("/admin/courses");
}

// ───────────── Уроки ─────────────
export async function createLesson(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId"));
  await prisma.lesson.create({
    data: {
      courseId,
      title: String(formData.get("title") ?? "").trim(),
      videoUrl: String(formData.get("videoUrl") ?? "").trim(),
      free: formData.get("free") === "on",
      order: parseInt(String(formData.get("order") ?? "0"), 10) || 0,
    },
  });
  revalidatePath("/courses");
  redirect("/admin/courses/" + courseId);
}

export async function updateLesson(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const courseId = String(formData.get("courseId"));
  await prisma.lesson.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? "").trim(),
      videoUrl: String(formData.get("videoUrl") ?? "").trim(),
      free: formData.get("free") === "on",
      order: parseInt(String(formData.get("order") ?? "0"), 10) || 0,
    },
  });
  revalidatePath("/courses");
  redirect("/admin/courses/" + courseId);
}

export async function deleteLesson(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId"));
  await prisma.lesson.delete({ where: { id: String(formData.get("id")) } });
  redirect("/admin/courses/" + courseId);
}

// ───────────── Чек-листы / рекомендации ─────────────
export async function createChecklist(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const slug = slugify(title) || "checklist";
  const fileUrl = await saveTo(formData.get("file"), slug, "checklists", ["pdf"], "pdf");
  const image = await saveTo(formData.get("imageFile"), slug, "checklists", IMG_EXTS, "jpg");
  await prisma.checklist.create({
    data: {
      title,
      description: String(formData.get("description") ?? "").trim(),
      fileUrl: fileUrl ?? String(formData.get("fileUrl") ?? "").trim(),
      image: image ?? "",
      order: parseInt(String(formData.get("order") ?? "0"), 10) || 0,
    },
  });
  revalidatePath("/club");
  redirect("/admin/checklists");
}

export async function deleteChecklist(formData: FormData) {
  await requireAdmin();
  await prisma.checklist.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/club");
  redirect("/admin/checklists");
}

// ───────────── Отзывы «до/после» ─────────────
export async function createReview(formData: FormData) {
  await requireAdmin();
  const author = String(formData.get("author") ?? "").trim();
  if (!author) return;
  const slug = slugify(author) || "review";
  const before = await saveTo(formData.get("beforeImage"), slug + "-before", "reviews", IMG_EXTS, "jpg");
  const after = await saveTo(formData.get("afterImage"), slug + "-after", "reviews", IMG_EXTS, "jpg");
  await prisma.review.create({
    data: {
      author,
      text: String(formData.get("text") ?? "").trim(),
      rating: Math.min(5, Math.max(1, parseInt(String(formData.get("rating") ?? "5"), 10) || 5)),
      beforeImage: before ?? "",
      afterImage: after ?? "",
      order: parseInt(String(formData.get("order") ?? "0"), 10) || 0,
    },
  });
  revalidatePath("/");
  redirect("/admin/reviews");
}

export async function deleteReview(formData: FormData) {
  await requireAdmin();
  await prisma.review.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/");
  redirect("/admin/reviews");
}

// ───────────── Бонусы: ручное сгорание просроченных ─────────────
export async function expireBonusesNow() {
  await requireAdmin();
  await expireBonuses();
  revalidatePath("/admin");
  redirect("/admin");
}
