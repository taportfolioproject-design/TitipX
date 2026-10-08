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
    return { success: true, data: local, source: 'local_fallback', message: 'Demo local database (URL Apps Script belum diisi)' };
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
      const mapped: MenuItem[] = json.data.map((row: Record<string, unknown>, idx: number) => ({
        id: String(row.id || `item-${idx + 1}`),
        name: String(row.name || row.namaProduk || 'Item'),
        sku: String(row.sku || `SKU-${idx + 1}`),
        category: String(row.category || row.kategori || 'snacks'),
        originCountry: String(row.originCountry || row.negaraAsal || 'Jepang'),
        originCity: String(row.originCity || row.kotaAsal || 'Tokyo'),
        countryCode: (row.countryCode || 'japan') as MenuItem['countryCode'],
        shopperName: String(row.shopperName || row.namaTraveler || 'Reza Pratama'),
        shopperFlight: String(row.shopperFlight || row.penerbangan || 'NH855'),
        priceIdr: Number(row.priceIdr || row.hargaIdr || 0),
        originalPriceForeign: String(row.originalPriceForeign || row.hargaAsing || '¥ 1,500'),
        marginPercent: Number(row.marginPercent || row.margin || 20),
        weightKg: Number(row.weightKg || row.bobotKg || 0.4),
        slotsTotal: Number(row.slotsTotal || row.totalKuota || 20),
        slotsBooked: Number(row.slotsBooked || row.kuotaTerisi || 0),
        status: (row.status || 'Available') as MenuItem['status'],
        imageUrl: String(row.imageUrl || row.urlIdGoogleDriveGambar || ''),
        rating: Number(row.rating || 5.0),
        reviewsCount: Number(row.reviewsCount || row.jumlahReview || 1),
        description: String(row.description || row.deskripsi || ''),
        storeReceiptRequired: Boolean(row.storeReceiptRequired ?? true),
      }));

      setLocalCache(STORAGE_MENU, mapped);
      return { success: true, data: mapped, source: 'google_sheets' };
    }

    throw new Error('Format data tidak sesuai');
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
      const mapped: OrderRecord[] = json.data.map((row: Record<string, unknown>, idx: number) => ({
        id: String(row.orderId || row.orderNumber || `ord-${idx + 1}`),
        orderNumber: String(row.orderNumber || row.orderId || `#JT-${idx + 1}`),
        customerName: String(row.customerName || row.namaPelanggan || 'Pelanggan'),
        customerPhone: String(row.customerPhone || row.nomorWhatsapp || '-'),
        customerAddress: String(row.customerAddress || row.alamatLengkap || '-'),
        itemsSummary: String(row.itemsSummary || row.daftarItem || '-'),
        itemsDetail: [],
        subtotal: Number(row.subtotal || 0),
        travelerFee: Number(row.travelerFee || row.biayaHandCarry || 0),
        customsBuffer: Number(row.customsBuffer || row.bufferBeaCukai || 0),
        courierFee: Number(row.courierFee || row.biayaKurir || 0),
        discount: Number(row.discount || row.diskon || 0),
        grandTotal: Number(row.grandTotal || row.totalPembayaran || 0),
        paymentMethod: String(row.paymentMethod || row.metodePembayaran || 'QRIS'),
        status: (row.status || 'Pending Purchase') as OrderRecord['status'],
        assignedTraveler: String(row.assignedTraveler || row.traveler || 'Mei Ling'),
        flightCode: String(row.flightCode || row.kodePenerbangan || 'NH855'),
        createdAt: String(row.createdAt || row.tanggal || new Date().toLocaleDateString('id-ID')),
      }));

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
      const mapped: CustomerRecord[] = json.data.map((row: Record<string, unknown>, idx: number) => ({
        id: String(row.id || row.idPengguna || `CUST-${idx + 1}`),
        name: String(row.name || row.namaPengguna || 'Pelanggan'),
        phone: String(row.phone || row.nomorWhatsapp || '-'),
        address: String(row.address || row.alamatUtama || '-'),
        totalOrders: Number(row.totalOrders || row.totalPesanan || 1),
        lifetimeSpent: Number(row.lifetimeSpent || row.totalBelanjaLtv || 0),
        trustScore: parseFloat(String(row.trustScore || row.skorKepercayaan || '98')) || 98.0,
        tier: (row.tier || row.statusTier || 'Member') as CustomerRecord['tier'],
      }));

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
export async function submitOrder(order: Partial<OrderRecord>): Promise<{ success: boolean; orderId: string; message: string }> {
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
    subtotal: order.subtotal || 0,
    travelerFee: order.travelerFee || 0,
    customsBuffer: order.customsBuffer || 0,
    courierFee: order.courierFee || 0,
    discount: order.discount || 0,
    grandTotal: order.grandTotal || 0,
    paymentMethod: order.paymentMethod || 'QRIS Instant',
    status: 'Pending Purchase',
    assignedTraveler: order.assignedTraveler || 'Mei Ling (Traveler)',
    flightCode: order.flightCode || 'NH855 (HND ➔ CGK)',
    createdAt: new Date().toLocaleString('id-ID'),
  };

  // Always update local cache for instant UI feedback
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
    // Send to Google Apps Script doPost
    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // text/plain prevents CORS preflight block on GAS Web App
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
  const existing = getLocalCache<MenuItem[]>(STORAGE_MENU, INITIAL_MENU);
  let updatedList: MenuItem[];
  if (isNew) {
    updatedList = [item, ...existing];
  } else {
    updatedList = existing.map(it => (it.id === item.id ? item : it));
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
          data: item,
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
  const updatedList = existing.filter(it => it.id !== id);
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
export async function updateOrderStatus(orderId: string, newStatus: OrderRecord['status']): Promise<boolean> {
  const existing = getLocalCache<OrderRecord[]>(STORAGE_ORDERS, INITIAL_ORDERS);
  const updatedList = existing.map(o => (o.orderNumber === orderId || o.id === orderId ? { ...o, status: newStatus } : o));
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
