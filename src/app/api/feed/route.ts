import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

interface FeedPost {
  user: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    avatarPreset: string | null;
  };
  date: string;
  folders: {
    folderId: number;
    folderName: string;
    folderSlug: string;
    items: {
      id: number;
      productId: number;
      title: string;
      url: string | null;
      imageUrl: string | null;
    }[];
  }[];
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor"); // ISO timestamp
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

  const userId = Number(session.user.id);

  // 1. Получаем список тех, на кого подписан
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = follows.map((f) => f.followingId);

  if (followingIds.length === 0) {
    return NextResponse.json({ posts: [], hasMore: false });
  }

  // 2. Выбираем события из FeedEvent
  const events = await prisma.feedEvent.findMany({
    where: {
      userId: { in: followingIds },
      folder: { isPublic: true }, // Проверяем что папка до сих пор публичная
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    include: {
      user: {
        select: { username: true, displayName: true, avatarUrl: true, avatarPreset: true },
      },
      item: {
        select: {
          id: true,
          productId: true,
          product: {
            select: { title: true, url: true, imageUrl: true },
          },
        },
      },
      folder: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
    // Берём больше чтобы потом сгруппировать в ~limit постов
    take: limit * 10,
  });

  // 3. Группировка: userId + день → пост, внутри по folderId
  const postsMap = new Map<string, FeedPost>();

  for (const event of events) {
    const dateStr = event.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
    const key = `${event.userId}-${dateStr}`;

    if (!postsMap.has(key)) {
      postsMap.set(key, {
        user: event.user,
        date: dateStr,
        folders: [],
      });
    }

    const post = postsMap.get(key)!;
    let folderGroup = post.folders.find((f) => f.folderId === event.folder.id);

    if (!folderGroup) {
      folderGroup = {
        folderId: event.folder.id,
        folderName: event.folder.name,
        folderSlug: event.folder.slug,
        items: [],
      };
      post.folders.push(folderGroup);
    }

    // Избегаем дубликатов
    if (!folderGroup.items.some((i) => i.id === event.item.id)) {
      folderGroup.items.push({
        id: event.item.id,
        productId: event.item.productId,
        title: event.item.product.title,
        url: event.item.product.url,
        imageUrl: event.item.product.imageUrl,
      });
    }
  }

  // 4. Сортировка постов по дате (свежие первые)
  const allPosts = Array.from(postsMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 5. Пагинация: возвращаем limit постов
  const paginatedPosts = allPosts.slice(0, limit);
  const hasMore = allPosts.length > limit;

  // Cursor для следующей страницы: самая старая дата + 1 день назад
  const lastPost = paginatedPosts[paginatedPosts.length - 1];
  const nextCursor = lastPost
    ? new Date(lastPost.date + "T00:00:00.000Z").toISOString()
    : null;

  return NextResponse.json({
    posts: paginatedPosts,
    hasMore,
    nextCursor,
  });
}
