'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

declare global {
  interface Window {
    __hrRevealReady?: boolean;
  }
}

export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    window.__hrRevealReady = true;
    const root = document.documentElement;
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)'));

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    root.classList.add('js-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
