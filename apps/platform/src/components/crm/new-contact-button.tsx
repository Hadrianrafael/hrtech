'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ContactForm, type FormOptions } from './contact-form';

export function NewContactButton({ options, label = 'Novo lead' }: { options: FormOptions; label?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo lead" description="O lead entra no CRM e no funil comercial automaticamente." size="lg">
        <ContactForm
          options={options}
          onDone={(id) => {
            setOpen(false);
            router.push(`/contacts/${id}`);
          }}
        />
      </Modal>
    </>
  );
}
