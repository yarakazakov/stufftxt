import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type") || "users";

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  if (type === "users") {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { displayName: { contains: q } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
      take: 50,
    });
    return NextResponse.json({ results: users });
  }

  if (type === "items") {
    // Поиск по Product: только те, у которых есть хотя бы один Item в публичной папке.
    // Атрибуция автора не возвращается.
    const products = await prisma.product.findMany({
      where: {
        title: { contains: q },
        items: {
          some: {
            folder: { isPublic: true },
          },
        },
      },
      select: {
        id: true,
        title: true,
        url: true,
        imageUrl: true,
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ results: products });
  }

  return NextResponse.json({ results: [] });
}
