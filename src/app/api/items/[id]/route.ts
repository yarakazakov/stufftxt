import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { findOrCreateProduct } from "@/lib/products";

// PUT — обновление позиции.
// Если меняется title/url/imageUrl — перепривязываем Item на другой Product (find-or-create).
// description всегда остаётся на Item (личная заметка).
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const itemId = Number(id);
  const { title, description, url, imageUrl } = await req.json();

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: Number(session.user.id) },
    include: { product: true },
  });

  if (!item) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Решаем — нужно ли перепривязать Product
  const newTitle = title !== undefined ? title?.trim() || item.product.title : item.product.title;
  const newUrl = url !== undefined ? url?.trim() || null : item.product.url;
  const newImageUrl = imageUrl !== undefined ? imageUrl || null : item.product.imageUrl;

  const productChanged =
    newTitle !== item.product.title ||
    newUrl !== item.product.url ||
    newImageUrl !== item.product.imageUrl;

  let productId = item.productId;
  if (productChanged) {
    const product = await findOrCreateProduct({
      title: newTitle,
      url: newUrl,
      imageUrl: newImageUrl,
    });
    productId = product.id;
  }

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: {
      productId,
      description: description !== undefined ? description?.trim() || null : item.description,
    },
  });

  return NextResponse.json(updated);
}

// DELETE — удаление позиции
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const itemId = Number(id);

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: Number(session.user.id) },
  });

  if (!item) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.item.delete({ where: { id: itemId } });

  return NextResponse.json({ ok: true });
}
