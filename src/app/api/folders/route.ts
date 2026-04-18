import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateSlug } from "@/lib/slug";

// GET — список папок текущего пользователя
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const folders = await prisma.folder.findMany({
    where: { userId: Number(session.user.id) },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: { product: true },
      },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(folders);
}

// POST — создание папки
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { name, description, isPublic } = await req.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const slug = generateSlug(name);

  const folder = await prisma.folder.create({
    data: {
      userId: Number(session.user.id),
      name: name.trim(),
      description: description?.trim() || null,
      isPublic: Boolean(isPublic),
      slug,
    },
  });

  return NextResponse.json(folder);
}
