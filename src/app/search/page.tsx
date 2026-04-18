"use client";

import { useState } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useSession } from "next-auth/react";

interface UserResult {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ItemResult {
  id: number;
  title: string;
  url: string | null;
  imageUrl: string | null;
}

export default function SearchPage() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"users" | "items">("users");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [itemResults, setItemResults] = useState<ItemResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearched(true);

    if (tab === "users") {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=users`);
      const data = await res.json();
      setUserResults(data.results || []);
    } else {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=items`);
      const data = await res.json();
      setItemResults(data.results || []);
    }
  };

  const switchTab = (newTab: "users" | "items") => {
    setTab(newTab);
    setSearched(false);
    setUserResults([]);
    setItemResults([]);
  };

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "stuff.txt", href: session ? "/dashboard" : "/" },
          { label: "search" },
        ]}
      />

      <h1>search</h1>

      <form onSubmit={handleSearch} style={{ marginTop: 8, marginBottom: 16 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search..."
          autoFocus
          style={{ marginBottom: 8 }}
        />
        <button type="submit">search</button>
      </form>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => switchTab("users")}
          style={{ fontWeight: tab === "users" ? "bold" : "normal" }}
        >
          users
        </button>
        {" | "}
        <button
          onClick={() => switchTab("items")}
          style={{ fontWeight: tab === "items" ? "bold" : "normal" }}
        >
          items
        </button>
      </div>

      {tab === "users" && searched && (
        <div>
          {userResults.length === 0 && <p style={{ color: "#666" }}>no users found</p>}
          {userResults.map((u) => (
            <div key={u.id} style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}>
              <span style={{ fontWeight: "bold" }}>{u.username}</span>
              {u.displayName && <span style={{ color: "#666" }}> — {u.displayName}</span>}
              {" "}
              <Link href={`/u/${u.username}`}>view profile</Link>
            </div>
          ))}
        </div>
      )}

      {tab === "items" && searched && (
        <div>
          {itemResults.length === 0 && <p style={{ color: "#666" }}>no items found</p>}
          {itemResults.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "6px 0",
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {item.imageUrl && (
                <img src={item.imageUrl} alt="" style={{ width: 32, height: 32, objectFit: "cover" }} />
              )}
              <Link href={`/products/${item.id}`} style={{ fontWeight: "bold" }}>
                {item.title}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
