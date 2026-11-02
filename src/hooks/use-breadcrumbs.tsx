'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// Custom breadcrumb mappings
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard/overview' }],
  '/dashboard/overview': [
    { title: 'Dashboard', link: '/dashboard/overview' },
    { title: 'Overview', link: '/dashboard/overview' }
  ]
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const rawPath = `/${segments.slice(0, index + 1).join('/')}`;
      const path = rawPath === '/dashboard' ? '/dashboard/overview' : rawPath;
      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
