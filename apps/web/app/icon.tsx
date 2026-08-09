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
          background: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)',
          borderRadius: 8,
        }}
      >
        <svg width="21" height="21" viewBox="0 0 40 40" fill="none">
          <path
            d="M13 11v18M27 11v18M13 20h14"
            stroke="#0D0D0D"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="20" r="2.6" fill="#0D0D0D" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
