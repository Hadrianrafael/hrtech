import { About } from '@/components/sections/About';
import { Contact } from '@/components/sections/Contact';
import { FaqSection } from '@/components/sections/FaqSection';
import { Founder } from '@/components/sections/Founder';
import { Hero } from '@/components/sections/Hero';
import { Process } from '@/components/sections/Process';
import { Segments } from '@/components/sections/Segments';
import { Services } from '@/components/sections/Services';
import { Stack } from '@/components/sections/Stack';
import type { Locale } from '@/lib/i18n/config';

export function HomePage({ locale }: { locale: Locale }) {
  return (
    <>
      <Hero locale={locale} />
      <Services locale={locale} />
      <Segments locale={locale} />
      <About locale={locale} />
      <Founder locale={locale} />
      <Stack locale={locale} />
      <Process locale={locale} />
      <FaqSection locale={locale} />
      <Contact locale={locale} />
    </>
  );
}
