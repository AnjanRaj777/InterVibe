'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      window.location.replace('/auth/login');
    }
  }, [isAuthenticated]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src="/logo.png"
              alt="InterVibe Logo"
              className="h-10 w-10 object-contain hidden dark:block animate-pulse"
            />
            <img
              src="/logo-light.png"
              alt="InterVibe Logo"
              className="h-10 w-10 object-contain block dark:hidden animate-pulse"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Redirecting to login...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
