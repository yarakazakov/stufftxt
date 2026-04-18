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
      avatarPreset: true,
      bio: true,
      email: true,
      emailVerified: true,
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    followersCount: user._count.followers,
    followingCount: user._count.following,
  });
}

// PUT — обновление профиля
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { displayName, bio, avatarUrl, avatarPreset } = await req.json();

  const updated = await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: {
      displayName: displayName?.trim() || null,
      bio: bio?.trim()?.slice(0, 200) || null,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      avatarPreset: avatarPreset !== undefined ? avatarPreset : undefined,
    },
  });

  return NextResponse.json(updated);
}
