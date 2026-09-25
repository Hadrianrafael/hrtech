import type { CSSProperties, ElementType, ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Atraso em milissegundos (útil para escalonar cards). */
  delay?: number;
  as?: ElementType;
};

/**
 * Marca o elemento para a animação de entrada no scroll.
 * A lógica fica em <RevealObserver /> — um único IntersectionObserver para a página toda.
 */
export function Reveal({ children, className, delay = 0, as: Tag = 'div' }: RevealProps) {
  const style = delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined;
  return (
    <Tag data-reveal="" className={className} style={style}>
      {children}
    </Tag>
  );
}
