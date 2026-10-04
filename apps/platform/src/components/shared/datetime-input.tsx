'use client';

import { useState } from 'react';

function toLocalInput(value: string | Date | null | undefined, dateOnly: boolean) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return dateOnly ? date : `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Campo de data/hora no fuso do navegador que envia ao servidor um ISO 8601 (UTC) em input oculto,
 * evitando erros de fuso horário entre cliente e servidor.
 */
export function DateTimeInput({
  name,
  defaultValue,
  id,
  required,
  dateOnly = false,
  onChange,
}: {
  name: string;
  defaultValue?: string | Date | null;
  id?: string;
  required?: boolean;
  dateOnly?: boolean;
  onChange?: (iso: string) => void;
}) {
  const [local, setLocal] = useState(toLocalInput(defaultValue, dateOnly));
  const iso = local ? new Date(dateOnly ? `${local}T12:00` : local).toISOString() : '';
  return (
    <>
      <input
        id={id}
        type={dateOnly ? 'date' : 'datetime-local'}
        className="input"
        value={local}
        required={required}
        onChange={(e) => {
          setLocal(e.target.value);
          if (onChange && e.target.value) onChange(new Date(dateOnly ? `${e.target.value}T12:00` : e.target.value).toISOString());
        }}
      />
      <input type="hidden" name={name} value={iso} />
    </>
  );
}

export { toLocalInput };
