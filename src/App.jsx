import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import OcrSection from './components/OcrSection';
import PeopleManager from './components/PeopleManager';
import TransactionManager from './components/TransactionManager';
import PaymentDestination from './components/PaymentDestination';
import SettlementSummary from './components/SettlementSummary';
import SettingsModal from './components/SettingsModal';
import { calculateSettlement } from './utils/calculator';
import { CheckCircle } from 'lucide-react';

const LOCAL_STORAGE_KEY_SETTINGS = 'splitbill_settings_v1';
const LOCAL_STORAGE_KEY_DATA = 'splitbill_data_v1';

const defaultPeople = ['Gue', 'Teman 1', 'Teman 2'];

const initialTransactions = [
  {
    id: 'tx_default_1',
    name: 'Transaksi 1',
    payer: 'Gue',
    items: [
      {
        id: 'item_1',
        name: 'Nasi Goreng Spesial',
        qty: 1,
        price: 25000,
        assignedTo: ['Gue']
      },
      {
        id: 'item_2',
        name: 'Mie Godhog',
        qty: 1,
        price: 22000,
        assignedTo: ['Teman 1']
      },
      {
        id: 'item_3',
        name: 'Es Teh Manis',
        qty: 3,
        price: 5000,
        assignedTo: ['Gue', 'Teman 1', 'Teman 2']
      }
    ],
    taxType: 'percent',
    taxValue: 10,
    serviceType: 'percent',
    serviceValue: 0,
    discountType: 'amount',
    discountValue: 0,
    distributionMethod: 'proportional'
  }
];

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
    const { storeName, items, detectedTax, detectedService, detectedDiscount } = ocrResult;

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
          discountValue: detectedDiscount || 0
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

  // Reset data ke template awal
  const handleResetData = () => {
    setPeople(defaultPeople);
    setTransactions(initialTransactions);
    setCurrentTxIndex(0);
    showToast('Data berhasil di-reset ke awal.');
  };

  // Kalkulasi settlement multi-transaksi
  const settlementData = useMemo(() => {
    return calculateSettlement(transactions, people);
  }, [transactions, people]);

  return (
    <div className="min-h-screen bg-[#EDE4D8] py-4 px-2 sm:px-4 flex flex-col items-center justify-start font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-maroon-800 text-[#FAF4EB] px-4 py-2 rounded-full font-mono text-xs font-semibold shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Receipt Paper Container */}
      <main className="w-full max-w-xl bg-[#FAF4EB] shadow-2xl rounded-2xl border-2 border-maroon-700/60 overflow-hidden relative transition-all">
        {/* Header with perforated edge */}
        <Header onOpenSettings={() => setIsSettingsOpen(true)} />

        {/* Section 1: Foto Struk & OCR */}
        <OcrSection
          ocrEngine={ocrEngine}
          setOcrEngine={setOcrEngine}
          onOcrSuccess={handleOcrSuccess}
          settings={settings}
          onOpenSettings={() => setIsSettingsOpen(true)}
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
        />
      </main>

      {/* Footer Branding */}
      <footer className="mt-4 text-center text-xs font-mono text-maroon-900/60">
        <p>Talangin Dulu · Hosting on splitbill.notnot.store</p>
        <p className="text-[10px] mt-0.5">Dibuat dengan Hallmark Design System anti-AI-slop</p>
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
