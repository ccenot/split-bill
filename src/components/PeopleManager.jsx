import React, { useState } from 'react';
import { UserPlus, X, Users } from 'lucide-react';

export default function PeopleManager({ people, setPeople, transactions, setTransactions }) {
  const [nameInput, setNameInput] = useState('');

  const handleAddPerson = (e) => {
    e?.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    if (people.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Nama "${trimmed}" sudah ada di daftar.`);
      return;
    }

    const nextPeople = [...people, trimmed];
    setPeople(nextPeople);
    setNameInput('');

    // Update transaksi pertama yang belum punya payer jika ada
    setTransactions(prev => {
      return prev.map((tx, idx) => {
        if (!tx.payer && idx === 0) {
          return { ...tx, payer: trimmed };
        }
        return tx;
      });
    });
  };

  const handleRemovePerson = (personToRemove) => {
    const nextPeople = people.filter(p => p !== personToRemove);
    setPeople(nextPeople);

    // Hapus person ini dari assignedTo di semua transaksi dan reset payer jika sesuai
    setTransactions(prev => {
      return prev.map(tx => {
        const nextItems = (tx.items || []).map(item => {
          return {
            ...item,
            assignedTo: (item.assignedTo || []).filter(p => p !== personToRemove)
          };
        });
        const nextPayer = tx.payer === personToRemove ? (nextPeople[0] || '') : tx.payer;
        return {
          ...tx,
          payer: nextPayer,
          items: nextItems
        };
      });
    });
  };

  const handleQuickAdd = () => {
    const defaults = ['Aku', 'Teman 1', 'Teman 2'];
    const newOnes = defaults.filter(d => !people.includes(d));
    if (newOnes.length > 0) {
      setPeople([...people, ...newOnes]);
    }
  };

  return (
    <section className="px-4 py-2">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-maroon-700 text-[#FAF4EB] text-xs font-mono font-bold flex items-center justify-center">
            2
          </span>
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-maroon-800 m-0">
            DAFTAR TEMAN / ORANG ({people.length})
          </h2>
        </div>

        {people.length === 0 && (
          <button
            type="button"
            onClick={handleQuickAdd}
            className="text-[11px] font-mono text-maroon-700 underline hover:text-maroon-900"
          >
            + Tambah Contoh
          </button>
        )}
      </div>

      {/* Input Tambah Orang */}
      <form onSubmit={handleAddPerson} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Ketik nama teman (misal: Budi, Citra, Andi)..."
            className="w-full pl-3 pr-8 py-1.5 text-xs font-sans rounded-lg border border-maroon-700/30 bg-white text-ink placeholder:text-maroon-800/40 focus:outline-none focus:ring-1 focus:ring-maroon-700"
          />
        </div>
        <button
          type="submit"
          className="px-3 py-1.5 bg-maroon-700 text-[#FAF4EB] text-xs font-mono font-semibold rounded-lg hover:bg-maroon-800 active:scale-95 transition-all flex items-center gap-1"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Tambah</span>
        </button>
      </form>

      {/* List Chips Orang */}
      <div className="flex flex-wrap gap-1.5">
        {people.map((person) => (
          <div
            key={person}
            className="px-2.5 py-1 bg-white border border-maroon-700/30 rounded-full flex items-center gap-1.5 shadow-2xs group"
          >
            <span className="font-mono text-xs font-medium text-maroon-900">
              {person}
            </span>
            <button
              type="button"
              onClick={() => handleRemovePerson(person)}
              className="text-maroon-700/60 hover:text-red-600 transition-colors"
              title={`Hapus ${person}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {people.length === 0 && (
          <p className="text-xs text-maroon-800/60 italic font-mono py-1">
            Belum ada nama teman. Masukkan nama yang ikut patungan di atas.
          </p>
        )}
      </div>
    </section>
  );
}
