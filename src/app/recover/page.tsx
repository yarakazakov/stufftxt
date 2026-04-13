"use client";

import { useState } from "react";
import Link from "next/link";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"email" | "code" | "reset" | "done">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/email/send-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "failed to send code");
        return;
      }

      setStep("code");
    } catch {
      setError("something went wrong");
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("code must be 6 digits");
      return;
    }

    setStep("reset");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/email/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "failed to reset password");
        return;
      }

      setStep("done");
    } catch {
      setError("something went wrong");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: "0 16px" }}>
      <h1>recover access</h1>
      <p style={{ margin: "8px 0 16px", color: "#666" }}>
        you can only recover access if you linked your email
      </p>

      {step === "email" && (
        <form onSubmit={handleSendCode}>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="email">email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <p style={{ color: "red", marginBottom: 8 }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "sending..." : "send recovery code"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleVerifyCode}>
          <p style={{ marginBottom: 8 }}>code sent to {email}</p>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="code">6-digit code</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
              maxLength={6}
            />
          </div>
          {error && <p style={{ color: "red", marginBottom: 8 }}>{error}</p>}
          <button type="submit">verify code</button>
        </form>
      )}

      {step === "reset" && (
        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="newPassword">new key / password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <p style={{ color: "red", marginBottom: 8 }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "saving..." : "set new password"}
          </button>
        </form>
      )}

      {step === "done" && (
        <div>
          <p>password has been reset successfully.</p>
          <p style={{ marginTop: 8 }}>
            <Link href="/login">go to log in</Link>
          </p>
        </div>
      )}

      <p style={{ marginTop: 16 }}>
        <Link href="/login">&larr; back to login</Link>
      </p>
    </div>
  );
}
