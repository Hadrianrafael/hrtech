'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../lib/cn';

const NODES = [
  { id: 'a', x: 320, y: 90, r: 4, delay: 0 },
  { id: 'b', x: 210, y: 170, r: 3, delay: 0.6 },
  { id: 'c', x: 420, y: 190, r: 5, delay: 1.1 },
  { id: 'd', x: 300, y: 300, r: 3, delay: 0.3 },
  { id: 'e', x: 460, y: 340, r: 3.5, delay: 0.9 },
  { id: 'f', x: 150, y: 330, r: 2.5, delay: 1.4 },
  { id: 'g', x: 380, y: 420, r: 4, delay: 0.2 },
];

const EDGES: [string, string][] = [
  ['a', 'b'],
  ['a', 'c'],
  ['b', 'd'],
  ['c', 'e'],
  ['d', 'f'],
  ['d', 'g'],
  ['e', 'g'],
];

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

/**
 * Ambient technological composition for the hero — a fixed, hand-placed node
 * graph, not a physics sim. Hidden below lg to keep mobile hero lean per the
 * brief's performance priority; respects prefers-reduced-motion by freezing
 * the drift/pulse and keeping only the static graph.
 */
export function NetworkVisual({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn('pointer-events-none hidden select-none lg:block', className)} aria-hidden>
      <svg width="560" height="480" viewBox="0 0 560 480" fill="none">
        <defs>
          <linearGradient id="network-edge" x1="0" y1="0" x2="560" y2="480" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#E92034" stopOpacity="0.5" />
            <stop offset="1" stopColor="#FF871F" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {EDGES.map(([from, to], i) => {
          const a = byId[from]!;
          const b = byId[to]!;
          return (
            <motion.line
              key={`${from}-${to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="url(#network-edge)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.4 + i * 0.12, ease: 'easeInOut' }}
            />
          );
        })}

        {NODES.map((node) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={
              reduceMotion
                ? { opacity: 1, scale: 1 }
                : { opacity: 1, scale: 1, translateX: [0, 6, 0], translateY: [0, -8, 0] }
            }
            transition={
              reduceMotion
                ? { duration: 0.4, delay: node.delay }
                : {
                    scale: { duration: 0.4, delay: node.delay, type: 'spring', stiffness: 300, damping: 20 },
                    opacity: { duration: 0.4, delay: node.delay },
                    translateX: { duration: 7, delay: node.delay + 1, repeat: Infinity, ease: 'easeInOut' },
                    translateY: { duration: 7, delay: node.delay + 1, repeat: Infinity, ease: 'easeInOut' },
                  }
            }
            style={{ transformOrigin: `${node.x}px ${node.y}px` }}
          >
            <circle cx={node.x} cy={node.y} r={node.r + 6} fill="#FF871F" opacity="0.08" />
            <circle cx={node.x} cy={node.y} r={node.r} fill="#FAFAFA" opacity="0.85" />
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
