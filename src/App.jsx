import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import OcrSection from './components/OcrSection';
import PeopleManager from './components/PeopleManager';
import TransactionManager from './components/TransactionManager';
import PaymentDestination from './components/PaymentDestination';
import SettlementSummary from './components/SettlementSummary';
import SettingsModal from './components/SettingsModal';
import SharedBillView from './components/SharedBillView';
import AdminDashboard from './components/AdminDashboard';
import { calculateSettlement } from './utils/calculator';
import { CheckCircle, RotateCcw } from 'lucide-react';

const LOCAL_STORAGE_KEY_SETTINGS = 'splitbill_settings_v1';
const LOCAL_STORAGE_KEY_DATA = 'splitbill_data_v1';

const defaultPeople = ['Gue', 'Teman 1', 'Teman 2'];

const createEmptyTransaction = (payer = 'Gue', name = 'Transaksi 1') => ({
  id: 'tx_' + Date.now(),
  name,
  payer,
  items: [],
  taxType: 'percent',
  taxValue: 0,
  serviceType: 'percent',
  serviceValue: 0,
  discountType: 'amount',
  discountValue: 0,
  rounding: 0,
  distributionMethod: 'proportional'
});

const initialTransactions = [createEmptyTransaction('Gue', 'Transaksi 1')];

