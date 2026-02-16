import { DashboardDataProvider } from '@/lib/data-context';
import { ToastProvider } from '@/components/ui/Toast';
import AppShell from '@/components/AppShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardDataProvider>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </DashboardDataProvider>
  );
}
