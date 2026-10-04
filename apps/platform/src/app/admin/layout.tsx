import { AdminShell } from '@/components/admin/admin-shell';
import { requirePlatformAdminPage } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';
export const metadata = { title: { default: 'Admin', template: '%s · Admin HR Tech' } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requirePlatformAdminPage();
  return <AdminShell userName={user.name}>{children}</AdminShell>;
}
