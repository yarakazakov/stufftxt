"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";

interface FollowUser {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export default function FollowingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<FollowUser[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/follow?type=following")
        .then((r) => r.json())
        .then((data) => setUsers(data.users || []));
    }
  }, [status, router]);

  if (status !== "authenticated") return <p>loading...</p>;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "stuff.txt", href: "/dashboard" },
          { label: "following" },
        ]}
      />
      <h1>following</h1>
      <p style={{ margin: "8px 0 16px" }}>
        <Link href="/dashboard">&larr; back to dashboard</Link>
      </p>
      {users.length === 0 && <p style={{ color: "#666" }}>you are not following anyone yet</p>}
      {users.map((u) => (
        <div key={u.id} style={{ padding: "4px 0" }}>
          <Link href={`/u/${u.username}`}>{u.displayName || u.username}</Link>
          {u.displayName && <span style={{ color: "#666" }}> @{u.username}</span>}
        </div>
      ))}
    </div>
  );
}
