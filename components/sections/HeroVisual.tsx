import { Icon } from '@/components/icons/Icon';

/**
 * Composição ilustrativa do Hero: um painel de sistema, um card de deploy,
 * um assistente de IA e um trecho de código. Feito só com HTML/CSS/SVG
 * (sem WebGL nem imagens) para não pesar no carregamento.
 * Os dados exibidos são fictícios e servem apenas como ilustração de interface.
 */
const bars = [38, 52, 44, 63, 58, 72, 66, 84, 78, 92, 86, 100];

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[640px] [perspective:1800px]" aria-hidden="true">
      {/* brilho de fundo */}
      <div className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgb(var(--brand)/0.28),transparent)] blur-2xl" />

      <div className="relative transition-transform duration-700 lg:[transform:rotateY(-9deg)_rotateX(5deg)]">
        {/* Janela principal */}
        <div className="overflow-hidden rounded-2xl border border-line/[0.12] bg-surface/95 shadow-[0_40px_120px_-40px_rgb(var(--brand)/0.45),0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="flex h-9 items-center gap-1.5 border-b border-line/[0.08] px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="ml-4 h-4 w-40 rounded bg-white/[0.05]" />
          </div>
          <div className="grid grid-cols-[52px_1fr] sm:grid-cols-[150px_1fr]">
            {/* sidebar */}
            <div className="border-r border-line/[0.07] p-3 sm:p-4">
              <div className="mb-5 h-5 w-5 rounded-md bg-gradient-to-br from-brand-soft to-brand sm:w-16" />
              {['layers', 'users', 'calendar', 'gauge', 'workflow'].map((icon, i) => (
                <div key={icon} className={`mb-2 flex items-center gap-2 rounded-lg px-1.5 py-1.5 sm:px-2 ${i === 0 ? 'bg-brand/15 text-brand-soft' : 'text-subtle'}`}>
                  <Icon name={icon as 'layers'} size={15} />
                  <span className={`hidden h-2 rounded-full sm:block ${i === 0 ? 'w-14 bg-brand-soft/60' : 'w-12 bg-white/10'}`} />
                </div>
              ))}
            </div>
            {/* conteúdo */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-2.5 w-20 rounded-full bg-white/20" />
                  <div className="mt-2 h-2 w-32 rounded-full bg-white/[0.08]" />
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-300">online</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {[
                  { w: 'w-10', tone: 'from-brand/25' },
                  { w: 'w-12', tone: 'from-accent/20' },
                  { w: 'w-8', tone: 'from-white/10' },
                ].map((card, i) => (
                  <div key={i} className={`rounded-xl border border-line/[0.07] bg-gradient-to-br ${card.tone} to-transparent p-2.5 sm:p-3`}>
                    <div className="h-1.5 w-10 rounded-full bg-white/15" />
                    <div className={`mt-2.5 h-3.5 ${card.w} rounded bg-white/70 sm:h-4`} />
                    <div className="mt-2 h-1.5 w-8 rounded-full bg-emerald-400/50" />
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-xl border border-line/[0.07] bg-bg/40 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="h-2 w-24 rounded-full bg-white/15" />
                  <div className="flex gap-1">
                    <span className="h-2 w-6 rounded-full bg-brand/60" />
                    <span className="h-2 w-6 rounded-full bg-white/10" />
                  </div>
                </div>
                <div className="relative mt-4 h-28 sm:h-32">
                  <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-2">
                    {bars.map((height, i) => (
                      <div key={i} className="flex-1 rounded-t-[4px] bg-gradient-to-t from-brand/10 to-brand/45" style={{ height: `${height}%` }} />
                    ))}
                  </div>
                  <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <path
                      d="M0 70 C 30 62, 45 66, 70 55 S 120 45, 150 40 S 200 30, 230 22 S 280 12, 300 6"
                      fill="none"
                      stroke="rgb(var(--brand-soft))"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                      strokeDasharray="600"
                      className="animate-draw-line"
                    />
                  </svg>
                </div>
              </div>

              <div className="mt-3 hidden space-y-2 sm:block">
                {[0, 1].map((row) => (
                  <div key={row} className="flex items-center gap-3 rounded-lg border border-line/[0.05] px-3 py-2">
                    <span className="h-6 w-6 rounded-full bg-white/10" />
                    <span className="h-2 w-28 rounded-full bg-white/15" />
                    <span className="ml-auto h-2 w-12 rounded-full bg-white/[0.08]" />
                    <span className={`h-4 w-14 rounded-full ${row === 0 ? 'bg-emerald-400/20' : 'bg-brand/20'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card: deploy */}
        <div className="absolute -left-3 top-[58%] hidden w-56 animate-float-slow rounded-xl border border-line/[0.12] bg-elevated/95 p-3.5 shadow-2xl backdrop-blur sm:block lg:-left-12">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300">
              <Icon name="check" size={15} strokeWidth={2} />
            </span>
            <div>
              <p className="text-[12px] font-medium text-fg">Deploy concluído</p>
              <p className="font-mono text-[10px] text-subtle">main → produção</p>
            </div>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400/70 to-emerald-300" />
          </div>
        </div>

        {/* Card: assistente de IA */}
        <div className="absolute -right-2 -top-6 hidden w-60 animate-float-slower rounded-xl border border-line/[0.12] bg-elevated/95 p-3.5 shadow-2xl backdrop-blur sm:block lg:-right-10">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/20 text-brand-soft">
              <Icon name="sparkles" size={15} />
            </span>
            <p className="text-[12px] font-medium text-fg">Assistente IA</p>
            <span className="ml-auto h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand-soft" />
          </div>
          <p className="mt-2.5 rounded-lg rounded-tl-sm bg-white/[0.05] px-2.5 py-2 text-[11.5px] leading-snug text-muted">
            Horário confirmado para quinta às 14h. Enviei o lembrete no WhatsApp.
          </p>
        </div>

        {/* Card: código */}
        <div className="absolute -bottom-8 right-4 hidden w-64 rounded-xl border border-line/[0.12] bg-[#0a0f1a]/95 p-3.5 font-mono text-[10.5px] leading-relaxed shadow-2xl backdrop-blur md:block lg:-right-6">
          <p>
            <span className="text-accent">export async function</span> <span className="text-brand-soft">agendar</span>
            <span className="text-subtle">(dados) {'{'}</span>
          </p>
          <p className="pl-3 text-subtle">
            <span className="text-accent">await</span> <span className="text-fg/80">agenda.reservar</span>(dados)
          </p>
          <p className="pl-3 text-subtle">
            <span className="text-accent">return</span> <span className="text-emerald-300">{"'confirmado'"}</span>
          </p>
          <p className="text-subtle">{'}'}</p>
        </div>
      </div>
    </div>
  );
}
