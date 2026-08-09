import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0D0D0D',
          borderRadius: 8,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 64 40" fill="none">
          <defs>
            <linearGradient id="g" x1="0" y1="4" x2="46" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFB65C" />
              <stop offset="1" stopColor="#FF871F" />
            </linearGradient>
          </defs>
          <rect x="10" y="4" width="6" height="32" rx="2" fill="url(#g)" />
          <rect x="26" y="4" width="6" height="32" rx="2" fill="url(#g)" />
          <rect x="10" y="17" width="22" height="6" rx="2" fill="url(#g)" />
          <rect x="32" y="4" width="15" height="16" rx="8" fill="url(#g)" />
          <path d="M34 20 L47 36" stroke="url(#g)" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
