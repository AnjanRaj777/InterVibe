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
  SidebarRail
} from '@/components/ui/sidebar';
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
  const filteredGroups = useFilteredNavGroups(navGroups);
  const { user } = useAuthStore();

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar collapsible='icon' className='border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200'>
      
      {/* SIDEBAR HEADER LOGO (PERFECTLY CENTERED WHEN COLLAPSED) */}
      <SidebarHeader className='h-[64px] flex flex-row items-center gap-3 px-4 border-b border-sidebar-border shrink-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center'>
        <div className='h-8 w-8 rounded-[8px] bg-foreground text-background grid place-items-center font-bold text-[13px] shadow-sm shrink-0'>
          I
        </div>
        <span className='text-[13.5px] font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:hidden'>
          intervibe
        </span>
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

      {/* FOOTER USER CARD (PERFECTLY CENTERED WHEN COLLAPSED) */}
      <SidebarFooter className='border-t border-sidebar-border p-2 pb-6 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:py-3 group-data-[collapsible=icon]:justify-center'>
        <Link 
          href="/dashboard/profile"
          className='flex items-center gap-2.5 w-full p-1.5 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer group group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center'
          title={user?.name || 'Alex Morgan'}
        >
          <img
            src='https://i.pravatar.cc/100?img=32'
            className='h-7 w-7 rounded-full object-cover shrink-0 border border-sidebar-border group-hover:border-foreground/40 transition-colors'
            alt='user'
          />
          <div className='leading-tight min-w-0 flex-1 group-data-[collapsible=icon]:hidden'>
            <p className='text-[12.5px] font-medium truncate text-foreground group-hover:text-foreground'>
              {user?.name || 'Alex Morgan'}
            </p>
            <p className='text-[11px] text-muted-foreground font-mono truncate'>
              {user?.email || 'alex@linear.app'}
            </p>
          </div>
          <Icons.chevronRight className='size-3.5 text-muted-foreground/60 group-hover:text-foreground ml-auto group-data-[collapsible=icon]:hidden transition-colors' />
        </Link>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
