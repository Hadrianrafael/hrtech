import { Bot, MessagesSquare, KanbanSquare } from 'lucide-react';
import { Logo } from '@/components/layout/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="mb-8 text-lg" />
          {children}
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-red-600 p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-2xl" />
        <h2 className="max-w-md text-3xl font-semibold leading-tight">Atendimento, CRM e IA em um só lugar.</h2>
        <p className="mt-3 max-w-md text-white/80">WhatsApp, Instagram, e-mail e o chat do seu site centralizados, com Inteligência Artificial ajudando sua equipe a vender mais.</p>
        <ul className="mt-8 space-y-3 text-sm text-white/90">
          <li className="flex items-center gap-2"><MessagesSquare className="h-4 w-4" /> Caixa de entrada unificada</li>
          <li className="flex items-center gap-2"><KanbanSquare className="h-4 w-4" /> Funil comercial com Kanban</li>
          <li className="flex items-center gap-2"><Bot className="h-4 w-4" /> Assistente com base de conhecimento própria</li>
        </ul>
      </aside>
    </main>
  );
}
