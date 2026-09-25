import { techIcons, type TechIconKey } from './tech-icons';

type BrandIconProps = {
  name: TechIconKey | 'linkedin';
  size?: number;
  className?: string;
};

/** Ícone de marca preenchido (monocromático, herda `currentColor`). */
export function BrandIcon({ name, size = 18, className }: BrandIconProps) {
  if (name === 'linkedin') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
        <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3.2 7.3H5v8.2h2.2v-8.2ZM6.1 5.8a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Zm11.9 7.5c0-2.2-1.2-3.2-2.8-3.2-1.3 0-1.9.7-2.2 1.2v-1H10.8v8.2H13v-4.4c0-1.1.4-1.9 1.4-1.9s1.4.8 1.4 1.9v4.4H18v-5.2Z" />
      </svg>
    );
  }
  const icon = techIcons[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <path d={icon.path} />
    </svg>
  );
}
