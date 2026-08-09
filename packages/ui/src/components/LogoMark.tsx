import * as React from 'react';

export interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * The HR Tech mark: a combined "HR" glyph — the H's right upright doubles as
 * the R's stem — fed by three short circuit traces from the left. Matches
 * the official reference (Opção B): orange/gold gradient, no background
 * tile — the tile is added separately for favicon/app-icon contexts only.
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  const height = size * (40 / 64);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 64 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="hrtech-mark-grad" x1="0" y1="4" x2="46" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFB65C" />
          <stop offset="1" stopColor="#FF871F" />
        </linearGradient>
      </defs>
      {/* circuit traces feeding into the mark */}
      <g stroke="url(#hrtech-mark-grad)" strokeWidth="1.5" strokeLinecap="round">
        <line x1="1" y1="8" x2="10" y2="8" />
        <line x1="0" y1="20" x2="10" y2="20" />
        <line x1="3" y1="32" x2="10" y2="32" />
      </g>
      <g fill="url(#hrtech-mark-grad)">
        <circle cx="1" cy="8" r="1.5" />
        <circle cx="0" cy="20" r="1.5" />
        <circle cx="3" cy="32" r="1.5" />
      </g>
      {/* H — right upright doubles as the R's stem */}
      <rect x="10" y="4" width="6" height="32" rx="2" fill="url(#hrtech-mark-grad)" />
      <rect x="26" y="4" width="6" height="32" rx="2" fill="url(#hrtech-mark-grad)" />
      <rect x="10" y="17" width="22" height="6" rx="2" fill="url(#hrtech-mark-grad)" />
      {/* R — bowl + diagonal leg */}
      <rect x="32" y="4" width="15" height="16" rx="8" fill="url(#hrtech-mark-grad)" />
      <path d="M34 20 L47 36" stroke="url(#hrtech-mark-grad)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
