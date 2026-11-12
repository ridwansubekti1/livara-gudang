import { useState, useRef } from 'react';
import { Calendar, MessageCircle, ImageDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useStore } from '../context/StoreContext';
import {
  getJakartaDateString,
  getWeekStartDateString,
  formatTanggalIndo,
  formatRupiah
} from '../utils/formatters';

export default function RecapTab() {
  const { products, mutations, isOwner, showToast } = useStore();

  const [startDate, setStartDate] = useState(getWeekStartDateString());
  const [endDate, setEndDate] = useState(getJakartaDateString());
  const cardRef = useRef(null);

  const weekMutations = mutations.filter((m) => m.date >= startDate && m.date <= endDate);
  const inMutations = weekMutations.filter((m) => m.type === 'IN');
  const outMutations = weekMutations.filter((m) => m.type === 'OUT');
  const damagedMutations = weekMutations.filter((m) => m.type === 'DAMAGED');

  // 1. Akumulasi Total Barang Masuk
  const inboundSummaryMap = {};
  inMutations.forEach((m) => {
    m.items.forEach((it) => {
      if (!inboundSummaryMap[it.productId]) {
        inboundSummaryMap[it.productId] = {
          code: it.code,
          name: it.name,
          unit: it.unit,
          qty: 0
        };
      }
      inboundSummaryMap[it.productId].qty += Number(it.qty);
    });
  });
  const inboundList = Object.values(inboundSummaryMap);

  // 2. Daftar Barang yang Wajib Dibeli / Restok (PO ke Supplier)
  const restockPOList = products.filter((p) => Number(p.stock) <= Number(p.minStock));

  const totalCapitalNow = products.reduce(
    (s, p) => s + Math.max(0, Number(p.stock)) * (Number(p.costPrice) || 0),
    0
  );

  const handleSetThisWeek = () => {
    setStartDate(getWeekStartDateString());
    setEndDate(getJakartaDateString());
  };

  const handleShareWA = () => {
    const inText =
      inboundList.length > 0
        ? inboundList.map((i) => `• [${i.code}] ${i.name}: +${i.qty} ${i.unit}`).join('\n')
        : '• Tidak ada barang masuk minggu ini';

    const outText =
      outMutations.length > 0
        ? outMutations
            .map((m) => {
              const itemsDesc = m.items
                .map((it) => {
                  const ret = Number(it.returnedQty) || 0;
                  const net = Number(it.qty) - ret;
                  return `  - [${it.code}] ${it.name}: Terpakai ${net} ${it.unit}${
                    ret > 0 ? ` (Dibawa ${it.qty}, Kembali ${ret})` : ''
                  }`;
                })
                .join('\n');
              return `*${m.projectName}* (${formatTanggalIndo(m.date)})\n${itemsDesc}`;
            })
            .join('\n\n')
        : '• Belum ada pengeluaran proyek minggu ini';

    const dmgText =
      damagedMutations.length > 0
        ? damagedMutations
            .map((m) => {
              const itemsDesc = m.items
                .map((it) => `  - [${it.code}] ${it.name}: -${it.qty} ${it.unit}`)
                .join('\n');
              return `*${m.projectName}* (${formatTanggalIndo(m.date)})\n${itemsDesc}`;
            })
            .join('\n')
        : '• Tidak ada barang rusak/reject minggu ini';

    const poText =
      restockPOList.length > 0
        ? restockPOList
            .map(
              (p) =>
                `• [${p.code}] ${p.name} — Sisa: *${p.stock} ${p.unit}* (Min: ${p.minStock}) ${
                  Number(p.stock) <= 0 ? '🚨 *HABIS*' : '⚠️ *MENIPIS*'
                }`
            )
            .join('\n')
        : '• Semua stok aman terkendali';

    const waMessage = `📦 *LAPORAN MINGGUAN GUDANG - LIVARA INTERIOR*
📅 Periode: ${formatTanggalIndo(startDate)} s/d ${formatTanggalIndo(endDate)}
${isOwner ? `💰 Nilai Aset Modal Gudang: *${formatRupiah(totalCapitalNow)}*\n` : ''}
📥 *1. TOTAL BARANG MASUK:*
${inText}

🏗️ *2. BARANG KELUAR PER PROYEK:*
${outText}

⚠️ *3. BARANG RUSAK / SAMPLE:*
${dmgText}

🛒 *4. DAFTAR WAJIB RESTOK (PO KE SUPPLIER):*
${poText}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(waMessage)}`, '_blank');
  };

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    showToast('Menyiapkan gambar laporan mingguan...');
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#fdfaf6'
      });
      const link = document.createElement('a');
      link.download = `Rekap-Gudang-Livara-${startDate}-sd-${endDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Gambar Rekap Mingguan berhasil diunduh!');
    } catch {
      alert('Gagal mengunduh gambar PNG.');
    }
  };

  return (
    <section className="space-y-5">
      <div className="bg-livara-creamLight p-4 rounded-2xl border-2 border-livara-brown/25 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-livara-brown font-extrabold text-sm">
          <Calendar className="w-5 h-5" />
          <span>Periode Rekap Mingguan:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-livara-brown/30 bg-white text-xs sm:text-sm font-bold outline-none"
          />
          <span className="font-bold text-xs text-stone-500">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-livara-brown/30 bg-white text-xs sm:text-sm font-bold outline-none"
          />
          <button
            type="button"
            onClick={handleSetThisWeek}
            className="px-3 py-2 rounded-xl bg-livara-brown text-livara-cream font-bold text-xs hover:bg-livara-brownDark"
          >
            7 Hari Terakhir
          </button>
        </div>
      </div>

      {/* KARTU LAPORAN MINGGUAN */}
      <div
        ref={cardRef}
        className="bg-livara-creamLight p-6 rounded-3xl border-2 border-livara-brown shadow-md space-y-5 max-w-2xl mx-auto"
      >
        <div className="flex items-center justify-between border-b-2 border-dashed border-livara-brown/25 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-livara-brown text-livara-cream px-2.5 py-1 rounded-full">
              Laporan Gudang Mingguan
            </span>
            <h2 className="text-xl font-extrabold text-livara-brown mt-1.5">LIVARA INTERIOR</h2>
            <p className="text-xs text-stone-600 font-semibold">
              Periode: {formatTanggalIndo(startDate)} — {formatTanggalIndo(endDate)}
            </p>
          </div>
          <img
            src="/icon.svg"
            alt="Livara Interior"
            className="w-12 h-12 rounded-2xl shadow-xs border border-livara-brown/20 object-cover"
          />
        </div>

        {/* Bagian 1: Total Barang Masuk */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-xl inline-block">
            1. Total Barang Masuk ({inboundList.length} Jenis Material)
          </h4>
          {inboundList.length === 0 ? (
            <p className="text-xs text-stone-500 italic px-1">
              Tidak ada pencatatan barang masuk pada periode ini.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {inboundList.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2.5 rounded-xl border border-livara-brown/15 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-[11px] text-livara-brown block">
                      {item.code}
                    </span>
                    <span className="font-bold text-stone-800">{item.name}</span>
                  </div>
                  <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                    +{item.qty} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bagian 2: Total Barang Keluar per Proyek */}
        <div className="space-y-2 pt-2 border-t border-dashed border-livara-brown/20">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-livara-cream bg-livara-brown px-3 py-1.5 rounded-xl inline-block">
            2. Total Barang Keluar per Proyek ({outMutations.length} Proyek)
          </h4>

          {outMutations.length === 0 ? (
            <p className="text-xs text-stone-500 italic px-1">
              Belum ada pengeluaran barang proyek pada periode ini.
            </p>
          ) : (
            <div className="space-y-2.5">
              {outMutations.map((m) => (
                <div
                  key={m.id}
                  className="bg-white p-3.5 rounded-2xl border border-livara-brown/20 space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
                    <span className="font-extrabold text-xs sm:text-sm text-stone-900">
                      {m.projectName}
                    </span>
                    <span className="text-[11px] font-bold text-stone-500">
                      {formatTanggalIndo(m.date)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {m.items.map((it, idx) => {
                      const returned = Number(it.returnedQty) || 0;
                      const netUsed = Number(it.qty) - returned;
                      return (
                        <div
                          key={idx}
                          className="flex flex-wrap items-center justify-between text-xs text-stone-700"
                        >
                          <span>
                            • <strong>[{it.code}]</strong> {it.name}
                          </span>
                          <span className="font-bold text-livara-brown">
                            Terpakai: {netUsed} {it.unit}{' '}
                            {returned > 0 && (
                              <span className="text-emerald-700 font-normal">
                                (Bawa {it.qty}, Lebih +{returned})
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bagian 3: Barang Rusak / Sample (Jika Ada) */}
        {damagedMutations.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-dashed border-livara-brown/20">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-900 bg-rose-100 px-3 py-1.5 rounded-xl inline-block">
              3. Catatan Barang Rusak / Sample ({damagedMutations.length})
            </h4>
            <div className="space-y-2">
              {damagedMutations.map((m) => (
                <div
                  key={m.id}
                  className="bg-rose-50/60 p-3 rounded-xl border border-rose-200 text-xs space-y-1"
                >
                  <div className="flex justify-between font-bold text-rose-950">
                    <span>{m.projectName}</span>
                    <span>{formatTanggalIndo(m.date)}</span>
                  </div>
                  {m.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-stone-700">
                      <span>
                        • [{it.code}] {it.name}
                      </span>
                      <span className="font-extrabold text-rose-700">
                        -{it.qty} {it.unit}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bagian 4: Daftar Barang Wajib Dibeli / Restok (PO ke Supplier) */}
        <div className="space-y-2 pt-2 border-t border-dashed border-livara-brown/20">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-950 bg-amber-200/80 px-3 py-1.5 rounded-xl inline-block">
            {damagedMutations.length > 0 ? '4.' : '3.'} Daftar Wajib Dibeli / Restok — PO ke Supplier ({restockPOList.length})
          </h4>

          {restockPOList.length === 0 ? (
            <p className="text-xs font-bold text-emerald-700 px-1">
              ✓ Seluruh stok material di atas batas minimum. Tidak ada PO mendesak.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {restockPOList.map((p) => {
                const isOut = Number(p.stock) <= 0;
                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      isOut
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : 'bg-amber-50 border-amber-300 text-amber-950'
                    }`}
                  >
                    <div>
                      <span className="font-mono font-extrabold text-[11px] block">
                        [{p.code}] {isOut ? '• HABIS!' : '• MENIPIS'}
                      </span>
                      <span className="font-bold">{p.name}</span>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-extrabold block">
                        Sisa: {p.stock} {p.unit}
                      </span>
                      <span className="text-[10px] opacity-75">Min: {p.minStock}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tombol Aksi Kirim WA & Unduh PNG */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleShareWA}
          className="py-3.5 px-5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition"
        >
          <MessageCircle className="w-5 h-5" />
          Kirim Laporan Mingguan ke WA
        </button>

        <button
          type="button"
          onClick={handleDownloadPNG}
          className="py-3.5 px-5 rounded-2xl bg-livara-brown hover:bg-livara-brownDark text-livara-cream font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition"
        >
          <ImageDown className="w-5 h-5" />
          Unduh Gambar Laporan (PNG)
        </button>
      </div>
    </section>
  );
}