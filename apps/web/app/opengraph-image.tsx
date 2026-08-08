import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'HR Tech — Desenvolvimento de Sistemas, SaaS e IA';
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
            background: 'radial-gradient(circle, rgba(233,32,52,0.45) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 84,
              height: 84,
              borderRadius: 20,
              fontSize: 44,
              fontWeight: 700,
              color: '#fff',
              background: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)',
            }}
          >
            H
          </div>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, color: '#fff' }}>
            HR<span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>&nbsp;Tech</span>
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontSize: 30, color: 'rgba(255,255,255,0.6)' }}>
          Desenvolvimento de Sistemas, SaaS e Inteligência Artificial
        </div>
      </div>
    ),
    { ...size },
  );
}
