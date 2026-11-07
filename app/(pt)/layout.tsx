import type { ReactNode } from 'react';
import { SiteDocument } from '@/components/layout/SiteDocument';
import { siteMetadata, siteViewport } from '@/lib/site-metadata';
import '../globals.css';

export const metadata = siteMetadata('pt-BR');
export const viewport = siteViewport;

export default function PortugueseLayout({ children }: { children: ReactNode }) {
  return <SiteDocument locale="pt-BR">{children}</SiteDocument>;
}
