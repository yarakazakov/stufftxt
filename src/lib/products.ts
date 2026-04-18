import { prisma } from "@/lib/prisma";

function normalize(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

export function makeDedupeKey(title: string, url: string | null | undefined): string {
  return `${normalize(title)}|${normalize(url)}`;
}

// Находит Product по (title, url) или создаёт новый.
// Если Product найден и у него нет картинки, а нам передали — обновляем.
export async function findOrCreateProduct(input: {
  title: string;
  url?: string | null;
  imageUrl?: string | null;
}) {
  const title = input.title.trim();
  const url = input.url?.trim() || null;
  const imageUrl = input.imageUrl?.trim() || null;
  const dedupeKey = makeDedupeKey(title, url);

  const existing = await prisma.product.findUnique({ where: { dedupeKey } });

  if (existing) {
    if (!existing.imageUrl && imageUrl) {
      return prisma.product.update({
        where: { id: existing.id },
        data: { imageUrl },
      });
    }
    return existing;
  }

  return prisma.product.create({
    data: { title, url, imageUrl, dedupeKey },
  });
}
