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
        border: "none",
        background: "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <svg width="32" height="32" viewBox="0 0 512 512" aria-hidden="true">
        <path
          fill="#000"
          d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm115.4 175.3l-38.6 181.8c-2.9 12.9-10.5 16.1-21.3 10l-58.8-43.3-28.4 27.3c-3.1 3.1-5.8 5.8-11.9 5.8l4.2-59.9 109-98.5c4.7-4.2-1-6.6-7.3-2.4L148.7 279.3 90.6 261.2c-12.6-4-12.9-12.6 2.6-18.6l322.7-124.4c10.5-3.8 19.7 2.6 16.4 16.1z"
        />
      </svg>
    </button>
  );
}
