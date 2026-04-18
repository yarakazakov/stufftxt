import crypto from "crypto";

export interface TelegramAuthData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Проверка подписи Telegram Login Widget.
 * Алгоритм: https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramAuth(
  data: TelegramAuthData,
  botToken: string
): boolean {
  const { hash, ...rest } = data;

  // 1. secret_key = SHA256(bot_token)
  const secretKey = crypto.createHash("sha256").update(botToken).digest();

  // 2. data_check_string = "key=value\nkey=value..." (отсортированные поля, кроме hash)
  const dataCheckString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${(rest as Record<string, unknown>)[k]}`)
    .join("\n");

  // 3. HMAC-SHA256(data_check_string, secret_key) должен совпадать с hash
  const computed = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computed !== hash) return false;

  // 4. Проверяем свежесть: auth_date не старше 1 дня
  const now = Math.floor(Date.now() / 1000);
  if (now - data.auth_date > 86400) return false;

  return true;
}
