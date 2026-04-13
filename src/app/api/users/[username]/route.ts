import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const session = await getSession();

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
      folders: {
        where: { isPublic: true },
        include: {
          items: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  // Проверяем подписан ли текущий пользователь
  let isFollowing = false;
  if (session?.user?.id) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: Number(session.user.id),
          followingId: user.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  return NextResponse.json({
    ...user,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    isFollowing,
  });
}
