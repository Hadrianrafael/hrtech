'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { IconArrowRight, IconBrandWhatsapp } from '@tabler/icons-react';
import { Button, AnimatedLogo, NetworkVisual, Marquee } from '@hrtech/ui';
import { siteConfig } from '@/lib/site-config';

const CAPABILITIES = [
  'SISTEMAS',
  'PLATAFORMAS SAAS',
  'INTELIGÊNCIA ARTIFICIAL',
  'AUTOMAÇÃO',
  'ENGENHARIA DE SOFTWARE',
  'INTEGRAÇÕES',
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full opacity-40 blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(233,32,52,0.25) 0%, transparent 70%)' }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 pb-20 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-28 lg:pt-28">
        <div>
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="flex items-center gap-3">
            <AnimatedLogo size={40} />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
              HR Tech — Desenvolvimento de Sistemas
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0.15}
            variants={fadeUp}
            className="mt-8 text-[clamp(2.5rem,6vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-white"
          >
            Sistemas que fazem sua{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)' }}
            >
              empresa evoluir
            </span>
            .
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.32}
            variants={fadeUp}
            className="mt-6 max-w-lg text-base leading-relaxed text-white/55 md:text-lg"
          >
            Desenvolvemos sistemas sob medida, plataformas SaaS, automações e Inteligência Artificial para
            empresas que não cabem em software genérico.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.48}
            variants={fadeUp}
            className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
          >
            <Button href="/contato" size="lg" iconRight={<IconArrowRight size={18} />}>
              Solicitar Orçamento
            </Button>
            <Button
              href={siteConfig.whatsappHref}
              variant="secondary"
              size="lg"
              iconLeft={<IconBrandWhatsapp size={18} />}
            >
              Falar no WhatsApp
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative flex justify-end"
        >
          <NetworkVisual />
        </motion.div>
      </div>

      <div className="relative border-y border-border py-5">
        <Marquee items={CAPABILITIES} />
      </div>
    </section>
  );
}
