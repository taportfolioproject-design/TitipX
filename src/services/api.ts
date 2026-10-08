import { getBranding } from '../config/branding';
import { MenuItem, OrderRecord, CustomerRecord } from '../types';
import { INITIAL_MENU, INITIAL_ORDERS, INITIAL_CUSTOMERS } from '../data/initialData';

const STORAGE_MENU = 'titipx_menu_cache';
const STORAGE_ORDERS = 'titipx_orders_cache';
const STORAGE_CUSTOMERS = 'titipx_customers_cache';

// Helper for local caching
function getLocalCache<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalCache<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Robust Price & Numeric Parser:
 * Handles:
 * - 285000 (number)
 * - "285000"
 * - "Rp 285.000" (Indonesian thousand separator)
 * - "285.000" -> 285000 (NOT 285!)
 * - "1.485.000" -> 1485000
 * - "285,000" (comma thousand separator)
 * - "285.000,00" -> 285000
 * - "Rp 3.850.000" -> 3850000
 */
export function parsePrice(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
  const raw = String(val).trim();
  if (!raw) return 0;

  // Clean currency prefixes (Rp, IDR, $, etc.) and spaces
  const clean = raw.replace(/[^0-9.,]/g, '');
  if (!clean) return 0;

  // Indonesian format with dots as thousand separators: e.g. "285.000" or "1.485.000"
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(clean)) {
    const numStr = clean.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(numStr);
    return isNaN(n) ? 0 : Math.round(n);
  }

  // Western format with commas as thousand separators: e.g. "285,000" or "1,485,000"
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(clean)) {
    const numStr = clean.replace(/,/g, '');
    const n = parseFloat(numStr);
    return isNaN(n) ? 0 : Math.round(n);
  }

  // Pure integer string with no dots/commas: e.g. "285000"
  if (/^\d+$/.test(clean)) {
    const n = parseInt(clean, 10);
    return isNaN(n) ? 0 : n;
  }

  // Single dot or comma: determine if it's decimal or 3-digit thousand
  // e.g. "285.000" (dot followed by 3 digits)
  if (/^\d+\.\d{3}$/.test(clean)) {
    const n = parseInt(clean.replace('.', ''), 10);
    return isNaN(n) ? 0 : n;
  }

  const n = parseFloat(clean.replace(',', '.'));
  return isNaN(n) ? 0 : Math.round(n);
}

/**
 * Case-insensitive & normalized field getter for Google Sheet rows
 */
export function getField(row: Record<string, unknown>, ...possibleKeys: string[]): unknown {
  if (!row || typeof row !== 'object') return undefined;

  // 1. Direct key match
  for (const k of possibleKeys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
      return row[k];
    }
  }

  // 2. Normalized lowercase alphanumeric match
  const normalizedTargets = possibleKeys.map((k) => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const entries = Object.entries(row);
  for (const [key, val] of entries) {
    if (val === undefined || val === null || val === '') continue;
    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedTargets.includes(normKey)) {
      return val;
    }
  }

  return undefined;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  source: 'google_sheets' | 'local_fallback';
  message?: string;
}

/**
 * Fetch catalog menu items from Google Apps Script (Sheet: 'menu')
 */
