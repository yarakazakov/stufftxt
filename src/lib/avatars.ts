// Пресеты дефолтных аватарок: серые фоны + чёрный астериск-логотип.
// Ключи стабильные — именно их сохраняем в User.avatarPreset.

export interface AvatarPreset {
  key: string;
  bg: string;
  fg: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { key: "grey-1", bg: "#f0f0f0", fg: "#000" },
  { key: "grey-2", bg: "#d8d8d8", fg: "#000" },
  { key: "grey-3", bg: "#b8b8b8", fg: "#000" },
  { key: "grey-4", bg: "#888",    fg: "#000" },
  { key: "grey-5", bg: "#555",    fg: "#fff" },
  { key: "grey-6", bg: "#222",    fg: "#fff" },
];

// Дефолт для юзера без выбранного пресета — детерминированно из username
export function defaultPresetForUsername(username: string): AvatarPreset {
  let sum = 0;
  for (let i = 0; i < username.length; i++) sum += username.charCodeAt(i);
  return AVATAR_PRESETS[sum % AVATAR_PRESETS.length];
}

export function getPreset(key: string | null | undefined, username: string): AvatarPreset {
  if (key) {
    const found = AVATAR_PRESETS.find((p) => p.key === key);
    if (found) return found;
  }
  return defaultPresetForUsername(username);
}
