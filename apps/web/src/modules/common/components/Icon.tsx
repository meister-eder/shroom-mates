/** Inline stroke icons (React twin of packages/ui Icon.astro). currentColor, round caps. */
const shapes = {
  cart: (
    <>
      <path d="M7 10a5 5 0 0 1 10 0" />
      <path d="M3 10h18l-1.8 9.2a1.5 1.5 0 0 1-1.5 1.2H6.3a1.5 1.5 0 0 1-1.5-1.2Z" />
      <path d="M9 13.5v4M12 13.5v4M15 13.5v4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  close: <path d="M5 5l14 14M19 5L5 19" />,
  "arrow-left": <path d="M20 12H4M10 6l-6 6 6 6" />,
  "arrow-right": <path d="M4 12h16M14 6l6 6-6 6" />,
} as const;

export type IconName = keyof typeof shapes;

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const Icon = ({
  name,
  size = 20,
  strokeWidth = 2.4,
  className,
}: IconProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {shapes[name]}
  </svg>
);
