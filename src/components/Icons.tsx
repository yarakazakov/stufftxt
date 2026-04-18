// Минималистичные SVG-иконки в стиле логотипа. currentColor для цвета.
interface IconProps {
  size?: number;
}

export function FeedIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ verticalAlign: "middle", display: "inline-block" }}
      aria-hidden="true"
    >
      <g fill="currentColor">
        <rect x="2" y="3" width="12" height="2" />
        <rect x="2" y="7" width="12" height="2" />
        <rect x="2" y="11" width="12" height="2" />
      </g>
    </svg>
  );
}

export function SearchIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ verticalAlign: "middle", display: "inline-block" }}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="7" cy="7" r="4" />
        <line x1="10.2" y1="10.2" x2="14" y2="14" strokeLinecap="square" />
      </g>
    </svg>
  );
}

export function PlusIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ verticalAlign: "middle", display: "inline-block" }}
      aria-hidden="true"
    >
      <g fill="currentColor">
        <rect x="7" y="2" width="2" height="12" />
        <rect x="2" y="7" width="12" height="2" />
      </g>
    </svg>
  );
}

export function LogoutIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ verticalAlign: "middle", display: "inline-block" }}
      aria-hidden="true"
    >
      <g fill="currentColor">
        {/* Левая "стенка" двери */}
        <rect x="2" y="2" width="2" height="12" />
        {/* Стрелка наружу */}
        <polygon points="9,4 9,7 6,7 6,9 9,9 9,12 14,8" />
      </g>
    </svg>
  );
}
