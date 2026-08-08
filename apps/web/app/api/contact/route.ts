import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${apiUrl}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json().catch(() => ({ message: 'Erro ao processar a resposta do servidor.' }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor. Tente novamente em instantes.' },
      { status: 503 },
    );
  }
}
