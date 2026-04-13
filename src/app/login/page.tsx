"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username: username.toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("invalid username or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: "0 16px" }}>
      <h1>log in</h1>
      <p style={{ margin: "8px 0 16px", color: "#666" }}>
        <Link href="/register">don&apos;t have an account? register</Link>
      </p>

      <form onSubmit={handleSubmit}>
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

        {error && (
          <p style={{ color: "red", marginBottom: 8 }}>{error}</p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "logging in..." : "log in"}
        </button>
      </form>

      <p style={{ marginTop: 16, color: "#666" }}>
        <Link href="/recover">forgot your key?</Link>
      </p>
    </div>
  );
}
