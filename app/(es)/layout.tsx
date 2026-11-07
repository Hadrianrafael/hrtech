import type { ReactNode } from 'react';
import { SiteDocument } from '@/components/layout/SiteDocument';
import { siteMetadata, siteViewport } from '@/lib/site-metadata';
import '../globals.css';

export const metadata = siteMetadata('es');
export const viewport = siteViewport;

export default function SpanishLayout({ children }: { children: ReactNode }) {
  return <SiteDocument locale="es">{children}</SiteDocument>;
}
