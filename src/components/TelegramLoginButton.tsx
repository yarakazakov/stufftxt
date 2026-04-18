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
    const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;
    if (!botId) {
      alert("telegram bot is not configured");
      return;
    }

    const origin = window.location.origin;
    const url =
      `https://oauth.telegram.org/auth?bot_id=${encodeURIComponent(botId)}` +
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
      <svg width="32" height="32" viewBox="0 0 333334 333334" aria-hidden="true" fillRule="evenodd" clipRule="evenodd">
        <path
          fill="#000"
          d="M166667 0c92048 0 166667 74619 166667 166667s-74619 166667-166667 166667S0 258715 0 166667 74619 0 166667 0zm80219 91205l-29735 149919s-4158 10396-15594 5404l-68410-53854s76104-68409 79222-71320c3119-2911 2079-3534 2079-3534 207-3535-5614 0-5614 0l-100846 64043-42002-14140s-6446-2288-7069-7277c-624-4992 7277-7694 7277-7694l166970-65498s13722-6030 13722 3951zm-87637 122889l-27141 24745s-2122 1609-4443 601l5197-45965 26387 20619z"
        />
      </svg>
    </button>
  );
}
