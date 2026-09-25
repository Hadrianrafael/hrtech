import { About } from '@/components/sections/About';
import { Contact } from '@/components/sections/Contact';
import { Founder } from '@/components/sections/Founder';
import { Hero } from '@/components/sections/Hero';
import { Process } from '@/components/sections/Process';
import { Segments } from '@/components/sections/Segments';
import { Services } from '@/components/sections/Services';
import { Stack } from '@/components/sections/Stack';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <About />
      <Founder />
      <Stack />
      <Process />
      <Segments />
      <Contact />
    </>
  );
}
