'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/cn';

export interface ProjectCardProps {
  eyebrow?: string;
  title: string;
  status?: string;
  description: string;
  href: string;
  ctaLabel?: string;
  visual: React.ReactNode;
  className?: string;
}

/**
 * Premium project showcase — one component reused for every portfolio
 * entry as new verticals ship. Deliberately not a generic "image + title +
 * button" card: the visual slot is the centerpiece, hover motion is a
 * single coordinated gesture (lift + parallax + border/CTA reaction), not
 * a stack of unrelated effects.
 */
export function ProjectCard({
  eyebrow = 'Projeto em destaque',
  title,
  status,
  description,
  href,
  ctaLabel = 'Conhecer solução',
  visual,
  className,
}: ProjectCardProps) {
  return (
    <motion.a
      href={href}
      className={cn(
        'group relative block overflow-hidden rounded-md border border-white/10 bg-[#0D0D0D]',
        className,
      )}
      whileHover="hover"
      initial="rest"
      animate="rest"
      variants={{ rest: { y: 0 }, hover: { y: -6 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-24 blur-3xl"
        variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
        transition={{ duration: 0.5 }}
        style={{
          background:
            'radial-gradient(closest-side, rgba(233,32,52,0.18), rgba(255,135,31,0.08), transparent)',
        }}
      />

      <div className="relative border-b border-white/10 transition-colors duration-300 group-hover:border-brand-orange/30">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-10 sm:pt-10">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">{eyebrow}</span>
            <h3 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">{title}</h3>
          </div>
          {status && (
            <span className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-white/55">
              {status}
            </span>
          )}
        </div>

        <div className="px-6 pb-8 pt-8 sm:px-10 sm:pb-10">
          <motion.div
            className="overflow-hidden rounded-md border border-white/10 bg-dark-surface p-5 md:p-7"
            variants={{ rest: { y: 0 }, hover: { y: -4 } }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            {visual}
          </motion.div>
        </div>
      </div>

      <div className="relative flex flex-col items-start justify-between gap-4 px-6 py-7 sm:flex-row sm:items-center sm:px-10">
        <p className="max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">{description}</p>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium">
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)' }}
          >
            {ctaLabel}
          </span>
          <motion.span
            aria-hidden
            className="text-brand-orange"
            variants={{ rest: { x: 0 }, hover: { x: 4 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            →
          </motion.span>
        </span>
      </div>
    </motion.a>
  );
}
