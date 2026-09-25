import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink, 
  Maximize2, 
  X,
  CreditCard,
  Building2,
  User,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { fetchBillFromCloud, updateBillPaymentStatus } from '../utils/supabase';

function formatRupiah(num) {
  const rounded = Math.round(Number(num) || 0);
  return 'Rp ' + rounded.toLocaleString('id-ID');
}

export default function SharedBillView({ billId, onBack }) {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [markingPaid, setMarkingPaid] = useState({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchBillFromCloud(billId);
        if (!data) {
          setError('Tagihan split bill tidak ditemukan atau link sudah kedaluwarsa.');
        } else {
          setBill(data);
        }
      } catch (err) {
        console.error(err);
        setError('Gagal memuat tagihan. Periksa koneksi internet kamu.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [billId]);

  const handleCopyAccount = (number) => {
    if (!number) return;
    navigator.clipboard.writeText(number);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleTogglePaid = async (personName) => {
    if (!bill) return;
    setMarkingPaid(prev => ({ ...prev, [personName]: true }));
    try {
      const currentSettlement = bill.settlement || {};
      const currentPaid = currentSettlement.paidStatus || {};
      const newStatus = !currentPaid[personName];
      const updatedSettlement = {
        ...currentSettlement,
        paidStatus: {
          ...currentPaid,
          [personName]: newStatus
        }
      };

      await updateBillPaymentStatus(bill.id, updatedSettlement);
      setBill(prev => ({
        ...prev,
        settlement: updatedSettlement
      }));
    } catch (err) {
      alert('Gagal memperbarui status bayar: ' + err.message);
    } finally {
      setMarkingPaid(prev => ({ ...prev, [personName]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EDE4] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#FAF4EB] p-8 rounded-2xl border-2 border-maroon-700/40 text-center shadow-lg">
          <div className="w-10 h-10 border-4 border-maroon-700/20 border-t-maroon-700 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-mono text-xs font-semibold text-maroon-800">
            MEMUAT RINCIAN SPLIT BILL...
          </p>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen bg-[#F4EDE4] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-red-200 text-center shadow-lg space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="font-bold text-lg text-slate-800">Tagihan Tidak Ditemukan</h2>
          <p className="text-sm text-slate-600">{error || 'Data split bill tidak ditemukan.'}</p>
          <button
            onClick={onBack}
            className="w-full py-2.5 bg-maroon-700 text-white rounded-xl text-sm font-semibold hover:bg-maroon-800 transition"
          >
            Buat Split Bill Baru
          </button>
        </div>
      </div>
    );
  }

  const { title, image_url, total_amount, payer, people = [], transactions = [], settlement = {}, payment_info = {}, created_at } = bill;
  const peopleSummary = settlement.peopleSummary || {};
  const paidStatus = settlement.paidStatus || {};

  const formattedDate = created_at 
    ? new Date(created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="min-h-screen bg-[#F4EDE4] text-slate-800 pb-24 font-sans selection:bg-maroon-700 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 bg-[#FAF4EB]/95 backdrop-blur border-b border-maroon-700/20 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-mono font-semibold text-maroon-800 hover:text-maroon-950 p-1 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-maroon-800">
            RINCIAN SPLIT BILL
          </span>
          <button
            onClick={handleCopyShareLink}
            className="flex items-center gap-1 text-xs font-mono font-semibold text-maroon-700 hover:text-maroon-900 bg-maroon-100/60 px-2 py-1 rounded-lg transition"
            title="Salin Link Tagihan"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Tersalin' : 'Share'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Bill Overview Header Card */}
        <div className="bg-[#FAF4EB] rounded-2xl border-2 border-maroon-700/30 p-5 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-maroon-800/60 font-semibold block mb-0.5">
                TEMPAT / TOKO
              </span>
              <h1 className="text-xl font-bold text-maroon-950 leading-tight">
                {title || 'Split Bill Bersama'}
              </h1>
              {formattedDate && (
                <p className="text-xs text-maroon-800/70 font-mono mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formattedDate}</span>
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-widest text-maroon-800/60 font-semibold block mb-0.5">
                TOTAL STRUK
              </span>
              <span className="text-xl font-mono font-bold text-maroon-800">
                {formatRupiah(total_amount)}
              </span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-maroon-700/15 flex items-center justify-between text-xs font-mono">
            <span className="text-maroon-800/80">
              Ditalangi oleh: <strong className="text-maroon-900">{payer || 'Gue'}</strong>
            </span>
            <span className="text-maroon-800/70">
              {people.length} Orang
            </span>
          </div>
        </div>

        {/* Foto Struk / Nota Preview Card */}
        {image_url && (
          <div className="bg-[#FAF4EB] rounded-2xl border-2 border-maroon-700/30 p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-maroon-700" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-maroon-900 m-0">
                  FOTO NOTA / STRUK
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="text-[11px] font-mono font-semibold text-maroon-700 hover:text-maroon-900 flex items-center gap-1"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Lihat Jelas</span>
              </button>
            </div>

            <div 
              onClick={() => setLightboxOpen(true)}
              className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-900 cursor-pointer border border-maroon-700/20 group"
            >
              <img
                src={image_url}
                alt="Foto Struk"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300 opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                <span className="text-white text-xs font-mono font-semibold flex items-center gap-1.5 drop-shadow">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Ketuk untuk perbesar & zoom nota
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Friends Itemized Breakdown (Hang Fu Tang Style) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-maroon-800 m-0">
              RINCIAN PER ORANG
            </h2>
            <span className="text-[11px] font-mono text-maroon-800/60">
              Cek pesanan masing-masing
            </span>
          </div>

          {people.map((personName, idx) => {
            const summary = peopleSummary[personName] || {};
            const isPayer = personName === payer;
            const isPaid = paidStatus[personName] || isPayer;
            const totalOwed = summary.totalOwed || 0;

            // Collect items ordered by this person across all transactions
            const orderedItems = [];
            transactions.forEach(tx => {
              (tx.items || []).forEach(item => {
                if (item.assignedTo && item.assignedTo.includes(personName)) {
                  const splitCount = item.assignedTo.length;
                  const itemPrice = (Number(item.qty) || 1) * (Number(item.price) || 0);
                  const sharePrice = itemPrice / splitCount;
                  orderedItems.push({
                    name: item.name || 'Item',
                    qty: item.qty || 1,
                    price: item.price || 0,
                    sharePrice,
                    isSplit: splitCount > 1,
                    splitCount
                  });
                }
              });
            });

            return (
              <div
                key={personName}
                className={`bg-[#FAF4EB] rounded-2xl border-2 transition-all p-4 shadow-sm space-y-3 ${
                  isPaid ? 'border-emerald-600/40' : 'border-maroon-700/30'
                }`}
              >
                {/* Person Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-maroon-700 text-[#FAF4EB] font-mono font-bold text-xs flex items-center justify-center uppercase">
                      {personName.substring(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-base text-maroon-950">
                          {personName}
                        </span>
                        {isPayer && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 text-[10px] font-mono font-bold">
                            Menalangi
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-maroon-800/70">
                        {orderedItems.length} pesanan
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-mono font-bold text-maroon-900 block">
                      {formatRupiah(totalOwed)}
                    </span>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      isPaid 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>{isPayer ? 'Sudah Talangi' : (isPaid ? 'Lunas' : 'Belum Bayar')}</span>
                    </span>
                  </div>
                </div>

                {/* Itemized Order List */}
                <div className="pt-2 border-t border-maroon-700/15 space-y-1.5">
                  {orderedItems.map((it, i) => (
                    <div key={i} className="flex items-start justify-between text-xs font-mono">
                      <div className="flex-1 pr-2">
                        <span className="text-maroon-950 font-semibold">{it.name}</span>
                        {it.isSplit && (
                          <span className="text-[10px] text-maroon-700/70 block">
                            (Porsi dibagi {it.splitCount} orang)
                          </span>
                        )}
                      </div>
                      <span className="text-maroon-900 font-semibold">
                        {formatRupiah(it.sharePrice)}
                      </span>
                    </div>
                  ))}

                  {/* Tax, Service & Rounding Share */}
                  {((summary.taxShare || 0) > 0 || (summary.serviceShare || 0) > 0 || (summary.roundingShare || 0) !== 0) && (
                    <div className="pt-1.5 border-t border-dashed border-maroon-700/15 text-[11px] font-mono text-maroon-800/75 space-y-0.5">
                      {(summary.taxShare || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>Pajak (PB1)</span>
                          <span>{formatRupiah(summary.taxShare)}</span>
                        </div>
                      )}
                      {(summary.serviceShare || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>Service Charge</span>
                          <span>{formatRupiah(summary.serviceShare)}</span>
                        </div>
                      )}
                      {(summary.discountShare || 0) > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Diskon</span>
                          <span>-{formatRupiah(summary.discountShare)}</span>
                        </div>
                      )}
                      {(summary.roundingShare || 0) !== 0 && (
                        <div className="flex justify-between">
                          <span>Pembulatan</span>
                          <span>{summary.roundingShare > 0 ? '+' : ''}{formatRupiah(summary.roundingShare)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Mark Paid Toggle Button (for non-payer) */}
                {!isPayer && (
                  <div className="pt-2 border-t border-maroon-700/10 flex items-center justify-end">
                    <button
                      type="button"
                      disabled={markingPaid[personName]}
                      onClick={() => handleTogglePaid(personName)}
                      className={`text-xs font-mono font-semibold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-white text-maroon-800 border-maroon-700/30 hover:bg-maroon-50'
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isPaid ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{isPaid ? 'Tandai Belum Lunas' : 'Tandai Sudah Bayar'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Rekening Tujuan Transfer Card */}
        {payment_info && (payment_info.number || payment_info.bank) && (
          <div className="bg-[#FAF4EB] rounded-2xl border-2 border-maroon-700/30 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-maroon-700" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-maroon-900 m-0">
                TUJUAN TRANSFER (TALANGAN)
              </h3>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-maroon-700/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-maroon-800">
                  {payment_info.bank || 'Bank'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyAccount(payment_info.number)}
                  className="flex items-center gap-1 px-2 py-1 bg-maroon-100/70 hover:bg-maroon-100 rounded-lg text-xs font-mono font-semibold text-maroon-800 transition"
                >
                  {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBank ? 'Tersalin!' : 'Salin Nomor'}</span>
                </button>
              </div>

              <div className="font-mono text-lg font-bold tracking-wider text-maroon-950">
                {payment_info.number || '-'}
              </div>

              {payment_info.name && (
                <div className="text-xs font-mono text-maroon-800/80">
                  a.n. <strong className="text-maroon-950">{payment_info.name}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Credit */}
        <div className="pt-2 pb-6 text-center text-xs font-mono text-maroon-800/60">
          <p>
            Talangin Dulu ·{' '}
            <a
              href="https://www.tiktok.com/@ccenot"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-maroon-900 font-semibold"
            >
              Created by @ccenot
            </a>
          </p>
        </div>
      </main>

      {/* Floating Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-[#FAF4EB]/95 backdrop-blur border-t-2 border-maroon-700/30 p-3">
        <div className="max-w-md mx-auto flex items-center gap-2">
          {payment_info.number ? (
            <button
              onClick={() => handleCopyAccount(payment_info.number)}
              className="flex-1 py-3 px-4 bg-maroon-700 hover:bg-maroon-800 text-[#FAF4EB] rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition"
            >
              <Copy className="w-4 h-4" />
              <span>{copiedBank ? 'NOMOR TERSALIN!' : 'SALIN REKENING / E-WALLET'}</span>
            </button>
          ) : (
            <button
              onClick={handleCopyShareLink}
              className="flex-1 py-3 px-4 bg-maroon-700 hover:bg-maroon-800 text-[#FAF4EB] rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedLink ? 'LINK TERSALIN!' : 'BAGIKAN LINK TAGIHAN'}</span>
            </button>
          )}

          <button
            onClick={handleCopyShareLink}
            className="w-12 h-12 flex items-center justify-center bg-white border border-maroon-700/30 text-maroon-800 rounded-xl hover:bg-maroon-50 transition shadow-sm"
            title="Salin Link"
          >
            {copiedLink ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>
      </footer>

      {/* Lightbox Modal for Receipt Photo */}
      {lightboxOpen && image_url && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="flex justify-between items-center text-white pb-3">
            <span className="font-mono text-xs font-semibold">Foto Struk Asli</span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-auto">
            <img
              src={image_url}
              alt="Nota Full"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
