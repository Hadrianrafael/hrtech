import { About } from './About';
import { Contact } from './Contact';
import { Founder } from './Founder';
import { Hero } from './Hero';
import { Process } from './Process';
import { Segments } from './Segments';
import { Services } from './Services';
import { Stack } from './Stack';
import { defaultLocale, type Locale } from '@/lib/i18n';

export function HomeContent({ locale = defaultLocale }: { locale?: Locale }) {
  return (
    <>
      <Hero locale={locale} />
      <Services locale={locale} />
      <About locale={locale} />
      <Founder locale={locale} />
      <Stack locale={locale} />
      <Process locale={locale} />
      <Segments locale={locale} />
      <Contact locale={locale} />
    </>
  );
}
