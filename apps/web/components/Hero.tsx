'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { IconArrowRight } from '@tabler/icons-react';
import { Button, AnimatedLogo } from '@hrtech/ui';
import { siteConfig } from '@/lib/site-config';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function Hero() {
  return (
    <section className="relative border-b border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-20 pt-16 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="lg:col-span-8">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="flex items-center gap-3">
            <AnimatedLogo size={36} />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink/40">
              HR Tech — Desenvolvimento de Sistemas
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0.14}
            variants={fadeUp}
            className="mt-8 max-w-2xl text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink"
          >
            Desenvolvimento de sistemas para empresas que querem{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)' }}
            >
              evoluir
            </span>
            .
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.3}
            variants={fadeUp}
            className="mt-6 max-w-lg text-base leading-relaxed text-ink/55 md:text-lg"
          >
            Construímos sistemas, SaaS, automações e experiências digitais sob medida para transformar processos
            complexos em soluções simples.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.44}
            variants={fadeUp}
            className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
          >
            <Button href="/contato" size="lg" iconRight={<IconArrowRight size={18} />}>
              Falar com a HR Tech
            </Button>
            <Button href="/servicos" variant="outline" size="lg">
              Conhecer nossos serviços
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="relative hidden items-center justify-center lg:col-span-4 lg:flex"
          aria-hidden
        >
          <svg width="220" height="280" viewBox="0 0 220 280" fill="none">
            <motion.path
              d="M20 20 H200 V260 H20 Z"
              stroke="#E5E5E5"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, delay: 0.5, ease: 'easeInOut' }}
            />
            <line x1="20" y1="90" x2="200" y2="90" stroke="#E5E5E5" strokeWidth="1" />
            <line x1="20" y1="190" x2="200" y2="190" stroke="#E5E5E5" strokeWidth="1" />
            <line x1="110" y1="20" x2="110" y2="260" stroke="#E5E5E5" strokeWidth="1" strokeDasharray="2 4" />
            <motion.line
              x1="20"
              y1="90"
              x2="110"
              y2="90"
              stroke="url(#hero-line-grad)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 1.1, ease: 'easeOut' }}
            />
            <motion.circle
              cx="110"
              cy="190"
              r="4"
              fill="#FF871F"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 1.4, type: 'spring', stiffness: 400, damping: 20 }}
            />
            <defs>
              <linearGradient id="hero-line-grad" x1="20" y1="90" x2="110" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#E92034" />
                <stop offset="1" stopColor="#FF871F" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
