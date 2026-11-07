import type { ReactNode } from 'react';
import { SiteDocument } from '@/components/layout/SiteDocument';
import { siteMetadata, siteViewport } from '@/lib/site-metadata';
import '../globals.css';

export const metadata = siteMetadata('en-US');
export const viewport = siteViewport;

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <SiteDocument locale="en-US">{children}</SiteDocument>;
}
