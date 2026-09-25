'use client';

import { useEffect, useState } from 'react';

/** Ano do copyright: gerado no build e atualizado no navegador. */
export function CurrentYear() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  useEffect(() => setYear(new Date().getFullYear()), []);
  return <>{year}</>;
}
