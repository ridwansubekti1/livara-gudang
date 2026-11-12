import { CheckCircle, Loader2 } from 'lucide-react';
import { useStore } from './context/StoreContext';
import Header from './components/Header';
import StockTab from './components/StockTab';
import CatalogPriceTab from './components/CatalogPriceTab';
import MutationTab from './components/MutationTab';
import RecapTab from './components/RecapTab';

export default function App() {
  const { activeTab, toastMsg, dataLoading } = useStore();

  return (
    <div className="min-h-screen bg-livara-cream">
      <Header />

      <main className="max-w-5xl mx-auto px-3.5 sm:px-4 pt-4 sm:pt-5">
        {dataLoading ? (
          <div className="bg-livara-creamLight p-10 rounded-3xl border-2 border-livara-brown/25 text-center space-y-2 shadow-xs my-6">
            <Loader2 className="w-7 h-7 text-livara-brown animate-spin mx-auto" />
            <p className="text-sm font-extrabold text-livara-brown">
              Menyinkronkan Data Gudang Livara dari Cloud...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'stok' && <StockTab />}
            {activeTab === 'harga' && <CatalogPriceTab />}
            {activeTab === 'mutasi' && <MutationTab />}
            {activeTab === 'rekap' && <RecapTab />}
          </>
        )}
      </main>

      {toastMsg && (
        <div className="fixed bottom-20 sm:bottom-5 right-4 z-50 bg-livara-brown text-livara-cream border-2 border-livara-cream px-4 py-3 rounded-2xl shadow-xl text-xs font-extrabold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}