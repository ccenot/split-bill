import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://tmfvbkqdptkceolxzkvh.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_Ha0m-b9Z8R63p868KvBKIg_v40CEdZi';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload receipt image blob/file to Supabase Storage bucket 'receipts'
 */
export async function uploadReceiptImage(fileOrBlob, filename) {
  try {
    const ext = (fileOrBlob.type && fileOrBlob.type.includes('png')) ? 'png' : 'jpg';
    const cleanName = filename || `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(cleanName, fileOrBlob, {
        contentType: fileOrBlob.type || 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('Error uploading receipt image:', error);
      return null;
    }

    const { data: pubData } = supabase.storage
      .from('receipts')
      .getPublicUrl(cleanName);

    return pubData?.publicUrl || null;
  } catch (err) {
    console.error('uploadReceiptImage exception:', err);
    return null;
  }
}

/**
 * Generate a short alphanumeric ID
 */
export function generateShortId(length = 6) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Save split bill data to Supabase
 */
export async function saveBillToCloud({
  title,
  imageUrl,
  totalAmount,
  payer,
  people,
  transactions,
  settlement,
  paymentInfo
}) {
  const billId = generateShortId(6);

  const payload = {
    id: billId,
    title: title || 'Split Bill',
    image_url: imageUrl || null,
    total_amount: totalAmount || 0,
    payer: payer || 'Gue',
    people: people || [],
    transactions: transactions || [],
    settlement: settlement || {},
    payment_info: paymentInfo || {},
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('bills')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error saving bill:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch bill by ID from Supabase
 */
export async function fetchBillFromCloud(id) {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching bill:', error);
    return null;
  }

  return data;
}

/**
 * Update payment status for a person in a bill
 */
export async function updateBillPaymentStatus(billId, updatedSettlement) {
  const { data, error } = await supabase
    .from('bills')
    .update({ settlement: updatedSettlement, updated_at: new Date().toISOString() })
    .eq('id', billId)
    .select()
    .single();

  if (error) {
    console.error('Error updating bill payment status:', error);
    throw error;
  }

  return data;
}
