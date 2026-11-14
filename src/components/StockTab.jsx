import { useState, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  PackagePlus,
  Save,
  Pencil,
  Trash,
  Search,
  Layers,
  Plus,
  X,
  Copy,
  ArrowUp,
  Calculator,
  History,
  Lock,
  Ruler,
  CheckCircle2,
  MessageCircle,
  RotateCcw
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  CATEGORIES,
  PRODUCT_NAME_PRESETS,
  UNITS,
  formatRupiah,
  formatThousandInput,
  parseThousandInput,
  getDefaultUnitByCategory,
  formatTanggalIndo
} from '../utils/formatters';

const WALL_SPECS = [
  { id: 'wp16', label: 'Wallpanel 16cm (Lebar efektif ~15cm × Tinggi 2.9m)', widthM: 0.15, heightM: 2.9, category: 'Wallpanel' },
  { id: 'wp30', label: 'Wallpanel 30cm (Lebar 30cm × Tinggi 2.9m)', widthM: 0.30, heightM: 2.9, category: 'Wallpanel' },
  { id: 'wb40', label: 'Wallboard 40cm (Lebar 40cm × Tinggi 2.9m)', widthM: 0.40, heightM: 2.9, category: 'Wallboard' },
  { id: 'wb60', label: 'Wallboard 60cm (Lebar 60cm × Tinggi 2.9m)', widthM: 0.60, heightM: 2.9, category: 'Wallboard' },
  { id: 'uv122', label: 'UV Board Marmer (Lebar 122cm × Tinggi 2.44m)', widthM: 1.22, heightM: 2.44, category: 'UV Board' }
];

