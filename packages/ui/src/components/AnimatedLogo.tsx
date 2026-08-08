'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface AnimatedLogoProps {
  size?: number;
  onComplete?: () => void;
  className?: string;
}

/**
 * One-time brand intro: circuit trace draws in, the node ignites, then the
 * mark and wordmark settle into place. Plays once on mount; skipped entirely
 * under prefers-reduced-motion in favor of the final static frame.
 */
export function AnimatedLogo({ size = 88, onComplete, className }: AnimatedLogoProps) {
  const reduceMotion = useReducedMotion();
  const calledRef = React.useRef(false);

  React.useEffect(() => {
    if (reduceMotion && !calledRef.current) {
      calledRef.current = true;
      onComplete?.();
    }
  }, [reduceMotion, onComplete]);

  if (reduceMotion) {
    return (
      <div className={className} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
          <defs>
            <linearGradient id="hrtech-static-grad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#E92034" />
              <stop offset="1" stopColor="#FF871F" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="11" fill="url(#hrtech-static-grad)" />
          <path d="M13 11v18M27 11v18M13 20h14" stroke="#0D0D0D" strokeWidth="3" strokeLinecap="round" />
          <circle cx="20" cy="20" r="2.4" fill="#0D0D0D" />
        </svg>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: size, height: size }}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden
        initial="hidden"
        animate="visible"
        onAnimationComplete={() => {
          if (!calledRef.current) {
            calledRef.current = true;
            onComplete?.();
          }
        }}
      >
        <defs>
          <linearGradient id="hrtech-anim-grad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#E92034" />
            <stop offset="1" stopColor="#FF871F" />
          </linearGradient>
        </defs>

        <motion.rect
          width="40"
          height="40"
          rx="11"
          fill="url(#hrtech-anim-grad)"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: '20px 20px' }}
        />

        <motion.path
          d="M13 11v18M27 11v18M13 20h14"
          stroke="#0D0D0D"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.35, ease: 'easeInOut' }}
        />

        <motion.circle
          cx="20"
          cy="20"
          r="2.4"
          fill="#0D0D0D"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 1.05, type: 'spring', stiffness: 500, damping: 20 }}
          style={{ transformOrigin: '20px 20px' }}
        />
        <motion.circle
          cx="20"
          cy="20"
          r="1"
          fill="#FF871F"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.8, 1], opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.15, ease: 'easeOut' }}
          style={{ transformOrigin: '20px 20px' }}
        />
      </motion.svg>
    </div>
  );
}
