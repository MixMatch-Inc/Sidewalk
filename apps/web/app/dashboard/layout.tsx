import { ProtectedAppShell } from '../_components/protected-app-shell';

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ProtectedAppShell>{children}</ProtectedAppShell>;
}
