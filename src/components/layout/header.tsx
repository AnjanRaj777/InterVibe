'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';

export default function Header() {
  const pathname = usePathname();
  const isInterview = pathname?.includes('/interview');

  return (
    <header className='bg-background/80 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 backdrop-blur-md md:h-14 border-b border-border/40'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumbs />
        {isInterview && (
          <div className='hidden md:flex items-center gap-2 ml-4'>
            <div className='h-4 w-px bg-border/60' />
            <span className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-card/80 border border-border/60 text-[11px] font-mono text-muted-foreground'>
              <span className='h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse' />
              LIVE SESSION
            </span>
          </div>
        )}
      </div>

      <div className='flex items-center gap-2 px-4'>
        <div className='hidden md:flex'>
          <SearchInput />
        </div>
        <ThemeModeToggle />
      </div>
    </header>
  );
}