export async function fetchCatalog(): Promise<ApiResponse<MenuItem[]>> {
  const branding = getBranding();
  const url = branding.appsScriptUrl?.trim();

  if (!url) {
    const local = getLocalCache<MenuItem[]>(STORAGE_MENU, INITIAL_MENU);
    return {
      success: true,
      data: local,
      source: 'local_fallback',
      message: 'Demo local database (URL Apps Script belum diisi)',
    };
  }

  try {
    const targetUrl = url.includes('?') ? `${url}&action=getMenu` : `${url}?action=getMenu`;
    const res = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const json = await res.json();

    if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
      const mapped: MenuItem[] = json.data.map((row: Record<string, unknown>, idx: number) => {
        const id = String(getField(row, 'id', 'ID', 'idItem') || `item-${idx + 1}`);
        const name = String(getField(row, 'name', 'namaProduk', 'nama', 'item', 'produk') || 'Item Jastip');
        const sku = String(getField(row, 'sku', 'SKU', 'kodeSku') || `SKU-${idx + 1}`);
        const category = String(getField(row, 'category', 'kategori', 'cat') || 'snacks');
        const originCountry = String(getField(row, 'originCountry', 'negaraAsal', 'negara') || 'Jepang');
        const originCity = String(getField(row, 'originCity', 'kotaAsal', 'kota') || 'Tokyo');
        
        let countryCode: MenuItem['countryCode'] = 'japan';
        const rawCode = String(getField(row, 'countryCode', 'kodeNegara', 'kode') || originCountry).toLowerCase();
        if (rawCode.includes('kor') || rawCode.includes('sel')) countryCode = 'korea';
        else if (rawCode.includes('us') || rawCode.includes('amer')) countryCode = 'usa';
        else if (rawCode.includes('thai') || rawCode.includes('bkk')) countryCode = 'thailand';
        else if (rawCode.includes('fran') || rawCode.includes('par') || rawCode.includes('cdg')) countryCode = 'france';
        else countryCode = 'japan';

        const shopperName = String(getField(row, 'shopperName', 'namaTraveler', 'traveler') || 'Reza Pratama');
        const shopperFlight = String(getField(row, 'shopperFlight', 'penerbangan', 'flight') || 'NH855 (Arr 28 Nov)');
        
        const rawPrice = getField(row, 'priceIdr', 'hargaIdr', 'harga', 'price', 'hargaJual', 'price_idr');
        const priceIdr = parsePrice(rawPrice) || 100000;

        const originalPriceForeign = String(
          getField(row, 'originalPriceForeign', 'hargaAsing', 'foreignPrice') || '¥ 1,500'
        );
        const marginPercent = parsePrice(getField(row, 'marginPercent', 'margin', 'marginPersen')) || 20;
        const weightKg = parseFloat(String(getField(row, 'weightKg', 'bobotKg', 'berat', 'weight') || '0.4')) || 0.4;
        const slotsTotal = parseInt(String(getField(row, 'slotsTotal', 'totalKuota', 'slots') || '20'), 10) || 20;
        const slotsBooked = parseInt(String(getField(row, 'slotsBooked', 'kuotaTerisi', 'booked') || '0'), 10) || 0;
        
        let status: MenuItem['status'] = 'Available';
        const rawStatus = String(getField(row, 'status', 'Status') || 'Available').trim();
        if (rawStatus.toLowerCase().includes('limit')) status = 'Limited Space';
        else if (rawStatus.toLowerCase().includes('flight') || rawStatus.toLowerCase().includes('transit')) status = 'In-Flight';
        else if (rawStatus.toLowerCase().includes('sold') || rawStatus.toLowerCase().includes('habis')) status = 'Sold Out';
        else status = 'Available';

        const imageUrl = String(getField(row, 'imageUrl', 'urlIdGoogleDriveGambar', 'gambar', 'image', 'foto') || '');
        const rating = parseFloat(String(getField(row, 'rating', 'Rating') || '5.0')) || 5.0;
        const reviewsCount = parseInt(String(getField(row, 'reviewsCount', 'jumlahReview', 'reviews') || '1'), 10) || 1;
        const description = String(getField(row, 'description', 'deskripsi', 'desc') || '');

        return {
          id,
          name,
          sku,
          category,
          originCountry,
          originCity,
          countryCode,
          shopperName,
          shopperFlight,
          priceIdr,
          originalPriceForeign,
          marginPercent,
          weightKg,
          slotsTotal,
          slotsBooked,
          status,
          imageUrl,
          rating,
          reviewsCount,
          description,
          storeReceiptRequired: true,
        };
      });

      setLocalCache(STORAGE_MENU, mapped);
      return { success: true, data: mapped, source: 'google_sheets' };
    }

    throw new Error('Data menu dari Google Sheets kosong atau format tidak sesuai');
  } catch (err) {
    console.warn('Gagal memuat dari Google Apps Script, menggunakan cache lokal:', err);
    const local = getLocalCache<MenuItem[]>(STORAGE_MENU, INITIAL_MENU);
    return {
      success: false,
      data: local,
      source: 'local_fallback',
      message: err instanceof Error ? err.message : 'Koneksi gagal',
    };
  }
}

