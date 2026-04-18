"use client";

import { useEffect, useRef, useState } from "react";

interface Folder {
  id: number;
  name: string;
  isPublic: boolean;
}

interface Props {
  onClose: () => void;
}

export default function QuickAddModal({ onClose }: Props) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState<number | "__new__" | "">("");
  const [inlineFolderName, setInlineFolderName] = useState("");
  const [inlineFolderPublic, setInlineFolderPublic] = useState(false);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  const [og, setOg] = useState<{ title?: string; imageUrl?: string } | null>(null);
  const [ogLoading, setOgLoading] = useState(false);
  const [urlFetched, setUrlFetched] = useState("");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Загрузка списка папок при монтировании
  useEffect(() => {
    fetch("/api/folders")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Folder[]) => {
        setFolders(data);
        if (data.length > 0) setFolderId(data[0].id);
        else setFolderId("__new__");
      })
      .catch(() => setFolderId("__new__"));
  }, []);

  // Esc закрывает
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const uploadFile = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      return data.imageUrl as string;
    }
    return null;
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) setImageUrl(url);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          const url = await uploadFile(file);
          if (url) setImageUrl(url);
        }
      }
    }
  };

  const fetchOg = async (u: string) => {
    if (!u || u === urlFetched) return;
    setUrlFetched(u);
    setOgLoading(true);
    setOg(null);
    try {
      const res = await fetch("/api/og-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl || data.title) setOg(data);
      }
    } catch {
      // ignore
    }
    setOgLoading(false);
  };

  const createInlineFolder = async (): Promise<number | null> => {
    if (!inlineFolderName.trim()) return null;
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: inlineFolderName.trim(), isPublic: inlineFolderPublic }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id as number;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("title is required");
      return;
    }

    setSaving(true);

    let fId: number;
    if (folderId === "__new__") {
      if (!inlineFolderName.trim()) {
        setError("enter folder name");
        setSaving(false);
        return;
      }
      const newId = await createInlineFolder();
      if (!newId) {
        setError("failed to create folder");
        setSaving(false);
        return;
      }
      fId = newId;
    } else if (folderId) {
      fId = folderId as number;
    } else {
      setError("choose a folder");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        url,
        imageUrl,
        folderId: fId,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "failed");
      return;
    }
    // Сигнал страницам обновить свой контент (дашборд слушает это событие)
    window.dispatchEvent(new CustomEvent("stufftxt:item-added"));
    onClose();
  };

  return (
    <>
      {/* Затемнение-ловушка кликов */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.2)",
          zIndex: 90,
        }}
      />
      {/* Сама панелька под шапкой */}
      <div
        ref={panelRef}
        onPaste={handlePaste}
        style={{
          position: "fixed",
          top: 48,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#fff",
          border: "1px solid #000",
          padding: 16,
          width: "100%",
          maxWidth: 440,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <strong>add item</strong>
          <button
            onClick={onClose}
            type="button"
            style={{ border: "none", background: "none", cursor: "pointer", fontSize: 16, padding: 0 }}
            aria-label="close"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* folder */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13 }}>folder *</label>
            <select
              value={folderId}
              onChange={(e) => {
                const v = e.target.value;
                setFolderId(v === "__new__" ? "__new__" : v === "" ? "" : Number(v));
              }}
            >
              <option value="">— select —</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.isPublic ? "[public]" : "[private]"}
                </option>
              ))}
              <option value="__new__">+ create new folder</option>
            </select>

            {folderId === "__new__" && (
              <div style={{ marginTop: 6, padding: 6, border: "1px solid #ccc" }}>
                <input
                  value={inlineFolderName}
                  onChange={(e) => setInlineFolderName(e.target.value)}
                  placeholder="folder name"
                  autoFocus
                  style={{ marginBottom: 4 }}
                />
                <label style={{ fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={inlineFolderPublic}
                    onChange={(e) => setInlineFolderPublic(e.target.checked)}
                    style={{ width: "auto", marginRight: 4 }}
                  />
                  public
                </label>
              </div>
            )}
          </div>

          {/* url */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13 }}>url</label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setOg(null);
                setUrlFetched("");
              }}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v) fetchOg(v);
              }}
              placeholder="https://..."
            />
            {ogLoading && <span style={{ fontSize: 12, color: "#666" }}> fetching...</span>}

            {og?.imageUrl && !imageUrl && (
              <div style={{ marginTop: 6, padding: 6, border: "1px solid #ccc", fontSize: 12 }}>
                <span style={{ color: "#666" }}>suggested image:</span>{" "}
                <img src={og.imageUrl} alt="" style={{ width: 36, height: 36, objectFit: "cover", verticalAlign: "middle", margin: "0 6px" }} />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl(og.imageUrl!);
                    setOg(null);
                  }}
                  style={{ fontSize: 12 }}
                >
                  use
                </button>{" "}
                <button
                  type="button"
                  onClick={() => setOg(null)}
                  style={{ fontSize: 12, color: "#666" }}
                >
                  skip
                </button>
              </div>
            )}
            {og?.title && !title && (
              <div style={{ marginTop: 4, fontSize: 12, color: "#666" }}>
                <button
                  type="button"
                  onClick={() => {
                    setTitle(og.title!);
                    setOg((prev) => (prev ? { ...prev, title: undefined } : null));
                  }}
                  style={{ fontSize: 12 }}
                >
                  use &ldquo;{og.title}&rdquo;
                </button>
              </div>
            )}
          </div>

          {/* title */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13 }}>title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* image — grey box */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13 }}>photo</label>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              {imageUrl ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={imageUrl}
                    alt=""
                    style={{
                      width: 72,
                      height: 72,
                      objectFit: "cover",
                      border: "1px solid #ccc",
                      display: "block",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      fontSize: 11,
                      padding: "0 4px",
                      lineHeight: "16px",
                      background: "#fff",
                      border: "1px solid #999",
                      cursor: "pointer",
                    }}
                    aria-label="remove"
                  >
                    x
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 72,
                    height: 72,
                    background: "#f0f0f0",
                    border: "1px dashed #999",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#999",
                    fontSize: 28,
                    lineHeight: 1,
                    userSelect: "none",
                  }}
                  title="upload image"
                >
                  +
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input
                  placeholder="or paste image url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={{ fontSize: 13 }}
                />
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                  upload, paste url, or Ctrl+V
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* description */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13 }}>note</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {error && <p style={{ color: "red", fontSize: 13, marginBottom: 8 }}>{error}</p>}

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving}>
              {saving ? "saving..." : "save"}
            </button>
            <button type="button" onClick={onClose}>
              cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
