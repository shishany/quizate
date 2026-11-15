'use client';

import { Roadmap } from '@/components/showcase/Roadmap';
import { useS } from '@/lib/showcase/i18n';

export default function ShowcaseHome() {
  const { s } = useS();
  return (
    <>
      <section className="rounded-2xl bg-primary p-5 text-white">
        <h1 className="text-2xl font-bold">{s.title}</h1>
        <p className="mt-1 text-sm text-white/90">{s.intro}</p>
      </section>
      <Roadmap />
    </>
  );
}
