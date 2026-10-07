import { NextResponse } from 'next/server';
import { pingDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await pingDatabase();
  return NextResponse.json({ status: db ? 'ok' : 'degraded', db, time: new Date().toISOString() }, { status: db ? 200 : 503 });
}
