// src/utils/calculator.js

export function formatRupiah(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  const rounded = Math.round(amount);
  return 'Rp ' + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseRupiahInput(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const cleaned = str.toString().replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Hitung rincian per transaksi dan kalkulasi konsolidasi multi-transaksi
 * @param {Array} transactions 
 * @param {Array} people 
 * @returns {Object} { transactionsBreakdown, peopleSummary, settlements, grandTotal }
 */
export function calculateSettlement(transactions, people) {
  const peopleSummary = {};
  people.forEach(p => {
    peopleSummary[p] = {
      name: p,
      itemsSubtotal: 0,
      taxShare: 0,
      serviceShare: 0,
      discountShare: 0,
      totalOwed: 0,
      totalPaid: 0,
      netBalance: 0, // positif = terima uang, negatif = harus bayar
      itemDetails: []
    };
  });

  let grandTotalAllTransactions = 0;

  const transactionsBreakdown = transactions.map(tx => {
    const rawSubtotal = (tx.items || []).reduce((sum, item) => {
      const itemTotal = (Number(item.qty) || 1) * (Number(item.price) || 0);
      return sum + itemTotal;
    }, 0);

    // Hitung Pajak
    let taxAmount = 0;
    if (tx.taxType === 'percent') {
      taxAmount = (rawSubtotal * (Number(tx.taxValue) || 0)) / 100;
    } else {
      taxAmount = Number(tx.taxValue) || 0;
    }

    // Hitung Service Charge
    let serviceAmount = 0;
    if (tx.serviceType === 'percent') {
      serviceAmount = (rawSubtotal * (Number(tx.serviceValue) || 0)) / 100;
    } else {
      serviceAmount = Number(tx.serviceValue) || 0;
    }

    // Hitung Diskon
    let discountAmount = 0;
    if (tx.discountType === 'percent') {
      discountAmount = (rawSubtotal * (Number(tx.discountValue) || 0)) / 100;
    } else {
      discountAmount = Number(tx.discountValue) || 0;
    }

    const txGrandTotal = Math.max(0, rawSubtotal + taxAmount + serviceAmount - discountAmount);
    grandTotalAllTransactions += txGrandTotal;

    // Catat siapa yang bayar transaksi ini
    if (tx.payer && peopleSummary[tx.payer]) {
      peopleSummary[tx.payer].totalPaid += txGrandTotal;
    }

    // Hitung konsumsi per orang di transaksi ini
    const txPersonSubtotals = {};
    people.forEach(p => { txPersonSubtotals[p] = 0; });

    (tx.items || []).forEach(item => {
      const itemTotal = (Number(item.qty) || 1) * (Number(item.price) || 0);
      const assigned = (item.assignedTo && item.assignedTo.length > 0)
        ? item.assignedTo.filter(p => people.includes(p))
        : [];

      if (assigned.length > 0) {
        const sharePerPerson = itemTotal / assigned.length;
        assigned.forEach(p => {
          txPersonSubtotals[p] += sharePerPerson;
          if (peopleSummary[p]) {
            peopleSummary[p].itemsSubtotal += sharePerPerson;
            peopleSummary[p].itemDetails.push({
              txName: tx.name || 'Transaksi',
              itemName: item.name,
              qty: item.qty,
              share: sharePerPerson,
              splitCount: assigned.length
            });
          }
        });
      }
    });

    // Hitung partisipan yang punya konsumsi di transaksi ini
    const activeParticipants = people.filter(p => txPersonSubtotals[p] > 0);
    const sumActiveSubtotals = activeParticipants.reduce((sum, p) => sum + txPersonSubtotals[p], 0);

    // Distribusi Pajak, Service & Diskon
    people.forEach(p => {
      const personSub = txPersonSubtotals[p];
      if (personSub <= 0) return;

      let pTax = 0;
      let pService = 0;
      let pDiscount = 0;

      if (tx.distributionMethod === 'flat') {
        // Bagi rata antar orang yang aktif di struk
        const count = activeParticipants.length || 1;
        pTax = taxAmount / count;
        pService = serviceAmount / count;
        pDiscount = discountAmount / count;
      } else {
        // Proporsional sesuai porsi belanja
        const ratio = sumActiveSubtotals > 0 ? (personSub / sumActiveSubtotals) : 0;
        pTax = taxAmount * ratio;
        pService = serviceAmount * ratio;
        pDiscount = discountAmount * ratio;
      }

      const pTotalOwed = Math.max(0, personSub + pTax + pService - pDiscount);

      if (peopleSummary[p]) {
        peopleSummary[p].taxShare += pTax;
        peopleSummary[p].serviceShare += pService;
        peopleSummary[p].discountShare += pDiscount;
        peopleSummary[p].totalOwed += pTotalOwed;
      }
    });

    return {
      id: tx.id,
      name: tx.name,
      payer: tx.payer,
      rawSubtotal,
      taxAmount,
      serviceAmount,
      discountAmount,
      grandTotal: txGrandTotal,
      personSubtotals: txPersonSubtotals
    };
  });

  // Hitung net balance
  people.forEach(p => {
    const summary = peopleSummary[p];
    summary.netBalance = summary.totalPaid - summary.totalOwed;
  });

  // Algoritma Penyederhanaan Utang (Debt Simplification)
  const debtors = []; // yang harus bayar (balance < -1)
  const creditors = []; // yang berhak terima (balance > 1)

  people.forEach(p => {
    const net = Math.round(peopleSummary[p].netBalance);
    if (net < -1) {
      debtors.push({ name: p, amount: -net });
    } else if (net > 1) {
      creditors.push({ name: p, amount: net });
    }
  });

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let dIndex = 0;
  let cIndex = 0;

  while (dIndex < debtors.length && cIndex < creditors.length) {
    const debtor = debtors[dIndex];
    const creditor = creditors[cIndex];

    const settledAmount = Math.min(debtor.amount, creditor.amount);
    if (settledAmount > 0) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: settledAmount
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount <= 1) dIndex++;
    if (creditor.amount <= 1) cIndex++;
  }

  return {
    transactionsBreakdown,
    peopleSummary: Object.values(peopleSummary),
    settlements,
    grandTotalAllTransactions
  };
}

/**
 * Format pesan teks WhatsApp yang rapi
 */
export function formatWhatsAppMessage({
  transactions,
  peopleSummary,
  settlements,
  grandTotal,
  paymentInfo
}) {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  let text = `🧾 *RINGKASAN SPLIT BILL*\n`;
  text += `📅 ${dateStr}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Rincian per transaksi
  text += `📍 *DAFTAR TRANSAKSI:*\n`;
  transactions.forEach((tx, idx) => {
    text += `${idx + 1}. *${tx.name || 'Transaksi ' + (idx + 1)}* : ${formatRupiah(tx.grandTotal || 0)}\n`;
    if (tx.payer) {
      text += `   ↳ Ditalangi oleh: *${tx.payer}*\n`;
    }
  });
  text += `\n*TOTAL SEMUA: ${formatRupiah(grandTotal)}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Rincian per orang
  text += `👥 *TAGIHAN PER ORANG:*\n`;
  peopleSummary.forEach(p => {
    text += `\n*• ${p.name}* : *${formatRupiah(p.totalOwed)}*\n`;
    if (p.itemDetails && p.itemDetails.length > 0) {
      p.itemDetails.forEach(item => {
        const splitText = item.splitCount > 1 ? ` (bagi ${item.splitCount})` : '';
        text += `   - ${item.itemName} x${item.qty || 1}${splitText}: ${formatRupiah(item.share)}\n`;
      });
    }
    const taxAndService = (p.taxShare || 0) + (p.serviceShare || 0) - (p.discountShare || 0);
    if (taxAndService !== 0) {
      text += `   - Pajak & Service net: ${formatRupiah(taxAndService)}\n`;
    }
    if (p.totalPaid > 0) {
      text += `   ↳ Sudah bayar/talangi: ${formatRupiah(p.totalPaid)}\n`;
    }
  });

  text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💸 *PETUNJUK TRANSFER:*\n`;
  if (settlements.length === 0) {
    text += `Semua impas! Tidak ada transfer yang diperlukan. 👍\n`;
  } else {
    settlements.forEach(s => {
      text += `👉 *${s.from}* transfer ke *${s.to}* : *${formatRupiah(s.amount)}*\n`;
    });
  }

  // Info rekening jika diisi
  if (paymentInfo && (paymentInfo.bank || paymentInfo.accountNumber)) {
    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💳 *REKENING / PEMBAYARAN:*\n`;
    if (paymentInfo.bank) text += `Bank / E-Wallet: *${paymentInfo.bank}*\n`;
    if (paymentInfo.accountNumber) text += `No. Rekening / HP: \`${paymentInfo.accountNumber}\`\n`;
    if (paymentInfo.accountName) text += `A/N: *${paymentInfo.accountName}*\n`;
  }

  text += `\n_Dihitung via Talangin Dulu (splitbill.notnot.store)_`;

  return text;
}
