import React, { useState } from 'react';
import { Copy, Check, MessageSquare, RefreshCw, ArrowRight, Wallet, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatRupiah, formatWhatsAppMessage } from '../utils/calculator';

export default function SettlementSummary({
  settlementData,
  transactions,
  people,
  settings,
  onReset
}) {
  const [copied, setCopied] = useState(false);

  const { transactionsBreakdown, peopleSummary, settlements, grandTotalAllTransactions } = settlementData;

  const handleCopyWhatsApp = () => {
    const text = formatWhatsAppMessage({
      transactions: transactionsBreakdown,
      peopleSummary,
      settlements,
      grandTotal: grandTotalAllTransactions,
      paymentInfo: {
        bank: settings.paymentBank,
        accountNumber: settings.paymentNumber,
        accountName: settings.paymentName
      }
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 }
      });
      setTimeout(() => setCopied(false), 3000);
    }).catch(err => {
      console.error('Clipboard error:', err);
      alert('Gagal menyalin otomatis. Silakan salin manual.');
    });
  };

  const handleOpenWhatsApp = () => {
    const text = formatWhatsAppMessage({
      transactions: transactionsBreakdown,
      peopleSummary,
      settlements,
      grandTotal: grandTotalAllTransactions,
      paymentInfo: {
        bank: settings.paymentBank,
        accountNumber: settings.paymentNumber,
        accountName: settings.paymentName
      }
    });

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <section className="px-4 py-3">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-maroon-700 text-[#FAF4EB] text-xs font-mono font-bold flex items-center justify-center">
            5
          </span>
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-maroon-800 m-0">
            HASIL HITUNGAN GABUNGAN
          </h2>
        </div>
      </div>

      {/* Main Settlement Box */}
      <div className="border-2 border-maroon-700 rounded-xl bg-paper-50 p-4 shadow-sm mb-4">
        {/* Grand Total Header */}
        <div className="text-center pb-3 border-b border-dashed border-maroon-700/40 mb-3">
          <span className="font-mono text-[11px] font-bold text-maroon-800/80 uppercase tracking-widest">
            TOTAL SEMUA PENGELUARAN
          </span>
          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-maroon-800 mt-0.5">
            {formatRupiah(grandTotalAllTransactions)}
          </div>
          <span className="text-[11px] font-sans text-maroon-700/70">
            ({transactions.length} transaksi / struk tergabung)
          </span>
        </div>

        {/* Ringkasan Per Orang */}
        <div className="mb-4">
          <h3 className="font-mono text-xs font-bold text-maroon-900 uppercase mb-2">
            Rincian Tanggungan Per Orang:
          </h3>

          <div className="space-y-2">
            {peopleSummary.map((person) => {
              const net = Math.round(person.netBalance);
              const isDebtor = net < -1; // harus bayar
              const isCreditor = net > 1; // terima uang
              const isEven = !isDebtor && !isCreditor;

              return (
                <div
                  key={person.name}
                  className="p-2.5 bg-white border border-maroon-700/20 rounded-lg text-xs"
                >
                  <div className="flex items-center justify-between font-mono font-bold text-maroon-900 mb-1">
                    <span className="text-sm">{person.name}</span>
                    <span className="text-sm">
                      Total: {formatRupiah(person.totalOwed)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-maroon-800/70 pt-1 border-t border-dashed border-maroon-700/15">
                    <span>
                      Belanja: {formatRupiah(person.itemsSubtotal)} | Biaya/Adj: {formatRupiah((person.taxShare || 0) + (person.serviceShare || 0) - (person.discountShare || 0) + (person.roundingShare || 0))}
                    </span>
                    {person.totalPaid > 0 && (
                      <span className="text-emerald-700 font-semibold">
                        Nalangi: {formatRupiah(person.totalPaid)}
                      </span>
                    )}
                  </div>

                  {/* Status Akhir */}
                  <div className="mt-1.5 pt-1 border-t border-maroon-700/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-maroon-800/60">
                      Status:
                    </span>
                    {isDebtor && (
                      <span className="px-2 py-0.5 rounded bg-maroon-100 text-maroon-800 font-mono text-[11px] font-bold">
                        Harus Bayar: {formatRupiah(Math.abs(net))}
                      </span>
                    )}
                    {isCreditor && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold">
                        Terima Refund: {formatRupiah(net)}
                      </span>
                    )}
                    {isEven && (
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[11px] font-bold">
                        Lunas / Pas
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {peopleSummary.length === 0 && (
              <p className="text-xs text-maroon-800/60 font-mono text-center py-2">
                Tambahkan orang dan assign item untuk melihat kalkulasi.
              </p>
            )}
          </div>
        </div>

        {/* Petunjuk Transfer / Settlement Cerdas */}
        <div className="pt-3 border-t border-dashed border-maroon-700/40 mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Wallet className="w-4 h-4 text-maroon-700" />
            <h3 className="font-mono text-xs font-bold text-maroon-900 uppercase">
              Petunjuk Transfer (Optimal):
            </h3>
          </div>

          <div className="space-y-1.5">
            {settlements.map((s, idx) => (
              <div
                key={idx}
                className="p-2 bg-maroon-50/70 border border-maroon-700/30 rounded-lg flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-maroon-900">{s.from}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-maroon-600" />
                  <span className="font-bold text-maroon-900">{s.to}</span>
                </div>
                <span className="font-bold text-maroon-800 text-xs">
                  {formatRupiah(s.amount)}
                </span>
              </div>
            ))}

            {settlements.length === 0 && peopleSummary.length > 0 && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Semua tagihan sudah impas! Tidak ada transfer yang perlu dilakukan.</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Rekening Jika Ada */}
        {settings.paymentNumber && (
          <div className="p-2.5 bg-paper-100 border border-maroon-700/20 rounded-lg text-xs font-mono mb-3">
            <span className="text-[10px] text-maroon-700/80 uppercase font-bold block mb-0.5">
              Rekening Tujuan Transfer:
            </span>
            <div className="font-bold text-maroon-900">
              {settings.paymentBank} - {settings.paymentNumber}
            </div>
            {settings.paymentName && (
              <div className="text-[11px] text-maroon-800">
                a.n {settings.paymentName}
              </div>
            )}
          </div>
        )}

        {/* Tombol Action WhatsApp & Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="w-full py-2.5 px-3 bg-maroon-700 text-[#FAF4EB] font-mono text-xs font-bold rounded-lg hover:bg-maroon-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Teks WhatsApp'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full py-2.5 px-3 bg-emerald-700 text-white font-mono text-xs font-bold rounded-lg hover:bg-emerald-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Kirim via WhatsApp</span>
          </button>
        </div>

        {/* Reset Button */}
        <div className="mt-3 pt-2 text-center border-t border-maroon-700/15">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset semua transaksi dan mulai dari awal?')) {
                onReset();
              }
            }}
            className="text-[11px] font-mono text-red-600 hover:text-red-800 flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Data & Struk Baru</span>
          </button>
        </div>
      </div>

      {/* Bottom Receipt Perforated Edge */}
      <div className="w-full overflow-hidden leading-none h-3.5 bg-[#EDE4D8] mt-2">
        <svg className="w-full h-3.5 text-[#FAF4EB] fill-current rotate-180" preserveAspectRatio="none" viewBox="0 0 100 10">
          <defs>
            <pattern id="scallop-bottom" x="0" y="0" width="8" height="10" patternUnits="userSpaceOnUse">
              <path d="M 0 10 L 0 0 C 2 5.5 6 5.5 8 0 L 8 10 Z" />
            </pattern>
          </defs>
          <rect width="100%" height="10" fill="url(#scallop-bottom)" />
        </svg>
      </div>
    </section>
  );
}
