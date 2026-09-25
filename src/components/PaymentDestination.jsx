import React from 'react';
import { CreditCard, Building2, User, Hash } from 'lucide-react';

const popularMethods = ['BCA', 'Mandiri', 'BRI', 'BNI', 'SeaBank', 'Bank Jago', 'GoPay', 'DANA', 'OVO'];

export default function PaymentDestination({ settings, onUpdateSettings }) {
  const handleChange = (field, value) => {
    onUpdateSettings({
      ...settings,
      [field]: value
    });
  };

  return (
    <section className="px-4 py-2">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-maroon-700 text-[#FAF4EB] text-xs font-mono font-bold flex items-center justify-center">
            4
          </span>
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-maroon-800 m-0">
            INFO REKENING / E-WALLET (TUJUAN TRANSFER)
          </h2>
        </div>
      </div>

      <div className="border border-dashed border-maroon-700/40 rounded-xl bg-paper-50 p-3 sm:p-4 shadow-xs">
        <p className="text-[11px] text-maroon-800/80 mb-3 leading-relaxed">
          Tujuan pembayaran ini otomatis dilampirkan ke rincian transfer dan format teks WhatsApp agar teman langsung bisa salin nomor rekening.
        </p>

        {/* Quick select pills */}
        <div className="mb-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-maroon-800/70 block mb-1.5 font-semibold">
            Pilih Cepat Bank / E-Wallet:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {popularMethods.map((method) => {
              const isActive = (settings.paymentBank || '').toUpperCase() === method.toUpperCase();
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => handleChange('paymentBank', method)}
                  className={`px-2 py-0.5 text-xs font-mono rounded-md border transition-colors ${
                    isActive
                      ? 'bg-maroon-700 text-[#FAF4EB] border-maroon-800 font-bold shadow-xs'
                      : 'bg-white/80 text-maroon-800 border-maroon-700/30 hover:bg-maroon-100/50'
                  }`}
                >
                  {method}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Bank / E-Wallet input */}
          <div>
            <label className="text-[11px] font-mono font-semibold text-maroon-800 flex items-center gap-1 mb-1">
              <Building2 className="w-3 h-3 text-maroon-700" />
              <span>Nama Bank / E-Wallet:</span>
            </label>
            <input
              type="text"
              value={settings.paymentBank || ''}
              onChange={(e) => handleChange('paymentBank', e.target.value)}
              placeholder="Contoh: BCA / GoPay"
              className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-maroon-700/30 bg-white text-ink focus:outline-none focus:ring-1 focus:ring-maroon-700"
            />
          </div>

          {/* Account Number input */}
          <div>
            <label className="text-[11px] font-mono font-semibold text-maroon-800 flex items-center gap-1 mb-1">
              <Hash className="w-3 h-3 text-maroon-700" />
              <span>No. Rek / No. HP:</span>
            </label>
            <input
              type="text"
              value={settings.paymentNumber || ''}
              onChange={(e) => handleChange('paymentNumber', e.target.value)}
              placeholder="Contoh: 1234567890"
              className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-maroon-700/30 bg-white text-ink focus:outline-none focus:ring-1 focus:ring-maroon-700 font-semibold"
            />
          </div>

          {/* Account Holder Name input */}
          <div>
            <label className="text-[11px] font-mono font-semibold text-maroon-800 flex items-center gap-1 mb-1">
              <User className="w-3 h-3 text-maroon-700" />
              <span>Atas Nama (a.n):</span>
            </label>
            <input
              type="text"
              value={settings.paymentName || ''}
              onChange={(e) => handleChange('paymentName', e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-maroon-700/30 bg-white text-ink focus:outline-none focus:ring-1 focus:ring-maroon-700"
            />
          </div>
        </div>

        {/* Live preview chip */}
        {(settings.paymentBank || settings.paymentNumber || settings.paymentName) && (
          <div className="mt-3 pt-2.5 border-t border-dashed border-maroon-700/20 flex items-center gap-2 text-xs font-mono text-maroon-900 bg-white/60 p-2 rounded-lg">
            <CreditCard className="w-3.5 h-3.5 text-maroon-700 flex-shrink-0" />
            <span className="text-[11px] truncate">
              Pratinjau: <span className="font-bold">{settings.paymentBank || 'Bank'}</span> ·{' '}
              <span className="font-mono font-bold text-maroon-800">{settings.paymentNumber || '-'}</span>
              {settings.paymentName ? ` (a.n ${settings.paymentName})` : ''}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
