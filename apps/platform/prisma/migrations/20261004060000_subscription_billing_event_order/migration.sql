-- Ordem dos eventos de cobrança: eventos mais antigos que o último aplicado são ignorados.
ALTER TABLE "Subscription" ADD COLUMN "lastBillingEventAt" TIMESTAMP(3);
