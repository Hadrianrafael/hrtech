'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { IconArrowRight } from '@tabler/icons-react';
import { Button, AnimatedLogo } from '@hrtech/ui';
import { TechObject3D } from '@/components/three/TechObject3D';

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
    <section className="relative overflow-hidden bg-dark-bg">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-28">
        <div className="lg:col-span-7">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="flex items-center gap-3">
            <AnimatedLogo size={36} />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
              HR Tech — Desenvolvimento de Sistemas
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0.14}
            variants={fadeUp}
            className="mt-8 max-w-2xl text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white"
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
            className="mt-6 max-w-lg text-base leading-relaxed text-white/55 md:text-lg"
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
            <Button href="/servicos" variant="secondary" size="lg">
              Conhecer nossos serviços
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.35 }}
          className="relative flex items-center justify-center lg:col-span-5"
        >
          <TechObject3D />
        </motion.div>
      </div>
    </section>
  );
}
