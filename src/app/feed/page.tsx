"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";

interface FeedItem {
  id: number;
  title: string;
  url: string | null;
  imageUrl: string | null;
}

interface FeedFolder {
  folderId: number;
  folderName: string;
  folderSlug: string;
  items: FeedItem[];
}

interface FeedPost {
  user: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  date: string;
  folders: FeedFolder[];
}

// Форматирование даты: "april 13" (текущий год) или "december 5, 2025" (прошлый год)
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const now = new Date();
  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();

  if (date.getFullYear() === now.getFullYear()) {
    return `${month} ${day}`;
  }
  return `${month} ${day}, ${date.getFullYear()}`;
}

export default function FeedPage() {
  const { status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Какие папки в каком посте раскрыты (для "+N more")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const loadFeed = useCallback(async (cursor?: string | null) => {
    const url = cursor
      ? `/api/feed?cursor=${encodeURIComponent(cursor)}&limit=20`
      : "/api/feed?limit=20";

    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    return data;
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      loadFeed().then((data) => {
        if (data) {
          setPosts(data.posts);
          setHasMore(data.hasMore);
          setNextCursor(data.nextCursor);
        }
        setLoading(false);
      });
    }
  }, [status, router, loadFeed]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const data = await loadFeed(nextCursor);
    if (data) {
      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    }
    setLoadingMore(false);
  };

  const toggleExpand = (postKey: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(postKey)) next.delete(postKey);
      else next.add(postKey);
      return next;
    });
  };

  if (status !== "authenticated") return <p>loading...</p>;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "wishlist", href: "/dashboard" },
          { label: "feed" },
        ]}
      />

      <h1>feed</h1>

      {loading && <p style={{ marginTop: 16 }}>loading...</p>}

      {!loading && posts.length === 0 && (
        <div style={{ marginTop: 16, color: "#666" }}>
          <p>your feed is empty. subscribe to someone to see their wishlists here.</p>
          <p style={{ marginTop: 8 }}>
            <Link href="/search">find people</Link>
          </p>
        </div>
      )}

      {posts.map((post, postIdx) => {
        const avatarLetter = (post.user.username || "?")[0].toUpperCase();

        return (
          <div
            key={`${post.user.username}-${post.date}`}
            style={{
              borderBottom: "1px solid #ccc",
              padding: "12px 0",
              ...(postIdx === 0 ? { marginTop: 12 } : {}),
            }}
          >
            {/* Header: avatar + username + date */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {post.user.avatarUrl ? (
                <img src={post.user.avatarUrl} alt="" style={{ width: 24, height: 24 }} />
              ) : (
                <div
                  style={{
                    width: 24,
                    height: 24,
                    background: "#ccc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: 12,
                  }}
                >
                  {avatarLetter}
                </div>
              )}
              <span>
                <Link href={`/u/${post.user.username}`}>
                  {post.user.displayName || post.user.username}
                </Link>
                <span style={{ color: "#666" }}> &middot; {formatDate(post.date)}</span>
              </span>
            </div>

            {/* Folders with items */}
            {post.folders.map((folder) => {
              const folderKey = `${post.user.username}-${post.date}-${folder.folderId}`;
              const isExpanded = expandedFolders.has(folderKey);
              const maxVisible = 5;
              const visibleItems = isExpanded
                ? folder.items
                : folder.items.slice(0, maxVisible);
              const hiddenCount = folder.items.length - maxVisible;

              return (
                <div key={folder.folderId} style={{ marginLeft: 32, marginBottom: 4 }}>
                  <div style={{ color: "#666", marginBottom: 2 }}>
                    added to{" "}
                    <Link href={`/u/${post.user.username}`}>
                      {folder.folderName}
                    </Link>
                    :
                  </div>
                  <div style={{ marginLeft: 16 }}>
                    {visibleItems.map((item) => (
                      <div key={item.id} style={{ padding: "1px 0" }}>
                        &middot; {item.title}
                        {item.url && (
                          <>
                            {" "}
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: 13 }}
                            >
                              [link]
                            </a>
                          </>
                        )}
                      </div>
                    ))}
                    {hiddenCount > 0 && !isExpanded && (
                      <div
                        onClick={() => toggleExpand(folderKey)}
                        style={{ color: "#666", cursor: "pointer", padding: "1px 0" }}
                      >
                        (+{hiddenCount} more)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Load more */}
      {hasMore && (
        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <button onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? "loading..." : "load more"}
          </button>
        </div>
      )}
    </div>
  );
}
