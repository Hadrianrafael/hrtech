import { BrandIcon } from '@/components/icons/BrandIcon';
import { whatsappLink } from '@/lib/whatsapp';

export function WhatsAppButton() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar com a HR Tech pelo WhatsApp (abre em nova aba)"
      className="group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-[#0b2e17] shadow-[0_12px_32px_-8px_rgba(37,211,102,0.55)] transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:bottom-6 sm:right-6"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/30 [animation-duration:3s]" aria-hidden="true" />
      <BrandIcon name="whatsapp" size={26} className="relative" />
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg border border-line/10 bg-elevated px-3 py-1.5 text-xs font-medium text-fg opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:block">
        Fale conosco no WhatsApp
      </span>
    </a>
  );
}
