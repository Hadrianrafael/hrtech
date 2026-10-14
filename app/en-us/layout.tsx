import type { ReactNode } from 'react';
import { RootDocument } from '@/components/layout/RootDocument';
import { layoutMetadata, siteViewport } from '@/lib/layout-meta';
import '../globals.css';

export const metadata = layoutMetadata('en-US');
export const viewport = siteViewport;

export default function Layout({ children }: { children: ReactNode }) {
  return <RootDocument locale="en-US">{children}</RootDocument>;
}
