import { AvatarPreset, getPreset } from "@/lib/avatars";

interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  avatarPreset?: string | null;
  size?: number;
  round?: boolean;
}

// Универсальный аватар.
// Приоритет: загруженная картинка → выбранный пресет → дефолтный пресет (детерминированно из username)
export default function Avatar({
  username,
  avatarUrl,
  avatarPreset,
  size = 40,
  round = false,
}: AvatarProps) {
  const commonStyle: React.CSSProperties = {
    width: size,
    height: size,
    display: "block",
    flexShrink: 0,
    borderRadius: round ? "50%" : 0,
    objectFit: "cover",
  };

  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt="" style={commonStyle} />;
  }

  const preset = getPreset(avatarPreset, username);
  return <PresetAvatar preset={preset} size={size} round={round} />;
}

// Отрисовка пресета без привязки к конкретному юзеру — используется и в пикере
export function PresetAvatar({
  preset,
  size = 40,
  round = false,
}: {
  preset: AvatarPreset;
  size?: number;
  round?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: "block",
        flexShrink: 0,
        borderRadius: round ? "50%" : 0,
      }}
      aria-hidden="true"
    >
      <rect width="100" height="100" fill={preset.bg} />
      <g fill={preset.fg} transform="translate(18 18) scale(0.64)">
        <rect x="42" y="4" width="16" height="92" />
        <rect x="42" y="4" width="16" height="92" transform="rotate(45 50 50)" />
        <rect x="42" y="4" width="16" height="92" transform="rotate(90 50 50)" />
        <rect x="42" y="4" width="16" height="92" transform="rotate(135 50 50)" />
      </g>
    </svg>
  );
}
