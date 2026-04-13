import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// PUT — обновление папки
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const folderId = Number(id);
  const { name, description, isPublic } = await req.json();

  // Проверяем что папка принадлежит пользователю
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId: Number(session.user.id) },
  });

  if (!folder) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const updated = await prisma.folder.update({
    where: { id: folderId },
    data: {
      name: name?.trim() || folder.name,
      description: description?.trim() || null,
      isPublic: isPublic !== undefined ? Boolean(isPublic) : folder.isPublic,
    },
  });

  return NextResponse.json(updated);
}

// DELETE — удаление папки
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const folderId = Number(id);

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId: Number(session.user.id) },
  });

  if (!folder) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.folder.delete({ where: { id: folderId } });

  return NextResponse.json({ ok: true });
}
