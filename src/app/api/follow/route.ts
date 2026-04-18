import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET — списки following/followers для текущего или произвольного пользователя (public data)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const username = searchParams.get("username");

  if (type !== "following" && type !== "followers") {
    return NextResponse.json({ error: "type required (following or followers)" }, { status: 400 });
  }

  // Определяем userId: либо по username, либо из сессии
  let userId: number;
  if (username) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }
    userId = user.id;
  } else {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    userId = Number(session.user.id);
  }

  const selectUser = {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    avatarPreset: true,
  };

  if (type === "following") {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: selectUser } },
    });
    return NextResponse.json({ users: follows.map((f) => f.following) });
  }

  const follows = await prisma.follow.findMany({
    where: { followingId: userId },
    include: { follower: { select: selectUser } },
  });
  return NextResponse.json({ users: follows.map((f) => f.follower) });
}

// POST — toggle подписка/отписка
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { targetUserId } = await req.json();

  if (!targetUserId) {
    return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
  }

  const followerId = Number(session.user.id);
  const followingId = Number(targetUserId);

  if (followerId === followingId) {
    return NextResponse.json({ error: "cannot follow yourself" }, { status: 400 });
  }

  // Проверяем существует ли подписка
  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });

  if (existing) {
    // Отписка
    await prisma.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  } else {
    // Подписка
    await prisma.follow.create({
      data: { followerId, followingId },
    });
    return NextResponse.json({ following: true });
  }
}
