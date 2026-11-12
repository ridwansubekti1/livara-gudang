import { createContext, useContext, useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { getJakartaDateString } from '../utils/formatters';

const StoreContext = createContext();

const AUTH_ROLE_SESSION = 'livara_active_role_v1';

export function StoreProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [mutations, setMutations] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stok');
  const [toastMsg, setToastMsg] = useState('');

  // Sistem Role: 'viewer' (Lihat Saja) | 'staff' (Admin Gudang) | 'owner' (Owner Full Akses)
  const [userRole, setUserRole] = useState(
    () => sessionStorage.getItem(AUTH_ROLE_SESSION) || 'viewer'
  );
  const [pins, setPins] = useState({ staffPin: '1111', ownerPin: '1234' });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const canEdit = userRole === 'staff' || userRole === 'owner';
  const isOwner = userRole === 'owner';

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Muat data dari Supabase Cloud saat aplikasi pertama kali dibuka
  useEffect(() => {
    let isMounted = true;
    async function initCloudData() {
      setDataLoading(true);
      try {
        const cloud = await storageService.fetchAllData();
        if (isMounted) {
          setProducts(cloud.products);
          setMutations(cloud.mutations);
          if (cloud.pins) setPins(cloud.pins);
        }
      } catch (err) {
        console.error('Gagal mengambil data dari Supabase:', err);
      } finally {
        if (isMounted) setDataLoading(false);
      }
    }
    initCloudData();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const updatePins = async (newStaffPin, newOwnerPin) => {
    const nextPins = {
      staffPin: String(newStaffPin).trim() || pins.staffPin,
      ownerPin: String(newOwnerPin).trim() || pins.ownerPin
    };
    setPins(nextPins);
    await storageService.savePinsToCloud(nextPins);
    showToast('PIN Keamanan Gudang berhasil disimpan ke Cloud!');
  };

  // --- MASTER BARANG / STOK (SINKRON KE SUPABASE) ---
  const saveProduct = async (prodData) => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    let targetProd;
    let updatedProducts;

    if (prodData.id) {
      targetProd = { ...prodData };
      updatedProducts = products.map((p) => (p.id === prodData.id ? targetProd : p));
      showToast('Data barang berhasil diperbarui di Cloud!');
    } else {
      targetProd = {
        ...prodData,
        id: 'prd_' + Date.now() + Math.random().toString(36).slice(2, 6)
      };
      updatedProducts = [targetProd, ...products];
      showToast('Barang baru ditambahkan ke Cloud Gudang!');
    }

    setProducts(updatedProducts);
    await storageService.upsertProducts([targetProd]);
  };

  const adjustStockQuick = async (productId, delta) => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    let changedProd = null;
    const updatedProducts = products.map((p) => {
      if (p.id === productId) {
        const nextStock = Math.max(0, Number(p.stock) + delta);
        changedProd = { ...p, stock: nextStock };
        return changedProd;
      }
      return p;
    });

    setProducts(updatedProducts);
    if (changedProd) {
      await storageService.upsertProducts([changedProd]);
    }
  };

  const deleteProduct = async (productId) => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    setProducts(products.filter((p) => p.id !== productId));
    await storageService.deleteProductById(productId);
    showToast('Barang dihapus dari database gudang');
  };

  // --- MUTASI BARANG MASUK, KELUAR PROYEK, & BARANG RUSAK ---
  const createMutation = async (payload) => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    const isDeducting = payload.type === 'OUT' || payload.type === 'DAMAGED';
    const affectedProducts = [];

    const updatedProducts = products.map((p) => {
      const found = payload.items.find((it) => it.productId === p.id);
      if (!found) return p;
      const delta = isDeducting ? -Number(found.qty) : Number(found.qty);
      const nextProd = {
        ...p,
        stock: Math.max(0, Number(p.stock) + delta)
      };
      affectedProducts.push(nextProd);
      return nextProd;
    });

    const newMutation = {
      id: 'mut_' + Date.now(),
      type: payload.type,
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

    setProducts(updatedProducts);
    setMutations([newMutation, ...mutations]);

    await Promise.all([
      storageService.upsertProducts(affectedProducts),
      storageService.upsertMutation(newMutation)
    ]);

    showToast(
      payload.type === 'IN'
        ? 'Stok masuk berhasil disimpan ke Cloud!'
        : payload.type === 'DAMAGED'
        ? 'Barang rusak/sample tercatat di Cloud!'
        : 'Barang keluar proyek tercatat di Cloud!'
    );
  };

  // --- FITUR BARANG LEBIH (SISA PROYEK KEMBALI KE STOK READY) ---
  const recordExcessReturn = async (mutationId, returnMap, returnNote = '') => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    const targetMut = mutations.find((m) => m.id === mutationId);
    if (!targetMut || targetMut.type !== 'OUT') return;

    const summaryParts = [];
    const affectedProducts = [];
    let updatedProducts = [...products];

    const updatedItems = targetMut.items.map((item) => {
      const addReturn = Number(returnMap[item.productId]) || 0;
      if (addReturn <= 0) return item;

      const maxReturnable = Number(item.qty) - (Number(item.returnedQty) || 0);
      const validReturn = Math.min(addReturn, maxReturnable);

      if (validReturn > 0) {
        updatedProducts = updatedProducts.map((p) => {
          if (p.id === item.productId) {
            const nextProd = { ...p, stock: Number(p.stock) + validReturn };
            affectedProducts.push(nextProd);
            return nextProd;
          }
          return p;
        });
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

    const updatedMutObj = {
      ...targetMut,
      items: updatedItems,
      returnLogs: [...(targetMut.returnLogs || []), logEntry]
    };

    setProducts(updatedProducts);
    setMutations(mutations.map((m) => (m.id === mutationId ? updatedMutObj : m)));

    await Promise.all([
      storageService.upsertProducts(affectedProducts),
      storageService.upsertMutation(updatedMutObj)
    ]);

    showToast('Barang lebih berhasil dikembalikan ke Stok Ready Cloud!');
  };

  const deleteMutation = async (mutationId) => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    const target = mutations.find((m) => m.id === mutationId);
    if (!target) return;

    const affectedProducts = [];
    const updatedProducts = products.map((p) => {
      const item = target.items.find((it) => it.productId === p.id);
      if (!item) return p;

      let nextProd;
      if (target.type === 'IN') {
        nextProd = { ...p, stock: Math.max(0, Number(p.stock) - Number(item.qty)) };
      } else {
        const netUsed = Number(item.qty) - (Number(item.returnedQty) || 0);
        nextProd = { ...p, stock: Number(p.stock) + netUsed };
      }
      affectedProducts.push(nextProd);
      return nextProd;
    });

    setProducts(updatedProducts);
    setMutations(mutations.filter((m) => m.id !== mutationId));

    await Promise.all([
      storageService.upsertProducts(affectedProducts),
      storageService.deleteMutationById(mutationId)
    ]);

    showToast('Catatan mutasi dihapus & stok Cloud disesuaikan kembali');
  };

  const loadSample = async () => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    setDataLoading(true);
    const sample = storageService.getSampleData();
    setProducts(sample.products);
    setMutations(sample.mutations);
    await storageService.replaceAllCloudData(sample.products, sample.mutations);
    setDataLoading(false);
    showToast('Data contoh berhasil dimuat ke Cloud Supabase!');
  };

  const clearAll = async () => {
    if (!isOwner) {
      alert('Hanya Owner yang dapat menghapus seluruh data gudang!');
      return;
    }
    setDataLoading(true);
    setProducts([]);
    setMutations([]);
    await storageService.replaceAllCloudData([], []);
    setDataLoading(false);
    showToast('Semua data gudang di Cloud telah dikosongkan');
  };

  const restoreFromJson = async (parsedData) => {
    if (!canEdit) {
      setIsLoginModalOpen(true);
      return;
    }
    setDataLoading(true);
    setProducts(parsedData.products);
    setMutations(parsedData.mutations);
    await storageService.replaceAllCloudData(parsedData.products, parsedData.mutations);
    setDataLoading(false);
    showToast('Data backup berhasil dipulihkan ke Cloud Supabase!');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        mutations,
        dataLoading,
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