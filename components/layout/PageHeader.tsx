import type { ReactNode } from 'react';
import { Breadcrumbs, type Crumb } from './Breadcrumbs';

type PageHeaderProps = {
  breadcrumbs: Crumb[];
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({ breadcrumbs, eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden pb-12 pt-[calc(var(--header-h)+3rem)] sm:pb-16 lg:pt-[calc(var(--header-h)+4.5rem)]">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_30%,transparent_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[-20rem] -z-10 h-[34rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--brand)/0.18),transparent)]" />
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        {eyebrow && <div className="hero-in mt-8">{eyebrow}</div>}
        <h1 className="hero-rise mt-5 max-w-4xl text-[2.4rem] font-semibold leading-[1.04] tracking-tightest text-fg sm:text-5xl lg:text-6xl">{title}</h1>
        {description && <p className="hero-in mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{description}</p>}
        {children}
      </div>
    </section>
  );
}
