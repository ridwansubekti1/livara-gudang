import { supabase } from './supabaseClient';
import { getJakartaDateString } from '../utils/formatters';

// Mapper Product: PostgreSQL (snake_case) <-> React (camelCase)
const mapProdFromDb = (row) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  category: row.category,
  unit: row.unit || 'Lembar',
  costPrice: Number(row.cost_price) || 0,
  sellPrice: Number(row.sell_price) || 0,
  stock: Number(row.stock) || 0,
  minStock: row.min_stock !== null && row.min_stock !== undefined ? Number(row.min_stock) : 5
});

const mapProdToDb = (p) => ({
  id: p.id,
  code: p.code,
  name: p.name,
  category: p.category,
  unit: p.unit || 'Lembar',
  cost_price: Number(p.costPrice) || 0,
  sell_price: Number(p.sellPrice) || 0,
  stock: Number(p.stock) || 0,
  min_stock: p.minStock !== null && p.minStock !== undefined && p.minStock !== '' ? Number(p.minStock) : 5
});

// Mapper Mutation: PostgreSQL (snake_case) <-> React (camelCase)
const mapMutFromDb = (row) => ({
  id: row.id,
  type: row.type,
  date: row.date,
  createdAt: row.created_at,
  supplier: row.supplier || '',
  projectName: row.project_name || '',
  picName: row.pic_name || '',
  note: row.note || '',
  items: Array.isArray(row.items) ? row.items : [],
  returnLogs: Array.isArray(row.return_logs) ? row.return_logs : []
});

const mapMutToDb = (m) => ({
  id: m.id,
  type: m.type,
  date: m.date,
  supplier: m.supplier || '',
  project_name: m.projectName || '',
  pic_name: m.picName || '',
  note: m.note || '',
  items: m.items || [],
  return_logs: m.returnLogs || []
});

export const storageService = {
  // Ambil semua data dari Supabase saat aplikasi dibuka
  async fetchAllData() {
    const [prodRes, mutRes, pinRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('mutations').select('*').order('created_at', { ascending: false }),
      supabase.from('app_settings').select('*').eq('key', 'pins').maybeSingle()
    ]);

    if (prodRes.error) console.error('Gagal memuat products:', prodRes.error);
    if (mutRes.error) console.error('Gagal memuat mutations:', mutRes.error);

    return {
      products: (prodRes.data || []).map(mapProdFromDb),
      mutations: (mutRes.data || []).map(mapMutFromDb),
      pins: pinRes.data?.value || { staffPin: '1111', ownerPin: '1234' }
    };
  },

  // Simpan / Update 1 atau beberapa produk sekaligus ke Supabase
  async upsertProducts(productsArray) {
    if (!productsArray || productsArray.length === 0) return;
    const rows = productsArray.map(mapProdToDb);
    const { error } = await supabase.from('products').upsert(rows);
    if (error) console.error('Error upsertProducts:', error);
  },

  // Hapus 1 produk dari Supabase
  async deleteProductById(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) console.error('Error deleteProductById:', error);
  },

  // Simpan / Update 1 catatan mutasi (Masuk/Keluar/Rusak/Return Barang Lebih)
  async upsertMutation(mutationObj) {
    const { error } = await supabase.from('mutations').upsert(mapMutToDb(mutationObj));
    if (error) console.error('Error upsertMutation:', error);
  },

  // Hapus 1 catatan mutasi
  async deleteMutationById(id) {
    const { error } = await supabase.from('mutations').delete().eq('id', id);
    if (error) console.error('Error deleteMutationById:', error);
  },

  // Simpan perubahan PIN Admin & Owner ke Cloud
  async savePinsToCloud(pinsObj) {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'pins', value: pinsObj });
    if (error) console.error('Error savePinsToCloud:', error);
  },

  // Ganti seluruh data di Cloud (untuk fitur Data Contoh, Pulihkan Backup, atau Clear All)
  async replaceAllCloudData(productsArray, mutationsArray) {
    await supabase.from('mutations').delete().neq('id', '_none_');
    await supabase.from('products').delete().neq('id', '_none_');

    if (productsArray.length > 0) {
      await supabase.from('products').insert(productsArray.map(mapProdToDb));
    }
    if (mutationsArray.length > 0) {
      await supabase.from('mutations').insert(mutationsArray.map(mapMutToDb));
    }
  },

  getSampleData() {
    const today = getJakartaDateString();
    return {
      products: [
        {
          id: 'p_wp16_01',
          code: 'WP16-OAK01',
          name: 'Wallpanel 16cm - Motif Kayu Oak',
          category: 'Wallpanel',
          unit: 'Lembar',
          costPrice: 85000,
          sellPrice: 125000,
          stock: 42,
          minStock: 10
        },
        {
          id: 'p_wp30_02',
          code: 'WP30-WAL04',
          name: 'Wallpanel 30cm - Dark Walnut',
          category: 'Wallpanel',
          unit: 'Lembar',
          costPrice: 135000,
          sellPrice: 190000,
          stock: 4,
          minStock: 8
        },
        {
          id: 'p_wb40_01',
          code: 'WB40-MRB02',
          name: 'Wallboard 40cm - Putih Carrara',
          category: 'Wallboard',
          unit: 'Lembar',
          costPrice: 160000,
          sellPrice: 230000,
          stock: 15,
          minStock: 5
        },
        {
          id: 'p_wb60_01',
          code: 'WB60-BLK09',
          name: 'Wallboard 60cm - Hitam Marmer',
          category: 'Wallboard',
          unit: 'Lembar',
          costPrice: 240000,
          sellPrice: 340000,
          stock: 0,
          minStock: 5
        },
        {
          id: 'p_uv_01',
          code: 'UV-GLD01',
          name: 'UV Board Standard (122x244cm) - Marmer Gold Line',
          category: 'UV Board',
          unit: 'Lembar',
          costPrice: 390000,
          sellPrice: 550000,
          stock: 3,
          minStock: 5
        },
        {
          id: 'p_la_t',
          code: 'ALU-T-GLD',
          name: 'List Alumunium T - Gold Mirror',
          category: 'List Alumunium',
          unit: 'Batang',
          costPrice: 45000,
          sellPrice: 75000,
          stock: 2,
          minStock: 6
        }
      ],
      mutations: [
        {
          id: 'mut_sample_1',
          type: 'OUT',
          date: today,
          supplier: '',
          projectName: 'Proyek Backdrop TV Bpk. Hendra - Summarecon Bekasi',
          picName: 'Tim Kang Dedi',
          note: 'Bawa lebih 3 lembar buat jaga-jaga potongan sudut',
          items: [
            {
              productId: 'p_wp16_01',
              code: 'WP16-OAK01',
              name: 'Wallpanel 16cm - Motif Kayu Oak',
              unit: 'Lembar',
              qty: 18,
              returnedQty: 3,
              costPrice: 85000,
              sellPrice: 125000
            }
          ],
          returnLogs: [
            {
              date: today,
              text: 'Barang lebih masuk ke Stok Ready: 3 Lembar Wallpanel 16cm - Motif Kayu Oak'
            }
          ]
        }
      ]
    };
  }
};