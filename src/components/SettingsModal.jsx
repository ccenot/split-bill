import React, { useState } from 'react';
import { X, Save, Key, CreditCard, ShieldCheck } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, settings, onSaveSettings }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({ ...settings });
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-[#FAF4EB] border-2 border-maroon-700 rounded-2xl max-w-md w-full p-5 shadow-xl text-ink relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-dashed border-maroon-700/40 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label="gear">⚙️</span>
            <h2 className="font-brand text-xl font-bold text-maroon-800 m-0">
              Pengaturan Aplikasi
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full text-maroon-700 hover:bg-maroon-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: AI Vision API Key */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-xs font-mono font-bold text-maroon-900 uppercase">
              <Key className="w-3.5 h-3.5 text-maroon-700" />
              <span>Kunci API Google Gemini (Opsional)</span>
            </div>
            <p className="text-[11px] text-maroon-800/70 mb-3 leading-relaxed">
              Jika menggunakan mode <span className="font-semibold">Gemini AI</span>, masukkan API Key Google Gemini Anda di bawah ini. Kunci disimpan aman hanya di browser lokal perangkat Anda (LocalStorage).
            </p>

            {/* Gemini */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-semibold text-maroon-800 flex justify-between">
                <span>Google Gemini API Key:</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-maroon-700 underline text-[10px]"
                >
                  Dapatkan Gratis ↗
                </a>
              </label>
              <input
                type="password"
                value={formData.geminiKey || ''}
                onChange={(e) => setFormData({ ...formData, geminiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-maroon-700/30 bg-white focus:outline-none focus:ring-1 focus:ring-maroon-700"
              />
            </div>
          </div>

          {/* Section 2: Info Rekening Transfer */}
          <div className="pt-3 border-t border-dashed border-maroon-700/30">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-mono font-bold text-maroon-900 uppercase">
              <CreditCard className="w-3.5 h-3.5 text-maroon-700" />
              <span>Info Rekening / E-Wallet (Tujuan Transfer)</span>
            </div>
            <p className="text-[11px] text-maroon-800/70 mb-3 leading-relaxed">
              Info ini otomatis dilampirkan pada teks format WhatsApp saat Anda menyalin hasil split bill.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-[11px] font-mono font-semibold text-maroon-800 block mb-1">
                  Bank / E-Wallet:
                </label>
                <input
                  type="text"
                  value={formData.paymentBank || ''}
                  onChange={(e) => setFormData({ ...formData, paymentBank: e.target.value })}
                  placeholder="BCA / Mandiri / GoPay / Dana"
                  className="w-full px-2.5 py-1.5 text-xs font-sans rounded border border-maroon-700/30 bg-white focus:outline-none focus:ring-1 focus:ring-maroon-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-semibold text-maroon-800 block mb-1">
                  No. Rek / No. HP:
                </label>
                <input
                  type="text"
                  value={formData.paymentNumber || ''}
                  onChange={(e) => setFormData({ ...formData, paymentNumber: e.target.value })}
                  placeholder="Contoh: 1234567890"
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-maroon-700/30 bg-white focus:outline-none focus:ring-1 focus:ring-maroon-700"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono font-semibold text-maroon-800 block mb-1">
                Atas Nama (A/N):
              </label>
              <input
                type="text"
                value={formData.paymentName || ''}
                onChange={(e) => setFormData({ ...formData, paymentName: e.target.value })}
                placeholder="Nama Pemilik Rekening"
                className="w-full px-2.5 py-1.5 text-xs font-sans rounded border border-maroon-700/30 bg-white focus:outline-none focus:ring-1 focus:ring-maroon-700"
              />
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-2.5 bg-paper-100 rounded-lg flex items-center gap-2 text-[11px] text-maroon-900/80 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>Semua data disimpan di perangkat Anda sendiri (Local-first).</span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-mono font-semibold text-maroon-800 rounded border border-maroon-700/30 hover:bg-maroon-50"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-mono font-bold bg-maroon-700 text-[#FAF4EB] rounded hover:bg-maroon-800 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedNotice ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
