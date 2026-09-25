import { About } from '@/components/sections/About';
import { Contact } from '@/components/sections/Contact';
import { Founder } from '@/components/sections/Founder';
import { Hero } from '@/components/sections/Hero';
import { Process } from '@/components/sections/Process';
import { Projects } from '@/components/sections/Projects';
import { Segments } from '@/components/sections/Segments';
import { Services } from '@/components/sections/Services';
import { Stack } from '@/components/sections/Stack';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <Projects />
      <About />
      <Founder />
      <Stack />
      <Process />
      <Segments />
      <Contact />
    </>
  );
}
