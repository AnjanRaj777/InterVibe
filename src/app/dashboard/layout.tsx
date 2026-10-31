import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { AuthGuard } from '@/components/auth/auth-guard';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | InterVibe',
  description: 'AI Mock Interview Platform Dashboard',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <AuthGuard>
          {children}
        </AuthGuard>
      </SidebarInset>
    </SidebarProvider>
  );
}
