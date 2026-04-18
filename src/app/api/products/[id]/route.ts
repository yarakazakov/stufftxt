import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products/[id] — карточка товара. Без атрибуции автора.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = Number(id);

  if (!productId) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      title: true,
      url: true,
      imageUrl: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}
