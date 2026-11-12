export const CATEGORIES = [
  'Wallpanel',
  'Wallboard',
  'UV Board',
  'List Wallpanel',
  'List Alumunium',
  'Lem & Aksesoris'
];

// Pilihan Nama & Ukuran Otomatis per Kategori biar nggak perlu ketik manual
export const PRODUCT_NAME_PRESETS = {
  'Wallpanel': ['Wallpanel 16cm', 'Wallpanel 30cm'],
  'Wallboard': ['Wallboard 40cm', 'Wallboard 60cm'],
  'UV Board': ['UV Board Standar (122x244cm)'],
  'List Wallpanel': ['List Siku Wallpanel'],
  'List Alumunium': ['List Alumunium T', 'List Alumunium U', 'List Alumunium L (Siku)'],
  'Lem & Aksesoris': ['Lem Sealant Konstruksi', 'Clip Wallpanel (Box)']
};

export const UNITS = ['Lembar', 'Batang', 'Tube / Botol', 'Pcs', 'Box', 'Roll'];

export const SUPPLIERS = ['Supplier Utama 1', 'Supplier Utama 2', 'Supplier Lainnya'];

export function formatRupiah(num) {
  const n = Number(num) || 0;
  return 'Rp ' + n.toLocaleString('id-ID');
}

export function formatThousandInput(val) {
  if (val === '' || val === null || val === undefined) return '';
  const cleaned = String(val).replace(/\D/g, '');
  if (cleaned === '') return '';
  return Number(cleaned).toLocaleString('id-ID');
}

export function parseThousandInput(str) {
  const cleaned = String(str).replace(/\D/g, '');
  return cleaned === '' ? '' : Number(cleaned);
}

export function getJakartaDateString(dateObj = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(dateObj);

  const y = parts.find((p) => p.type === 'year').value;
  const m = parts.find((p) => p.type === 'month').value;
  const d = parts.find((p) => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}

export function getWeekStartDateString() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return getJakartaDateString(d);
}

export function formatTanggalIndo(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function getDefaultUnitByCategory(category) {
  if (['Wallpanel', 'Wallboard', 'UV Board'].includes(category)) return 'Lembar';
  if (['List Wallpanel', 'List Alumunium'].includes(category)) return 'Batang';
  if (category === 'Lem & Aksesoris') return 'Tube / Botol';
  return 'Lembar';
}