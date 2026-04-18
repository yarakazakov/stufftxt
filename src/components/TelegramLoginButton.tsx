"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Props {
  /** Ссылка для редиректа после успешного логина */
  callbackUrl?: string;
}

/**
 * Кнопка "Войти через Telegram" — кастомная иконка без текста.
 * Открывает официальный Telegram Login popup через oauth.telegram.org,
 * получает данные через window.postMessage и отправляет в next-auth.
 *
 * Требования:
 *  - бот создан в @BotFather
 *  - для production: BotFather /setdomain должен содержать твой домен
 *    (на localhost popup будет ругаться — тестируй через ngrok или после деплоя)
 *  - NEXT_PUBLIC_TELEGRAM_BOT_USERNAME (для text, info) и numeric id бота
 */
export default function TelegramLoginButton({ callbackUrl = "/dashboard" }: Props) {
  const router = useRouter();
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== "https://oauth.telegram.org") return;

      let data: unknown = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      const parsed = data as { event?: string; result?: Record<string, unknown> };
      if (parsed?.event !== "auth_result" || !parsed.result) return;

      popupRef.current?.close();

      const res = await signIn("telegram", {
        payload: JSON.stringify(parsed.result),
        redirect: false,
      });

      if (res?.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        alert("telegram login failed");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router, callbackUrl]);

  const handleClick = () => {
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      alert("telegram bot is not configured");
      return;
    }

    const origin = window.location.origin;
    const url =
      `https://oauth.telegram.org/auth?bot_id=${encodeURIComponent(botUsername)}` +
      `&origin=${encodeURIComponent(origin)}` +
      `&embed=0` +
      `&request_access=write` +
      `&return_to=${encodeURIComponent(origin)}`;

    // Note: bot_id параметр в oauth.telegram.org принимает и username, и numeric id
    // Откроем popup по центру
    const w = 550;
    const h = 470;
    const left = (window.screen.width - w) / 2;
    const top = (window.screen.height - h) / 2;
    popupRef.current = window.open(
      url,
      "telegram_oauth",
      `width=${w},height=${h},left=${left},top=${top}`
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="continue with telegram"
      aria-label="continue with telegram"
      style={{
        width: 48,
        height: 48,
        padding: 0,
        border: "1px solid #ccc",
        background: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <svg width="32" height="32" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="24" fill="#229ED9" />
        <path
          d="M10.8 23.3l24.5-9.4c1.1-.4 2.1.3 1.8 2l-4.2 19.7c-.3 1.3-1 1.7-2.1 1l-5.9-4.4-2.8 2.7c-.3.3-.6.6-1.2.6l.4-6 11-9.9c.5-.4-.1-.6-.7-.3L18 24.1l-5.8-1.8c-1.3-.4-1.3-1.3.6-2z"
          fill="#fff"
        />
      </svg>
    </button>
  );
}
