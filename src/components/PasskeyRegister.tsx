"use client";

import { useState, useEffect } from "react";
import { startRegistration } from "@simplewebauthn/browser";

export default function PasskeyRegister({ onRegistered }: { onRegistered?: () => void }) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    // Проверяем поддержку WebAuthn в браузере
    setSupported(typeof window !== "undefined" && window.PublicKeyCredential !== undefined);
  }, []);

  if (!supported) return null;

  const handleRegister = async () => {
    setStatus("loading");
    setError("");

    try {
      // 1. Получаем options от сервера
      const optionsRes = await fetch("/api/passkeys/register-options", {
        method: "POST",
      });

      if (!optionsRes.ok) {
        throw new Error("failed to get registration options");
      }

      const options = await optionsRes.json();

      // 2. Вызываем браузерный WebAuthn API (popup с отпечатком/Face ID)
      const registration = await startRegistration({ optionsJSON: options });

      // 3. Отправляем результат на сервер
      const verifyRes = await fetch("/api/passkeys/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registration),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "verification failed");
      }

      setStatus("success");
      onRegistered?.();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "something went wrong");
    }
  };

  return (
    <div>
      {status === "success" ? (
        <p style={{ color: "green" }}>passkey added</p>
      ) : (
        <>
          <button onClick={handleRegister} disabled={status === "loading"}>
            {status === "loading" ? "adding passkey..." : "add passkey"}
          </button>
          {status === "error" && (
            <p style={{ color: "red", marginTop: 4 }}>{error}</p>
          )}
        </>
      )}
    </div>
  );
}
