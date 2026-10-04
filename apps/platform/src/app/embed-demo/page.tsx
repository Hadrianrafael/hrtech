import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = { title: 'Demonstração do widget' };

/** Página que simula o site de um cliente com o widget e o formulário de captura instalados. */
export default async function EmbedDemo({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!key) return <p className="p-8 text-sm">Informe ?key=pk_… (copie em Chatbot e IA).</p>;
  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <header className="rounded-2xl bg-gradient-to-br from-sky-600 to-emerald-500 p-10 text-white">
        <p className="text-xs uppercase tracking-widest opacity-80">Site de exemplo</p>
        <h1 className="mt-2 text-3xl font-semibold">Sua pousada à beira-mar</h1>
        <p className="mt-2 opacity-90">Esta página simula o site do cliente. O botão de chat no canto inferior e o formulário abaixo enviam dados para o CRM da HR Tech.</p>
      </header>
      <section className="rounded-2xl border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold">Solicite um orçamento</h2>
        <form data-hrtech-form={key} className="grid gap-3 sm:grid-cols-2">
          <input name="name" placeholder="Nome" required className="input" />
          <input name="phone" placeholder="WhatsApp" className="input" />
          <input name="email" type="email" placeholder="E-mail" className="input sm:col-span-2" />
          <input name="checkIn" type="date" className="input" aria-label="Check-in" />
          <input name="checkOut" type="date" className="input" aria-label="Check-out" />
          <input name="guests" placeholder="Hóspedes" className="input" />
          <input name="interest" placeholder="Tipo de quarto / interesse" className="input" />
          <textarea name="message" placeholder="Mensagem" className="input h-20 py-2 sm:col-span-2" />
          <input name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
          <label className="flex items-center gap-2 text-xs sm:col-span-2"><input type="checkbox" name="consent" required /> Autorizo o contato e o tratamento dos meus dados (LGPD).</label>
          <label className="flex items-center gap-2 text-xs sm:col-span-2"><input type="checkbox" name="wantsAppointment" /> Quero agendar um atendimento.</label>
          <button type="submit" className="h-10 rounded-lg bg-sky-600 font-medium text-white sm:col-span-2">Enviar</button>
        </form>
      </section>
      <Script src="/widget.js" data-key={key} strategy="afterInteractive" />
    </main>
  );
}
