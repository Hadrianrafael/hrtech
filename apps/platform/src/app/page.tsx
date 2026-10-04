import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/context';

export default async function Home() {
  const auth = await getUser();
  redirect(auth ? '/dashboard' : '/login');
}
