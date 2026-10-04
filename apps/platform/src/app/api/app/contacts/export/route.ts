import { NextResponse, type NextRequest } from 'next/server';
import { audit } from '@/lib/audit';
import { routeContext } from '@/lib/route';
import { contactWhere, LEAD_STATUS_LABELS, SOURCE_LABELS } from '@/server/contacts';

function csvCell(v: unknown) {
  const s = v === null || v === undefined ? '' : String(v);
  // Neutraliza fórmulas (CSV injection) e escapa aspas.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const ctx = await routeContext('contacts.export');
  if (ctx instanceof NextResponse) return ctx;
  const sp = req.nextUrl.searchParams;
  const where = contactWhere(ctx, {
    q: sp.get('q') ?? undefined,
    status: sp.get('status') ?? undefined,
    source: sp.get('source') ?? undefined,
    ownerId: sp.get('ownerId') ?? undefined,
    tagId: sp.get('tagId') ?? undefined,
  });
  const contacts = await ctx.db.contact.findMany({ where, orderBy: { createdAt: 'desc' }, take: 20000, include: { tags: { include: { tag: true } } } });
  const header = ['Nome', 'E-mail', 'Telefone', 'WhatsApp', 'Instagram', 'Empresa', 'Cidade', 'UF', 'Origem', 'Status', 'Valor potencial', 'Etiquetas', 'Criado em', 'Consentimento'];
  const rows = contacts.map((c) =>
    [
      c.name, c.email, c.phone, c.whatsapp, c.instagram, c.companyName, c.city, c.state, SOURCE_LABELS[c.source] ?? c.source, LEAD_STATUS_LABELS[c.status],
      c.potentialValue?.toString() ?? '', c.tags.map((t) => t.tag.name).join(', '), c.createdAt.toISOString(), c.consentAt?.toISOString() ?? '',
    ].map(csvCell).join(';'),
  );
  await audit({ organizationId: ctx.orgId, actorUserId: ctx.userId, action: 'contacts.exported', severity: 'warning', metadata: { count: contacts.length } });
  return new NextResponse('﻿' + [header.map(csvCell).join(';'), ...rows].join('\r\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="contatos-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' },
  });
}
