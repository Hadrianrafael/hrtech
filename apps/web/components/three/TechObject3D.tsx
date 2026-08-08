'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'framer-motion';

const TechObjectScene = dynamic(() => import('./TechObjectScene'), { ssr: false });

/**
 * Single restrained 3D signature moment for the hero — not a particle field.
 * Pauses via IntersectionObserver when off-screen, freezes under
 * prefers-reduced-motion, and never mounts below lg (mobile gets the
 * simplified 2D hero per the performance-first brief).
 */
export function TechObject3D() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="hidden h-[360px] w-[360px] lg:block">
      <TechObjectScene spin={visible && !reduceMotion} />
    </div>
  );
}
