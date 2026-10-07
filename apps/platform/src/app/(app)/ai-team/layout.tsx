import type { ReactNode } from 'react';
import { AiTeamTabs } from '@/components/ai-team/tabs';

/** Navegação da Equipe IA. Cada página verifica o próprio acesso (o layout não protege requisições RSC parciais). */
export default function AiTeamLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <AiTeamTabs />
      {children}
    </div>
  );
}
