import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Interview Room',
        url: '/dashboard/interview',
        icon: 'video',
        isActive: false,
        shortcut: ['i', 'i'],
        items: []
      },
      {
        title: 'Billing',
        url: '/dashboard/billing',
        icon: 'settings',
        isActive: false,
        shortcut: ['b', 'b'],
        items: []
      }
    ]
  },
  {
    label: 'Account',
    items: [
      {
        title: 'Profile & Settings',
        url: '/dashboard/profile',
        icon: 'profile',
        isActive: false,
        shortcut: ['p', 'p'],
        items: []
      },
      {
        title: 'Sign In / Switch',
        url: '/auth/login',
        icon: 'login',
        isActive: false,
        shortcut: ['l', 'l'],
        items: []
      }
    ]
  }
];
