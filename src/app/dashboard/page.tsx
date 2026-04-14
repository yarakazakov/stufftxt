"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";

interface Item {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  order: number;
}

interface Folder {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  slug: string;
  items: Item[];
}

interface Profile {
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  emailVerified: boolean;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<number | "all">>(new Set());
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<number | null>(null);
  const [addingItemTo, setAddingItemTo] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStep, setEmailStep] = useState<"email" | "code">("email");
  const [emailInput, setEmailInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [emailError, setEmailError] = useState("");

  // Форма для новой папки
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDesc, setNewFolderDesc] = useState("");
  const [newFolderPublic, setNewFolderPublic] = useState(false);

  // Форма для редактирования папки
  const [editFolderName, setEditFolderName] = useState("");
  const [editFolderDesc, setEditFolderDesc] = useState("");
  const [editFolderPublic, setEditFolderPublic] = useState(false);

  // Форма для новой позиции
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemImage, setNewItemImage] = useState<string>("");

  // Форма для редактирования позиции
  const [editItemTitle, setEditItemTitle] = useState("");
  const [editItemDesc, setEditItemDesc] = useState("");
  const [editItemUrl, setEditItemUrl] = useState("");
  const [editItemImage, setEditItemImage] = useState<string>("");

  const [formError, setFormError] = useState("");

  const loadFolders = useCallback(async () => {
    const res = await fetch("/api/folders");
    if (res.ok) {
      const data = await res.json();
      setFolders(data);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated") {
      loadFolders();
      loadProfile();
      // Проверяем localStorage для баннера
      const dismissed = localStorage.getItem("emailBannerDismissed");
      if (dismissed) setBannerDismissed(true);
    }
  }, [status, router, loadFolders, loadProfile]);

  if (status !== "authenticated" || !session) return <p>loading...</p>;

  const toggleFolder = (id: number | "all") => {
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

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newFolderName,
        description: newFolderDesc,
        isPublic: newFolderPublic,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || "failed");
      return;
    }
    setNewFolderName("");
    setNewFolderDesc("");
    setNewFolderPublic(false);
    setShowNewFolder(false);
    loadFolders();
  };

  const handleUpdateFolder = async (folderId: number) => {
    setFormError("");
    const res = await fetch(`/api/folders/${folderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editFolderName,
        description: editFolderDesc,
        isPublic: editFolderPublic,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || "failed");
      return;
    }
    setEditingFolder(null);
    loadFolders();
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (!confirm("are you sure you want to delete this folder?")) return;
    await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
    loadFolders();
  };

  const handleUploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      return data.imageUrl;
    }
    return null;
  };

  const handleCreateItem = async (e: React.FormEvent, folderId: number) => {
    e.preventDefault();
    setFormError("");
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newItemTitle,
        description: newItemDesc,
        url: newItemUrl,
        imageUrl: newItemImage,
        folderId,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || "failed");
      return;
    }
    setNewItemTitle("");
    setNewItemDesc("");
    setNewItemUrl("");
    setNewItemImage("");
    loadFolders();
  };

  const handleUpdateItem = async (itemId: number) => {
    setFormError("");
    const res = await fetch(`/api/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editItemTitle,
        description: editItemDesc,
        url: editItemUrl,
        imageUrl: editItemImage,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || "failed");
      return;
    }
    setEditingItem(null);
    loadFolders();
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("are you sure you want to delete this item?")) return;
    await fetch(`/api/items/${itemId}`, { method: "DELETE" });
    loadFolders();
  };

  const handlePaste = async (
    e: React.ClipboardEvent,
    setImage: (url: string) => void
  ) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          const url = await handleUploadFile(file);
          if (url) setImage(url);
        }
      }
    }
  };

  const handleFileInput = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await handleUploadFile(file);
      if (url) setImage(url);
    }
  };

  const handleSendEmailCode = async () => {
    setEmailError("");
    const res = await fetch("/api/email/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput }),
    });
    if (!res.ok) {
      const data = await res.json();
      setEmailError(data.error || "failed");
      return;
    }
    setEmailStep("code");
  };

  const handleVerifyEmail = async () => {
    setEmailError("");
    const res = await fetch("/api/email/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput, code: codeInput }),
    });
    if (!res.ok) {
      const data = await res.json();
      setEmailError(data.error || "failed");
      return;
    }
    setShowEmailModal(false);
    setBannerDismissed(true);
    localStorage.setItem("emailBannerDismissed", "true");
    loadProfile();
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem("emailBannerDismissed", "true");
  };

  // Все позиции из всех папок
  const allItems = folders.flatMap((f) =>
    f.items.map((item) => ({ ...item, folderName: f.name, folderId: f.id }))
  );

  const avatarLetter = (session.user.username || "?")[0].toUpperCase();

  return (
    <div>
      <Breadcrumbs items={[{ label: "wishlist", href: "/dashboard" }, { label: "dashboard" }]} />

      {/* Email banner */}
      {!bannerDismissed && profile && !profile.email && (
        <div
          style={{
            border: "1px solid #ccc",
            padding: "8px 12px",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 10,
          }}
        >
          <span>
            link your email to recover access if you lose your key{" "}
            <button onClick={() => setShowEmailModal(true)}>link email</button>
          </span>
          <button onClick={dismissBanner} style={{ border: "none", background: "none", cursor: "pointer" }}>
            x
          </button>
        </div>
      )}

      {/* Email modal */}
      {showEmailModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div style={{ background: "#fff", border: "1px solid #ccc", padding: 24, maxWidth: 400, width: "100%" }}>
            <h2>link email</h2>
            {emailStep === "email" ? (
              <div>
                <div style={{ marginTop: 8, marginBottom: 8 }}>
                  <label htmlFor="linkEmail">email</label>
                  <input
                    id="linkEmail"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                </div>
                {emailError && <p style={{ color: "red", marginBottom: 8 }}>{emailError}</p>}
                <button onClick={handleSendEmailCode}>send code</button>{" "}
                <button onClick={() => setShowEmailModal(false)}>cancel</button>
              </div>
            ) : (
              <div>
                <p style={{ margin: "8px 0" }}>code sent to {emailInput}</p>
                <div style={{ marginBottom: 8 }}>
                  <label htmlFor="verifyCode">6-digit code</label>
                  <input
                    id="verifyCode"
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    maxLength={6}
                  />
                </div>
                {emailError && <p style={{ color: "red", marginBottom: 8 }}>{emailError}</p>}
                <button onClick={handleVerifyEmail}>verify</button>{" "}
                <button onClick={() => setShowEmailModal(false)}>cancel</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Приветствие */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        {profile?.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" style={{ width: 40, height: 40 }} />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              background: "#ccc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: 18,
            }}
          >
            {avatarLetter}
          </div>
        )}
        <div>
          <h1>hi, {session.user.username}</h1>
          <div style={{ fontSize: 13, color: "#666" }}>
            <Link href="/feed">feed</Link>
            {" | "}
            <Link href="/dashboard/settings">settings</Link>
            {" | "}
            <Link href="/dashboard/following">following</Link>
            {" | "}
            <Link href="/dashboard/followers">followers</Link>
          </div>
        </div>
      </div>

      {/* Кнопка новой папки */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setShowNewFolder(!showNewFolder)}>+ new folder</button>
      </div>

      {/* Форма новой папки */}
      {showNewFolder && (
        <form onSubmit={handleCreateFolder} style={{ border: "1px solid #ccc", padding: 12, marginBottom: 16 }}>
          <h3>new folder</h3>
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <label htmlFor="folderName">name</label>
            <input
              id="folderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="folderDesc">description</label>
            <textarea
              id="folderDesc"
              value={newFolderDesc}
              onChange={(e) => setNewFolderDesc(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>
              <input
                type="checkbox"
                checked={newFolderPublic}
                onChange={(e) => setNewFolderPublic(e.target.checked)}
                style={{ width: "auto", marginRight: 4 }}
              />
              public
            </label>
          </div>
          {formError && <p style={{ color: "red", marginBottom: 8 }}>{formError}</p>}
          <button type="submit">create</button>{" "}
          <button type="button" onClick={() => setShowNewFolder(false)}>cancel</button>
        </form>
      )}

      {/* Виртуальная папка "all" */}
      <div style={{ borderBottom: "1px solid #ccc", marginBottom: 8 }}>
        <div
          onClick={() => toggleFolder("all")}
          style={{ cursor: "pointer", padding: "8px 0", fontWeight: "bold" }}
        >
          {openFolders.has("all") ? "[-]" : "[+]"} all ({allItems.length})
        </div>
        {openFolders.has("all") && (
          <div style={{ paddingLeft: 16, paddingBottom: 8 }}>
            {allItems.length === 0 && (
              <p style={{ color: "#666" }}>no items yet</p>
            )}
            {allItems.map((item) => (
              <div key={item.id} style={{ marginBottom: 4 }}>
                <div
                  onClick={() => toggleItem(item.id)}
                  style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                >
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" style={{ width: 24, height: 24 }} />
                  )}
                  <span>{item.title}</span>
                  <span style={{ color: "#666", fontSize: 13 }}>in {item.folderName}</span>
                </div>
                {openItems.has(item.id) && (
                  <div style={{ paddingLeft: 32, paddingTop: 4, paddingBottom: 4 }}>
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" style={{ maxWidth: 200, display: "block", marginBottom: 4 }} />
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

      {/* Папки */}
      {folders.length === 0 && (
        <p style={{ color: "#666", margin: "16px 0" }}>
          you have no folders yet.{" "}
          <button onClick={() => setShowNewFolder(true)}>create one?</button>
        </p>
      )}
      {folders.map((folder) => (
        <div key={folder.id} style={{ borderBottom: "1px solid #ccc", marginBottom: 8 }}>
          <div
            style={{
              cursor: "pointer",
              padding: "8px 0",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span onClick={() => toggleFolder(folder.id)} style={{ fontWeight: "bold", flex: 1 }}>
              {openFolders.has(folder.id) ? "[-]" : "[+]"} {folder.name} ({folder.items.length}){" "}
              <span style={{ fontWeight: "normal", color: "#666", fontSize: 13 }}>
                [{folder.isPublic ? "public" : "private"}]
              </span>
            </span>
            {/* Превью фото (2x2 сетка) если свёрнуто */}
            {!openFolders.has(folder.id) && folder.items.some((i) => i.imageUrl) && (
              <div style={{ display: "grid", gridTemplateColumns: "40px 40px", gap: 2 }}>
                {folder.items
                  .filter((i) => i.imageUrl)
                  .slice(0, 4)
                  .map((i) => (
                    <img key={i.id} src={i.imageUrl!} alt="" style={{ width: 40, height: 40, objectFit: "cover" }} />
                  ))}
              </div>
            )}
          </div>

          {/* Раскрытая папка */}
          {openFolders.has(folder.id) && (
            <div style={{ paddingLeft: 16, paddingBottom: 8 }}>
              {folder.description && <p style={{ color: "#666", marginBottom: 8 }}>{folder.description}</p>}

              <div style={{ marginBottom: 8, fontSize: 13 }}>
                <button
                  onClick={() => {
                    setEditingFolder(folder.id);
                    setEditFolderName(folder.name);
                    setEditFolderDesc(folder.description || "");
                    setEditFolderPublic(folder.isPublic);
                  }}
                >
                  edit folder
                </button>
                {" | "}
                <button onClick={() => setAddingItemTo(folder.id)}>add item</button>
                {" | "}
                {folder.isPublic && (
                  <Link href={`/u/${session.user.username}`}>open page</Link>
                )}
                {" | "}
                <button onClick={() => handleDeleteFolder(folder.id)} style={{ color: "red" }}>
                  delete
                </button>
              </div>

              {/* Редактирование папки */}
              {editingFolder === folder.id && (
                <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 8 }}>
                  <h3>edit folder</h3>
                  <div style={{ marginTop: 8, marginBottom: 8 }}>
                    <label>name</label>
                    <input value={editFolderName} onChange={(e) => setEditFolderName(e.target.value)} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label>description</label>
                    <textarea value={editFolderDesc} onChange={(e) => setEditFolderDesc(e.target.value)} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={editFolderPublic}
                        onChange={(e) => setEditFolderPublic(e.target.checked)}
                        style={{ width: "auto", marginRight: 4 }}
                      />
                      public
                    </label>
                  </div>
                  {formError && <p style={{ color: "red", marginBottom: 8 }}>{formError}</p>}
                  <button onClick={() => handleUpdateFolder(folder.id)}>save</button>{" "}
                  <button onClick={() => setEditingFolder(null)}>cancel</button>
                </div>
              )}

              {/* Добавление позиции */}
              {addingItemTo === folder.id && (
                <form
                  onSubmit={(e) => handleCreateItem(e, folder.id)}
                  style={{ border: "1px solid #ccc", padding: 12, marginBottom: 8 }}
                  onPaste={(e) => handlePaste(e, setNewItemImage)}
                >
                  <h3>add item</h3>
                  <div style={{ marginTop: 8, marginBottom: 8 }}>
                    <label>title *</label>
                    <input value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} required />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label>description</label>
                    <textarea value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label>url (link to product)</label>
                    <input value={newItemUrl} onChange={(e) => setNewItemUrl(e.target.value)} type="url" />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label>photo (upload, paste URL, or Ctrl+V)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileInput(e, setNewItemImage)}
                      style={{ marginBottom: 4 }}
                    />
                    <input
                      placeholder="or paste image URL"
                      value={newItemImage}
                      onChange={(e) => setNewItemImage(e.target.value)}
                    />
                    {newItemImage && (
                      <img src={newItemImage} alt="" style={{ maxWidth: 100, marginTop: 4, display: "block" }} />
                    )}
                  </div>
                  {formError && <p style={{ color: "red", marginBottom: 8 }}>{formError}</p>}
                  <button type="submit">save</button>{" "}
                  <button type="button" onClick={() => setAddingItemTo(null)}>cancel</button>
                </form>
              )}

              {/* Позиции */}
              {folder.items.length === 0 && (
                <p style={{ color: "#666" }}>
                  this folder is empty.{" "}
                  <button onClick={() => setAddingItemTo(folder.id)}>add an item?</button>
                </p>
              )}
              {folder.items.map((item) => (
                <div key={item.id} style={{ marginBottom: 4 }}>
                  <div
                    onClick={() => toggleItem(item.id)}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {item.imageUrl && <img src={item.imageUrl} alt="" style={{ width: 24, height: 24 }} />}
                    <span>{item.title}</span>
                  </div>

                  {/* Развёрнутая позиция */}
                  {openItems.has(item.id) && (
                    <div style={{ paddingLeft: 32, paddingTop: 4, paddingBottom: 8 }}>
                      {editingItem === item.id ? (
                        <div
                          style={{ border: "1px solid #ccc", padding: 12 }}
                          onPaste={(e) => handlePaste(e, setEditItemImage)}
                        >
                          <h3>edit item</h3>
                          <div style={{ marginTop: 8, marginBottom: 8 }}>
                            <label>title *</label>
                            <input value={editItemTitle} onChange={(e) => setEditItemTitle(e.target.value)} required />
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <label>description</label>
                            <textarea value={editItemDesc} onChange={(e) => setEditItemDesc(e.target.value)} />
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <label>url</label>
                            <input value={editItemUrl} onChange={(e) => setEditItemUrl(e.target.value)} type="url" />
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <label>photo</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileInput(e, setEditItemImage)}
                              style={{ marginBottom: 4 }}
                            />
                            <input
                              placeholder="or paste image URL"
                              value={editItemImage}
                              onChange={(e) => setEditItemImage(e.target.value)}
                            />
                            {editItemImage && (
                              <img src={editItemImage} alt="" style={{ maxWidth: 100, marginTop: 4, display: "block" }} />
                            )}
                          </div>
                          {formError && <p style={{ color: "red", marginBottom: 8 }}>{formError}</p>}
                          <button onClick={() => handleUpdateItem(item.id)}>save</button>{" "}
                          <button onClick={() => setEditingItem(null)}>cancel</button>
                        </div>
                      ) : (
                        <>
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt="" style={{ maxWidth: 200, display: "block", marginBottom: 4 }} />
                          )}
                          {item.description && <p>{item.description}</p>}
                          {item.url && (
                            <p>
                              <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
                            </p>
                          )}
                          <div style={{ marginTop: 4, fontSize: 13 }}>
                            <button
                              onClick={() => {
                                setEditingItem(item.id);
                                setEditItemTitle(item.title);
                                setEditItemDesc(item.description || "");
                                setEditItemUrl(item.url || "");
                                setEditItemImage(item.imageUrl || "");
                              }}
                            >
                              edit
                            </button>
                            {" | "}
                            <button onClick={() => handleDeleteItem(item.id)} style={{ color: "red" }}>
                              delete
                            </button>
                          </div>
                        </>
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
