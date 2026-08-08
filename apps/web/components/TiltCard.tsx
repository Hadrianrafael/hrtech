'use client';

import * as React from 'react';
import { useReducedMotion } from 'framer-motion';

export interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

/**
 * Cheap CSS-transform tilt-on-hover — a restrained stand-in for a full 3D
 * scene on pages where a second WebGL canvas isn't worth the cost. Desktop
 * pointer only (touch never fires mousemove); frozen under reduced-motion.
 */
export function TiltCard({ children, className, strength = 7 }: TiltCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [transform, setTransform] = React.useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(
      `perspective(1000px) rotateX(${(-py * strength).toFixed(2)}deg) rotateY(${(px * strength).toFixed(2)}deg)`,
    );
  };

  const onMouseLeave = () => setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg)');

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={className}
      style={{ transform, transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)', willChange: 'transform' }}
    >
      {children}
    </div>
  );
}
