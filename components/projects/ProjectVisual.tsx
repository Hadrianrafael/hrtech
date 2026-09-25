import { Icon } from '@/components/icons/Icon';
import { BrowserFrame, PhoneFrame } from '@/components/ui/DeviceFrames';
import type { Project } from '@/data/projects';
import { cn } from '@/lib/cn';

function hostname(url?: string) {
  if (!url) return undefined;
  try {
    const { hostname: host, pathname } = new URL(url);
    return `${host}${pathname}`.replace(/\/$/, '');
  } catch {
    return undefined;
  }
}

/** Ilustração neutra para projetos que ainda não têm capturas de tela. */
function PendingScreens({ project }: { project: Project }) {
  const isSystem = project.categories.some((category) => category !== 'SITE');
  return (
    <div className="absolute inset-0 grid grid-cols-[22%_1fr] bg-surface">
      <div className="border-r border-line/[0.07] p-3 sm:p-4">
        <div className="h-4 w-4/5 rounded bg-gradient-to-r from-brand-soft/70 to-brand/60" />
        <div className="mt-5 space-y-2.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={cn('h-2 rounded-full', i === 1 ? 'w-4/5 bg-brand-soft/50' : 'w-3/5 bg-white/10')} />
          ))}
        </div>
      </div>
      <div className="p-3 sm:p-5">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-line/[0.07] bg-white/[0.02] p-2 sm:p-3">
              <div className="h-1.5 w-2/3 rounded-full bg-white/15" />
              <div className="mt-2 h-3 w-1/2 rounded bg-white/50 sm:h-4" />
            </div>
          ))}
        </div>
        <div className="mt-3 flex h-[45%] items-end gap-1.5 rounded-lg border border-line/[0.07] bg-bg/40 p-3">
          {(isSystem ? [40, 62, 48, 70, 58, 82, 74, 95] : [70, 50, 80, 60, 90, 75, 85, 65]).map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand/10 to-brand/45" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-5 rounded-md border border-line/[0.05] bg-white/[0.02]" />
          ))}
        </div>
      </div>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-line/[0.12] bg-bg/90 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted backdrop-blur">
        <Icon name="image" size={12} />
        Ilustração · capturas em breve
      </div>
    </div>
  );
}

type ProjectVisualProps = { project: Project; priority?: boolean; showPhone?: boolean; className?: string; sizes?: string };

export function ProjectVisual({ project, priority, showPhone = true, className, sizes }: ProjectVisualProps) {
  const phone = project.gallery.find((image) => image.frame === 'mobile');
  return (
    <div className={cn('relative', showPhone && phone && 'pb-6 pr-8 sm:pr-14', className)}>
      <BrowserFrame src={project.cover?.src} alt={project.cover?.alt} url={hostname(project.links.live)} priority={priority} sizes={sizes}>
        {!project.cover && <PendingScreens project={project} />}
      </BrowserFrame>
      {showPhone && phone && (
        <PhoneFrame src={phone.src} alt={phone.alt} className="absolute bottom-0 right-0 w-[24%] min-w-[84px] max-w-[150px]" />
      )}
    </div>
  );
}
