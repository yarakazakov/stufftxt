"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Props {
  /** Ссылка для редиректа после успешного логина */
  callbackUrl?: string;
}

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

/**
 * Официальный Telegram Login Widget (telegram-widget.js).
 * Рендерит кнопку в своём iframe — кастомный стиль недоступен.
 *
 * Требования:
 *  - бот создан в @BotFather
 *  - BotFather /setdomain должен содержать домен сайта
 *  - NEXT_PUBLIC_TELEGRAM_BOT_USERNAME = username бота без @
 */
export default function TelegramLoginButton({ callbackUrl = "/dashboard" }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    const container = containerRef.current;
    if (!botUsername || !container) return;

    // Глобальный колбэк, который вызовет виджет после успешной авторизации
    window.onTelegramAuth = async (user: TelegramUser) => {
      const res = await signIn("telegram", {
        payload: JSON.stringify(user),
        redirect: false,
      });
      if (res?.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        alert("telegram login failed");
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "0");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");

    container.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
      if (container) container.innerHTML = "";
    };
  }, [router, callbackUrl]);

  return <div ref={containerRef} />;
}
