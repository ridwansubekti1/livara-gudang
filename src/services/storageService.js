import { getJakartaDateString } from '../utils/formatters';

const STORAGE_KEY = 'livara_interior_warehouse_v1';

const defaultState = {
  products: [],
  mutations: []
};

export const storageService = {
  loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState;
      const parsed = JSON.parse(raw);
      return {
        products: Array.isArray(parsed.products) ? parsed.products : [],
        mutations: Array.isArray(parsed.mutations) ? parsed.mutations : []
      };
    } catch (err) {
      console.error('Gagal memuat data gudang:', err);
      return defaultState;
    }
  },

  saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('Gagal menyimpan data gudang:', err);
      return false;
    }
  },

  clearData() {
    localStorage.removeItem(STORAGE_KEY);
    return defaultState;
  },

  getSampleData() {
    const today = getJakartaDateString();
    return {
      products: [
        {
          id: 'p_wp16_01',
          code: 'WP16-OAK01',
          name: 'Wallpanel 16cm Motif Kayu Oak',
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
          name: 'Wallpanel 30cm Dark Walnut',
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
          name: 'Wallboard 40cm Putih Carrara',
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
          name: 'Wallboard 60cm Hitam Marmer',
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
          name: 'UV Board Motif Marmer Gold Line',
          category: 'UV Board',
          unit: 'Lembar',
          costPrice: 390000,
          sellPrice: 550000,
          stock: 3,
          minStock: 5
        },
        {
          id: 'p_lwp_01',
          code: 'LWP-OAK01',
          name: 'List Wallpanel Ending Oak',
          category: 'List Wallpanel',
          unit: 'Batang',
          costPrice: 35000,
          sellPrice: 55000,
          stock: 20,
          minStock: 10
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
        },
        {
          id: 'p_la_u',
          code: 'ALU-U-BLK',
          name: 'List Alumunium U - Hitam Doff',
          category: 'List Alumunium',
          unit: 'Batang',
          costPrice: 42000,
          sellPrice: 70000,
          stock: 14,
          minStock: 6
        },
        {
          id: 'p_la_l',
          code: 'ALU-L-SLV',
          name: 'List Alumunium L Siku - Silver',
          category: 'List Alumunium',
          unit: 'Batang',
          costPrice: 48000,
          sellPrice: 80000,
          stock: 12,
          minStock: 6
        },
        {
          id: 'p_lem_01',
          code: 'SEAL-CLR',
          name: 'Lem Sealant Konstruksi Heavy Duty',
          category: 'Lem & Aksesoris',
          unit: 'Tube / Botol',
          costPrice: 32000,
          sellPrice: 50000,
          stock: 0,
          minStock: 10
        }
      ],
      mutations: [
        {
          id: 'mut_sample_1',
          type: 'IN',
          date: today,
          supplier: 'Supplier Utama 1',
          projectName: '',
          picName: 'Admin Gudang',
          note: 'Restok mingguan Wallpanel & List',
          items: [
            {
              productId: 'p_wp16_01',
              code: 'WP16-OAK01',
              name: 'Wallpanel 16cm Motif Kayu Oak',
              unit: 'Lembar',
              qty: 30,
              returnedQty: 0,
              costPrice: 85000,
              sellPrice: 125000
            },
            {
              productId: 'p_lwp_01',
              code: 'LWP-OAK01',
              name: 'List Wallpanel Ending Oak',
              unit: 'Batang',
              qty: 15,
              returnedQty: 0,
              costPrice: 35000,
              sellPrice: 55000
            }
          ],
          returnLogs: []
        },
        {
          id: 'mut_sample_2',
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
              name: 'Wallpanel 16cm Motif Kayu Oak',
              unit: 'Lembar',
              qty: 18,
              returnedQty: 3, // 3 lembar tidak terpakai dan sudah balik ke stok ready
              costPrice: 85000,
              sellPrice: 125000
            },
            {
              productId: 'p_uv_01',
              code: 'UV-GLD01',
              name: 'UV Board Motif Marmer Gold Line',
              unit: 'Lembar',
              qty: 2,
              returnedQty: 0,
              costPrice: 390000,
              sellPrice: 550000
            },
            {
              productId: 'p_la_t',
              code: 'ALU-T-GLD',
              name: 'List Alumunium T - Gold Mirror',
              unit: 'Batang',
              qty: 4,
              returnedQty: 1,
              costPrice: 45000,
              sellPrice: 75000
            }
          ],
          returnLogs: [
            {
              date: today,
              text: 'Barang lebih kembali ke stok ready: 3 Lembar Wallpanel 16cm Oak, 1 Batang List Alu T Gold'
            }
          ]
        }
      ]
    };
  }
};