import { NextResponse } from 'next/server';
import { errorResponse, routeContext } from '@/lib/route';
import { exportContactData } from '@/server/lgpd';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await routeContext('contacts.export');
  if (ctx instanceof NextResponse) return ctx;
  try {
    const { id } = await params;
    const data = await exportContactData(ctx, id);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="dados-titular-${id}.json"`, 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
