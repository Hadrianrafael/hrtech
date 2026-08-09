'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { IconBrandWhatsapp } from '@tabler/icons-react';
import { siteConfig } from '@/lib/site-config';

export function WhatsAppFloatingButton() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.a
      href={siteConfig.whatsappHref}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
      whileHover={reduceMotion ? undefined : { scale: 1.05, y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      className="fixed bottom-6 right-6 z-50 flex h-14 items-center gap-2.5 rounded-full border border-white/10 bg-[#0D0D0D] pl-3.5 pr-3.5 text-white shadow-[0_8px_30px_-8px_rgba(0,0,0,0.55)] transition-shadow duration-300 hover:shadow-[0_10px_36px_-6px_rgba(37,211,102,0.4)] sm:pr-5"
    >
      <IconBrandWhatsapp size={26} className="shrink-0" style={{ color: '#25D366' }} aria-hidden />
      <span className="hidden text-sm font-medium sm:inline">Falar no WhatsApp</span>
    </motion.a>
  );
}