export default function StockTab() {
  const {
    products,
    mutations,
    saveProduct,
    adjustStockQuick,
    deleteProduct,
    showToast,
    canEdit,
    setIsLoginModalOpen
  } = useStore();

  // State Pop-up Modals & Deteksi Scroll
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [isEstimatorOpen, setIsEstimatorOpen] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  // State Kalkulator Estimasi Proyek & Cek Stok
  const [wallWidth, setWallWidth] = useState('3');
  const [wallHeight, setWallHeight] = useState('2.9');
  const [selectedSpecId, setSelectedSpecId] = useState('wp16');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [includeWaste, setIncludeWaste] = useState(true);

  // State Form Barang
  const [editId, setEditId] = useState('');
  const [category, setCategory] = useState('Wallpanel');
  const [selectedPreset, setSelectedPreset] = useState(PRODUCT_NAME_PRESETS['Wallpanel'][0]);
  const [customName, setCustomName] = useState('');
  const [motifDetail, setMotifDetail] = useState('');
  const [code, setCode] = useState('');
  const [unit, setUnit] = useState('Lembar');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState(5);

  // Kalkulator Bantu Box
  const [showBoxCalc, setShowBoxCalc] = useState(false);
  const [boxCount, setBoxCount] = useState('');
  const [pcsPerBox, setPcsPerBox] = useState('');

  // Filter, Pencarian & Sorting
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('ALL');
  const [filterStockStatus, setFilterStockStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');

  // Deteksi scroll untuk mengubah kartu atas menjadi Sticky Bar Simpel saat di-scroll ke bawah
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledDown(window.scrollY > 90);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const outOfStockItems = products.filter((p) => Number(p.stock) <= 0);
  const lowStockItems = products.filter(
    (p) => Number(p.stock) > 0 && Number(p.stock) <= Number(p.minStock)
  );

  const totalSku = products.length;
  const totalLembarReady = products
    .filter((p) => p.unit === 'Lembar')
    .reduce((sum, p) => sum + Math.max(0, Number(p.stock)), 0);
  const totalBatangReady = products
    .filter((p) => p.unit === 'Batang')
    .reduce((sum, p) => sum + Math.max(0, Number(p.stock)), 0);
  const totalLainnyaReady = products
    .filter((p) => p.unit !== 'Lembar' && p.unit !== 'Batang')
    .reduce((sum, p) => sum + Math.max(0, Number(p.stock)), 0);

  const hasActiveFilter =
    search.trim() !== '' ||
    filterCat !== 'ALL' ||
    filterStockStatus !== 'ALL' ||
    sortBy !== 'DEFAULT';

  const resetAllFilters = () => {
    setSearch('');
    setFilterCat('ALL');
    setFilterStockStatus('ALL');
    setSortBy('DEFAULT');
  };

  // --- LOGIKA PERHITUNGAN KALKULATOR ESTIMASI DINDING ---
  const activeSpec = WALL_SPECS.find((s) => s.id === selectedSpecId) || WALL_SPECS[0];
  const matchingProductsForSpec = products.filter((p) => p.category === activeSpec.category);
  const chosenEstimatorProduct =
    matchingProductsForSpec.find((p) => p.id === selectedProductId) ||
    matchingProductsForSpec[0] ||
    null;

  const wMeter = Math.max(0, parseFloat(wallWidth) || 0);
  const hMeter = Math.max(0, parseFloat(wallHeight) || 0);
  const wallAreaM2 = wMeter * hMeter;

  const stripsAcross = wMeter > 0 ? Math.ceil(wMeter / activeSpec.widthM) : 0;
  const heightMultiplier = hMeter > activeSpec.heightM ? hMeter / activeSpec.heightM : 1;
  const baseSheets = Math.ceil(stripsAcross * heightMultiplier);
  const finalSheetsNeeded = includeWaste ? Math.ceil(baseSheets * 1.05) : baseSheets;

  const estListBatang = wMeter > 0 && hMeter > 0 ? Math.ceil((wMeter * 2 + hMeter * 2) / 2.9) : 0;
  const estSealantTubes = finalSheetsNeeded > 0 ? Math.max(1, Math.ceil(finalSheetsNeeded / 3.5)) : 0;

  const currentStockReady = chosenEstimatorProduct ? Number(chosenEstimatorProduct.stock) : 0;
  const stockShortage = Math.max(0, finalSheetsNeeded - currentStockReady);
  const isStockEnough = chosenEstimatorProduct && currentStockReady >= finalSheetsNeeded;
  const estMaterialPrice = chosenEstimatorProduct
    ? finalSheetsNeeded * (Number(chosenEstimatorProduct.sellPrice) || 0)
    : 0;

  const handleShareEstimateWA = () => {
    const prodLabel = chosenEstimatorProduct
      ? `[${chosenEstimatorProduct.code}] ${chosenEstimatorProduct.name}`
      : activeSpec.label;
    const statusText = chosenEstimatorProduct
      ? isStockEnough
        ? `✅ READY DI GUDANG (Tersedia ${currentStockReady} Lembar)`
        : `⚠️ KURANG ${stockShortage} LEMBAR (Ready di gudang: ${currentStockReady} Lembar)`
      : '-';

    const waText = `📐 *ESTIMASI KEBUTUHAN MATERIAL - LIVARA INTERIOR*
Ukuran Bidang Dinding: *${wMeter}m (Lebar) × ${hMeter}m (Tinggi)* (${wallAreaM2.toFixed(1)} m²)
Material Pilihan: *${prodLabel}*

📦 *Rincian Kebutuhan Material:*
- Kebutuhan Utama: *${finalSheetsNeeded} Lembar* ${includeWaste ? '(Sudah termasuk +5% cadangan potong)' : '(Pas tanpa cadangan)'}
- Estimasi List Penutup/Siku: *~${estListBatang} Batang*
- Estimasi Lem Sealant: *~${estSealantTubes} Tube*
${estMaterialPrice > 0 ? `• Estimasi Nilai Material Utama: *${formatRupiah(estMaterialPrice)}*` : ''}

📊 *Status Ketersediaan Gudang:*
${statusText}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const presets = PRODUCT_NAME_PRESETS[newCat] || [];
    setSelectedPreset(presets[0] || 'CUSTOM');
    if (!editId) {
      setUnit(getDefaultUnitByCategory(newCat));
    }
  };

  const openAddModal = () => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (p) => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    setEditId(p.id);
    setCategory(p.category);
    setCode(p.code);
    setUnit(p.unit);
    setCostPrice(p.costPrice);
    setSellPrice(p.sellPrice);
    setStock(p.stock);
    setMinStock(p.minStock);

    const presets = PRODUCT_NAME_PRESETS[p.category] || [];
    const matchedPreset = presets.find((pr) => p.name.startsWith(pr));
    if (matchedPreset) {
      setSelectedPreset(matchedPreset);
      const rest = p.name.slice(matchedPreset.length).replace(/^\s*-\s*/, '');
      setMotifDetail(rest);
      setCustomName('');
    } else {
      setSelectedPreset('CUSTOM');
      setCustomName(p.name);
      setMotifDetail('');
    }

    setIsModalOpen(true);
  };

  const handleDuplicate = (p) => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    setEditId('');
    setCategory(p.category);
    setUnit(p.unit);
    setCostPrice(p.costPrice);
    setSellPrice(p.sellPrice);
    setStock(0);
    setMinStock(p.minStock);

    const codePrefix = (p.code || '').includes('-') ? p.code.split('-')[0] + '-' : '';
    setCode(codePrefix);

    const presets = PRODUCT_NAME_PRESETS[p.category] || [];
    const matchedPreset = presets.find((pr) => p.name.startsWith(pr));
    if (matchedPreset) {
      setSelectedPreset(matchedPreset);
      setMotifDetail('');
      setCustomName('');
    } else {
      setSelectedPreset('CUSTOM');
      setCustomName(p.name);
      setMotifDetail('');
    }

    setIsModalOpen(true);
    showToast(`Template "${p.category}" disalin! Tinggal isi Kode & Stok baru.`);
  };

  const applyBoxCalculator = () => {
    const total = (Number(boxCount) || 0) * (Number(pcsPerBox) || 0);
    if (total > 0) {
      setStock(total);
      setShowBoxCalc(false);
      setBoxCount('');
      setPcsPerBox('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const baseName = selectedPreset === 'CUSTOM' ? customName.trim() : selectedPreset;
    if (!baseName || !code.trim()) return;

    const finalName = motifDetail.trim() ? `${baseName} - ${motifDetail.trim()}` : baseName;

    saveProduct({
      id: editId || undefined,
      code: code.trim().toUpperCase(),
      name: finalName,
      category,
      unit,
      costPrice: Number(costPrice) || 0,
      sellPrice: Number(sellPrice) || 0,
      stock: Number(stock) || 0,
      minStock: minStock === '' ? 5 : Number(minStock)
    });
    resetForm();
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setEditId('');
    setCategory('Wallpanel');
    setSelectedPreset(PRODUCT_NAME_PRESETS['Wallpanel'][0]);
    setCustomName('');
    setMotifDetail('');
    setCode('');
    setUnit('Lembar');
    setCostPrice('');
    setSellPrice('');
    setStock('');
    setMinStock(5);
    setShowBoxCalc(false);
    setBoxCount('');
    setPcsPerBox('');
  };

  const filteredProducts = products
    .filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCode = (p.code || '').toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      if (filterCat !== 'ALL' && p.category !== filterCat) return false;
      if (filterStockStatus === 'HABIS' && Number(p.stock) > 0) return false;
      if (
        filterStockStatus === 'MENIPIS' &&
        !(Number(p.stock) > 0 && Number(p.stock) <= Number(p.minStock))
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'STOCK_ASC') return Number(a.stock) - Number(b.stock);
      if (sortBy === 'STOCK_DESC') return Number(b.stock) - Number(a.stock);
      if (sortBy === 'CODE_ASC') return (a.code || '').localeCompare(b.code || '');
      return 0;
    });

  const productHistoryList = historyProduct
    ? mutations
        .filter((m) => m.items.some((it) => it.productId === historyProduct.id))
        .map((m) => {
          const item = m.items.find((it) => it.productId === historyProduct.id);
          return {
            ...m,
            itemQty: item.qty,
            itemReturned: item.returnedQty || 0
          };
        })
    : [];

  const currentPresets = PRODUCT_NAME_PRESETS[category] || [];

  return (
    <section className="space-y-3 sm:space-y-4 pb-28 sm:pb-20">
      {/* ==================== STICKY COMPACT BAR SAAT SCROLL KE BAWAH (SMARTPHONE & DESKTOP) ==================== */}
      {isScrolledDown && (
        <div className="fixed top-[54px] sm:top-[134px] left-0 right-0 z-25 bg-livara-creamLight/95 backdrop-blur-md border-b-2 border-livara-brown/25 shadow-md px-3 sm:px-4 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="max-w-5xl mx-auto space-y-1.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
            {/* Baris 1: 3 Info Stok (Lembar, Batang, Motif) + Kalkulator Dinding dalam 1 Pita Tipis */}
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-extrabold">
                <span className="bg-livara-cream px-2.5 py-1 rounded-lg border border-livara-brown/20 text-livara-brown">
                  {totalLembarReady} <span className="font-semibold text-[10px] sm:text-[11px]">Lembar</span>
                </span>
                <span className="bg-livara-cream px-2.5 py-1 rounded-lg border border-livara-brown/20 text-stone-800">
                  {totalBatangReady} <span className="font-semibold text-[10px] sm:text-[11px]">Batang</span>
                </span>
                <span className="bg-livara-brown text-livara-cream px-2.5 py-1 rounded-lg">
                  {totalSku} <span className="font-normal text-[10px] sm:text-[11px]">Kode</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsEstimatorOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-950 font-extrabold text-[10px] sm:text-xs flex items-center gap-1 shrink-0 transition"
              >
                <Ruler className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-livara-brown" />
                <span>Hitung Dinding</span>
              </button>
            </div>

            {/* Baris 2 (Di Desktop menyatu sebaris di sebelah kanan): Warning Stok Habis & Menipis */}
            {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 sm:pt-0">
                {outOfStockItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setFilterStockStatus(filterStockStatus === 'HABIS' ? 'ALL' : 'HABIS')
                    }
                    className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-extrabold flex items-center gap-1 shrink-0 transition ${
                      filterStockStatus === 'HABIS'
                        ? 'bg-rose-700 text-white ring-2 ring-rose-300'
                        : 'bg-rose-100 text-rose-900 border border-rose-300 hover:bg-rose-200'
                    }`}
                  >
                    <AlertOctagon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>{outOfStockItems.length} Habis</span>
                  </button>
                )}

                {lowStockItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setFilterStockStatus(filterStockStatus === 'MENIPIS' ? 'ALL' : 'MENIPIS')
                    }
                    className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-extrabold flex items-center gap-1 shrink-0 transition ${
                      filterStockStatus === 'MENIPIS'
                        ? 'bg-amber-600 text-white ring-2 ring-amber-300'
                        : 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>{lowStockItems.length} Menipis</span>
                  </button>
                )}

                {/* Tampilkan kode-kode kritis dalam 1 baris tipis */}
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-bold text-stone-600 truncate">
                  {[...outOfStockItems, ...lowStockItems].slice(0, 5).map((item) => (
                    <span
                      key={item.id}
                      onClick={() => (canEdit ? handleEdit(item) : setHistoryProduct(item))}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition ${
                        Number(item.stock) <= 0
                          ? 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                          : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {item.code}:{item.stock}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAMPILAN NORMAL SAAT DI ATAS HALAMAN ==================== */}
      {/* 1. RINGKASAN FISIK GUDANG: 1 BARIS 3 KOLOM */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-livara-creamLight px-2.5 py-2.5 sm:p-4 rounded-2xl border border-livara-brown/20 shadow-2xs text-center sm:text-left">
          <p className="text-[10px] sm:text-xs font-bold text-livara-brown/80 uppercase tracking-tight sm:tracking-wider truncate">
            Stok Lembaran
          </p>
          <p className="text-base sm:text-2xl font-extrabold text-livara-brown leading-tight mt-0.5 sm:mt-1">
            {totalLembarReady} <span className="text-[10px] sm:text-sm font-bold">Lbr</span>
          </p>
          <p className="hidden sm:block text-xs text-stone-600 mt-0.5 font-medium">
            Wallpanel, Wallboard & UV Board
          </p>
        </div>

        <div className="bg-livara-creamLight px-2.5 py-2.5 sm:p-4 rounded-2xl border border-livara-brown/20 shadow-2xs text-center sm:text-left">
          <p className="text-[10px] sm:text-xs font-bold text-livara-brown/80 uppercase tracking-tight sm:tracking-wider truncate">
            List & Batang
          </p>
          <p className="text-base sm:text-2xl font-extrabold text-stone-900 leading-tight mt-0.5 sm:mt-1">
            {totalBatangReady} <span className="text-[10px] sm:text-sm font-bold">Btg</span>
          </p>
          <p className="hidden sm:block text-xs text-stone-600 mt-0.5 font-medium">
            List PVC & Alumunium • {totalLainnyaReady} Aksesoris
          </p>
        </div>

        <div className="bg-livara-brown text-livara-cream px-2.5 py-2.5 sm:p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-center sm:justify-between text-center sm:text-left">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-livara-cream/80 uppercase tracking-tight sm:tracking-wider truncate">
              Total Motif
            </p>
            <p className="text-base sm:text-2xl font-extrabold text-white leading-tight mt-0.5 sm:mt-1">
              {totalSku} <span className="text-[10px] sm:text-sm font-bold">Kode</span>
            </p>
            <p className="hidden sm:block text-xs text-livara-cream/90 mt-0.5 font-medium">
              {lowStockItems.length} menipis • {outOfStockItems.length} habis
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={openAddModal}
              className="hidden md:flex px-3.5 py-2.5 rounded-xl bg-livara-cream text-livara-brown hover:bg-white font-extrabold text-xs items-center gap-1.5 shadow-sm transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          )}
        </div>
      </div>

      {/* Bar Shortcut Kalkulator Dinding & Info Mode Lihat Saja */}
      <div className="bg-livara-creamLight border border-livara-brown/25 rounded-2xl px-3 py-2.5 flex items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-livara-brown min-w-0">
          {!canEdit ? (
            <>
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Mode Lihat Saja (Stok Terkunci)</span>
            </>
          ) : (
            <>
              <Ruler className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Kalkulator kebutuhan dinding customer:</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsEstimatorOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 font-extrabold text-[11px] sm:text-xs flex items-center gap-1 transition shrink-0"
        >
          <Ruler className="w-3.5 h-3.5 text-livara-brown" />
          <span>Hitung Dinding</span>
        </button>
      </div>

      {/* 2. NOTIFIKASI BANNER (Versi Penuh Saat Belum Scroll) */}
      {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
        <div className="space-y-2">
          {outOfStockItems.length > 0 && (
            <div className="bg-rose-100 border border-rose-500 rounded-2xl p-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2 text-rose-900 font-extrabold text-xs mb-2">
                <div className="flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>STOK HABIS ({outOfStockItems.length} Kode Kosong)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFilterStockStatus('HABIS')}
                  className="text-[11px] underline font-bold text-rose-800 shrink-0"
                >
                  Filter Habis
                </button>
              </div>
              <div className="flex sm:flex-wrap gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {outOfStockItems.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => (canEdit ? handleEdit(p) : setHistoryProduct(p))}
                    className="px-2.5 py-1 rounded-xl bg-white border border-rose-400 text-rose-900 font-bold text-[11px] flex items-center gap-1.5 shrink-0 shadow-2xs"
                  >
                    <span className="font-mono bg-rose-100 px-1.5 py-0.5 rounded text-[10px]">
                      {p.code}
                    </span>
                    <span className="truncate max-w-[130px] sm:max-w-none">{p.name}</span>
                    <span className="bg-rose-700 text-white px-1.5 py-0.5 rounded text-[10px]">
                      0
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {lowStockItems.length > 0 && (
            <div className="bg-amber-100/90 border border-amber-500 rounded-2xl p-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2 text-amber-950 font-extrabold text-xs mb-2">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>STOK MENIPIS ({lowStockItems.length} Perlu Restok)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFilterStockStatus('MENIPIS')}
                  className="text-[11px] underline font-bold text-amber-900 shrink-0"
                >
                  Filter Menipis
                </button>
              </div>
              <div className="flex sm:flex-wrap gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {lowStockItems.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => (canEdit ? handleEdit(p) : setHistoryProduct(p))}
                    className="px-2.5 py-1 rounded-xl bg-white border border-amber-400 text-amber-950 font-bold text-[11px] flex items-center gap-1.5 shrink-0 shadow-2xs"
                  >
                    <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                      {p.code}
                    </span>
                    <span className="truncate max-w-[130px] sm:max-w-none">{p.name}</span>
                    <span className="bg-amber-600 text-white px-1.5 py-0.5 rounded text-[10px]">
                      {p.stock}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. DAFTAR STOK FISIK */}
      <div className="bg-livara-creamLight rounded-2xl border-2 border-livara-brown/25 shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-livara-brown/15 flex flex-wrap items-center justify-between gap-2 bg-livara-creamLight">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-xs sm:text-sm text-livara-brown flex items-center gap-1.5">
              <Layers className="w-4 h-4 shrink-0" />
              <span>Daftar Stok Gudang ({filteredProducts.length})</span>
            </h3>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-extrabold text-[10px] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-livara-cream hover:bg-livara-creamDark text-livara-brown border border-livara-brown/25 font-extrabold text-[11px] flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{search ? `"${search}"` : 'Cari / Filter'}</span>
            </button>
          </div>
        </div>

        {hasActiveFilter && (
          <div className="px-3 py-2 bg-amber-50/80 border-b border-livara-brown/10 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-bold text-stone-600">Filter Aktif:</span>
            {search && (
              <span className="bg-white border border-livara-brown/20 px-2 py-0.5 rounded-md font-bold text-livara-brown">
                Kata kunci: "{search}"
              </span>
            )}
            {filterCat !== 'ALL' && (
              <span className="bg-white border border-livara-brown/20 px-2 py-0.5 rounded-md font-bold text-livara-brown">
                Kategori: {filterCat}
              </span>
            )}
            {filterStockStatus !== 'ALL' && (
              <span className="bg-white border border-livara-brown/20 px-2 py-0.5 rounded-md font-bold text-livara-brown">
                Status: {filterStockStatus}
              </span>
            )}
          </div>
        )}

        <div className="divide-y divide-livara-brown/15">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-sm space-y-2">
              <p>Tidak ada barang yang cocok dengan pencarian/filter saat ini.</p>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-3.5 py-2 rounded-xl bg-livara-brown text-livara-cream font-bold text-xs"
                >
                  Tampilkan Semua Barang
                </button>
              )}
            </div>
          ) : (
            filteredProducts.map((p) => {
              const qty = Number(p.stock);
              const min = Number(p.minStock);
              const isOut = qty <= 0;
              const isLow = qty > 0 && qty <= min;

              return (
                <div
                  key={p.id}
                  className={`p-3 sm:p-4 flex items-center justify-between gap-2.5 transition ${
                    isOut
                      ? 'bg-rose-100/70'
                      : isLow
                      ? 'bg-amber-100/50'
                      : 'hover:bg-livara-cream/50'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] sm:text-xs font-extrabold bg-livara-brown text-livara-cream px-2 py-0.5 rounded-md">
                        {p.code}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold bg-livara-creamDark text-livara-brown px-1.5 py-0.5 rounded-md">
                        {p.category}
                      </span>
                      {isOut && (
                        <span className="text-[10px] font-extrabold bg-rose-700 text-white px-2 py-0.5 rounded-full">
                          HABIS
                        </span>
                      )}
                      {isLow && (
                        <span className="text-[10px] font-extrabold bg-amber-600 text-white px-2 py-0.5 rounded-full">
                          MENIPIS
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-xs sm:text-base text-stone-900 leading-snug">
                      {p.name}
                    </h4>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] sm:text-xs text-stone-500 mr-1">
                        Min: <strong>{p.minStock}</strong>
                      </span>

                      <button
                        type="button"
                        onClick={() => setHistoryProduct(p)}
                        className="px-2 py-1 rounded-lg bg-livara-cream hover:bg-livara-creamDark text-livara-brown border border-livara-brown/20 text-[10px] font-bold flex items-center gap-1"
                        title="Riwayat Proyek"
                      >
                        <History className="w-3 h-3" />
                        <span>Riwayat</span>
                      </button>

                      {canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(p)}
                            className="p-1.5 rounded-lg bg-livara-cream hover:bg-livara-creamDark text-livara-brown border border-livara-brown/20"
                            title="Copy Motif"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(p)}
                            className="p-1.5 rounded-lg bg-livara-cream hover:bg-livara-creamDark text-livara-brown border border-livara-brown/20"
                            title="Edit Barang"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(`Hapus "[${p.code}] ${p.name}" dari master stok?`)
                              ) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700"
                            title="Hapus Barang"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-livara-cream p-1 rounded-xl border border-livara-brown/20 shrink-0">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => adjustStockQuick(p.id, -1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-livara-creamDark font-extrabold text-livara-brown shadow-2xs active:scale-95"
                      >
                        -
                      </button>
                    )}
                    <div className="px-2 sm:px-3 py-0.5 text-center min-w-[44px]">
                      <span
                        className={`font-extrabold text-sm sm:text-base block leading-none ${
                          isOut ? 'text-rose-700' : isLow ? 'text-amber-700' : 'text-stone-900'
                        }`}
                      >
                        {p.stock}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-stone-500">
                        {p.unit}
                      </span>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => adjustStockQuick(p.id, 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-livara-creamDark font-extrabold text-livara-brown shadow-2xs active:scale-95"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. FLOATING BUTTONS DI POJOK KANAN BAWAH */}
      <div className="fixed bottom-20 sm:bottom-5 right-3.5 sm:right-5 z-40 flex items-center gap-2">
        {isScrolledDown && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-livara-creamLight hover:bg-white text-livara-brown border-2 border-livara-brown shadow-lg flex items-center justify-center transition"
            title="Kembali ke Atas"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsSearchModalOpen(true)}
          className={`px-3.5 py-3 rounded-2xl border-2 shadow-xl font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition active:scale-95 ${
            hasActiveFilter
              ? 'bg-amber-400 text-slate-950 border-livara-brown'
              : 'bg-livara-creamLight hover:bg-white text-livara-brown border-livara-brown'
          }`}
          title="Cari & Filter Stok"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>{hasActiveFilter ? 'Filter Aktif' : 'Cari Stok'}</span>
        </button>

        {canEdit ? (
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-3 rounded-2xl bg-livara-brown hover:bg-livara-brownDark text-livara-cream border-2 border-livara-cream shadow-xl font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Tambah</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="px-3.5 py-3 rounded-2xl bg-livara-brown hover:bg-livara-brownDark text-livara-cream border-2 border-livara-cream shadow-xl font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <Lock className="w-4 h-4" />
            <span>Login</span>
          </button>
        )}
      </div>

      {/* 5. POP-UP MODAL FLOATING SEARCH & FILTER STOK */}
      {isSearchModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 pt-14 sm:pt-4"
          onClick={() => setIsSearchModalOpen(false)}
        >
          <div
            className="bg-livara-creamLight border-2 border-livara-brown rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-livara-brown/20 pb-3">
              <div className="flex items-center gap-2 text-livara-brown font-extrabold text-base">
                <Search className="w-5 h-5" />
                <h3>Cari & Filter Stok Gudang</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                className="p-1.5 rounded-xl bg-livara-cream text-livara-brown"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Ketik Kode Barang atau Nama Material
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Contoh: WL-1007 / Oak / Alu T..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border-2 border-livara-brown/30 bg-white text-sm font-bold outline-none focus:border-livara-brown"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Status Ketersediaan Stok
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterStockStatus('ALL')}
                    className={`py-2 px-2 rounded-xl text-xs font-extrabold transition ${
                      filterStockStatus === 'ALL'
                        ? 'bg-livara-brown text-livara-cream shadow-xs'
                        : 'bg-white text-livara-brown border border-livara-brown/25'
                    }`}
                  >
                    Semua ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStockStatus('MENIPIS')}
                    className={`py-2 px-2 rounded-xl text-xs font-extrabold transition ${
                      filterStockStatus === 'MENIPIS'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    Menipis ({lowStockItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStockStatus('HABIS')}
                    className={`py-2 px-2 rounded-xl text-xs font-extrabold transition ${
                      filterStockStatus === 'HABIS'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-rose-100 text-rose-900'
                    }`}
                  >
                    Habis ({outOfStockItems.length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Kategori Material
                  </label>
                  <select
                    value={filterCat}
                    onChange={(e) => setFilterCat(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-xs font-bold text-livara-brown outline-none"
                  >
                    <option value="ALL">Semua Kategori</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Urutkan Stok
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-xs font-bold text-stone-700 outline-none"
                  >
                    <option value="DEFAULT">Terbaru</option>
                    <option value="STOCK_ASC">Stok Terdikit</option>
                    <option value="STOCK_DESC">Stok Terbanyak</option>
                    <option value="CODE_ASC">Kode A - Z</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-livara-brown/15 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-3.5 py-2.5 rounded-xl bg-livara-creamDark text-livara-brown font-bold text-xs"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-livara-brown hover:bg-livara-brownDark text-livara-cream font-extrabold text-xs sm:text-sm shadow-md transition"
              >
                Lihat Hasil ({filteredProducts.length} Barang)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. POP-UP MODAL KALKULATOR ESTIMASI KEBUTUHAN DINDING & CEK STOK */}
      {isEstimatorOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsEstimatorOpen(false)}
        >
          <div
            className="bg-livara-creamLight border-2 border-livara-brown rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-livara-brown/20 pb-3">
              <div className="flex items-center gap-2 text-livara-brown font-extrabold text-sm sm:text-base">
                <Ruler className="w-5 h-5" />
                <h3>Kalkulator Estimasi Dinding & Cek Stok</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEstimatorOpen(false)}
                className="p-1.5 rounded-xl bg-livara-cream text-livara-brown"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Lebar Dinding (Meter)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={wallWidth}
                  onChange={(e) => setWallWidth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-extrabold outline-none focus:border-livara-brown"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Tinggi Dinding (Meter)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={wallHeight}
                  onChange={(e) => setWallHeight(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-extrabold outline-none focus:border-livara-brown"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Jenis & Ukuran Material PVC
                </label>
                <select
                  value={selectedSpecId}
                  onChange={(e) => {
                    setSelectedSpecId(e.target.value);
                    setSelectedProductId('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-xs sm:text-sm font-bold outline-none focus:border-livara-brown"
                >
                  {WALL_SPECS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Pilih Kode Motif di Gudang (Cek Stok)
                </label>
                <select
                  value={chosenEstimatorProduct?.id || ''}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-xs sm:text-sm font-bold outline-none focus:border-livara-brown"
                >
                  {matchingProductsForSpec.length === 0 ? (
                    <option value="">-- Belum ada kode terdaftar di kategori ini --</option>
                  ) : (
                    matchingProductsForSpec.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name} (Stok Ready: {p.stock} {p.unit})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWaste}
                  onChange={(e) => setIncludeWaste(e.target.checked)}
                  className="rounded border-livara-brown text-livara-brown"
                />
                <span>Tambahkan cadangan potongan / waste (+5%)</span>
              </label>
            </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-livara-brown/25 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-stone-500">
                  Luas Bidang: <strong>{wallAreaM2.toFixed(2)} m²</strong>
                </span>
                <span className="text-xs font-extrabold text-livara-brown">
                  Estimasi Kebutuhan
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-livara-cream p-2.5 rounded-xl">
                  <span className="text-lg sm:text-xl font-extrabold text-livara-brown block">
                    {finalSheetsNeeded}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-stone-600">
                    Lembar Utama
                  </span>
                </div>
                <div className="bg-livara-cream p-2.5 rounded-xl">
                  <span className="text-lg sm:text-xl font-extrabold text-stone-800 block">
                    ~{estListBatang}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-stone-600">
                    Batang List
                  </span>
                </div>
                <div className="bg-livara-cream p-2.5 rounded-xl">
                  <span className="text-lg sm:text-xl font-extrabold text-stone-800 block">
                    ~{estSealantTubes}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-stone-600">
                    Tube Sealant
                  </span>
                </div>
              </div>

              {chosenEstimatorProduct && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    isStockEnough
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isStockEnough ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertOctagon className="w-4 h-4 text-rose-700 shrink-0" />
                    )}
                    <div>
                      <p className="font-extrabold">
                        {isStockEnough
                          ? `Stok Ready Cukup! (Tersedia ${currentStockReady} Lembar)`
                          : `Stok Kurang ${stockShortage} Lembar! (Ready: ${currentStockReady} Lembar)`}
                      </p>
                      {estMaterialPrice > 0 && (
                        <p className="text-[11px] opacity-85">
                          Estimasi Nilai Jual Bahan Utama: {formatRupiah(estMaterialPrice)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEstimatorOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-livara-creamDark text-livara-brown font-bold text-xs"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleShareEstimateWA}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim Estimasi ke WA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. POP-UP MODAL RIWAYAT PEMAKAIAN PER KODE BARANG */}
      {historyProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setHistoryProduct(null)}
        >
          <div
            className="bg-livara-creamLight border-2 border-livara-brown rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-livara-brown/20 pb-3">
              <div>
                <span className="font-mono text-xs font-extrabold bg-livara-brown text-livara-cream px-2 py-0.5 rounded">
                  {historyProduct.code}
                </span>
                <h3 className="font-extrabold text-base text-stone-900 mt-1">
                  {historyProduct.name}
                </h3>
                <p className="text-xs text-stone-600">
                  Stok Ready Saat Ini: <strong>{historyProduct.stock} {historyProduct.unit}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryProduct(null)}
                className="p-1.5 rounded-xl bg-livara-cream text-livara-brown"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              <p className="text-xs font-extrabold text-livara-brown uppercase tracking-wider">
                Riwayat Keluar / Masuk Kode Ini ({productHistoryList.length}):
              </p>
              {productHistoryList.length === 0 ? (
                <p className="text-xs text-stone-500 italic py-4 text-center">
                  Belum ada riwayat proyek atau stok masuk untuk kode barang ini.
                </p>
              ) : (
                productHistoryList.map((h) => {
                  const isIn = h.type === 'IN';
                  const isDamaged = h.type === 'DAMAGED';
                  const netUsed = Number(h.itemQty) - Number(h.itemReturned);
                  return (
                    <div
                      key={h.id}
                      className="bg-white p-3 rounded-xl border border-livara-brown/20 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-stone-500 block">
                          {formatTanggalIndo(h.date)} • {h.picName || '-'}
                        </span>
                        <p className="font-extrabold text-stone-900">
                          {isIn
                            ? `Stok Masuk (${h.supplier})`
                            : isDamaged
                            ? `Barang Rusak/Sample (${h.projectName})`
                            : h.projectName}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {isIn ? (
                          <span className="font-extrabold text-emerald-700 block">
                            +{h.itemQty} {historyProduct.unit}
                          </span>
                        ) : (
                          <span className="font-extrabold text-rose-700 block">
                            -{netUsed} {historyProduct.unit}
                          </span>
                        )}
                        {!isIn && !isDamaged && h.itemReturned > 0 && (
                          <span className="text-[10px] text-emerald-700">
                            (Bawa {h.itemQty}, Kembali +{h.itemReturned})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. POP-UP MODAL TAMBAH / EDIT BARANG */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-livara-creamLight border-2 border-livara-brown rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-livara-brown/20 pb-3">
              <div className="flex items-center gap-2 text-livara-brown font-extrabold text-base">
                <PackagePlus className="w-5 h-5" />
                <h3>{editId ? `Edit Material [${code}]` : 'Tambah Material / Kode Motif Baru'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-livara-cream hover:bg-livara-creamDark text-livara-brown"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  1. Kategori Produk *
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-bold outline-none focus:border-livara-brown"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  2. Pilih Varian & Ukuran *
                </label>
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-bold outline-none focus:border-livara-brown"
                >
                  {currentPresets.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Ketik Ukuran Lainnya...</option>
                </select>
              </div>

              {selectedPreset === 'CUSTOM' && (
                <div className="sm:col-span-6">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nama Barang & Ukuran Custom *
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ketik nama barang dan ukurannya..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-semibold outline-none focus:border-livara-brown"
                  />
                </div>
              )}

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  3. Kode Barang / SKU *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Cth: WL-1007 / ALU-T-GLD"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-bold uppercase outline-none focus:border-livara-brown"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Satuan Ukuran *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-bold outline-none focus:border-livara-brown"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Keterangan Motif / Warna (Opsional)
                </label>
                <input
                  type="text"
                  value={motifDetail}
                  onChange={(e) => setMotifDetail(e.target.value)}
                  placeholder="Contoh: Kayu Oak / Marmer Putih (Kosongkan jika cukup kode saja)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-semibold outline-none focus:border-livara-brown"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Harga Beli / Modal (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatThousandInput(costPrice)}
                  onChange={(e) => setCostPrice(parseThousandInput(e.target.value))}
                  placeholder="Cth: 85.000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-bold outline-none focus:border-livara-brown"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Harga Jual (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatThousandInput(sellPrice)}
                  onChange={(e) => setSellPrice(parseThousandInput(e.target.value))}
                  placeholder="Cth: 125.000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-bold outline-none focus:border-livara-brown"
                />
              </div>

              <div className="sm:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700">Stok Ready *</label>
                  <button
                    type="button"
                    onClick={() => setShowBoxCalc(!showBoxCalc)}
                    className="text-[11px] font-bold text-livara-brown underline flex items-center gap-0.5"
                  >
                    <Calculator className="w-3 h-3" /> Hitung Box
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={formatThousandInput(stock)}
                  onChange={(e) => setStock(parseThousandInput(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-bold outline-none focus:border-livara-brown"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Batas Minimum Restok
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={formatThousandInput(minStock)}
                  onChange={(e) => setMinStock(parseThousandInput(e.target.value))}
                  placeholder="5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-bold outline-none focus:border-livara-brown"
                />
              </div>

              {showBoxCalc && (
                <div className="sm:col-span-6 bg-livara-cream p-3 rounded-2xl border border-livara-brown/25 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-livara-brown">
                    Konversi Dus/Box ke {unit}:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      value={boxCount}
                      onChange={(e) => setBoxCount(e.target.value)}
                      placeholder="Jml Box"
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-livara-brown/30 bg-white text-xs font-bold text-center"
                    />
                    <span className="text-xs font-bold">×</span>
                    <input
                      type="number"
                      min="1"
                      value={pcsPerBox}
                      onChange={(e) => setPcsPerBox(e.target.value)}
                      placeholder={`Isi/${unit}`}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-livara-brown/30 bg-white text-xs font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={applyBoxCalculator}
                      className="px-3 py-1.5 rounded-lg bg-livara-brown text-livara-cream font-bold text-xs"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              )}

              <div className="sm:col-span-6 flex justify-end gap-2 pt-3 border-t border-livara-brown/15">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-livara-creamDark text-livara-brown font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-livara-brown hover:bg-livara-brownDark text-livara-cream font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{editId ? 'Simpan Perubahan' : 'Simpan Material'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}