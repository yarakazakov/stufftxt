"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Avatar from "@/components/Avatar";
import Link from "next/link";

interface Item {
  id: number;
  description: string | null;
  product: {
    id: number;
    title: string;
    url: string | null;
    imageUrl: string | null;
  };
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
  avatarPreset: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  folders: Folder[];
}

interface FollowUser {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatarPreset: string | null;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { data: session } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [followLoading, setFollowLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Модалка списка followers / following
  const [listModal, setListModal] = useState<"followers" | "following" | null>(null);
  const [listUsers, setListUsers] = useState<FollowUser[] | null>(null);
  const [listLoading, setListLoading] = useState(false);

  const openList = async (type: "followers" | "following") => {
    setListModal(type);
    setListUsers(null);
    setListLoading(true);
    try {
      const res = await fetch(`/api/follow?type=${type}&username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json();
        setListUsers(data.users || []);
      } else {
        setListUsers([]);
      }
    } catch {
      setListUsers([]);
    }
    setListLoading(false);
  };

  const closeList = () => {
    setListModal(null);
    setListUsers(null);
  };

  useEffect(() => {
    if (!listModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeList();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [listModal]);

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

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.host}/u/${user.username}`
    : `stuff.txt/u/${user.username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/u/${user.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "stuff.txt", href: session ? "/dashboard" : "/" },
          { label: `${user.username} · profile` },
        ]}
      />

      {/* Баннер "public profile" */}
      <div
        style={{
          background: "#f0f0f0",
          border: "1px solid #ccc",
          padding: "6px 12px",
          marginBottom: 16,
          fontSize: 13,
          color: "#555",
          textAlign: "center",
        }}
      >
        public profile
        {isOwnProfile && (
          <span style={{ color: "#888" }}> · this is how others see you</span>
        )}
      </div>

      {/* Карточка-витрина */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "24px 16px",
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <Avatar
            username={user.username}
            avatarUrl={user.avatarUrl}
            avatarPreset={user.avatarPreset}
            size={96}
            round
          />
        </div>

        <h1 style={{ fontSize: 22 }}>{user.displayName || user.username}</h1>
        {user.displayName && (
          <p style={{ color: "#666", marginTop: 2 }}>@{user.username}</p>
        )}
        {user.bio && (
          <p style={{ marginTop: 8, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            {user.bio}
          </p>
        )}

        <p style={{ color: "#666", fontSize: 13, marginTop: 10 }}>
          <button
            type="button"
            onClick={() => openList("followers")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "#0000EE",
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {user.followersCount} followers
          </button>
          {" · "}
          <button
            type="button"
            onClick={() => openList("following")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "#0000EE",
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {user.followingCount} following
          </button>
        </p>

        {/* Share url */}
        <div
          style={{
            marginTop: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            border: "1px solid #ccc",
            padding: "4px 8px",
            background: "#fafafa",
          }}
        >
          <span style={{ color: "#666" }}>{shareUrl}</span>
          <button onClick={handleCopy} style={{ fontSize: 12, padding: "2px 8px" }}>
            {copied ? "copied" : "copy"}
          </button>
        </div>

        {/* Кнопки действий */}
        <div style={{ marginTop: 14 }}>
          {session && !isOwnProfile && (
            <button onClick={handleFollow} disabled={followLoading}>
              {user.isFollowing ? "unsubscribe" : "subscribe"}
            </button>
          )}
          {isOwnProfile && (
            <span style={{ fontSize: 13 }}>
              <Link href="/dashboard">back to my stuff</Link>
              {" · "}
              <Link href="/dashboard/settings">edit profile</Link>
            </span>
          )}
        </div>
      </div>

      {/* Публичные папки — read-only вид */}
      {user.folders.length === 0 && (
        <p style={{ color: "#666", textAlign: "center" }}>
          {isOwnProfile
            ? "you have no public wishlists yet. make a folder public in my stuff."
            : "this user has no public wishlists yet"}
        </p>
      )}

      {user.folders.map((folder) => (
        <section key={folder.id} style={{ marginBottom: 28 }}>
          <div
            style={{
              borderBottom: "1px solid #000",
              paddingBottom: 4,
              marginBottom: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <h2 style={{ fontSize: 17 }}>{folder.name}</h2>
            <span style={{ fontSize: 13, color: "#666" }}>
              {folder.items.length} {folder.items.length === 1 ? "item" : "items"}
            </span>
          </div>

          {folder.description && (
            <p style={{ color: "#666", marginBottom: 10, fontSize: 14 }}>
              {folder.description}
            </p>
          )}

          {folder.items.length === 0 ? (
            <p style={{ color: "#888", fontSize: 13, fontStyle: "italic" }}>empty</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {folder.items.map((item) => (
                <li
                  key={item.id}
                  style={{
                    padding: "6px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div
                    onClick={() => toggleItem(item.id)}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt=""
                        style={{
                          width: 36,
                          height: 36,
                          objectFit: "cover",
                          border: "1px solid #eee",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          background: "#f5f5f5",
                          border: "1px solid #eee",
                        }}
                      />
                    )}
                    <Link
                      href={`/products/${item.product.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.product.title}
                    </Link>
                  </div>

                  {openItems.has(item.id) && (
                    <div style={{ paddingLeft: 46, paddingTop: 6 }}>
                      {item.product.imageUrl && (
                        <img
                          src={item.product.imageUrl}
                          alt=""
                          style={{ maxWidth: 260, display: "block", marginBottom: 6 }}
                        />
                      )}
                      {item.description && <p>{item.description}</p>}
                      {item.product.url && (
                        <p style={{ marginTop: 4 }}>
                          <a
                            href={item.product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.product.url}
                          </a>
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {/* Modal: список followers / following */}
      {listModal && (
        <>
          <div
            onClick={closeList}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.3)",
              zIndex: 90,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#fff",
              border: "1px solid #000",
              padding: 16,
              width: "100%",
              maxWidth: 360,
              maxHeight: "70vh",
              overflowY: "auto",
              zIndex: 100,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 12,
              }}
            >
              <strong>{listModal}</strong>
              <button
                type="button"
                onClick={closeList}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 0,
                }}
                aria-label="close"
              >
                x
              </button>
            </div>

            {listLoading && <p style={{ color: "#666" }}>loading...</p>}

            {!listLoading && listUsers && listUsers.length === 0 && (
              <p style={{ color: "#666", fontSize: 13 }}>
                {listModal === "followers" ? "no followers yet" : "not following anyone yet"}
              </p>
            )}

            {!listLoading && listUsers && listUsers.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {listUsers.map((u) => (
                  <li
                    key={u.id}
                    style={{
                      padding: "8px 0",
                      borderBottom: "1px solid #eee",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Avatar
                      username={u.username}
                      avatarUrl={u.avatarUrl}
                      avatarPreset={u.avatarPreset}
                      size={28}
                      round
                    />
                    <Link
                      href={`/u/${u.username}`}
                      onClick={closeList}
                      style={{ flex: 1 }}
                    >
                      {u.displayName || u.username}
                    </Link>
                    {u.displayName && (
                      <span style={{ color: "#666", fontSize: 12 }}>@{u.username}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
