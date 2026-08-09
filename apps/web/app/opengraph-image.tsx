import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'HR Tech — Desenvolvimento de Sistemas, SaaS e Automação';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0D0D0D',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -160,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 700,
            height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,135,31,0.35) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <svg width="70" height="44" viewBox="0 0 64 40" fill="none">
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
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, color: '#fff' }}>
            HR<span style={{ color: '#FF871F' }}>&nbsp;Tech</span>
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontSize: 30, color: 'rgba(255,255,255,0.6)' }}>
          Desenvolvimento de Sistemas, SaaS e Automação
        </div>
      </div>
    ),
    { ...size },
  );
}
