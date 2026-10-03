import { AccountRoleType, UserSession } from '../types';

export interface AccountRoleOption {
  id: AccountRoleType;
  number: number;
  label: string;
  name: string;
  category: 'admin' | 'petugas';
  badge: string;
  description: string;
  allowedCategoryIds: string[];
  categoryNames: string[];
}

export const ACCOUNT_ROLE_OPTIONS: AccountRoleOption[] = [
  {
    id: 'panitia',
    number: 1,
    label: '1. Panitia (admin)',
    name: 'Panitia (Admin)',
    category: 'admin',
    badge: 'Panitia (Admin)',
    description: 'Bisa mengontrol sepenuhnya (semua kategori penghargaan & semua menu sistem)',
    allowedCategoryIds: ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6'],
    categoryNames: [
      'Penghargaan Khidmah (Ranting)',
      'Penghargaan Khidmah (Guru)',
      'Penghargaan Khidmah (Alumni)',
      'Penghargaan Khidmah (Pengurus)',
      'Penghargaan Santri Terbaik',
      'Penghargaan Murid Terbaik',
    ],
  },
  {
    id: 'madrasah',
    number: 2,
    label: '2. Madrasah (petugas)',
    name: 'Madrasah (Petugas)',
    category: 'petugas',
    badge: 'Madrasah (Petugas)',
    description:
      'Akses 5 Kategori: Khidmah (Ranting), Khidmah (Guru), Khidmah (Pengurus), Santri Terbaik, Murid Terbaik',
    allowedCategoryIds: ['cat-1', 'cat-2', 'cat-4', 'cat-5', 'cat-6'],
    categoryNames: [
      'Penghargaan Khidmah (Ranting)',
      'Penghargaan Khidmah (Guru)',
      'Penghargaan Khidmah (Pengurus)',
      'Penghargaan Santri Terbaik',
      'Penghargaan Murid Terbaik',
    ],
  },
  {
    id: 'alumni',
    number: 3,
    label: '3. Alumni (petugas)',
    name: 'Alumni (Petugas)',
    category: 'petugas',
    badge: 'Alumni (Petugas)',
    description: 'Menampilkan Penghargaan Khidmah (Alumni) saja',
    allowedCategoryIds: ['cat-3'],
    categoryNames: ['Penghargaan Khidmah (Alumni)'],
  },
  {
    id: 'pengurus_instansi',
    number: 4,
    label: '4. Pengurus Instansi (petugas)',
    name: 'Pengurus Instansi (Petugas)',
    category: 'petugas',
    badge: 'Pengurus Instansi (Petugas)',
    description: 'Menampilkan Penghargaan Khidmah (Pengurus) saja',
    allowedCategoryIds: ['cat-4'],
    categoryNames: ['Penghargaan Khidmah (Pengurus)'],
  },
  {
    id: 'pengurus_daerah',
    number: 5,
    label: '5. Pengurus Daerah (petugas)',
    name: 'Pengurus Daerah (Petugas)',
    category: 'petugas',
    badge: 'Pengurus Daerah (Petugas)',
    description: 'Menampilkan Penghargaan Khidmah (Pengurus) dan Penghargaan Santri Terbaik',
    allowedCategoryIds: ['cat-4', 'cat-5'],
    categoryNames: [
      'Penghargaan Khidmah (Pengurus)',
      'Penghargaan Santri Terbaik',
    ],
  },
];

export function getRoleOptionById(id?: string | null): AccountRoleOption {
  if (!id) return ACCOUNT_ROLE_OPTIONS[0];
  const found = ACCOUNT_ROLE_OPTIONS.find((opt) => opt.id === id);
  if (found) return found;

  const lower = id.toLowerCase();
  if (lower.includes('panitia') || lower.includes('admin')) return ACCOUNT_ROLE_OPTIONS[0];
  if (lower.includes('alumni')) return ACCOUNT_ROLE_OPTIONS[2];
  if (lower.includes('instansi')) return ACCOUNT_ROLE_OPTIONS[3];
  if (lower.includes('daerah') || lower.includes('cabang')) return ACCOUNT_ROLE_OPTIONS[4];
  if (lower.includes('madrasah') || lower.includes('guru')) return ACCOUNT_ROLE_OPTIONS[1];

  return ACCOUNT_ROLE_OPTIONS[1]; // default petugas
}

export function getAllowedCategoryIdsForUser(user?: UserSession | null): string[] {
  if (!user) return ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6'];

  if (user.accountType) {
    const opt = ACCOUNT_ROLE_OPTIONS.find((o) => o.id === user.accountType);
    if (opt) return opt.allowedCategoryIds;
  }

  // Fallback detection from role or category strings
  const roleLower = (user.role || '').toLowerCase();
  const categoryLower = (user.category || '').toLowerCase();

  if (categoryLower === 'admin' || roleLower.includes('admin') || roleLower.includes('panitia')) {
    return ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6'];
  }
  if (roleLower.includes('alumni')) {
    return ['cat-3'];
  }
  if (roleLower.includes('instansi')) {
    return ['cat-4'];
  }
  if (roleLower.includes('daerah') || roleLower.includes('cabang')) {
    return ['cat-4', 'cat-5'];
  }
  // Default petugas: Madrasah (5 kategori)
  return ['cat-1', 'cat-2', 'cat-4', 'cat-5', 'cat-6'];
}

export function isCategoryAllowedForUser(categoryId: string, user?: UserSession | null): boolean {
  const allowed = getAllowedCategoryIdsForUser(user);
  return allowed.includes(categoryId);
}