/**
 * Fetch orders from Google Apps Script (Sheet: 'pesanan')
 */
export async function fetchOrders(): Promise<ApiResponse<OrderRecord[]>> {
  const branding = getBranding();
  const url = branding.appsScriptUrl?.trim();

  if (!url) {
    const local = getLocalCache<OrderRecord[]>(STORAGE_ORDERS, INITIAL_ORDERS);
    return { success: true, data: local, source: 'local_fallback' };
  }

  try {
    const targetUrl = url.includes('?') ? `${url}&action=getOrders` : `${url}?action=getOrders`;
    const res = await fetch(targetUrl, { method: 'GET', redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const json = await res.json();

    if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
      const mapped: OrderRecord[] = json.data.map((row: Record<string, unknown>, idx: number) => {
        const id = String(getField(row, 'orderId', 'orderNumber', 'id', 'noPesanan') || `ord-${idx + 1}`);
        const orderNumber = String(getField(row, 'orderNumber', 'orderId', 'noPesanan') || `#JT-${idx + 1}`);
        const customerName = String(getField(row, 'customerName', 'namaPelanggan', 'nama') || 'Pelanggan');
        const customerPhone = String(getField(row, 'customerPhone', 'nomorWhatsapp', 'telepon', 'wa') || '-');
        const customerAddress = String(getField(row, 'customerAddress', 'alamatLengkap', 'alamat') || '-');
        const itemsSummary = String(getField(row, 'itemsSummary', 'daftarItem', 'barang') || '-');

        const subtotal = parsePrice(getField(row, 'subtotal', 'Subtotal')) || 0;
        const travelerFee = parsePrice(getField(row, 'travelerFee', 'biayaHandCarry', 'feeJastip')) || 0;
        const customsBuffer = parsePrice(getField(row, 'customsBuffer', 'bufferBeaCukai', 'cukai')) || 0;
        const courierFee = parsePrice(getField(row, 'courierFee', 'biayaKurir', 'ongkir')) || 0;
        const discount = parsePrice(getField(row, 'discount', 'diskon', 'promo')) || 0;
        const grandTotal = parsePrice(getField(row, 'grandTotal', 'totalPembayaran', 'total', 'jumlah')) || 0;

        const paymentMethod = String(getField(row, 'paymentMethod', 'metodePembayaran', 'metode') || 'QRIS Instant');
        
        let status: OrderRecord['status'] = 'Pending Purchase';
        const rawStatus = String(getField(row, 'status', 'Status') || 'Pending Purchase').trim();
        if (rawStatus.toLowerCase().includes('proof')) status = 'Proof Uploaded';
        else if (rawStatus.toLowerCase().includes('transit') || rawStatus.toLowerCase().includes('flight')) status = 'In-Transit';
        else if (rawStatus.toLowerCase().includes('customs') || rawStatus.toLowerCase().includes('cukai')) status = 'Customs Cleared';
        else if (rawStatus.toLowerCase().includes('courier') || rawStatus.toLowerCase().includes('kurir')) status = 'Courier Dispatched';
        else if (rawStatus.toLowerCase().includes('deliver') || rawStatus.toLowerCase().includes('selesai')) status = 'Delivered';
        else status = 'Pending Purchase';

        const assignedTraveler = String(getField(row, 'assignedTraveler', 'traveler') || 'Mei Ling');
        const flightCode = String(getField(row, 'flightCode', 'kodePenerbangan', 'penerbangan') || 'NH855');
        const createdAt = String(getField(row, 'createdAt', 'tanggal', 'date') || new Date().toLocaleDateString('id-ID'));

        return {
          id,
          orderNumber,
          customerName,
          customerPhone,
          customerAddress,
          itemsSummary,
          itemsDetail: [],
          subtotal,
          travelerFee,
          customsBuffer,
          courierFee,
          discount,
          grandTotal,
          paymentMethod,
          status,
          assignedTraveler,
          flightCode,
          createdAt,
        };
      });

      setLocalCache(STORAGE_ORDERS, mapped);
      return { success: true, data: mapped, source: 'google_sheets' };
    }
    throw new Error('Data pesanan kosong');
  } catch (err) {
    const local = getLocalCache<OrderRecord[]>(STORAGE_ORDERS, INITIAL_ORDERS);
    return { success: false, data: local, source: 'local_fallback', message: String(err) };
  }
}

/**
 * Fetch KYC customers from Google Apps Script (Sheet: 'nama_pengguna')
 */
export async function fetchCustomers(): Promise<ApiResponse<CustomerRecord[]>> {
  const branding = getBranding();
  const url = branding.appsScriptUrl?.trim();

  if (!url) {
    const local = getLocalCache<CustomerRecord[]>(STORAGE_CUSTOMERS, INITIAL_CUSTOMERS);
    return { success: true, data: local, source: 'local_fallback' };
  }

  try {
    const targetUrl = url.includes('?') ? `${url}&action=getUsers` : `${url}?action=getUsers`;
    const res = await fetch(targetUrl, { method: 'GET', redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const json = await res.json();

    if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
      const mapped: CustomerRecord[] = json.data.map((row: Record<string, unknown>, idx: number) => {
        const id = String(getField(row, 'id', 'idPengguna', 'ID') || `CUST-${idx + 1}`);
        const name = String(getField(row, 'name', 'namaPengguna', 'nama') || 'Pelanggan');
        const phone = String(getField(row, 'phone', 'nomorWhatsapp', 'wa') || '-');
        const address = String(getField(row, 'address', 'alamatUtama', 'alamat') || '-');
        const totalOrders = parseInt(String(getField(row, 'totalOrders', 'totalPesanan') || '1'), 10) || 1;
        const lifetimeSpent = parsePrice(getField(row, 'lifetimeSpent', 'totalBelanjaLtv', 'totalBelanja')) || 0;
        const trustScore = parseFloat(String(getField(row, 'trustScore', 'skorKepercayaan') || '98').replace('%', '')) || 98.0;
        
        let tier: CustomerRecord['tier'] = 'Member';
        const rawTier = String(getField(row, 'tier', 'statusTier', 'tier') || 'Member');
        if (rawTier.includes('Diamond')) tier = 'Diamond VIP';
        else if (rawTier.includes('Gold')) tier = 'Gold';
        else if (rawTier.includes('Silver')) tier = 'Silver';
        else tier = 'Member';

        return {
          id,
          name,
          phone,
          address,
          totalOrders,
          lifetimeSpent,
          trustScore,
          tier,
        };
      });

      setLocalCache(STORAGE_CUSTOMERS, mapped);
      return { success: true, data: mapped, source: 'google_sheets' };
    }
    throw new Error('Data pengguna kosong');
  } catch (err) {
    const local = getLocalCache<CustomerRecord[]>(STORAGE_CUSTOMERS, INITIAL_CUSTOMERS);
    return { success: false, data: local, source: 'local_fallback', message: String(err) };
  }
}

/**
 * Kirim Pesanan Baru (doPost action: 'createOrder')
 */
export async function submitOrder(
  order: Partial<OrderRecord>
): Promise<{ success: boolean; orderId: string; message: string }> {
  const branding = getBranding();
  const url = branding.appsScriptUrl?.trim();
  const generatedId = '#JT-' + Math.floor(1000 + Math.random() * 9000);

  const fullOrder: OrderRecord = {
    id: 'ord-' + Date.now(),
    orderNumber: order.orderNumber || generatedId,
    customerName: order.customerName || 'Pelanggan',
    customerPhone: order.customerPhone || '-',
    customerAddress: order.customerAddress || '-',
    itemsSummary: order.itemsSummary || '',
    itemsDetail: order.itemsDetail || [],
    subtotal: parsePrice(order.subtotal) || 0,
    travelerFee: parsePrice(order.travelerFee) || 0,
    customsBuffer: parsePrice(order.customsBuffer) || 0,
    courierFee: parsePrice(order.courierFee) || 0,
    discount: parsePrice(order.discount) || 0,
    grandTotal: parsePrice(order.grandTotal) || 0,
    paymentMethod: order.paymentMethod || 'QRIS Instant',
    status: 'Pending Purchase',
    assignedTraveler: order.assignedTraveler || 'Mei Ling (Traveler)',
    flightCode: order.flightCode || 'NH855 (HND ➔ CGK)',
    createdAt: new Date().toLocaleString('id-ID'),
  };

  const existingOrders = getLocalCache<OrderRecord[]>(STORAGE_ORDERS, INITIAL_ORDERS);
  setLocalCache(STORAGE_ORDERS, [fullOrder, ...existingOrders]);

  if (!url) {
    return {
      success: true,
      orderId: fullOrder.orderNumber,
      message: 'Pesanan tersimpan di sistem lokal (Hubungkan Apps Script untuk simpan langsung ke Google Spreadsheet)',
    };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'createOrder',
        data: fullOrder,
      }),
    });

    const json = await res.json();
    return {
      success: true,
      orderId: fullOrder.orderNumber,
      message: json.message || 'Pesanan berhasil dicatat ke Google Spreadsheet!',
    };
  } catch (err) {
    console.warn('Gagal POST ke Google Apps Script:', err);
    return {
      success: true,
      orderId: fullOrder.orderNumber,
      message: 'Pesanan berhasil diproses (Cadangan lokal tersimpan)',
    };
  }
}

