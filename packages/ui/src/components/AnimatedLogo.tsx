'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface AnimatedLogoProps {
  size?: number;
  onComplete?: () => void;
  className?: string;
}

const GRADIENT_ID = 'hrtech-anim-grad';

function GradientDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="4" x2="46" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFB65C" />
        <stop offset="1" stopColor="#FF871F" />
      </linearGradient>
    </defs>
  );
}

/**
 * One-time brand intro matching the official concept: circuit traces draw
 * in first, then the H forms, then the R completes it — orange/gold
 * gradient, no background tile (the mark sits directly on the dark hero).
 * Plays once on mount; skipped under prefers-reduced-motion in favor of the
 * final static frame.
 */
export function AnimatedLogo({ size = 88, onComplete, className }: AnimatedLogoProps) {
  const reduceMotion = useReducedMotion();
  const calledRef = React.useRef(false);
  const height = size * (40 / 64);

  React.useEffect(() => {
    if (reduceMotion && !calledRef.current) {
      calledRef.current = true;
      onComplete?.();
    }
  }, [reduceMotion, onComplete]);

  if (reduceMotion) {
    return (
      <div className={className} style={{ width: size, height }}>
        <svg width={size} height={height} viewBox="0 0 64 40" fill="none" aria-hidden>
          <GradientDefs id="hrtech-static-grad" />
          <rect x="10" y="4" width="6" height="32" rx="2" fill="url(#hrtech-static-grad)" />
          <rect x="26" y="4" width="6" height="32" rx="2" fill="url(#hrtech-static-grad)" />
          <rect x="10" y="17" width="22" height="6" rx="2" fill="url(#hrtech-static-grad)" />
          <rect x="32" y="4" width="15" height="16" rx="8" fill="url(#hrtech-static-grad)" />
          <path d="M34 20 L47 36" stroke="url(#hrtech-static-grad)" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: size, height }}>
      <motion.svg
        width={size}
        height={height}
        viewBox="0 0 64 40"
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
        <GradientDefs id={GRADIENT_ID} />

        {/* circuit traces */}
        <motion.g stroke={`url(#${GRADIENT_ID})`} strokeWidth="1.5" strokeLinecap="round">
          {[
            { x1: 1, y1: 8, x2: 10, y2: 8 },
            { x1: 0, y1: 20, x2: 10, y2: 20 },
            { x1: 3, y1: 32, x2: 10, y2: 32 },
          ].map((line, i) => (
            <motion.line
              key={i}
              {...line}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
            />
          ))}
        </motion.g>
        <motion.g fill={`url(#${GRADIENT_ID})`}>
          {[
            { cx: 1, cy: 8 },
            { cx: 0, cy: 20 },
            { cx: 3, cy: 32 },
          ].map((node, i) => (
            <motion.circle
              key={i}
              {...node}
              r="1.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.25, delay: 0.3 + i * 0.06 }}
              style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
            />
          ))}
        </motion.g>

        {/* H — forms next */}
        <motion.rect
          x="10"
          y="4"
          width="6"
          height="32"
          rx="2"
          fill={`url(#${GRADIENT_ID})`}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: '13px 20px' }}
        />
        <motion.rect
          x="26"
          y="4"
          width="6"
          height="32"
          rx="2"
          fill={`url(#${GRADIENT_ID})`}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.58, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: '29px 20px' }}
        />
        <motion.rect
          x="10"
          y="17"
          width="22"
          height="6"
          rx="2"
          fill={`url(#${GRADIENT_ID})`}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.72, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: '10px 20px' }}
        />

        {/* R — completes the mark */}
        <motion.rect
          x="32"
          y="4"
          width="15"
          height="16"
          rx="8"
          fill={`url(#${GRADIENT_ID})`}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.9, type: 'spring', stiffness: 400, damping: 22 }}
          style={{ transformOrigin: '32px 12px' }}
        />
        <motion.path
          d="M34 20 L47 36"
          stroke={`url(#${GRADIENT_ID})`}
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.0, ease: 'easeInOut' }}
        />
      </motion.svg>
    </div>
  );
}
