"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { FeedIcon, SearchIcon, LogoutIcon, PlusIcon } from "./Icons";
import Avatar from "./Avatar";
import QuickAddModal from "./QuickAddModal";

export default function Header() {
  const { data: session, status } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreset, setAvatarPreset] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Загрузка аватара для залогиненного пользователя
  useEffect(() => {
    if (session?.user?.username) {
      fetch(`/api/users/${session.user.username}`)
        .then((r) => r.json())
        .then((data) => {
          setAvatarUrl(data.avatarUrl ?? null);
          setAvatarPreset(data.avatarPreset ?? null);
        })
        .catch(() => {});
    }
  }, [session?.user?.username]);

  return (
    <header
      style={{
        borderBottom: "1px solid #ccc",
        padding: "8px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
      <div style={{ display: "inline-flex", alignItems: "center", gap: 16 }}>
        <Link
          href={status === "authenticated" ? "/dashboard" : "/"}
          style={{
            fontWeight: "bold",
            textDecoration: "none",
            color: "#000",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Logo size={16} />
          stuff.txt
        </Link>
        {status === "authenticated" && session?.user && (
          <Link
            href="/feed"
            title="feed"
            aria-label="feed"
            style={{ display: "inline-flex", alignItems: "center", color: "#000" }}
          >
            <FeedIcon size={18} />
          </Link>
        )}
      </div>
      <nav style={{ display: "flex", alignItems: "center", gap: 16, color: "#000" }}>
        {status === "authenticated" && session?.user ? (
          <>
            <button
              onClick={() => setShowQuickAdd(true)}
              title="add item"
              aria-label="add item"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#000",
                border: "1px solid #000",
                width: 22,
                height: 22,
                background: "#f0f0f0",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <PlusIcon size={14} />
            </button>
            <Link
              href="/search"
              title="search"
              aria-label="search"
              style={{ display: "inline-flex", alignItems: "center", color: "#000" }}
            >
              <SearchIcon size={18} />
            </Link>
            <Link
              href={`/u/${session.user.username}`}
              title="my profile"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
                color: "#000",
              }}
            >
              <Avatar
                username={session.user.username}
                avatarUrl={avatarUrl}
                avatarPreset={avatarPreset}
                size={22}
                round
              />
              <span style={{ textDecoration: "underline" }}>{session.user.username}</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="log out"
              aria-label="log out"
              style={{
                background: "none",
                border: "none",
                color: "#000",
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <LogoutIcon size={18} />
            </button>
          </>
        ) : status === "unauthenticated" ? (
          <>
            <Link
              href="/search"
              title="search"
              aria-label="search"
              style={{ display: "inline-flex", alignItems: "center", color: "#000" }}
            >
              <SearchIcon size={18} />
            </Link>
            <Link href="/login">log in</Link>
            <Link href="/register">register</Link>
          </>
        ) : null}
      </nav>
      </div>
      {showQuickAdd && <QuickAddModal onClose={() => setShowQuickAdd(false)} />}
    </header>
  );
}