export default function App() {
  // Load settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      geminiKey: '',
      geminiModel: 'gemini-2.0-flash',
      paymentBank: 'BCA',
      paymentNumber: '',
      paymentName: ''
    };
  });

  // Load people & transactions
  const [people, setPeople] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_DATA);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.people) && parsed.people.length > 0) {
          return parsed.people.map(p => p === 'Aku' ? 'Gue' : p);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return defaultPeople;
  });

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_DATA);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
          return parsed.transactions.map(tx => ({
            ...tx,
            payer: tx.payer === 'Aku' ? 'Gue' : tx.payer,
            items: (tx.items || []).map(it => ({
              ...it,
              assignedTo: (it.assignedTo || []).map(p => p === 'Aku' ? 'Gue' : p)
            }))
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initialTransactions;
  });

  const [currentTxIndex, setCurrentTxIndex] = useState(0);
  const [ocrEngine, setOcrEngine] = useState('tesseract');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);

  // Dark Mode State - Default Gelap (Dark)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('splitbill_theme');
    if (saved) return saved === 'dark';
    return true; // Default true (Gelap)
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('splitbill_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('splitbill_theme', 'light');
    }
  }, [isDarkMode]);

  // Deteksi rute URL admin (/admin)
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');
  });

  // Deteksi rute URL untuk melihat share bill (/b/:id atau ?b=:id)
  const [sharedBillId, setSharedBillId] = useState(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    if (path.startsWith('/b/')) {
      return path.replace('/b/', '').split('/')[0];
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('b') || params.get('bill') || null;
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setIsAdminRoute(path === '/admin' || path.startsWith('/admin/'));
      if (path.startsWith('/b/')) {
        setSharedBillId(path.replace('/b/', '').split('/')[0]);
      } else {
        const params = new URLSearchParams(window.location.search);
        setSharedBillId(params.get('b') || params.get('bill') || null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Persist Settings
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  // Persist App Data
  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY_DATA,
        JSON.stringify({ people, transactions })
      );
    } catch (e) {
      console.error(e);
    }
  }, [people, transactions]);

  // Handle OCR Result
  const handleOcrSuccess = (ocrResult) => {
    const { storeName, items, detectedTax, detectedService, detectedDiscount, detectedRounding } = ocrResult;

    const currentTx = transactions[currentTxIndex];
    const isCurrentTxEmpty =
      !currentTx ||
      !currentTx.items ||
      currentTx.items.length === 0 ||
      (currentTx.items.length === 1 && (!currentTx.items[0].name || currentTx.items[0].price === 0));

    // Beri assignment default ke semua anggota
    const mappedItems = (items || []).map(item => ({
      ...item,
      assignedTo: [...people]
    }));

    if (isCurrentTxEmpty && currentTx) {
      // Perbarui transaksi yang sedang aktif
      setTransactions(prev => {
        const next = [...prev];
        next[currentTxIndex] = {
          ...next[currentTxIndex],
          name: storeName || next[currentTxIndex].name,
          items: mappedItems,
          taxType: 'amount',
          taxValue: detectedTax || 0,
          serviceType: 'amount',
          serviceValue: detectedService || 0,
          discountType: 'amount',
          discountValue: detectedDiscount || 0,
          rounding: detectedRounding || 0
        };
        return next;
      });
      showToast(`Struk "${storeName}" berhasil dimuat ke ${currentTx.name}!`);
    } else {
      // Buat transaksi baru di carousel
      const newTxIndex = transactions.length;
      const newTx = {
        id: 'tx_' + Date.now(),
        name: storeName || `Transaksi ${newTxIndex + 1}`,
        payer: people[0] || '',
        items: mappedItems,
        taxType: 'amount',
        taxValue: detectedTax || 0,
        serviceType: 'amount',
        serviceValue: detectedService || 0,
        discountType: 'amount',
        discountValue: detectedDiscount || 0,
        rounding: detectedRounding || 0,
        distributionMethod: 'proportional'
      };

      setTransactions(prev => [...prev, newTx]);
      setCurrentTxIndex(newTxIndex);
      showToast(`Struk baru berhasil ditambahkan sebagai Transaksi ${newTxIndex + 1}!`);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Reset data / Mulai Tagihan Baru (Auto Clear)
  const handleResetData = (confirmFirst = true) => {
    if (confirmFirst && !window.confirm('Kosongkan semua item, pajak, biaya, dan foto nota untuk membuat tagihan baru?')) {
      return;
    }
    const cleanTx = createEmptyTransaction(people[0] || 'Gue', 'Transaksi 1');
    setTransactions([cleanTx]);
    setCurrentTxIndex(0);
    setReceiptFile(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY_TX);
    } catch (e) {
      console.error(e);
    }
    showToast('Form berhasil dikosongkan. Siap untuk tagihan baru!');
  };

  // Kalkulasi settlement multi-transaksi
  const settlementData = useMemo(() => {
    return calculateSettlement(transactions, people);
  }, [transactions, people]);

  // Jika URL mengarah ke halaman Admin (/admin)
  if (isAdminRoute) {
    return (
      <AdminDashboard
        onBack={() => {
          window.history.pushState({}, '', '/');
          setIsAdminRoute(false);
        }}
        isDarkMode={isDarkMode}
      />
    );
  }

  // Jika URL mengarah ke link share bill publik (/b/:id)
  if (sharedBillId) {
    return (
      <SharedBillView
        billId={sharedBillId}
        onBack={() => {
          window.history.pushState({}, '', '/');
          setSharedBillId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#EDE4D8] dark:bg-[#121110] py-4 px-2 sm:px-4 flex flex-col items-center justify-start font-sans transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-maroon-800 text-[#FAF4EB] px-4 py-2 rounded-full font-mono text-xs font-semibold shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Receipt Paper Container */}
      <main className="w-full max-w-xl bg-[#FAF4EB] dark:bg-[#1E1B18] shadow-2xl rounded-2xl border-2 border-maroon-700/60 dark:border-amber-900/50 overflow-hidden relative transition-all">
        {/* Header with perforated edge */}
        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(prev => !prev)}
          onNewBill={() => handleResetData(true)}
        />

        {/* Quick Clear / Tagihan Baru Bar */}
        <div className="px-4 py-1.5 flex items-center justify-between text-xs font-mono border-b border-dashed border-maroon-700/20 dark:border-neutral-700 bg-maroon-50/50 dark:bg-[#25201C] transition-colors">
          <span className="text-[11px] text-maroon-800/70 dark:text-amber-200/70">
            {transactions.reduce((acc, tx) => acc + (tx.items?.length || 0), 0) > 0 
              ? `${transactions.reduce((acc, tx) => acc + (tx.items?.length || 0), 0)} item belanja terinput` 
              : 'Belum ada item belanja'}
          </span>
          <button
            type="button"
            onClick={() => handleResetData(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 border border-rose-300/60 dark:border-rose-900/50 transition active:scale-95"
            title="Kosongkan semua item, pajak, dan foto struk"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Buat Tagihan Baru (Clear)</span>
          </button>
        </div>

        {/* Section 1: Foto Struk & OCR */}
        <OcrSection
          ocrEngine={ocrEngine}
          setOcrEngine={setOcrEngine}
          onOcrSuccess={handleOcrSuccess}
          settings={settings}
          receiptFile={receiptFile}
          onReceiptImageChange={setReceiptFile}
        />

        {/* Dashed divider */}
        <div className="mx-4 receipt-divider my-2"></div>

        {/* Section 2: Daftar Teman / Orang */}
        <PeopleManager
          people={people}
          setPeople={setPeople}
          transactions={transactions}
          setTransactions={setTransactions}
        />

        {/* Dashed divider */}
        <div className="mx-4 receipt-divider my-2"></div>

        {/* Section 3: Transaksi Carousel & Items */}
        <TransactionManager
          transactions={transactions}
          setTransactions={setTransactions}
          currentTxIndex={currentTxIndex}
          setCurrentTxIndex={setCurrentTxIndex}
          people={people}
        />

        {/* Dashed divider */}
        <div className="mx-4 receipt-divider my-2"></div>

        {/* Section 4: Info Rekening / E-Wallet (Tujuan Transfer) */}
        <PaymentDestination
          settings={settings}
          onUpdateSettings={setSettings}
        />

        {/* Dashed divider */}
        <div className="mx-4 receipt-divider my-2"></div>

        {/* Section 5: Hasil Hitungan Gabungan & WhatsApp Sharing */}
        <SettlementSummary
          settlementData={settlementData}
          transactions={transactions}
          people={people}
          settings={settings}
          onReset={handleResetData}
          receiptFile={receiptFile}
        />
      </main>

      {/* Footer Branding */}
      <footer className="mt-4 text-center text-xs font-mono text-maroon-900/60 dark:text-slate-500 space-y-1">
        <p>Talangin Dulu · Hosting on splitbill.notnot.store</p>
        <p className="text-[10px]">
          Created by{' '}
          <a
            href="https://www.tiktok.com/@ccenot"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-maroon-900 dark:hover:text-slate-300 font-semibold"
          >
            @ccenot
          </a>
        </p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
      />
    </div>
  );
}
