"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TelegramLoginButton from "@/components/TelegramLoginButton";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "registration failed");
        setLoading(false);
        return;
      }

      // Автоматический логин после регистрации
      const result = await signIn("credentials", {
        username: username.toLowerCase(),
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        setError("registered but failed to log in, please try logging in manually");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("something went wrong");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: "0 16px" }}>
      <h1>register</h1>
      <p style={{ margin: "8px 0 16px", color: "#666" }}>
        <Link href="/login">already have an account? log in</Link>
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: 8 }}>
          <label htmlFor="username">username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label htmlFor="password">key / password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label htmlFor="confirmPassword">repeat key / password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p style={{ color: "red", marginBottom: 8 }}>{error}</p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "creating..." : "create account"}
        </button>
      </form>

      {/* Разделитель */}
      <div style={{ margin: "24px 0", borderTop: "1px solid #ccc", position: "relative" }}>
        <span
          style={{
            position: "absolute",
            top: -10,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#fff",
            padding: "0 12px",
            color: "#666",
            fontSize: 13,
          }}
        >
          or
        </span>
      </div>

      {/* Telegram login */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <TelegramLoginButton />
      </div>
    </div>
  );
}
