export interface SignatoryProfile {
  id: string;
  role: string;
  name: string;
  shortTitle: string;
  order: number;
}

/**
 * Daftar Resmi Pejabat Penandatangan (TTD)
 * Sesuai arahan penyesuaian:
 * 1. Koordinator I: Mas d.Nawawy Sadoellah
 * 2. Koordinator II: Mas Abd. Djalil Kamil
 * 3. Ketua Milad: H. Ahmad Arif Bahruddin
 * 4. Wakil Ketua: M. Fahrurrozi Hasani
 * 5. Ketua Sie Penganugerahan: Birril Walid
 * 6. Admin Sie Penganugerahan: Abdul Majid
 * 7. Bendahara Sie Penganugerahan: Moh Ali Ghufron
 */
export const OFFICIAL_SIGNATORIES: SignatoryProfile[] = [
  {
    id: 'koordinator-1',
    role: 'Koordinator I',
    name: 'Mas d.Nawawy Sadoellah',
    shortTitle: 'Koordinator I',
    order: 1,
  },
  {
    id: 'koordinator-2',
    role: 'Koordinator II',
    name: 'Mas Abd. Djalil Kamil',
    shortTitle: 'Koordinator II',
    order: 2,
  },
  {
    id: 'ketua-milad',
    role: 'Ketua Milad',
    name: 'H. Ahmad Arif Bahruddin',
    shortTitle: 'Ketua Milad',
    order: 3,
  },
  {
    id: 'wakil-ketua',
    role: 'Wakil Ketua',
    name: 'M. Fahrurrozi Hasani',
    shortTitle: 'Wakil Ketua',
    order: 4,
  },
  {
    id: 'ketua-sie-penganugerahan',
    role: 'Ketua Sie Penganugerahan',
    name: 'Birril Walid',
    shortTitle: 'Ketua Sie',
    order: 5,
  },
  {
    id: 'admin-sie-penganugerahan',
    role: 'Admin Sie Penganugerahan',
    name: 'Abdul Majid',
    shortTitle: 'Admin Sie',
    order: 6,
  },
  {
    id: 'bendahara-sie-penganugerahan',
    role: 'Bendahara Sie Penganugerahan',
    name: 'Moh Ali Ghufron',
    shortTitle: 'Bendahara Sie',
    order: 7,
  },
];

export function getSignatoryByNameOrRole(queryStr?: string | null): SignatoryProfile | undefined {
  if (!queryStr) return undefined;
  const q = queryStr.toLowerCase().trim();
  return OFFICIAL_SIGNATORIES.find(
    (s) => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q)
  );
}

export function getNameByRole(role: string, fallbackName?: string): string {
  const match = OFFICIAL_SIGNATORIES.find(
    (s) => s.role.toLowerCase() === role.toLowerCase() || s.id === role
  );
  if (match) return match.name;
  return fallbackName || '';
}
