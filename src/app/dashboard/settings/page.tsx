"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import PasskeyRegister from "@/components/PasskeyRegister";
import Link from "next/link";

interface PasskeyInfo {
  id: string;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Email linking
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStep, setEmailStep] = useState<"email" | "code">("email");
  const [emailInput, setEmailInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [emailError, setEmailError] = useState("");

  // Passkeys
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          setDisplayName(data.displayName || "");
          setBio(data.bio || "");
          setAvatarUrl(data.avatarUrl || "");
          setEmail(data.email || "");
          setEmailVerified(data.emailVerified || false);
        });
      loadPasskeys();
    }
  }, [status, router]);

  const loadPasskeys = async () => {
    const res = await fetch("/api/passkeys");
    if (res.ok) {
      const data = await res.json();
      setPasskeys(data);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    if (!confirm("are you sure you want to remove this passkey?")) return;
    const res = await fetch(`/api/passkeys/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadPasskeys();
    }
  };

  const handleSave = async () => {
    setError("");
    setSaved(false);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, bio, avatarUrl: avatarUrl || null }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      const data = await res.json();
      setError(data.error || "failed to save");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setAvatarUrl(data.imageUrl);
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
    setEmail(emailInput);
    setEmailVerified(true);
  };

  if (status !== "authenticated") return <p>loading...</p>;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "wishlist", href: "/dashboard" },
          { label: "settings" },
        ]}
      />

      <h1>settings</h1>
      <p style={{ margin: "8px 0 16px" }}>
        <Link href="/dashboard">&larr; back to dashboard</Link>
      </p>

      {/* Avatar */}
      <div style={{ marginBottom: 16 }}>
        <label>avatar</label>
        {avatarUrl && (
          <img src={avatarUrl} alt="" style={{ width: 60, height: 60, display: "block", marginBottom: 4 }} />
        )}
        <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ marginBottom: 4 }} />
        {avatarUrl && (
          <button onClick={() => setAvatarUrl("")} style={{ fontSize: 13 }}>
            remove avatar
          </button>
        )}
      </div>

      {/* Display Name */}
      <div style={{ marginBottom: 8 }}>
        <label htmlFor="displayName">display name</label>
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      {/* Bio */}
      <div style={{ marginBottom: 8 }}>
        <label htmlFor="bio">bio (max 200 chars)</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 200))}
          maxLength={200}
        />
        <span style={{ fontSize: 12, color: "#666" }}>{bio.length}/200</span>
      </div>

      {/* Email */}
      <div style={{ marginBottom: 16 }}>
        <label>email</label>
        {email ? (
          <p>
            {email} {emailVerified && <span style={{ color: "green" }}>verified</span>}
          </p>
        ) : (
          <p>
            <span style={{ color: "#666" }}>not linked</span>{" "}
            <button onClick={() => setShowEmailModal(true)}>link email</button>
          </p>
        )}
      </div>

      {error && <p style={{ color: "red", marginBottom: 8 }}>{error}</p>}
      {saved && <p style={{ color: "green", marginBottom: 8 }}>saved</p>}

      <button onClick={handleSave}>save changes</button>

      {/* Passkeys */}
      <div style={{ marginTop: 32, borderTop: "1px solid #ccc", paddingTop: 16 }}>
        <h2>passkeys</h2>
        {passkeys.length === 0 ? (
          <p style={{ color: "#666", margin: "8px 0" }}>
            no passkeys registered. add one to log in without your key.
          </p>
        ) : (
          <div style={{ margin: "8px 0" }}>
            {passkeys.map((pk) => (
              <div
                key={pk.id}
                style={{
                  padding: "6px 0",
                  borderBottom: "1px solid #eee",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  {pk.credentialDeviceType === "multiDevice" ? "synced passkey" : "device passkey"}
                  {pk.credentialBackedUp && " (backed up)"}
                  <span style={{ color: "#666", fontSize: 13, marginLeft: 8 }}>
                    added {new Date(pk.createdAt).toLocaleDateString()}
                  </span>
                </span>
                <button
                  onClick={() => handleDeletePasskey(pk.id)}
                  style={{ color: "red", fontSize: 13 }}
                >
                  remove
                </button>
              </div>
            ))}
          </div>
        )}
        <PasskeyRegister onRegistered={loadPasskeys} />
      </div>

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
                  <label>email</label>
                  <input
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
                  <label>6-digit code</label>
                  <input
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
    </div>
  );
}
