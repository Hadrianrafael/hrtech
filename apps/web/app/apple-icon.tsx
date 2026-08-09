import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)',
          borderRadius: 44,
        }}
      >
        <svg width="110" height="110" viewBox="0 0 40 40" fill="none">
          <path
            d="M13 11v18M27 11v18M13 20h14"
            stroke="#0D0D0D"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="20" r="2.6" fill="#0D0D0D" />
          <circle cx="20" cy="20" r="1.1" fill="#FF871F" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
