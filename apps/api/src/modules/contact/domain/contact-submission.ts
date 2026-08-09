export interface ContactSubmission {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  segment?: string;
  interest?: string;
  message: string;
}

export function normalizeContactSubmission(input: ContactSubmission): ContactSubmission {
  return {
    name: input.name.trim(),
    company: input.company?.trim() || undefined,
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    segment: input.segment?.trim() || undefined,
    interest: input.interest?.trim() || undefined,
    message: input.message.trim(),
  };
}
