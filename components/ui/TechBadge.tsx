import { BrandIcon } from '@/components/icons/BrandIcon';
import type { Technology } from '@/data/technologies';
import { cn } from '@/lib/cn';

function monogram(name: string) {
  const words = name.replace(/[()]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0]!.slice(0, 2);
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

export function TechBadge({ tech, className }: { tech: Technology; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-line/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-[13px] text-muted transition-colors duration-200 hover:border-line/[0.18] hover:text-fg',
        className,
      )}
    >
      {tech.icon ? (
        <BrandIcon name={tech.icon} size={15} className="shrink-0 opacity-80" />
      ) : (
        <span className="grid h-[15px] min-w-[15px] shrink-0 place-items-center rounded-[4px] bg-white/10 px-0.5 font-mono text-[8.5px] font-semibold leading-none text-fg/80" aria-hidden="true">
          {monogram(tech.name)}
        </span>
      )}
      {tech.name}
    </span>
  );
}
