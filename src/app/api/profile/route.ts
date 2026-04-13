import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET — текущий профиль
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      email: true,
      emailVerified: true,
    },
  });

  return NextResponse.json(user);
}

// PUT — обновление профиля
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { displayName, bio, avatarUrl } = await req.json();

  const updated = await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: {
      displayName: displayName?.trim() || null,
      bio: bio?.trim()?.slice(0, 200) || null,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
    },
  });

  return NextResponse.json(updated);
}
