'use client';

import { cancelSubscriptionAction, requestPlanChangeAction } from '@/app/actions/org';
import { Button } from '@/components/ui/button';
import { useAction } from '@/components/ui/use-action';
import { useToast } from '@/components/ui/toast';

export function PlanButton({ planId, current }: { planId: string; current: boolean }) {
  const toast = useToast();
  const r = useAction(() => requestPlanChangeAction(planId), {
    onSuccess: (d) => {
      if (d.url) window.location.href = d.url;
      else if (d.message) toast.info(d.message);
    },
  });
  if (current) return <Button size="sm" variant="secondary" disabled className="w-full justify-center">Plano atual</Button>;
  return <Button size="sm" loading={r.pending} onClick={() => r.run()} className="w-full justify-center">Solicitar este plano</Button>;
}

export function CancelButton() {
  const r = useAction(() => cancelSubscriptionAction());
  return <Button size="sm" variant="ghost" loading={r.pending} onClick={() => confirm('Agendar cancelamento ao fim do período atual?') && r.run()}>Cancelar assinatura</Button>;
}
