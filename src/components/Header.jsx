import { useState } from 'react';
import {
  Boxes,
  WalletCards,
  ArrowLeftRight,
  ClipboardList,
  Sparkles,
  Download,
  Upload,
  Trash2,
  Lock,
  LogOut,
  ShieldCheck,
  UserCheck,
  Eye,
  X
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { getJakartaDateString, formatTanggalIndo } from '../utils/formatters';

export default function Header() {
  const {
    products,
    mutations,
    activeTab,
    setActiveTab,
    loadSample,
    clearAll,
    restoreFromJson,
    showToast,
    userRole,
    canEdit,
    isOwner,
    loginWithPin,
    logoutUser,
    isLoginModalOpen,
    setIsLoginModalOpen
  } = useStore();

  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const todayStr = getJakartaDateString();

  const outOfStockCount = products.filter((p) => Number(p.stock) <= 0).length;
  const lowStockCount = products.filter(
    (p) => Number(p.stock) > 0 && Number(p.stock) <= Number(p.minStock)
  ).length;
  const totalAlertCount = outOfStockCount + lowStockCount;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const res = loginWithPin(pinInput);
    if (res.success) {
      setPinInput('');
      setLoginError('');
    } else {
      setLoginError(res.message);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ products, mutations }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-gudang-livara-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File Backup JSON berhasil diunduh!');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed.products) || !Array.isArray(parsed.mutations)) {
          alert('Format file JSON tidak sesuai dengan struktur Gudang Livara!');
          return;
        }
        restoreFromJson(parsed);
      } catch {
        alert('File JSON tidak valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSampleClick = () => {
    if (products.length > 0 || mutations.length > 0) {
      if (!window.confirm('Timpa data saat ini dengan Data Contoh Gudang Livara Interior?')) return;
    }
    loadSample();
  };

  const handleClearClick = () => {
    if (window.confirm('⚠️ Yakin ingin MENGHAPUS SEMUA data stok & riwayat mutasi gudang?')) {
      clearAll();
    }
  };

  return (
    <>
      {/* TOP HEADER BAR (Ramping di HP karena Tab pindah ke bawah) */}
      <header className="bg-livara-brown text-livara-cream sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-4 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/icon.svg"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/icon.svg';
              }}
              alt="Livara Interior"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl shadow-sm border border-livara-cream/30 object-cover shrink-0 bg-livara-cream"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm sm:text-lg leading-tight tracking-tight text-livara-cream truncate">
                  LIVARA INTERIOR
                </h1>
                {userRole === 'owner' && (
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                    <ShieldCheck className="w-2.5 h-2.5" /> Owner
                  </span>
                )}
                {userRole === 'staff' && (
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                    <UserCheck className="w-2.5 h-2.5" /> Admin
                  </span>
                )}
                {userRole === 'viewer' && (
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase bg-livara-cream/20 text-livara-cream px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                    <Eye className="w-2.5 h-2.5" /> Lihat
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-livara-cream/80 truncate">
                {formatTanggalIndo(todayStr)} • Gudang PVC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {canEdit && (
              <>
                <button
                  onClick={handleSampleClick}
                  className="text-xs font-bold bg-livara-brownDark hover:bg-black/30 text-livara-cream border border-livara-cream/20 p-2 sm:px-2.5 sm:py-2 rounded-xl flex items-center gap-1 transition"
                  title="Isi Data Contoh"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Contoh</span>
                </button>

                <button
                  onClick={handleExport}
                  className="text-xs font-semibold bg-livara-brownDark hover:bg-black/30 text-livara-cream border border-livara-cream/20 p-2 sm:px-2.5 sm:py-2 rounded-xl flex items-center gap-1 transition"
                  title="Backup JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Backup</span>
                </button>

                <label
                  className="text-xs font-semibold bg-livara-brownDark hover:bg-black/30 text-livara-cream border border-livara-cream/20 p-2 sm:px-2.5 sm:py-2 rounded-xl flex items-center gap-1 cursor-pointer transition"
                  title="Pulihkan JSON"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Pulihkan</span>
                  <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                </label>
              </>
            )}

            {isOwner && (
              <button
                onClick={handleClearClick}
                className="text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white p-2 sm:px-2.5 sm:py-2 rounded-xl flex items-center gap-1 transition"
                title="Hapus Semua Data"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {userRole === 'viewer' ? (
              <button
                type="button"
                onClick={() => {
                  setLoginError('');
                  setPinInput('');
                  setIsLoginModalOpen(true);
                }}
                className="text-[11px] sm:text-xs font-extrabold bg-livara-cream text-livara-brown hover:bg-white px-2.5 py-2 rounded-xl flex items-center gap-1 shadow-sm transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={logoutUser}
                className="text-[11px] sm:text-xs font-extrabold bg-livara-cream text-livara-brown hover:bg-white px-2.5 py-2 rounded-xl flex items-center gap-1 shadow-sm transition"
                title="Kunci Kembali ke Mode Lihat Saja"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* NAVIGASI 4 TAB KHUSUS DESKTOP / TABLET (hidden sm:block) */}
        <div className="hidden sm:block max-w-5xl mx-auto px-4 pb-3 pt-0.5">
          <div className="grid grid-cols-4 gap-1.5 bg-livara-brownDark p-1.5 rounded-2xl border border-livara-cream/15">
            <button
              onClick={() => setActiveTab('stok')}
              className={`py-2.5 px-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-1.5 transition ${
                activeTab === 'stok'
                  ? 'bg-livara-cream text-livara-brown shadow-md'
                  : 'text-livara-cream/80 hover:text-white'
              }`}
            >
              <Boxes className="w-4 h-4 shrink-0" />
              <span>Stok Gudang</span>
              {totalAlertCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    outOfStockCount > 0
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {totalAlertCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('harga')}
              className={`py-2.5 px-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-1.5 transition ${
                activeTab === 'harga'
                  ? 'bg-livara-cream text-livara-brown shadow-md'
                  : 'text-livara-cream/80 hover:text-white'
              }`}
            >
              <WalletCards className="w-4 h-4 shrink-0" />
              <span>Harga & Aset</span>
              {!isOwner && <Lock className="w-3 h-3 opacity-70" />}
            </button>

            <button
              onClick={() => setActiveTab('mutasi')}
              className={`py-2.5 px-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-1.5 transition ${
                activeTab === 'mutasi'
                  ? 'bg-livara-cream text-livara-brown shadow-md'
                  : 'text-livara-cream/80 hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
              <span>Keluar / Masuk</span>
            </button>

            <button
              onClick={() => setActiveTab('rekap')}
              className={`py-2.5 px-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-1.5 transition ${
                activeTab === 'rekap'
                  ? 'bg-livara-cream text-livara-brown shadow-md'
                  : 'text-livara-cream/80 hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Rekap Mingguan</span>
            </button>
          </div>
        </div>
      </header>

      {/* BOTTOM TAB BAR KHUSUS SMARTPHONE (sm:hidden) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-livara-brown text-livara-cream border-t-2 border-livara-cream/20 shadow-[0_-4px_20px_rgba(0,0,0,0.25)] px-2 py-1.5">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('stok');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`relative py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
              activeTab === 'stok'
                ? 'bg-livara-cream text-livara-brown font-extrabold shadow-sm'
                : 'text-livara-cream/75 font-semibold'
            }`}
          >
            <Boxes className="w-5 h-5" />
            <span className="text-[10px] leading-none mt-0.5">Stok</span>
            {totalAlertCount > 0 && (
              <span
                className={`absolute top-1 right-2.5 text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  outOfStockCount > 0
                    ? 'bg-rose-600 text-white'
                    : 'bg-amber-400 text-slate-950'
                }`}
              >
                {totalAlertCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('harga');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`relative py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
              activeTab === 'harga'
                ? 'bg-livara-cream text-livara-brown font-extrabold shadow-sm'
                : 'text-livara-cream/75 font-semibold'
            }`}
          >
            <div className="relative">
              <WalletCards className="w-5 h-5" />
              {!isOwner && (
                <Lock className="w-2.5 h-2.5 absolute -top-1 -right-2 opacity-80" />
              )}
            </div>
            <span className="text-[10px] leading-none mt-0.5">Harga</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('mutasi');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
              activeTab === 'mutasi'
                ? 'bg-livara-cream text-livara-brown font-extrabold shadow-sm'
                : 'text-livara-cream/75 font-semibold'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span className="text-[10px] leading-none mt-0.5">Mutasi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('rekap');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
              activeTab === 'rekap'
                ? 'bg-livara-cream text-livara-brown font-extrabold shadow-sm'
                : 'text-livara-cream/75 font-semibold'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] leading-none mt-0.5">Rekap</span>
          </button>
        </div>
      </nav>

      {/* POP-UP MODAL LOGIN PIN ADMIN / OWNER */}
      {isLoginModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsLoginModalOpen(false)}
        >
          <div
            className="bg-livara-creamLight border-2 border-livara-brown rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="p-1.5 rounded-xl bg-livara-cream text-livara-brown"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-livara-brown text-livara-cream flex items-center justify-center mx-auto shadow-md -mt-4">
              <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-livara-brown">
                Login Akses Gudang Livara
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Masukkan PIN untuk mengubah jumlah stok, menambah material, atau mencatat mutasi proyek:
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Ketik PIN Akses..."
                className="w-full px-4 py-3 rounded-xl border-2 border-livara-brown/30 bg-white text-center font-extrabold text-base tracking-widest outline-none focus:border-livara-brown"
              />

              {loginError && <p className="text-xs font-bold text-rose-700">{loginError}</p>}

              <div className="bg-livara-cream p-3 rounded-xl border border-livara-brown/15 text-[11px] text-stone-600 text-left space-y-1">
                <p>
                  • <strong>PIN Admin Gudang :</strong> Bisa ubah stok (+/-), tambah barang, & catat keluar/masuk proyek.
                </p>
                <p>
                  • <strong>PIN Owner :</strong> Akses penuh termasuk membuka tab Harga Beli & Aset Modal.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-livara-brown hover:bg-livara-brownDark text-livara-cream font-extrabold text-sm shadow-md transition"
              >
                Masuk Sekarang
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}