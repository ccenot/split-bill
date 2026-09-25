import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  Search, 
  ArrowLeft, 
  Receipt, 
  Database, 
  Image as ImageIcon, 
  Coins, 
  Maximize2, 
  X, 
  Lock, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

function formatRupiah(num) {
  const rounded = Math.round(Number(num) || 0);
  return 'Rp ' + rounded.toLocaleString('id-ID');
}

export default function AdminDashboard({ onBack, isDarkMode }) {
  const [pin, setPin] = useState(() => sessionStorage.getItem('splitbill_admin_pin') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState({ totalBills: 0, totalWithImages: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Auto-verify if PIN already in sessionStorage
  useEffect(() => {
    if (pin) {
      verifyPin(pin);
    }
  }, []);

  const verifyPin = async (inputPin) => {
    setPinError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: inputPin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setPin(inputPin);
        sessionStorage.setItem('splitbill_admin_pin', inputPin);
        loadBills(inputPin);
      } else {
        setPinError(data.error || 'PIN Admin tidak valid.');
      }
    } catch (err) {
      console.error(err);
      setPinError('Gagal menghubungi server backend.');
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    verifyPin(pinInput.trim());
  };

  const loadBills = async (activePin = pin) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bills', {
        headers: { 'x-admin-pin': activePin }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBills(data.bills || []);
        setStats(data.stats || { totalBills: 0, totalWithImages: 0, totalAmount: 0 });
      } else {
        if (res.status === 401) {
          setIsAuthenticated(false);
          sessionStorage.removeItem('splitbill_admin_pin');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    const confirmDelete = window.confirm(`Yakin ingin MENGHAPUS bill "${title || id}"?\n\nSemua data tagihan dan foto nota struk akan dihapus permanen dari Supabase Database dan Storage.`);
    if (!confirmDelete) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/bills/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': pin }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBills(prev => prev.filter(b => b.id !== id));
        setStats(prev => ({
          ...prev,
          totalBills: Math.max(0, prev.totalBills - 1)
        }));
      } else {
        alert('Gagal menghapus: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error koneksi: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter bills based on search query
  const filteredBills = bills.filter(b => {
    const q = searchQuery.toLowerCase();
    const titleMatch = (b.title || '').toLowerCase().includes(q);
    const idMatch = (b.id || '').toLowerCase().includes(q);
    const payerMatch = (b.payer || '').toLowerCase().includes(q);
    const peopleMatch = Array.isArray(b.people) && b.people.some(p => p.toLowerCase().includes(q));
    return titleMatch || idMatch || payerMatch || peopleMatch;
  });

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#EDE4D8] dark:bg-[#121110] flex items-center justify-center p-4 font-sans text-slate-800 dark:text-slate-100">
        <div className="w-full max-w-sm bg-[#FAF4EB] dark:bg-[#1E1B18] p-6 rounded-2xl border-2 border-maroon-700/50 dark:border-amber-900/60 shadow-xl space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-maroon-100 dark:bg-amber-950/60 text-maroon-700 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-maroon-900 dark:text-amber-300">
              PANEL ADMIN SPLIT BILL
            </h1>
            <p className="text-xs text-maroon-800/70 dark:text-slate-400 font-mono">
              Masukkan PIN Admin untuk memantau database & foto struk
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan 6 Digit PIN Admin"
                autoFocus
                className="w-full px-3 py-2 text-center text-lg tracking-widest font-mono rounded-xl border border-maroon-700/30 dark:border-neutral-700 bg-white dark:bg-[#141210] focus:outline-none focus:ring-2 focus:ring-maroon-700 dark:focus:ring-amber-500"
              />
              {pinError && (
                <p className="text-xs text-red-600 dark:text-red-400 font-mono text-center mt-1.5 font-semibold">
                  {pinError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-maroon-700 hover:bg-maroon-800 text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition shadow-sm"
            >
              Masuk Dashboard
            </button>
          </form>

          <div className="pt-2 text-center border-t border-maroon-700/15 dark:border-neutral-800">
            <button
              onClick={onBack}
              className="text-xs font-mono text-maroon-800/70 dark:text-slate-400 hover:text-maroon-900 dark:hover:text-slate-200"
            >
              ← Kembali ke Aplikasi Utama
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDE4D8] dark:bg-[#121110] text-slate-800 dark:text-slate-100 font-sans pb-16 transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 bg-[#FAF4EB]/95 dark:bg-[#1E1B18]/95 backdrop-blur border-b border-maroon-700/20 dark:border-neutral-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1 rounded-lg text-maroon-800 dark:text-slate-300 hover:bg-maroon-100/60 dark:hover:bg-neutral-800"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h1 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-maroon-900 dark:text-amber-300">
                  DASHBOARD ADMIN · MONITORING DATABASE
                </h1>
              </div>
              <p className="text-[10px] font-mono text-maroon-800/60 dark:text-slate-400">
                Pantau unggahan struk publik & bersihkan data spam
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadBills()}
              disabled={loading}
              className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-maroon-700/20 dark:border-neutral-700 text-maroon-800 dark:text-slate-200 hover:bg-maroon-50 dark:hover:bg-neutral-700 text-xs font-mono flex items-center gap-1 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem('splitbill_admin_pin');
                setIsAuthenticated(false);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-mono font-semibold hover:bg-red-200 transition"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-5 space-y-5">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#FAF4EB] dark:bg-[#1E1B18] p-4 rounded-xl border border-maroon-700/20 dark:border-neutral-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-maroon-100 dark:bg-amber-950/60 text-maroon-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-maroon-800/60 dark:text-slate-400 block font-semibold">
                Total Tagihan Dibuat
              </span>
              <span className="font-mono text-xl font-bold text-maroon-900 dark:text-slate-100">
                {stats.totalBills} Bills
              </span>
            </div>
          </div>

          <div className="bg-[#FAF4EB] dark:bg-[#1E1B18] p-4 rounded-xl border border-maroon-700/20 dark:border-neutral-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-maroon-800/60 dark:text-slate-400 block font-semibold">
                Foto Struk di Storage
              </span>
              <span className="font-mono text-xl font-bold text-emerald-800 dark:text-emerald-300">
                {stats.totalWithImages} Foto
              </span>
            </div>
          </div>

          <div className="bg-[#FAF4EB] dark:bg-[#1E1B18] p-4 rounded-xl border border-maroon-700/20 dark:border-neutral-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-maroon-800/60 dark:text-slate-400 block font-semibold">
                Total Nilai Gabungan
              </span>
              <span className="font-mono text-xl font-bold text-amber-900 dark:text-amber-300">
                {formatRupiah(stats.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-[#FAF4EB] dark:bg-[#1E1B18] p-2.5 rounded-xl border border-maroon-700/20 dark:border-neutral-800 flex items-center gap-2">
          <Search className="w-4 h-4 text-maroon-700/60 dark:text-slate-400 ml-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama resto, ID bill, pemesan, atau nama peserta..."
            className="flex-1 bg-transparent border-none text-xs font-mono focus:outline-none dark:text-slate-100 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-mono text-maroon-700 dark:text-slate-400 px-2"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Bills List / Table */}
        <div className="bg-[#FAF4EB] dark:bg-[#1E1B18] rounded-2xl border border-maroon-700/30 dark:border-neutral-800 overflow-hidden shadow-sm">
          <div className="p-3 bg-maroon-100/50 dark:bg-neutral-800/50 border-b border-maroon-700/15 dark:border-neutral-700 flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-maroon-900 dark:text-slate-200">
              DAFTAR TAGIHAN DI DATABASE ({filteredBills.length})
            </span>
            <span className="text-[11px] text-maroon-800/60 dark:text-slate-400">
              Diurutkan dari yang terbaru
            </span>
          </div>

          {filteredBills.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-maroon-800/60 dark:text-slate-400 space-y-1">
              <Receipt className="w-8 h-8 mx-auto text-maroon-700/40 dark:text-neutral-600 mb-2" />
              <p>Tidak ada data tagihan ditemukan.</p>
              {searchQuery && <p className="text-[11px]">Coba cari dengan kata kunci lain.</p>}
            </div>
          ) : (
            <div className="divide-y divide-maroon-700/10 dark:divide-neutral-800">
              {filteredBills.map((bill) => {
                const dateStr = bill.created_at
                  ? new Date(bill.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : '-';

                const peopleList = Array.isArray(bill.people) ? bill.people.join(', ') : '';

                return (
                  <div
                    key={bill.id}
                    className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-maroon-50/40 dark:hover:bg-neutral-800/40 transition"
                  >
                    {/* Left: Thumbnail & Main Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Photo Thumbnail */}
                      {bill.image_url ? (
                        <div
                          onClick={() => setLightboxImage(bill.image_url)}
                          className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden cursor-pointer flex-shrink-0 relative group border border-maroon-700/30"
                          title="Klik untuk melihat foto struk asli"
                        >
                          <img
                            src={bill.image_url}
                            alt="Struk"
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-maroon-100/50 dark:bg-neutral-800 border border-dashed border-maroon-700/30 flex flex-col items-center justify-center text-maroon-700/60 dark:text-neutral-500 flex-shrink-0">
                          <Receipt className="w-5 h-5 mb-0.5" />
                          <span className="text-[9px] font-mono">No Foto</span>
                        </div>
                      )}

                      {/* Detail Info */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-maroon-950 dark:text-slate-100">
                            {bill.title || 'Split Bill'}
                          </span>
                          <a
                            href={`/b/${bill.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-maroon-100 dark:bg-neutral-800 text-maroon-800 dark:text-amber-400 text-[10px] font-mono hover:underline font-bold"
                          >
                            <span>#{bill.id}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>

                        <div className="text-xs font-mono text-maroon-800/75 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                          <span>📅 {dateStr}</span>
                          <span>👤 Talangan: <strong className="text-maroon-900 dark:text-slate-200">{bill.payer || 'Gue'}</strong></span>
                        </div>

                        {peopleList && (
                          <div className="text-[11px] font-mono text-maroon-800/60 dark:text-slate-500 truncate max-w-md">
                            Peserta ({bill.people.length}): {peopleList}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Nominal & Action Buttons */}
                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-maroon-700/10 dark:border-neutral-800">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] font-mono uppercase text-maroon-800/60 dark:text-slate-400 block">
                          Total Tagihan
                        </span>
                        <span className="font-mono text-base font-bold text-maroon-800 dark:text-amber-400">
                          {formatRupiah(bill.total_amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`/b/${bill.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-maroon-700/20 dark:border-neutral-700 text-maroon-800 dark:text-slate-200 hover:bg-maroon-50 text-xs font-mono flex items-center gap-1"
                          title="Buka Halaman Struk"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="hidden sm:inline">Buka</span>
                        </a>

                        <button
                          type="button"
                          disabled={deletingId === bill.id}
                          onClick={() => handleDelete(bill.id, bill.title)}
                          className="p-2 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 transition text-xs font-mono flex items-center gap-1 disabled:opacity-50"
                          title="Hapus bill & foto nota"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {deletingId === bill.id ? 'Menghapus...' : 'Hapus'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox Modal for Receipt Photo Preview */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="flex justify-between items-center text-white pb-3 max-w-4xl mx-auto w-full">
            <span className="font-mono text-xs font-semibold">Foto Nota Asli Pengguna</span>
            <button
              onClick={() => setLightboxImage(null)}
              className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-auto max-w-4xl mx-auto w-full">
            <img
              src={lightboxImage}
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
