import { createContext, useContext, useState } from 'react';
import { storageService } from '../services/storageService';
import { getJakartaDateString } from '../utils/formatters';

const StoreContext = createContext();

const AUTH_PINS_KEY = 'livara_auth_pins_v1';
const AUTH_ROLE_SESSION = 'livara_active_role_v1';

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(() => storageService.loadData().products);
  const [mutations, setMutations] = useState(() => storageService.loadData().mutations);
  const [activeTab, setActiveTab] = useState('stok');
  const [toastMsg, setToastMsg] = useState('');

  // Sistem Role: 'viewer' (Lihat Saja) | 'staff' (Admin Gudang) | 'owner' (Owner Full Akses)
  const [userRole, setUserRole] = useState(
    () => sessionStorage.getItem(AUTH_ROLE_SESSION) || 'viewer'
  );
  const [pins, setPins] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(AUTH_PINS_KEY));
      return saved || { staffPin: '1111', ownerPin: '1234' };
    } catch {
      return { staffPin: '1111', ownerPin: '1234' };
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const canEdit = userRole === 'staff' || userRole === 'owner';
  const isOwner = userRole === 'owner';

  const syncStorage = (newProducts, newMutations) => {
    setProducts(newProducts);
    setMutations(newMutations);
    storageService.saveData({ products: newProducts, mutations: newMutations });
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // --- FUNGSI LOGIN & LOGOUT ---
  const loginWithPin = (inputPin) => {
    const clean = String(inputPin).trim();
    if (clean === pins.ownerPin) {
      setUserRole('owner');
      sessionStorage.setItem(AUTH_ROLE_SESSION, 'owner');
      setIsLoginModalOpen(false);
      showToast('Login berhasil sebagai OWNER (Akses Penuh)!');
      return { success: true, role: 'owner' };
    }
    if (clean === pins.staffPin) {
      setUserRole('staff');
      sessionStorage.setItem(AUTH_ROLE_SESSION, 'staff');
      setIsLoginModalOpen(false);
      showToast('Login berhasil sebagai ADMIN GUDANG!');
      return { success: true, role: 'staff' };
    }
    return { success: false, message: 'PIN tidak dikenali! Coba lagi.' };
  };

  const logoutUser = () => {
    setUserRole('viewer');
    sessionStorage.removeItem(AUTH_ROLE_SESSION);
    if (activeTab === 'harga') setActiveTab('stok');
    showToast('Kembali ke Mode Lihat Saja (Terkunci)');
  };

  const updatePins = (newStaffPin, newOwnerPin) => {
    const nextPins = {
      staffPin: String(newStaffPin).trim() || pins.staffPin,
      ownerPin: String(newOwnerPin).trim() || pins.ownerPin
    };
    setPins(nextPins);
    localStorage.setItem(AUTH_PINS_KEY, JSON.stringify(nextPins));
    showToast('PIN Keamanan Gudang berhasil diperbarui!');
  };

  // --- MASTER BARANG / STOK ---
  const saveProduct = (prodData) => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    let updatedProducts;
    if (prodData.id) {
      updatedProducts = products.map((p) => (p.id === prodData.id ? { ...p, ...prodData } : p));
      showToast('Data barang berhasil diperbarui!');
    } else {
      const newProd = {
        ...prodData,
        id: 'prd_' + Date.now() + Math.random().toString(36).slice(2, 6)
      };
      updatedProducts = [newProd, ...products];
      showToast('Barang baru ditambahkan ke gudang!');
    }
    syncStorage(updatedProducts, mutations);
  };

  const adjustStockQuick = (productId, delta) => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    const updatedProducts = products.map((p) => {
      if (p.id === productId) {
        const nextStock = Math.max(0, Number(p.stock) + delta);
        return { ...p, stock: nextStock };
      }
      return p;
    });
    syncStorage(updatedProducts, mutations);
  };

  const deleteProduct = (productId) => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    const updatedProducts = products.filter((p) => p.id !== productId);
    syncStorage(updatedProducts, mutations);
    showToast('Barang dihapus dari master stok');
  };

  // --- MUTASI BARANG MASUK & KELUAR PROYEK ---
