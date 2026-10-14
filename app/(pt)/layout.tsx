import type { ReactNode } from 'react';
import { RootDocument } from '@/components/layout/RootDocument';
import { layoutMetadata, siteViewport } from '@/lib/layout-meta';
import '../globals.css';

export const metadata = layoutMetadata('pt-BR');
export const viewport = siteViewport;

export default function Layout({ children }: { children: ReactNode }) {
  return <RootDocument locale="pt-BR">{children}</RootDocument>;
}
