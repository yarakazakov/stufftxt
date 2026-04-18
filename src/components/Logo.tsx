interface LogoProps {
  size?: number;
}

// Восьмилучевая звёздочка-астериск. Наследует цвет текста через currentColor.
export default function Logo({ size = 16 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ verticalAlign: "middle", display: "inline-block" }}
      aria-hidden="true"
    >
      <g fill="currentColor">
        <rect x="42" y="4" width="16" height="92" />
        <rect x="42" y="4" width="16" height="92" transform="rotate(45 50 50)" />
        <rect x="42" y="4" width="16" height="92" transform="rotate(90 50 50)" />
        <rect x="42" y="4" width="16" height="92" transform="rotate(135 50 50)" />
      </g>
    </svg>
  );
}
