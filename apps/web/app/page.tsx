import { getApiHealth } from '@/lib/get-api-health';

export default async function Page() {
  const health = await getApiHealth();

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>HR Tech — em construção</h1>
      <p>Status da API: {health.status}</p>
    </main>
  );
}