// --- MUTASI BARANG MASUK, KELUAR PROYEK, & BARANG RUSAK ---
  const createMutation = (payload) => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    // Baik 'OUT' (Keluar Proyek) maupun 'DAMAGED' (Barang Rusak/Sample) sama-sama mengurangi stok ready
    const isDeducting = payload.type === 'OUT' || payload.type === 'DAMAGED';

    const updatedProducts = products.map((p) => {
      const found = payload.items.find((it) => it.productId === p.id);
      if (!found) return p;
      const delta = isDeducting ? -Number(found.qty) : Number(found.qty);
      return {
        ...p,
        stock: Math.max(0, Number(p.stock) + delta)
      };
    });

    const newMutation = {
      id: 'mut_' + Date.now(),
      type: payload.type, // 'IN' | 'OUT' | 'DAMAGED'
      date: payload.date || getJakartaDateString(),
      createdAt: new Date().toISOString(),
      supplier: payload.supplier || '',
      projectName: payload.projectName || '',
      picName: payload.picName || '',
      note: payload.note || '',
      items: payload.items.map((it) => ({
        ...it,
        returnedQty: 0
      })),
      returnLogs: []
    };

    const updatedMutations = [newMutation, ...mutations];
    syncStorage(updatedProducts, updatedMutations);
    showToast(
      payload.type === 'IN'
        ? 'Stok masuk berhasil ditambahkan ke stok ready!'
        : payload.type === 'DAMAGED'
        ? 'Barang rusak/sample tercatat & stok ready dikurangi!'
        : 'Barang keluar proyek tercatat & stok ready dikurangi!'
    );
  };

  // --- FITUR BARANG LEBIH (SISA PROYEK KEMBALI KE STOK READY) ---
  const recordExcessReturn = (mutationId, returnMap, returnNote = '') => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    const targetMut = mutations.find((m) => m.id === mutationId);
    if (!targetMut || targetMut.type !== 'OUT') return;

    const summaryParts = [];
    let updatedProducts = [...products];

    const updatedItems = targetMut.items.map((item) => {
      const addReturn = Number(returnMap[item.productId]) || 0;
      if (addReturn <= 0) return item;

      const maxReturnable = Number(item.qty) - (Number(item.returnedQty) || 0);
      const validReturn = Math.min(addReturn, maxReturnable);

      if (validReturn > 0) {
        updatedProducts = updatedProducts.map((p) =>
          p.id === item.productId ? { ...p, stock: Number(p.stock) + validReturn } : p
        );
        summaryParts.push(`${validReturn} ${item.unit} ${item.name}`);
      }

      return {
        ...item,
        returnedQty: (Number(item.returnedQty) || 0) + validReturn
      };
    });

    if (summaryParts.length === 0) {
      showToast('Tidak ada jumlah barang lebih yang diinput');
      return;
    }

    const logEntry = {
      date: getJakartaDateString(),
      text: `Barang lebih masuk ke Stok Ready: ${summaryParts.join(', ')}${
        returnNote ? ` (${returnNote})` : ''
      }`
    };

    const updatedMutations = mutations.map((m) =>
      m.id === mutationId
        ? {
            ...m,
            items: updatedItems,
            returnLogs: [...(m.returnLogs || []), logEntry]
          }
        : m
    );

    syncStorage(updatedProducts, updatedMutations);
    showToast('Barang lebih berhasil dikembalikan ke Stok Ready!');
  };

  const deleteMutation = (mutationId) => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    const target = mutations.find((m) => m.id === mutationId);
    if (!target) return;

    const updatedProducts = products.map((p) => {
      const item = target.items.find((it) => it.productId === p.id);
      if (!item) return p;

      if (target.type === 'IN') {
        return { ...p, stock: Number(p.stock) - Number(item.qty) };
      } else {
        const netUsed = Number(item.qty) - (Number(item.returnedQty) || 0);
        return { ...p, stock: Number(p.stock) + netUsed };
      }
    });

    const updatedMutations = mutations.filter((m) => m.id !== mutationId);
    syncStorage(updatedProducts, updatedMutations);
    showToast('Catatan mutasi dihapus & stok disesuaikan kembali');
  };

  const loadSample = () => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    const sample = storageService.getSampleData();
    syncStorage(sample.products, sample.mutations);
    showToast('Data contoh Livara Interior berhasil dimuat!');
  };

  const clearAll = () => {
    if (!isOwner) {
      alert('Hanya Owner yang dapat menghapus seluruh data gudang!');
      return;
    }
    const empty = storageService.clearData();
    setProducts(empty.products);
    setMutations(empty.mutations);
    showToast('Semua data gudang telah dikosongkan');
  };

  const restoreFromJson = (parsedData) => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    syncStorage(parsedData.products, parsedData.mutations);
    showToast('Data backup gudang berhasil dipulihkan!');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        mutations,
        activeTab,
        setActiveTab,
        toastMsg,
        showToast,
        userRole,
        canEdit,
        isOwner,
        pins,
        updatePins,
        loginWithPin,
        logoutUser,
        isLoginModalOpen,
        setIsLoginModalOpen,
        saveProduct,
        adjustStockQuick,
        deleteProduct,
        createMutation,
        recordExcessReturn,
        deleteMutation,
        loadSample,
        clearAll,
        restoreFromJson
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);