/**
 * Tambah / Update Item Menu
 */
export async function saveMenuItem(item: MenuItem, isNew = false): Promise<boolean> {
  const itemToSave = {
    ...item,
    priceIdr: parsePrice(item.priceIdr),
  };

  const existing = getLocalCache<MenuItem[]>(STORAGE_MENU, INITIAL_MENU);
  let updatedList: MenuItem[];
  if (isNew) {
    updatedList = [itemToSave, ...existing];
  } else {
    updatedList = existing.map((it) => (it.id === itemToSave.id ? itemToSave : it));
  }
  setLocalCache(STORAGE_MENU, updatedList);

  const branding = getBranding();
  const url = branding.appsScriptUrl?.trim();
  if (url) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: isNew ? 'addMenuItem' : 'updateMenuItem',
          data: itemToSave,
        }),
      });
    } catch (e) {
      console.warn('Gagal sync menu ke Google Sheet:', e);
    }
  }
  return true;
}

/**
 * Hapus Item Menu
 */
export async function deleteMenuItem(id: string): Promise<boolean> {
  const existing = getLocalCache<MenuItem[]>(STORAGE_MENU, INITIAL_MENU);
  const updatedList = existing.filter((it) => it.id !== id);
  setLocalCache(STORAGE_MENU, updatedList);

  const branding = getBranding();
  const url = branding.appsScriptUrl?.trim();
  if (url) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteMenuItem', id }),
      });
    } catch (e) {
      console.warn('Gagal sync delete ke Google Sheet:', e);
    }
  }
  return true;
}

/**
 * Update Status Pesanan
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderRecord['status']
): Promise<boolean> {
  const existing = getLocalCache<OrderRecord[]>(STORAGE_ORDERS, INITIAL_ORDERS);
  const updatedList = existing.map((o) =>
    o.orderNumber === orderId || o.id === orderId ? { ...o, status: newStatus } : o
  );
  setLocalCache(STORAGE_ORDERS, updatedList);

  const branding = getBranding();
  const url = branding.appsScriptUrl?.trim();
  if (url) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateOrderStatus', orderId, newStatus }),
      });
    } catch (e) {
      console.warn('Gagal update status di Google Sheet:', e);
    }
  }
  return true;
}
