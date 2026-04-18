import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { findOrCreateProduct } from "@/lib/products";

// POST — создание позиции.
// Принимает либо { title, url, imageUrl, description, folderId } — создаётся новый Product (или reuse)
// Либо { productId, description, folderId } — привязка к существующему Product (из карточки)
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, url, imageUrl, folderId, productId } = body;

  if (!folderId) {
    return NextResponse.json({ error: "folderId is required" }, { status: 400 });
  }

  const folder = await prisma.folder.findFirst({
    where: { id: Number(folderId), userId: Number(session.user.id) },
  });

  if (!folder) {
    return NextResponse.json({ error: "folder not found" }, { status: 404 });
  }

  let product;
  if (productId) {
    product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product) {
      return NextResponse.json({ error: "product not found" }, { status: 404 });
    }
  } else {
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    product = await findOrCreateProduct({ title, url, imageUrl });
  }

  const item = await prisma.item.create({
    data: {
      userId: Number(session.user.id),
      folderId: Number(folderId),
      productId: product.id,
      description: description?.trim() || null,
    },
  });

  if (folder.isPublic) {
    await prisma.feedEvent.create({
      data: {
        userId: Number(session.user.id),
        itemId: item.id,
        folderId: Number(folderId),
      },
    });
  }

  return NextResponse.json(item);
}
