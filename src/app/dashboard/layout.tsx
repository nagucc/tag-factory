import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '控制台 - Tag Factory',
  description: '数据标签管理系统控制台',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
