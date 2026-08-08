import * as React from 'react';

export interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * The HR Tech monogram: an "H" built from two circuit uprights joined by a
 * trace with a node — not a literal typeface letter, so it reads as a mark
 * even at favicon size. Shared path geometry with AnimatedLogo's intro.
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="hrtech-mark-grad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E92034" />
          <stop offset="1" stopColor="#FF871F" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#hrtech-mark-grad)" />
      <path
        d="M13 11v18M27 11v18M13 20h14"
        stroke="#0D0D0D"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="20" r="2.4" fill="#0D0D0D" />
      <circle cx="20" cy="20" r="1" fill="#FF871F" />
    </svg>
  );
}
