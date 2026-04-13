"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";

interface Item {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
}

interface Folder {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  items: Item[];
}

interface UserProfile {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  folders: Folder[];
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { data: session } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [openFolders, setOpenFolders] = useState<Set<number>>(new Set());
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${username}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => setUser(data))
      .catch(() => setNotFound(true));
  }, [username]);

  if (notFound) {
    return (
      <div>
        <h1>user not found</h1>
        <p style={{ marginTop: 8 }}>
          <Link href="/search">search for users</Link>
        </p>
      </div>
    );
  }

  if (!user) return <p>loading...</p>;

  const toggleFolder = (id: number) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleItem = (id: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: user.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setUser((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: data.following,
              followersCount: prev.followersCount + (data.following ? 1 : -1),
            }
          : prev
      );
    }
    setFollowLoading(false);
  };

  const isOwnProfile = session?.user?.username === username;
  const avatarLetter = (user.username || "?")[0].toUpperCase();

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "wishlist", href: session ? "/dashboard" : "/" },
          { label: user.username },
        ]}
      />

      {/* Профиль */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" style={{ width: 60, height: 60 }} />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              background: "#ccc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: 24,
            }}
          >
            {avatarLetter}
          </div>
        )}
        <div>
          <h1>{user.displayName || user.username}</h1>
          {user.displayName && <p style={{ color: "#666" }}>@{user.username}</p>}
          {user.bio && <p style={{ marginTop: 4 }}>{user.bio}</p>}
          <p style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
            {user.followersCount} followers | {user.followingCount} following
          </p>
        </div>
      </div>

      {/* Кнопка подписки */}
      {session && !isOwnProfile && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={handleFollow} disabled={followLoading}>
            {user.isFollowing ? "unsubscribe" : "subscribe"}
          </button>
        </div>
      )}

      {isOwnProfile && (
        <p style={{ marginBottom: 16 }}>
          <Link href="/dashboard">go to dashboard</Link>
          {" | "}
          <Link href="/dashboard/settings">edit profile</Link>
        </p>
      )}

      {/* Папки */}
      {user.folders.length === 0 && (
        <p style={{ color: "#666" }}>this user has no public wishlists yet</p>
      )}
      {user.folders.map((folder) => (
        <div key={folder.id} style={{ borderBottom: "1px solid #ccc", marginBottom: 8 }}>
          <div
            onClick={() => toggleFolder(folder.id)}
            style={{ cursor: "pointer", padding: "8px 0", fontWeight: "bold" }}
          >
            {openFolders.has(folder.id) ? "[-]" : "[+]"} {folder.name} ({folder.items.length})
          </div>

          {openFolders.has(folder.id) && (
            <div style={{ paddingLeft: 16, paddingBottom: 8 }}>
              {folder.description && <p style={{ color: "#666", marginBottom: 8 }}>{folder.description}</p>}
              {folder.items.length === 0 && <p style={{ color: "#666" }}>no items</p>}
              {folder.items.map((item) => (
                <div key={item.id} style={{ marginBottom: 4 }}>
                  <div
                    onClick={() => toggleItem(item.id)}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {item.imageUrl && <img src={item.imageUrl} alt="" style={{ width: 24, height: 24 }} />}
                    <span>{item.title}</span>
                  </div>
                  {openItems.has(item.id) && (
                    <div style={{ paddingLeft: 32, paddingTop: 4, paddingBottom: 4 }}>
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt="" style={{ maxWidth: 300, display: "block", marginBottom: 4 }} />
                      )}
                      {item.description && <p>{item.description}</p>}
                      {item.url && (
                        <p>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
