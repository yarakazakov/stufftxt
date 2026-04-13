"use client";

import { useState, useEffect } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";

export default function PasskeyLogin() {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    setSupported(typeof window !== "undefined" && window.PublicKeyCredential !== undefined);
  }, []);

  if (!supported) return null;

  const handleLogin = async () => {
    setStatus("loading");
    setError("");

    try {
      // 1. Получаем options (discoverable credentials — без username)
      const optionsRes = await fetch("/api/passkeys/login-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!optionsRes.ok) {
        throw new Error("failed to get login options");
      }

      const options = await optionsRes.json();

      // 2. Вызываем браузерный WebAuthn API (выбор passkey)
      const authentication = await startAuthentication({ optionsJSON: options });

      // 3. Отправляем на сервер для верификации
      const verifyRes = await fetch("/api/passkeys/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authentication),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "login failed");
      }

      // Успех — редирект на dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setStatus("error");
      // Пользователь отменил — не показываем ошибку
      if (err instanceof Error && err.name === "NotAllowedError") {
        setStatus("idle");
        return;
      }
      setError(err instanceof Error ? err.message : "something went wrong");
    }
  };

  return (
    <div>
      <button onClick={handleLogin} disabled={status === "loading"}>
        {status === "loading" ? "authenticating..." : "log in with passkey"}
      </button>
      {status === "error" && (
        <p style={{ color: "red", marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}
