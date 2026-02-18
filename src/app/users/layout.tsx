import MainLayout from '@/components/MainLayout';

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout title="用户管理">{children}</MainLayout>;
}
