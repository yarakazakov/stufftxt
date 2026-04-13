import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// PUT — обновление позиции
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
  });

  if (!item) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: {
      title: title?.trim() || item.title,
      description: description !== undefined ? description?.trim() || null : item.description,
      url: url !== undefined ? url?.trim() || null : item.url,
      imageUrl: imageUrl !== undefined ? imageUrl || null : item.imageUrl,
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
