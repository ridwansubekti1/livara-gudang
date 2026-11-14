import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Plus,
  X,
  Save,
  Trash2,
  HardHat,
  Truck,
  CheckCircle2,
  Search,
  MessageCircle,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  SUPPLIERS,
  getJakartaDateString,
  formatTanggalIndo,
  formatRupiah
} from '../utils/formatters';

const DAMAGE_REASONS = [
  'Cacat Pengiriman / Pecah Sudut',
  'Rusak Saat Pemotongan / Gudang',
  'Potongan Sample untuk Customer',
  'Barang Reject Pabrik / Melengkung'
];

export default function MutationTab() {
  const {
    products,
    mutations,
    createMutation,
    recordExcessReturn,
    deleteMutation,
    canEdit,
    isOwner,
    setIsLoginModalOpen
  } = useStore();

  const [mode, setMode] = useState('OUT'); // 'OUT' | 'IN' | 'DAMAGED'
  const [date, setDate] = useState(getJakartaDateString());
  const [supplier, setSupplier] = useState(SUPPLIERS[0]);
  const [damageReason, setDamageReason] = useState(DAMAGE_REASONS[0]);
  const [projectName, setProjectName] = useState('');
  const [picName, setPicName] = useState('');
  const [note, setNote] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [rows, setRows] = useState([{ productId: products[0]?.id || '', qty: 1 }]);

  const [returnModalMut, setReturnModalMut] = useState(null);
  const [returnInputs, setReturnInputs] = useState({});
  const [returnNote, setReturnNote] = useState('');

  const selectableProducts = products.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (
      (p.code || '').toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const handleAddRow = () => {
    const defaultId = selectableProducts[0]?.id || products[0]?.id || '';
    setRows([...rows, { productId: defaultId, qty: 1 }]);
  };

  const handleRemoveRow = (idx) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== idx));
  };

  const handleRowChange = (idx, field, val) => {
    setRows(rows.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    if (products.length === 0) {
      alert('Tambahkan data barang terlebih dahulu di tab Stok Gudang!');
      return;
    }

    if (mode === 'OUT' && !projectName.trim()) {
      alert('Nama Proyek / Klien wajib diisi untuk pengeluaran barang!');
      return;
    }

    const merged = new Map();
    rows.forEach((r) => {
      const prod = products.find((p) => p.id === r.productId);
      const q = Number(r.qty) || 0;
      if (!prod || q <= 0) return;

      if (merged.has(prod.id)) {
        merged.get(prod.id).qty += q;
      } else {
        merged.set(prod.id, {
          productId: prod.id,
          code: prod.code,
          name: prod.name,
          unit: prod.unit,
          qty: q,
          costPrice: Number(prod.costPrice) || 0,
          sellPrice: Number(prod.sellPrice) || 0
        });
      }
    });

    const finalItems = Array.from(merged.values());
    if (finalItems.length === 0) {
      alert('Pilih minimal 1 barang dengan jumlah lebih dari 0.');
      return;
    }

    if (mode === 'OUT' || mode === 'DAMAGED') {
      const overList = [];
      finalItems.forEach((it) => {
        const p = products.find((x) => x.id === it.productId);
        if (p && it.qty > Number(p.stock)) {
          overList.push(`${p.code} - ${p.name} (Input: ${it.qty}, Stok Ready: ${p.stock} ${p.unit})`);
        }
      });

      if (overList.length > 0) {
        const ok = window.confirm(
          `⚠️ PERINGATAN STOK KURANG DI GUDANG:\n\n${overList.join(
            '\n'
          )}\n\nTetap simpan pencatatan ini?`
        );
        if (!ok) return;
      }
    }

    createMutation({
      type: mode,
      date,
      supplier: mode === 'IN' ? supplier : '',
      projectName:
        mode === 'OUT'
          ? projectName.trim()
          : mode === 'DAMAGED'
          ? damageReason
          : '',
      picName: picName.trim(),
      note: note.trim(),
      items: finalItems
    });

    setProjectName('');
    setPicName('');
    setNote('');
    setProductSearch('');
    setRows([{ productId: products[0]?.id || '', qty: 1 }]);
  };

  const handleSendDeliveryNoteWA = (mut) => {
    const itemLines = mut.items
      .map((it) => {
        const ret = Number(it.returnedQty) || 0;
        const net = Number(it.qty) - ret;
        return `• *[${it.code}]* ${it.name}\n  Dibawa: *${it.qty} ${it.unit}*${
          ret > 0 ? ` | Kembali Ready: +${ret} | Terpakai: *${net} ${it.unit}*` : ''
        }`;
      })
      .join('\n');

    const text = `🚚 *SURAT JALAN MATERIAL PROYEK - LIVARA INTERIOR*
📅 Tanggal: ${formatTanggalIndo(mut.date)}
🏗️ Proyek: *${mut.projectName}*
👷 Tim / PIC: ${mut.picName || '-'}

📦 *Rincian Material yang Dibawa:*
${itemLines}
${mut.note ? `\n📝 Catatan: _${mut.note}_` : ''}

_Harap cek jumlah fisik sebelum berangkat. Jika ada sisa barang lebih (tidak terpakai), wajib dilaporkan kembali ke gudang agar masuk ke Stok Ready._`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const openReturnModal = (mut) => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    setReturnModalMut(mut);
    setReturnInputs({});
    setReturnNote('');
  };

  const handleConfirmReturn = (e) => {
    e.preventDefault();
    if (!returnModalMut) return;
    recordExcessReturn(returnModalMut.id, returnInputs, returnNote.trim());
    setReturnModalMut(null);
  };

  return (
    <section className="space-y-5">
      {/* FORM INPUT MUTASI */}
      {!canEdit ? (
        <div className="bg-livara-creamLight p-5 rounded-2xl border-2 border-livara-brown/25 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-livara-brown">
            <Lock className="w-5 h-5 shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm">Pencatatan Keluar / Masuk Terkunci</h3>
              <p className="text-xs text-stone-600">
                Login sebagai Admin Gudang atau Owner untuk mencatat barang proyek, barang rusak, atau stok masuk.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-livara-brown text-livara-cream font-extrabold text-xs"
          >
            Login
          </button>
        </div>
      ) : (
        <div className="bg-livara-creamLight p-5 rounded-2xl border-2 border-livara-brown/25 shadow-sm space-y-4">
          {/* 3 Pilihan Mode Mutasi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-livara-cream p-1.5 rounded-2xl border border-livara-brown/20">
            <button
              type="button"
              onClick={() => setMode('OUT')}
              className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition ${
                mode === 'OUT'
                  ? 'bg-livara-brown text-livara-cream shadow-sm'
                  : 'text-livara-brown/70 hover:text-livara-brown'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Keluar Proyek</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('IN')}
              className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition ${
                mode === 'IN'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-livara-brown/70 hover:text-livara-brown'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Stok Masuk (Supplier)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('DAMAGED')}
              className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition ${
                mode === 'DAMAGED'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'text-livara-brown/70 hover:text-livara-brown'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Barang Rusak / Sample</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Tanggal *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-bold outline-none focus:border-livara-brown"
                />
              </div>

              {mode === 'OUT' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nama Proyek / Rumah Customer *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Contoh: Pemasangan Wallpanel Bpk. Andi - Grand Galaxy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-semibold outline-none focus:border-livara-brown"
                  />
                </div>
              )}

              {mode === 'IN' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Pilih Supplier *
                  </label>
                  <select
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-bold outline-none focus:border-livara-brown"
                  >
                    {SUPPLIERS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {mode === 'DAMAGED' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Kategori Alasan Barang Rusak / Keluar Non-Proyek *
                  </label>
                  <select
                    value={damageReason}
                    onChange={(e) => setDamageReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-bold outline-none focus:border-livara-brown"
                  >
                    {DAMAGE_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {mode === 'OUT'
                    ? 'Dibawa Oleh (Tukang / Tim)'
                    : mode === 'IN'
                    ? 'Diterima Oleh (Orang Gudang)'
                    : 'Dilaporkan / Dicek Oleh'}
                </label>
                <input
                  type="text"
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder={mode === 'OUT' ? 'Contoh: Tim Kang Dedi' : 'Contoh: Admin Gudang'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm outline-none focus:border-livara-brown"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    mode === 'DAMAGED'
                      ? 'Contoh: Pecah sudut 20cm saat turun dari truk ekspedisi'
                      : 'Opsional (misal: dilebihkan 2 lembar untuk cadangan)'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm outline-none focus:border-livara-brown"
                />
              </div>
            </div>

            <div className="bg-livara-cream p-3.5 rounded-2xl border border-livara-brown/20 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-extrabold text-livara-brown uppercase tracking-wider">
                  {mode === 'OUT'
                    ? 'Daftar Material yang Dibawa ke Proyek *'
                    : mode === 'IN'
                    ? 'Daftar Material yang Masuk Gudang *'
                    : 'Daftar Material yang Rusak / Dijadikan Sample *'}
                </label>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="text-xs font-extrabold bg-livara-brown text-livara-cream px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-livara-brownDark"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Baris Barang
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Ketik untuk menyaring pilihan kode di bawah (Cth: WL-1007 / UV / ALU)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-livara-brown/25 bg-white text-xs font-semibold outline-none focus:border-livara-brown"
                />
              </div>

              {rows.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={r.productId}
                    onChange={(e) => handleRowChange(idx, 'productId', e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-xs sm:text-sm font-semibold outline-none"
                  >
                    {selectableProducts.length === 0 ? (
                      <option value="">-- Kode tidak ditemukan --</option>
                    ) : (
                      selectableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.code}] {p.name} (Ready: {p.stock} {p.unit})
                        </option>
                      ))
                    )}
                  </select>

                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={r.qty}
                    onChange={(e) =>
                      handleRowChange(idx, 'qty', e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="Qty"
                    className="w-20 px-3 py-2.5 rounded-xl border border-livara-brown/30 bg-white text-sm font-extrabold text-center outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    className="p-2.5 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 shadow-sm transition ${
                mode === 'OUT'
                  ? 'bg-livara-brown hover:bg-livara-brownDark'
                  : mode === 'IN'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-rose-700 hover:bg-rose-800'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {mode === 'OUT'
                  ? 'Simpan Pengeluaran Proyek & Potong Stok Ready'
                  : mode === 'IN'
                  ? 'Simpan Barang Masuk & Tambah Stok Ready'
                  : 'Simpan Catatan Barang Rusak & Potong Stok Ready'}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* RIWAYAT MUTASI */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-livara-brown uppercase tracking-wider px-1">
          Riwayat Keluar / Masuk Barang ({mutations.length})
        </h3>

        {mutations.length === 0 ? (
          <div className="bg-livara-creamLight p-8 rounded-2xl border-2 border-livara-brown/20 text-center text-stone-500 text-sm">
            Belum ada catatan stok masuk, keluar proyek, atau barang rusak.
          </div>
        ) : (
          mutations.map((m) => {
            const isOut = m.type === 'OUT';
            const isDamaged = m.type === 'DAMAGED';
            return (
              <div
                key={m.id}
                className="bg-livara-creamLight p-4 rounded-2xl border-2 border-livara-brown/20 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-livara-brown/10 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isOut
                            ? 'bg-livara-brown text-livara-cream'
                            : isDamaged
                            ? 'bg-rose-700 text-white'
                            : 'bg-emerald-700 text-white'
                        }`}
                      >
                        {isOut ? (
                          <>
                            <HardHat className="w-3 h-3" /> KELUAR PROYEK
                          </>
                        ) : isDamaged ? (
                          <>
                            <ShieldAlert className="w-3 h-3" /> BARANG RUSAK / SAMPLE
                          </>
                        ) : (
                          <>
                            <Truck className="w-3 h-3" /> STOK MASUK
                          </>
                        )}
                      </span>
                      <span className="text-xs font-bold text-stone-500">
                        {formatTanggalIndo(m.date)}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base text-stone-900 mt-1">
                      {isOut || isDamaged ? m.projectName : m.supplier}
                    </h4>

                    {m.picName && (
                      <p className="text-xs font-semibold text-livara-brown">
                        PIC / Tim: {m.picName}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {isOut && (
                      <button
                        type="button"
                        onClick={() => handleSendDeliveryNoteWA(m)}
                        className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-1.5 transition shadow-2xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Surat Jalan WA</span>
                      </button>
                    )}

                    {isOut && canEdit && (
                      <button
                        type="button"
                        onClick={() => openReturnModal(m)}
                        className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 font-extrabold text-xs flex items-center gap-1.5 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-800" />
                        <span>Catat Barang Lebih</span>
                      </button>
                    )}

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              'Hapus catatan mutasi ini? Stok akan dikembalikan ke posisi semula.'
                            )
                          ) {
                            deleteMutation(m.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                        title="Hapus Mutasi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  {m.items.map((it, idx) => {
                    const returned = Number(it.returnedQty) || 0;
                    const netUsed = Number(it.qty) - returned;
                    return (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center justify-between bg-livara-cream px-3 py-2 rounded-xl text-xs"
                      >
                        <div className="font-bold text-stone-800">
                          <span className="font-mono text-[11px] bg-livara-brown/10 text-livara-brown px-1.5 py-0.5 rounded mr-1.5">
                            {it.code}
                          </span>
                          {it.name}
                        </div>

                        {isOut ? (
                          <div className="flex items-center gap-2 mt-1 sm:mt-0">
                            <span className="text-stone-600">
                              Dibawa: <strong>{it.qty}</strong> {it.unit}
                            </span>
                            {returned > 0 && (
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-extrabold">
                                Kembali Ready: +{returned} {it.unit}
                              </span>
                            )}
                            <span className="bg-livara-brown text-livara-cream px-2 py-0.5 rounded-md font-extrabold">
                              Terpakai: {netUsed} {it.unit}
                            </span>
                          </div>
                        ) : isDamaged ? (
                          <span className="font-extrabold text-rose-700">
                            -{it.qty} {it.unit} (Rusak/Sample)
                          </span>
                        ) : (
                          <span className="font-extrabold text-emerald-700">
                            +{it.qty} {it.unit}
                            {isOwner && ` (Modal: ${formatRupiah(it.qty * (it.costPrice || 0))})`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {m.note && <p className="text-xs italic text-stone-600">Catatan: "{m.note}"</p>}

                {m.returnLogs && m.returnLogs.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 space-y-1">
                    {m.returnLogs.map((log, i) => (
                      <p
                        key={i}
                        className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          [{formatTanggalIndo(log.date)}] {log.text}
                        </span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL INPUT BARANG LEBIH */}
      {returnModalMut && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-livara-creamLight border-2 border-livara-brown rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-livara-brown/20 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-livara-brown">
                  Catat Barang Lebih (Sisa Proyek)
                </h3>
                <p className="text-xs text-stone-600 font-semibold">
                  {returnModalMut.projectName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReturnModalMut(null)}
                className="p-1.5 rounded-xl bg-livara-cream text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturn} className="space-y-3">
              <p className="text-xs text-stone-700 bg-amber-100/80 border border-amber-300 p-2.5 rounded-xl font-medium">
                Masukkan jumlah <strong>barang tidak terpakai (barang lebih)</strong> yang dibawa pulang dari proyek. Jumlah ini akan <strong>otomatis masuk kembali ke Stok Ready</strong>.
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {returnModalMut.items.map((it) => {
                  const alreadyReturned = Number(it.returnedQty) || 0;
                  const maxLeft = Number(it.qty) - alreadyReturned;
                  return (
                    <div
                      key={it.productId}
                      className="bg-white p-3 rounded-xl border border-livara-brown/20 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-xs text-stone-900">
                          [{it.code}] {it.name}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Dibawa: {it.qty} {it.unit} • Sudah diretur: {alreadyReturned} {it.unit} •{' '}
                          <strong>Bisa diretur: maks {maxLeft}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max={maxLeft}
                          disabled={maxLeft <= 0}
                          value={returnInputs[it.productId] || ''}
                          onChange={(e) =>
                            setReturnInputs({
                              ...returnInputs,
                              [it.productId]: e.target.value
                            })
                          }
                          placeholder="0"
                          className="w-16 px-2.5 py-1.5 rounded-lg border border-livara-brown/40 text-sm font-extrabold text-center outline-none"
                        />
                        <span className="text-xs font-bold text-stone-600">{it.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Keterangan Retur (Opsional)
                </label>
                <input
                  type="text"
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  placeholder="Contoh: Kondisi utuh mulus, dibawa balik Kang Dedi"
                  className="w-full px-3 py-2 rounded-xl border border-livara-brown/30 bg-white text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalMut(null)}
                  className="px-4 py-2.5 rounded-xl bg-livara-creamDark text-livara-brown font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-livara-brown hover:bg-livara-brownDark text-livara-cream font-extrabold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Kembalikan ke Stok Ready</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}