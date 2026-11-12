import { CheckCircle } from 'lucide-react';
import { useStore } from './context/StoreContext';
import Header from './components/Header';
import StockTab from './components/StockTab';
import CatalogPriceTab from './components/CatalogPriceTab';
import MutationTab from './components/MutationTab';
import RecapTab from './components/RecapTab';

export default function App() {
  const { activeTab, toastMsg } = useStore();

  return (
    <div className="min-h-screen bg-livara-cream">
      <Header />

      <main className="max-w-5xl mx-auto px-4 pt-5">
        {activeTab === 'stok' && <StockTab />}
        {activeTab === 'harga' && <CatalogPriceTab />}
        {activeTab === 'mutasi' && <MutationTab />}
        {activeTab === 'rekap' && <RecapTab />}
      </main>

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-livara-brown text-livara-cream border-2 border-livara-cream px-4 py-3 rounded-2xl shadow-xl text-xs font-extrabold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}