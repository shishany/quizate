import type { AdminRole } from '@/lib/types';

export type AdminPage =
  'overview' | 'questions' | 'leaderboard' | 'fraud' | 'sponsors' | 'config' | 'prizes' | 'audit';

/** FR-25: which roles (BRD section 2) open which admin pages. */
export const ACCESS: Record<AdminPage, AdminRole[]> = {
  overview: [
    'super_admin',
    'content_editor',
    'content_reviewer',
    'sponsor_manager',
    'fraud_analyst',
    'prize_officer',
    'finance_approver',
  ],
  questions: ['super_admin', 'content_editor', 'content_reviewer'],
  leaderboard: ['super_admin', 'fraud_analyst', 'prize_officer'],
  fraud: ['super_admin', 'fraud_analyst'],
  sponsors: ['super_admin', 'sponsor_manager'],
  config: ['super_admin'],
  prizes: ['super_admin', 'prize_officer', 'finance_approver'],
  audit: ['super_admin'],
};

export const PAGES: { id: AdminPage; href: string }[] = [
  { id: 'overview', href: '/admin' },
  { id: 'questions', href: '/admin/questions' },
  { id: 'leaderboard', href: '/admin/leaderboard' },
  { id: 'fraud', href: '/admin/fraud' },
  { id: 'sponsors', href: '/admin/sponsors' },
  { id: 'config', href: '/admin/config' },
  { id: 'prizes', href: '/admin/prizes' },
  { id: 'audit', href: '/admin/audit' },
];

export const pageForPath = (path: string): AdminPage =>
  [...PAGES]
    .reverse()
    .find((p) => path === p.href || (p.href !== '/admin' && path.startsWith(p.href)))?.id ??
  'overview';
