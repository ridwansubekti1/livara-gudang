import { useState } from 'react';
import {
  Search,
  WalletCards,
  Pencil,
  Check,
  X,
  Lock,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  CATEGORIES,
  formatRupiah,
  formatThousandInput,
  parseThousandInput
} from '../utils/formatters';

export default function CatalogPriceTab() {
  const { products, saveProduct, isOwner, pins, updatePins, loginWithPin } = useStore();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showChangePin, setShowChangePin] = useState(false);
  const [newStaffPin, setNewStaffPin] = useState(pins.staffPin);
  const [newOwnerPin, setNewOwnerPin] = useState(pins.ownerPin);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('ALL');

  // State Edit Cepat Harga & Qty
  const [editingId, setEditingId] = useState(null);
  const [editCost, setEditCost] = useState('');
  const [editSell, setEditSell] = useState('');
  const [editQty, setEditQty] = useState('');

  const handleUnlockOwner = (e) => {
    e.preventDefault();
    if (String(pinInput).trim() === pins.ownerPin) {
      loginWithPin(pinInput);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Khusus Owner! Masukkan PIN Owner (Default: 1234).');
    }
  };

  const handleSavePins = (e) => {
    e.preventDefault();
    if (newStaffPin.trim().length < 4 || newOwnerPin.trim().length < 4) {
      alert('PIN minimal 4 angka!');
      return;
    }
    updatePins(newStaffPin, newOwnerPin);
    setShowChangePin(false);
  };

  if (!isOwner) {
    return (
      <section className="max-w-md mx-auto my-8 bg-livara-creamLight p-6 rounded-3xl border-2 border-livara-brown/30 shadow-md text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-livara-brown text-livara-cream flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-livara-brown">Akses Khusus Owner</h2>
          <p className="text-xs text-stone-600 mt-1">
            Tab ini memuat <strong>Harga Beli (Modal)</strong>, <strong>Harga Jual</strong>, dan{' '}
            <strong>Total Nilai Aset Gudang</strong>. Masukkan PIN Owner untuk membuka:
          </p>
        </div>

        <form onSubmit={handleUnlockOwner} className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="Masukkan PIN Owner"
            className="w-full px-4 py-3 rounded-xl border-2 border-livara-brown/30 bg-white text-center font-extrabold text-base tracking-widest outline-none focus:border-livara-brown"
          />
          {pinError && <p className="text-xs font-bold text-rose-700">{pinError}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-livara-brown hover:bg-livara-brownDark text-livara-cream font-extrabold text-sm transition shadow-sm"
          >
            Buka Data Harga & Aset
          </button>
        </form>
      </section>
    );
  }

  const totalCapitalValue = products.reduce(
    (sum, p) => sum + Math.max(0, Number(p.stock)) * (Number(p.costPrice) || 0),
    0
  );
  const totalSellValue = products.reduce(
    (sum, p) => sum + Math.max(0, Number(p.stock)) * (Number(p.sellPrice) || 0),
    0
  );
  const totalMarginPotential = Math.max(0, totalSellValue - totalCapitalValue);

  const filtered = products.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.code || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterCat !== 'ALL' && p.category !== filterCat) return false;
    return true;
  });

  const startQuickEdit = (p) => {
    setEditingId(p.id);
    setEditCost(p.costPrice || 0);
    setEditSell(p.sellPrice || 0);
    setEditQty(p.stock || 0);
  };

  const saveQuickEdit = (p) => {
    saveProduct({
      ...p,
      costPrice: Number(editCost) || 0,
      sellPrice: Number(editSell) || 0,
      stock: Number(editQty) || 0
    });
    setEditingId(null);
  };

  return (
    <section className="space-y-5">
      {/* Bar Pengaturan PIN Keamanan Gudang */}
      <div className="bg-livara-creamLight px-4 py-3 rounded-2xl border border-livara-brown/25 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-livara-brown">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Mode Owner Aktif — Anda dapat mengedit harga & mengatur PIN staf gudang</span>
        </div>
        <button
          type="button"
          onClick={() => setShowChangePin(!showChangePin)}
          className="px-3 py-1.5 rounded-xl bg-livara-cream hover:bg-livara-creamDark text-livara-brown font-bold text-xs flex items-center gap-1 border border-livara-brown/20"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Atur PIN Admin & Owner</span>
        </button>
      </div>

      {showChangePin && (
        <form
          onSubmit={handleSavePins}
          className="bg-white p-4 rounded-2xl border-2 border-livara-brown/30 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              PIN Admin Gudang (Staf):
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={newStaffPin}
              onChange={(e) => setNewStaffPin(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-livara-brown/30 text-xs font-bold outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              PIN Owner (Full Akses):
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={newOwnerPin}
              onChange={(e) => setNewOwnerPin(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-livara-brown/30 text-xs font-bold outline-none"
            />
          </div>
          <button
            type="submit"
            className="py-2 px-4 rounded-xl bg-emerald-700 text-white font-extrabold text-xs"
          >
            Simpan Pengaturan PIN
          </button>
        </form>
      )}

      {/* 3 Kartu Ringkasan Aset & Harga */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-livara-creamLight p-4 rounded-2xl border-2 border-livara-brown/20 shadow-xs">
          <p className="text-xs font-bold text-livara-brown/80 uppercase tracking-wider">
            Total Modal Stok Ready
          </p>
          <p className="text-xl font-extrabold text-stone-900 mt-1">
            {formatRupiah(totalCapitalValue)}
          </p>
          <p className="text-xs text-stone-600 mt-0.5 font-medium">
            Akumulasi (Qty Ready × Harga Beli)
          </p>
        </div>

        <div className="bg-livara-creamLight p-4 rounded-2xl border-2 border-livara-brown/20 shadow-xs">
          <p className="text-xs font-bold text-livara-brown/80 uppercase tracking-wider">
            Total Nilai Jual Stok
          </p>
          <p className="text-xl font-extrabold text-livara-brown mt-1">
            {formatRupiah(totalSellValue)}
          </p>
          <p className="text-xs text-stone-600 mt-0.5 font-medium">
            Akumulasi (Qty Ready × Harga Jual)
          </p>
        </div>

        <div className="bg-livara-brown text-livara-cream p-4 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-livara-cream/80 uppercase tracking-wider">
            Potensi Margin Gudang
          </p>
          <p className="text-xl font-extrabold text-white mt-1">
            {formatRupiah(totalMarginPotential)}
          </p>
          <p className="text-xs text-livara-cream/90 mt-0.5 font-medium">
            Selisih Nilai Jual dikurangi Modal
          </p>
        </div>
      </div>

      {/* Tabel Lengkap Seluruh Stok: Qty, Harga Beli & Harga Jual */}
      <div className="bg-livara-creamLight rounded-2xl border-2 border-livara-brown/25 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-livara-brown/15 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-extrabold text-sm text-livara-brown flex items-center gap-2">
              <WalletCards className="w-4 h-4" />
              Daftar Seluruh Stok, Qty, Harga Beli & Harga Jual ({filtered.length})
            </h3>
            <span className="text-xs text-stone-500">
              Klik ikon pensil di kanan baris untuk ubah harga/qty cepat
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kode barang (WL-1007...) atau nama barang..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-livara-brown/25 bg-white text-sm outline-none focus:border-livara-brown"
              />
            </div>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="px-3 py-2 rounded-xl border border-livara-brown/25 bg-white text-sm font-bold text-livara-brown outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-livara-cream text-livara-brown text-xs font-extrabold uppercase border-b border-livara-brown/20">
                <th className="py-3 px-4">Kode & Nama Barang</th>
                <th className="py-3 px-3 text-center">Qty Ready</th>
                <th className="py-3 px-3 text-right">Harga Beli (Modal)</th>
                <th className="py-3 px-3 text-right">Harga Jual</th>
                <th className="py-3 px-3 text-right">Total Modal</th>
                <th className="py-3 px-3 text-right">Total Nilai Jual</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-livara-brown/15 text-xs sm:text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-stone-500">
                    Belum ada data stok yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isEditing = editingId === p.id;
                  const qty = Math.max(0, Number(p.stock));
                  const totalModal = qty * (Number(p.costPrice) || 0);
                  const totalJual = qty * (Number(p.sellPrice) || 0);

                  return (
                    <tr key={p.id} className="hover:bg-livara-cream/60 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-extrabold bg-livara-brown text-livara-cream px-2 py-0.5 rounded">
                            {p.code}
                          </span>
                          <span className="text-[11px] font-bold text-stone-500">
                            {p.category}
                          </span>
                        </div>
                        <p className="font-extrabold text-stone-900 mt-0.5">{p.name}</p>
                      </td>

                      <td className="py-3 px-3 text-center font-extrabold">
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatThousandInput(editQty)}
                            onChange={(e) => setEditQty(parseThousandInput(e.target.value))}
                            className="w-16 px-2 py-1 rounded-lg border border-livara-brown bg-white text-center font-extrabold"
                          />
                        ) : (
                          <span
                            className={
                              Number(p.stock) <= 0
                                ? 'text-rose-700'
                                : Number(p.stock) <= Number(p.minStock)
                                ? 'text-amber-700'
                                : 'text-stone-900'
                            }
                          >
                            {p.stock} <span className="text-[11px] font-normal">{p.unit}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-stone-700">
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatThousandInput(editCost)}
                            onChange={(e) => setEditCost(parseThousandInput(e.target.value))}
                            className="w-24 px-2 py-1 rounded-lg border border-livara-brown bg-white text-right font-bold"
                          />
                        ) : (
                          formatRupiah(p.costPrice)
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-extrabold text-livara-brown">
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatThousandInput(editSell)}
                            onChange={(e) => setEditSell(parseThousandInput(e.target.value))}
                            className="w-24 px-2 py-1 rounded-lg border border-livara-brown bg-white text-right font-bold"
                          />
                        ) : (
                          formatRupiah(p.sellPrice)
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-stone-600">
                        {formatRupiah(totalModal)}
                      </td>

                      <td className="py-3 px-3 text-right font-extrabold text-emerald-800">
                        {formatRupiah(totalJual)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => saveQuickEdit(p)}
                              className="p-1.5 rounded-lg bg-emerald-700 text-white"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg bg-stone-200 text-stone-700"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startQuickEdit(p)}
                            className="p-1.5 rounded-lg bg-livara-cream hover:bg-livara-creamDark text-livara-brown border border-livara-brown/20"
                            title="Edit Harga / Qty"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}