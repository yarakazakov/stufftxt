import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// POST — создание позиции
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { title, description, url, imageUrl, folderId } = await req.json();

  if (!title || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  if (!folderId) {
    return NextResponse.json({ error: "folderId is required" }, { status: 400 });
  }

  // Проверяем что папка принадлежит пользователю
  const folder = await prisma.folder.findFirst({
    where: { id: Number(folderId), userId: Number(session.user.id) },
  });

  if (!folder) {
    return NextResponse.json({ error: "folder not found" }, { status: 404 });
  }

  const item = await prisma.item.create({
    data: {
      userId: Number(session.user.id),
      folderId: Number(folderId),
      title: title.trim(),
      description: description?.trim() || null,
      url: url?.trim() || null,
      imageUrl: imageUrl || null,
    },
  });

  return NextResponse.json(item);
}
