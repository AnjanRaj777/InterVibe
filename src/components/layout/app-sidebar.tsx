'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { navGroups } from '@/config/nav-config';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useFilteredNavGroups } from '@/hooks/use-nav';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const { isMobile } = useSidebar();
  const filteredGroups = useFilteredNavGroups(navGroups);
  const { user, logout, prepareAccountSwitch } = useAuthStore();
  const [avatarError, setAvatarError] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  React.useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } catch {
      setIsSigningOut(false);
    }
  };

  const handleSwitchAccount = async () => {
    await prepareAccountSwitch();
    window.location.href = '/auth/login?switch=1';
  };

  const displayName = user?.name || 'Candidate';
  const displayEmail = user?.email || '';
  const initial = (user?.name || user?.email || 'C').charAt(0).toUpperCase();

  return (
    <Sidebar collapsible='icon' className='border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200'>
      
      {/* SIDEBAR HEADER LOGO (PERFECTLY CENTERED WHEN COLLAPSED) */}
      <SidebarHeader className='h-[64px] flex flex-row items-center gap-3 px-4 border-b border-sidebar-border shrink-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center'>
        <Link href='/dashboard' className='flex items-center gap-2.5'>
          <img
            src='/logo.png'
            alt='iV Logo'
            className='h-8 w-8 object-contain shrink-0 hidden dark:block'
          />
          <img
            src='/logo-light.png'
            alt='iV Logo'
            className='h-8 w-8 object-contain shrink-0 block dark:hidden'
          />
          <span className='text-sm font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:hidden'>
            iV
          </span>
        </Link>
        <span className='ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-muted-foreground group-data-[collapsible=icon]:hidden'>
          BETA
        </span>
      </SidebarHeader>

      <SidebarContent className='overflow-x-hidden flex-1'>
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label || 'ungrouped'} className='py-2 group-data-[collapsible=icon]:py-1'>
            {group.label && (
              <SidebarGroupLabel className='font-mono text-[10px] tracking-widest text-muted-foreground uppercase px-3 group-data-[collapsible=icon]:hidden'>
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                const isActive = pathname === item.url;
                return item?.items && item?.items?.length > 0 ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.isActive}
                    className='group/collapsible'
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                          {item.icon && <Icon />}
                          <span>{item.title}</span>
                          <Icons.chevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden' />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                      className={
                        isActive 
                          ? 'bg-foreground text-background font-medium hover:bg-foreground hover:text-background shadow-xs' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors'
                      }
                    >
                      <Link href={item.url}>
                        <Icon className='size-4' />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* FOOTER USER CARD WITH INTERACTIVE DROPDOWN & SIGN OUT */}
      <SidebarFooter className='border-t border-sidebar-border p-2 pb-6 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:py-3 group-data-[collapsible=icon]:justify-center'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              className='flex items-center gap-2.5 w-full p-1.5 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer group group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center text-left outline-none'
              title={displayName}
            >
              {user?.avatarUrl && !avatarError ? (
                <img
                  src={user.avatarUrl}
                  className='h-7 w-7 rounded-full object-cover shrink-0 border border-sidebar-border group-hover:border-foreground/40 transition-colors'
                  alt={displayName}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className='h-7 w-7 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 grid place-items-center text-[11px] font-bold font-mono shrink-0'>
                  {initial}
                </div>
              )}
              <div className='leading-tight min-w-0 flex-1 group-data-[collapsible=icon]:hidden'>
                <p className='text-[12.5px] font-medium truncate text-foreground group-hover:text-foreground'>
                  {displayName}
                </p>
                {displayEmail && (
                  <p className='text-[11px] text-muted-foreground font-mono truncate'>
                    {displayEmail}
                  </p>
                )}
              </div>
              <Icons.chevronRight className='size-3.5 text-muted-foreground/60 group-hover:text-foreground ml-auto group-data-[collapsible=icon]:hidden transition-colors' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? 'bottom' : 'top'}
            align='start'
            className='w-60 p-1.5 bg-card border-border/60 shadow-xl rounded-xl z-50'
          >
            <DropdownMenuLabel className='px-2 py-2 font-normal'>
              <div className='flex items-center gap-2.5'>
                {user?.avatarUrl && !avatarError ? (
                  <img
                    src={user.avatarUrl}
                    className='h-8 w-8 rounded-full object-cover shrink-0 border border-sidebar-border'
                    alt={displayName}
                  />
                ) : (
                  <div className='h-8 w-8 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 grid place-items-center text-xs font-bold font-mono shrink-0'>
                    {initial}
                  </div>
                )}
                <div className='flex flex-col min-w-0 flex-1'>
                  <span className='text-xs font-semibold text-foreground truncate'>
                    {displayName}
                  </span>
                  {displayEmail && (
                    <span className='text-[11px] text-muted-foreground font-mono truncate'>
                      {displayEmail}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className='my-1 bg-border/40' />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href='/dashboard/profile' className='flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg cursor-pointer hover:bg-sidebar-accent'>
                  <Icons.settings className='size-3.5 text-muted-foreground' />
                  <span>Profile & Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href='/dashboard/billing' className='flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg cursor-pointer hover:bg-sidebar-accent'>
                  <Icons.creditCard className='size-3.5 text-muted-foreground' />
                  <span>Billing & Plans</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className='flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg cursor-pointer hover:bg-sidebar-accent'
                onClick={handleSwitchAccount}
              >
                <Icons.arrowRight className='size-3.5 text-muted-foreground' />
                <span>Switch Account</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className='my-1 bg-border/40' />
            <DropdownMenuItem
              disabled={isSigningOut}
              className='flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg cursor-pointer text-red-500 focus:text-red-500 hover:bg-red-500/10 focus:bg-red-500/10'
              onClick={handleSignOut}
            >
              <Icons.logout className='size-3.5 text-red-500' />
              <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
