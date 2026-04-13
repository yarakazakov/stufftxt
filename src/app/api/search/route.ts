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
    const items = await prisma.item.findMany({
      where: {
        title: { contains: q },
        folder: { isPublic: true },
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        folder: {
          select: {
            name: true,
            slug: true,
            user: {
              select: { username: true },
            },
          },
        },
      },
      take: 50,
    });
    return NextResponse.json({ results: items });
  }

  return NextResponse.json({ results: [] });
}
