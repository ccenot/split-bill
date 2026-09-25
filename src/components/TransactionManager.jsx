import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Users, Receipt, Percent, DollarSign } from 'lucide-react';
import { formatRupiah, parseRupiahInput } from '../utils/calculator';

export default function TransactionManager({
  transactions,
  setTransactions,
  currentTxIndex,
  setCurrentTxIndex,
  people
}) {
  const currentTx = transactions[currentTxIndex] || transactions[0];

  // Helper update current transaction
  const updateCurrentTx = (updatedFields) => {
    setTransactions(prev => {
      const next = [...prev];
      next[currentTxIndex] = { ...next[currentTxIndex], ...updatedFields };
      return next;
    });
  };

  // Add new transaction
  const handleAddTransaction = () => {
    const newId = 'tx_' + Date.now();
    const newTxNumber = transactions.length + 1;
    const newTx = {
      id: newId,
      name: `Transaksi ${newTxNumber}`,
      payer: people[0] || '',
      items: [
        {
          id: 'item_' + Math.random().toString(36).substr(2, 9),
          name: 'Menu / Barang 1',
          qty: 1,
          price: 15000,
          assignedTo: [...people]
        }
      ],
      taxType: 'percent',
      taxValue: 0,
      serviceType: 'percent',
      serviceValue: 0,
      discountType: 'amount',
      discountValue: 0,
      distributionMethod: 'proportional' // 'proportional' | 'flat'
    };

    setTransactions(prev => [...prev, newTx]);
    setCurrentTxIndex(transactions.length);
  };

  // Delete transaction
  const handleDeleteTransaction = (indexToDelete) => {
    if (transactions.length <= 1) {
      alert('Minimal harus ada satu transaksi.');
      return;
    }
    const confirmDelete = window.confirm(`Hapus transaksi "${transactions[indexToDelete].name}"?`);
    if (!confirmDelete) return;

    setTransactions(prev => prev.filter((_, idx) => idx !== indexToDelete));
    if (currentTxIndex >= transactions.length - 1) {
      setCurrentTxIndex(Math.max(0, transactions.length - 2));
    }
  };

  // Items CRUD
  const handleAddItem = () => {
    const newItem = {
      id: 'item_' + Math.random().toString(36).substr(2, 9),
      name: '',
      qty: 1,
      price: 0,
      assignedTo: [...people]
    };
    updateCurrentTx({
      items: [...(currentTx.items || []), newItem]
    });
  };

  const handleUpdateItem = (itemId, fields) => {
    const updatedItems = (currentTx.items || []).map(item => {
      if (item.id === itemId) {
        return { ...item, ...fields };
      }
      return item;
    });
    updateCurrentTx({ items: updatedItems });
  };

  const handleDeleteItem = (itemId) => {
    const updatedItems = (currentTx.items || []).filter(item => item.id !== itemId);
    updateCurrentTx({ items: updatedItems });
  };

  const handleTogglePersonOnItem = (itemId, personName) => {
    const item = (currentTx.items || []).find(i => i.id === itemId);
    if (!item) return;

    const currentAssigned = item.assignedTo || [];
    let nextAssigned;
    if (currentAssigned.includes(personName)) {
      nextAssigned = currentAssigned.filter(p => p !== personName);
    } else {
      nextAssigned = [...currentAssigned, personName];
    }
    handleUpdateItem(itemId, { assignedTo: nextAssigned });
  };

  const handleSelectAllOnItem = (itemId) => {
    const item = (currentTx.items || []).find(i => i.id === itemId);
    if (!item) return;

    const currentAssigned = item.assignedTo || [];
    if (currentAssigned.length === people.length) {
      handleUpdateItem(itemId, { assignedTo: [] });
    } else {
      handleUpdateItem(itemId, { assignedTo: [...people] });
    }
  };

  // Kalkulasi cepat ringkasan transaksi aktif
  const rawSubtotal = (currentTx.items || []).reduce((sum, item) => {
    return sum + (Number(item.qty) || 1) * (Number(item.price) || 0);
  }, 0);

  const taxAmount = currentTx.taxType === 'percent'
    ? (rawSubtotal * (Number(currentTx.taxValue) || 0)) / 100
    : (Number(currentTx.taxValue) || 0);

  const serviceAmount = currentTx.serviceType === 'percent'
    ? (rawSubtotal * (Number(currentTx.serviceValue) || 0)) / 100
    : (Number(currentTx.serviceValue) || 0);

  const discountAmount = currentTx.discountType === 'percent'
    ? (rawSubtotal * (Number(currentTx.discountValue) || 0)) / 100
    : (Number(currentTx.discountValue) || 0);

  const txTotal = Math.max(0, rawSubtotal + taxAmount + serviceAmount - discountAmount);

  return (
    <section className="px-4 py-2">
      {/* Header Bar: TRANSAKSI & Tambah Transaksi */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-maroon-700 text-[#FAF4EB] text-xs font-mono font-bold flex items-center justify-center">
            3
          </span>
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-maroon-800 m-0">
            TRANSAKSI ({transactions.length})
          </h2>
        </div>

        <button
          type="button"
          onClick={handleAddTransaction}
          className="px-2.5 py-1 text-xs font-mono font-semibold text-maroon-800 border border-dashed border-maroon-700/60 rounded bg-paper-50 hover:bg-maroon-100/50 flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Transaksi</span>
        </button>
      </div>

      {/* Main Transaction Card */}
      <div className="border border-maroon-700/60 rounded-xl bg-paper-50/70 p-3 shadow-xs">
        {/* Navigation Bar: < Transaksi X > */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-maroon-700/20">
          <button
            type="button"
            disabled={currentTxIndex <= 0}
            onClick={() => setCurrentTxIndex(prev => Math.max(0, prev - 1))}
            className="w-7 h-7 rounded-full border border-maroon-700/40 flex items-center justify-center text-maroon-800 hover:bg-maroon-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Carousel Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-xs px-1 py-0.5">
            {transactions.map((tx, idx) => (
              <button
                key={tx.id}
                type="button"
                onClick={() => setCurrentTxIndex(idx)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all whitespace-nowrap ${
                  idx === currentTxIndex
                    ? 'bg-maroon-700 text-[#FAF4EB] shadow-xs'
                    : 'bg-transparent text-maroon-800/80 border border-maroon-700/30 hover:bg-maroon-100/60'
                }`}
              >
                {tx.name || `Struk ${idx + 1}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentTxIndex >= transactions.length - 1}
              onClick={() => setCurrentTxIndex(prev => Math.min(transactions.length - 1, prev + 1))}
              className="w-7 h-7 rounded-full border border-maroon-700/40 flex items-center justify-center text-maroon-800 hover:bg-maroon-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {transactions.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteTransaction(currentTxIndex)}
                title="Hapus transaksi ini"
                className="w-7 h-7 rounded-full text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Input Nama Transaksi & Payer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-maroon-800 min-w-[50px]">
              Nama:
            </span>
            <input
              type="text"
              value={currentTx.name || ''}
              onChange={(e) => updateCurrentTx({ name: e.target.value })}
              placeholder="Contoh: Warmindo, Resto A, Kopi"
              className="flex-1 px-2.5 py-1 text-xs font-sans rounded border border-maroon-700/30 bg-white text-ink focus:outline-none focus:ring-1 focus:ring-maroon-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-maroon-800 min-w-[50px]">
              Talangan:
            </span>
            <select
              value={currentTx.payer || ''}
              onChange={(e) => updateCurrentTx({ payer: e.target.value })}
              className="flex-1 px-2.5 py-1 text-xs font-sans rounded border border-maroon-700/30 bg-white text-ink focus:outline-none focus:ring-1 focus:ring-maroon-700"
            >
              <option value="">-- Pilih yang bayar struk --</option>
              {people.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Daftar Item / Menu */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[11px] font-bold text-maroon-800/80 uppercase">
              Daftar Item ({currentTx.items?.length || 0})
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-[11px] font-mono font-semibold text-maroon-700 hover:text-maroon-900 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Tambah Item</span>
            </button>
          </div>

          <div className="space-y-2">
            {(currentTx.items || []).map((item, itemIdx) => {
              const itemTotal = (Number(item.qty) || 1) * (Number(item.price) || 0);
              const assigned = item.assignedTo || [];

              return (
                <div
                  key={item.id || itemIdx}
                  className="p-2 bg-white/90 border border-maroon-700/20 rounded-lg text-xs"
                >
                  {/* Row 1: Nama Item, Qty, Harga, Subtotal & Delete */}
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <input
                      type="text"
                      value={item.name || ''}
                      onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                      placeholder="Nama Menu / Item"
                      className="flex-1 min-w-[120px] px-2 py-1 text-xs rounded border border-maroon-700/20 bg-paper-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon-700"
                    />

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-maroon-700/70 font-mono">x</span>
                      <input
                        type="number"
                        min="1"
                        value={item.qty || 1}
                        onChange={(e) => handleUpdateItem(item.id, { qty: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        className="w-12 px-1.5 py-1 text-xs text-center font-mono rounded border border-maroon-700/20 bg-paper-50 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-maroon-700/70 font-mono">@</span>
                      <input
                        type="text"
                        value={item.price ? Number(item.price).toLocaleString('id-ID') : ''}
                        onChange={(e) => handleUpdateItem(item.id, { price: parseRupiahInput(e.target.value) })}
                        placeholder="Harga"
                        className="w-24 px-2 py-1 text-xs text-right font-mono rounded border border-maroon-700/20 bg-paper-50 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="font-mono text-xs font-bold text-maroon-900 min-w-[75px] text-right">
                      {formatRupiah(itemTotal)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Hapus item"
                      className="w-6 h-6 rounded flex items-center justify-center text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Row 2: Assignment Tags (Siapa yang makan/beli item ini) */}
                  <div className="pt-1.5 border-t border-dashed border-maroon-700/15 flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-mono font-medium text-maroon-800/70 mr-1">
                      Dibagi ke:
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSelectAllOnItem(item.id)}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                        assigned.length === people.length && people.length > 0
                          ? 'bg-maroon-800 text-white border-maroon-800'
                          : 'bg-paper-100 text-maroon-800 border-maroon-700/20 hover:bg-maroon-100'
                      }`}
                    >
                      Semua
                    </button>

                    {people.map(p => {
                      const isSelected = assigned.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleTogglePersonOnItem(item.id, p)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all ${
                            isSelected
                              ? 'bg-maroon-700 text-[#FAF4EB] border-maroon-700 font-semibold'
                              : 'bg-transparent text-maroon-800/80 border-maroon-700/30 hover:bg-maroon-50'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    {people.length === 0 && (
                      <span className="text-[10px] text-red-600 italic">
                        (Tambahkan orang di Bagian 3 terlebih dahulu)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {(!currentTx.items || currentTx.items.length === 0) && (
              <div className="py-4 text-center border border-dashed border-maroon-700/20 rounded-lg text-maroon-800/60 font-mono text-xs">
                Belum ada item di transaksi ini. Klik "+ Tambah Item" atau scan struk.
              </div>
            )}
          </div>
        </div>

        {/* Pajak, Service & Diskon */}
        <div className="p-2.5 bg-paper-100/70 border border-maroon-700/20 rounded-lg text-xs space-y-2 mb-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Pajak */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[11px] font-semibold text-maroon-800">
                  Pajak / PB1
                </span>
                <div className="flex rounded border border-maroon-700/20 overflow-hidden text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => updateCurrentTx({ taxType: 'percent' })}
                    className={`px-1.5 py-0.5 ${currentTx.taxType === 'percent' ? 'bg-maroon-700 text-white' : 'bg-white'}`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCurrentTx({ taxType: 'amount' })}
                    className={`px-1.5 py-0.5 ${currentTx.taxType === 'amount' ? 'bg-maroon-700 text-white' : 'bg-white'}`}
                  >
                    Rp
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0"
                value={currentTx.taxValue || 0}
                onChange={(e) => updateCurrentTx({ taxValue: Number(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-xs font-mono rounded border border-maroon-700/30 bg-white"
              />
              <span className="text-[10px] font-mono text-maroon-700/80">
                = {formatRupiah(taxAmount)}
              </span>
            </div>

            {/* Service Charge */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[11px] font-semibold text-maroon-800">
                  Service Charge
                </span>
                <div className="flex rounded border border-maroon-700/20 overflow-hidden text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => updateCurrentTx({ serviceType: 'percent' })}
                    className={`px-1.5 py-0.5 ${currentTx.serviceType === 'percent' ? 'bg-maroon-700 text-white' : 'bg-white'}`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCurrentTx({ serviceType: 'amount' })}
                    className={`px-1.5 py-0.5 ${currentTx.serviceType === 'amount' ? 'bg-maroon-700 text-white' : 'bg-white'}`}
                  >
                    Rp
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0"
                value={currentTx.serviceValue || 0}
                onChange={(e) => updateCurrentTx({ serviceValue: Number(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-xs font-mono rounded border border-maroon-700/30 bg-white"
              />
              <span className="text-[10px] font-mono text-maroon-700/80">
                = {formatRupiah(serviceAmount)}
              </span>
            </div>

            {/* Diskon */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[11px] font-semibold text-maroon-800">
                  Diskon / Promo
                </span>
                <div className="flex rounded border border-maroon-700/20 overflow-hidden text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => updateCurrentTx({ discountType: 'amount' })}
                    className={`px-1.5 py-0.5 ${currentTx.discountType === 'amount' ? 'bg-maroon-700 text-white' : 'bg-white'}`}
                  >
                    Rp
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCurrentTx({ discountType: 'percent' })}
                    className={`px-1.5 py-0.5 ${currentTx.discountType === 'percent' ? 'bg-maroon-700 text-white' : 'bg-white'}`}
                  >
                    %
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0"
                value={currentTx.discountValue || 0}
                onChange={(e) => updateCurrentTx({ discountValue: Number(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-xs font-mono rounded border border-maroon-700/30 bg-white"
              />
              <span className="text-[10px] font-mono text-maroon-700/80">
                = {formatRupiah(discountAmount)}
              </span>
            </div>
          </div>

          {/* Opsi Distribusi Pajak/Service */}
          <div className="pt-2 border-t border-maroon-700/15 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-mono text-maroon-800/80">
              Metode Bagi Pajak & Biaya:
            </span>
            <div className="flex items-center gap-2 text-xs font-mono">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name={`distMethod_${currentTx.id}`}
                  checked={currentTx.distributionMethod !== 'flat'}
                  onChange={() => updateCurrentTx({ distributionMethod: 'proportional' })}
                  className="accent-maroon-700"
                />
                <span>Proporsional (Sesuai Belanja)</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name={`distMethod_${currentTx.id}`}
                  checked={currentTx.distributionMethod === 'flat'}
                  onChange={() => updateCurrentTx({ distributionMethod: 'flat' })}
                  className="accent-maroon-700"
                />
                <span>Bagi Rata</span>
              </label>
            </div>
          </div>
        </div>

        {/* Ringkasan Subtotal Struk Ini */}
        <div className="pt-2 border-t border-dashed border-maroon-700/30 flex items-center justify-between text-xs font-mono">
          <span className="text-maroon-800/80">Total Transaksi Ini:</span>
          <span className="text-base font-bold text-maroon-800">
            {formatRupiah(txTotal)}
          </span>
        </div>
      </div>
    </section>
  );
}
