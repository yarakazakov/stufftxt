"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Product {
  id: number;
  title: string;
  url: string | null;
  imageUrl: string | null;
}

interface Folder {
  id: number;
  name: string;
  isPublic: boolean;
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | "">("");
  const [notFound, setNotFound] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => data && setProduct(data));
  }, [id]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/folders")
        .then((r) => r.json())
        .then((data: Folder[]) => {
          setFolders(data);
          if (data.length > 0) setSelectedFolder(data[0].id);
        });
    }
  }, [status]);

  const handleAdd = async () => {
    if (!selectedFolder || !product) return;
    setAdding(true);
    setError("");
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        folderId: selectedFolder,
      }),
    });
    setAdding(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "failed");
      return;
    }
    setAdded(true);
  };

  if (notFound) {
    return (
      <div>
        <Breadcrumbs
          items={[
            { label: "stuff.txt", href: session ? "/dashboard" : "/" },
            { label: "not found" },
          ]}
        />
        <p style={{ marginTop: 16 }}>product not found</p>
      </div>
    );
  }

  if (!product) return <p>loading...</p>;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "stuff.txt", href: session ? "/dashboard" : "/" },
          { label: "search", href: "/search" },
          { label: product.title },
        ]}
      />

      <h1>{product.title}</h1>

      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt=""
          style={{ maxWidth: 400, display: "block", marginTop: 8, marginBottom: 8 }}
        />
      )}

      {product.url && (
        <p>
          <a href={product.url} target="_blank" rel="noopener noreferrer">
            {product.url}
          </a>
        </p>
      )}

      {/* Add to folder */}
      <div style={{ marginTop: 16, borderTop: "1px solid #ccc", paddingTop: 16 }}>
        {status === "unauthenticated" && (
          <p style={{ color: "#666" }}>
            <Link href="/login">log in</Link> to add this to your list
          </p>
        )}

        {status === "authenticated" && folders.length === 0 && (
          <p style={{ color: "#666" }}>
            you have no folders yet.{" "}
            <Link href="/dashboard">create one first</Link>
          </p>
        )}

        {status === "authenticated" && folders.length > 0 && !added && (
          <div>
            <button onClick={handleAdd} disabled={adding || !selectedFolder}>
              {adding ? "adding..." : "add to my list"}
            </button>
            {" "}
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(Number(e.target.value))}
              style={{ width: "auto" }}
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.isPublic ? "[public]" : "[private]"}
                </option>
              ))}
            </select>
            {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
          </div>
        )}

        {added && (
          <p style={{ color: "#666" }}>
            added.{" "}
            <button
              onClick={() => {
                setAdded(false);
              }}
            >
              add to another folder
            </button>
            {" | "}
            <Link href="/dashboard">go to dashboard</Link>
          </p>
        )}
      </div>
    </div>
  );
}
