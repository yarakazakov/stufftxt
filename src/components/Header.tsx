"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Header() {
  const { data: session, status } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Загрузка аватара для залогиненного пользователя
  useEffect(() => {
    if (session?.user?.username) {
      fetch(`/api/users/${session.user.username}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        })
        .catch(() => {});
    }
  }, [session?.user?.username]);

  return (
    <header
      style={{
        borderBottom: "1px solid #ccc",
        padding: "8px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <Link
          href={status === "authenticated" ? "/dashboard" : "/"}
          style={{ fontWeight: "bold", textDecoration: "none" }}
        >
          wishlist
        </Link>
      </div>
      <nav>
        {status === "authenticated" && session?.user ? (
          <>
            <Link href="/feed">feed</Link>
            {" | "}
            <Link href="/search">search</Link>
            {" | "}
            <Link href={`/u/${session.user.username}`}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  style={{
                    width: 16,
                    height: 16,
                    verticalAlign: "middle",
                    marginRight: 4,
                  }}
                />
              ) : null}
              my profile
            </Link>
            {" | "}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                background: "none",
                border: "none",
                color: "#0000EE",
                cursor: "pointer",
                padding: 0,
                fontSize: "inherit",
                fontFamily: "inherit",
                textDecoration: "underline",
              }}
            >
              log out
            </button>
          </>
        ) : status === "unauthenticated" ? (
          <>
            <Link href="/search">search</Link>
            {" | "}
            <Link href="/login">log in</Link>
            {" | "}
            <Link href="/register">register</Link>
          </>
        ) : null}
      </nav>
    </header>
  );
}
