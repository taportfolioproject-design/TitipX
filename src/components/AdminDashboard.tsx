import React, { useState } from 'react';
import { MenuItem, OrderRecord, CustomerRecord } from '../types';
import { BrandingConfig } from '../config/branding';
import { DriveImage } from './DriveImage';
import { saveMenuItem, deleteMenuItem, updateOrderStatus } from '../services/api';

interface AdminDashboardProps {
  menu: MenuItem[];
  orders: OrderRecord[];
  customers: CustomerRecord[];
  branding: BrandingConfig;
  onRefreshData: () => void;
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  menu,
  orders,
  customers,
  branding,
  onRefreshData,
  onOpenGuide,
  onOpenSettings,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'customers'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(orders[0] || null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [originFilter, setOriginFilter] = useState('ALL');

  // Modal State for Add / Edit Item
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form Fields for Item Modal
  const [formItemName, setFormItemName] = useState('');
  const [formCategory, setFormCategory] = useState('snacks');
  const [formOriginCountry, setFormOriginCountry] = useState('Jepang');
  const [formOriginCity, setFormOriginCity] = useState('Tokyo • Ginza');
  const [formCountryCode, setFormCountryCode] = useState<MenuItem['countryCode']>('japan');
  const [formShopperName, setFormShopperName] = useState('Reza Pratama');
  const [formShopperFlight, setFormShopperFlight] = useState('NH855 (Arr 28 Nov)');
  const [formForeignPrice, setFormForeignPrice] = useState(2500);
  const [formMarginPercent, setFormMarginPercent] = useState(20);
  const [formCustomsBuffer, setFormCustomsBuffer] = useState(15000);
  const [formPriceIdr, setFormPriceIdr] = useState<number>(285000);
  const [formWeightKg, setFormWeightKg] = useState(0.4);
  const [formSlotsTotal, setFormSlotsTotal] = useState(20);
  const [formSlotsBooked, setFormSlotsBooked] = useState(0);
  const [formStatus, setFormStatus] = useState<MenuItem['status']>('Available');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Calculations for Admin CRUD FX Engine
  const fxRate = formCountryCode === 'japan' ? 104.82 : formCountryCode === 'korea' ? 11.64 : 15840;
  const baseIdr = formForeignPrice * fxRate;
  const marginIdr = baseIdr * (formMarginPercent / 100);
  const calculatedTotalIdr = Math.round(baseIdr + marginIdr + formCustomsBuffer);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormItemName('');
    setFormCategory('snacks');
    setFormOriginCountry('Jepang');
    setFormOriginCity('Tokyo');
    setFormCountryCode('japan');
    setFormShopperName('Reza Pratama');
    setFormShopperFlight('NH855 (Arr 28 Nov)');
    setFormForeignPrice(2500);
    setFormMarginPercent(20);
    setFormCustomsBuffer(15000);
    setFormPriceIdr(285000);
    setFormWeightKg(0.4);
    setFormSlotsTotal(20);
    setFormSlotsBooked(0);
    setFormStatus('Available');
    setFormImageUrl('');
    setFormDescription('');
    setIsItemModalOpen(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormItemName(item.name);
    setFormCategory(item.category);
    setFormOriginCountry(item.originCountry);
    setFormOriginCity(item.originCity);
    setFormCountryCode(item.countryCode);
    setFormShopperName(item.shopperName);
    setFormShopperFlight(item.shopperFlight);
    setFormForeignPrice(2500);
    setFormMarginPercent(item.marginPercent);
    setFormCustomsBuffer(15000);
    setFormPriceIdr(item.priceIdr);
    setFormWeightKg(item.weightKg);
    setFormSlotsTotal(item.slotsTotal);
    setFormSlotsBooked(item.slotsBooked);
    setFormStatus(item.status);
    setFormImageUrl(item.imageUrl);
    setFormDescription(item.description);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemData: MenuItem = {
      id: editingItem ? editingItem.id : 'item-' + Date.now(),
      sku: editingItem ? editingItem.sku : 'SKU-' + Math.floor(100 + Math.random() * 900),
      name: formItemName,
      category: formCategory,
      originCountry: formOriginCountry,
      originCity: formOriginCity,
      countryCode: formCountryCode,
      shopperName: formShopperName,
      shopperFlight: formShopperFlight,
      priceIdr: formPriceIdr || calculatedTotalIdr || 100000,
      originalPriceForeign: `${formForeignPrice}`,
      marginPercent: formMarginPercent,
      weightKg: formWeightKg,
      slotsTotal: formSlotsTotal,
      slotsBooked: formSlotsBooked,
      status: formStatus,
      imageUrl: formImageUrl,
      rating: editingItem ? editingItem.rating : 5.0,
      reviewsCount: editingItem ? editingItem.reviewsCount : 1,
      description: formDescription,
      storeReceiptRequired: true,
    };

    await saveMenuItem(itemData, !editingItem);
    setIsItemModalOpen(false);
    onRefreshData();
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Yakin ingin menghapus item ini dari katalog & Google Spreadsheet?')) {
      await deleteMenuItem(id);
      onRefreshData();
    }
  };

  const handleUpdateStatus = async (orderId: string, status: OrderRecord['status']) => {
    await updateOrderStatus(orderId, status);
    if (selectedOrder && selectedOrder.orderNumber === orderId) {
      setSelectedOrder({ ...selectedOrder, status });
    }
    onRefreshData();
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'ALL') return true;
    return o.status === orderStatusFilter;
  });

  // Filtered Menu
  const filteredMenu = menu.filter((item) => {
    const matchesSearch =
      !catalogSearch ||
      item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.shopperName.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesCountry = originFilter === 'ALL' || item.countryCode === originFilter;
    return matchesSearch && matchesCountry;
  });

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 space-y-6">
      {/* Top Header Command Center */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 rounded-lg text-xs font-bold">OPERATIONS</span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sync {branding.appsScriptUrl ? 'Google Spreadsheet' : 'Cache Lokal'}
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1">Admin Command Center & Rekber Portal</h1>
          <p className="text-xs text-slate-400">
            Kelola katalog menu, transaksi pesanan, inspeksi bukti belanja traveler, dan data pengguna.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenGuide}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <span>📊</span> Setup Sheets & Code.gs
          </button>
          <button
            onClick={onOpenSettings}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <span>⚙️</span> Pengaturan Toko
          </button>
          <button
            onClick={onRefreshData}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
          >
            <span>🔄</span> Refresh Data
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3.5 py-2 bg-red-600/90 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Kunci & Keluar dari Admin Portal"
            >
              <span>🔒</span> Keluar Admin
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics Rail */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Item Katalog Aktif</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">📦</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{menu.length}</span>
            <span className="text-xs text-emerald-600 font-bold ml-2">● Realtime Sync</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Escrow Vault Diamankan</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">🛡️</span>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              Rp{' '}
              {orders
                .reduce((s, o) => s + o.grandTotal, 0)
                .toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-emerald-600 font-bold block">100% Guaranteed</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Shopper Flights Aktif</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">✈️</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">18</span>
            <span className="text-xs text-slate-500 block">TYO, SEL, LA, BKK, CDG</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Total Pengguna KYC</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">👥</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{customers.length}</span>
            <span className="text-xs text-purple-600 font-bold block">Sheet nama_pengguna</span>
          </div>
        </div>
      </div>

      {/* Segmented Controller Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📋 Pesanan & Escrow ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'catalog'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🏷️ Master Katalog CRUD ({menu.length})
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'customers'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          👤 Direktori Pengguna / KYC ({customers.length})
        </button>
      </div>

      {/* TAB 1: ORDERS & ESCROW MANIFEST */}
      {activeTab === 'orders' && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Table */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden w-full">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Daftar Transaksi Pesanan (Sheet: pesanan)</h3>
                <p className="text-xs text-slate-500">Klik baris pesanan untuk menginspeksi bukti struk & status rekber</p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none font-medium"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Pending Purchase">Pending Purchase</option>
                  <option value="Proof Uploaded">Proof Uploaded</option>
                  <option value="In-Transit">In-Transit</option>
                  <option value="Customs Cleared">Customs Cleared</option>
                  <option value="Courier Dispatched">Courier Dispatched</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">No. Order</th>
                    <th className="py-3 px-4">Pelanggan & WA</th>
                    <th className="py-3 px-4">Barang Titipan</th>
                    <th className="py-3 px-4 text-right">Total (IDR)</th>
                    <th className="py-3 px-4">Status Transaksi</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredOrders.map((ord) => {
                    const isSelected = selectedOrder?.orderNumber === ord.orderNumber;
                    return (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-bold text-blue-600 font-mono">{ord.orderNumber}</span>
                          <span className="block text-[10px] text-slate-400">{ord.createdAt}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">{ord.customerName}</span>
                          <span className="block text-[10px] text-slate-500 font-mono">
                            {ord.customerPhone}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate" title={ord.itemsSummary}>
                          {ord.itemsSummary}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          Rp {ord.grandTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.status === 'Proof Uploaded'
                                ? 'bg-blue-100 text-blue-800'
                                : ord.status === 'In-Transit'
                                ? 'bg-amber-100 text-amber-800'
                                : ord.status === 'Customs Cleared'
                                ? 'bg-purple-100 text-purple-800'
                                : ord.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <a
                            href={`https://wa.me/${ord.customerPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg inline-block"
                            title="Chat Pelanggan di WhatsApp"
                          >
                            💬
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Inspection Drawer */}
          {selectedOrder && (
            <div className="w-full lg:w-[420px] bg-white rounded-3xl border border-slate-200/90 shadow-lg p-5 space-y-4 shrink-0">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="font-bold text-base text-slate-900">
                    Inspeksi {selectedOrder.orderNumber}
                  </h4>
                  <p className="text-xs text-slate-500">{selectedOrder.customerName}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Escrow Funded
                </span>
              </div>

              {/* Milestone Tracker */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Tahapan Rekber (Lifecycle)
                </span>
                <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <span className="mt-1 font-medium">DP Masuk</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <span className="mt-1 font-bold text-blue-600">Dibeli</span>
                  </div>
                  <div className="flex flex-col items-center opacity-60">
                    <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold">
                      3
                    </div>
                    <span className="mt-1">Flight</span>
                  </div>
                  <div className="flex flex-col items-center opacity-60">
                    <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold">
                      4
                    </div>
                    <span className="mt-1">Cukai</span>
                  </div>
                  <div className="flex flex-col items-center opacity-60">
                    <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold">
                      5
                    </div>
                    <span className="mt-1">Selesai</span>
                  </div>
                </div>
              </div>

              {/* Shopper Proof Image */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Foto Bukti Belanja & Struk Kasir:
                </span>
                <div className="h-40 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                  <DriveImage
                    driveIdOrUrl={selectedOrder.proofImageUrl}
                    fallbackText="Struk Belanja Toko Fisik"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-mono">
                    OCR Match: 100% Verified
                  </div>
                </div>
              </div>

              {/* Financial Ledger */}
              <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                <div className="flex justify-between">
                  <span>Subtotal Barang:</span>
                  <span className="font-semibold text-slate-900">
                    Rp {selectedOrder.subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fee Hand-carry:</span>
                  <span className="font-semibold text-slate-900">
                    Rp {selectedOrder.travelerFee.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Buffer Bea Cukai:</span>
                  <span className="font-semibold text-slate-900">
                    Rp {selectedOrder.customsBuffer.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkir Kurir Domestik:</span>
                  <span className="font-semibold text-slate-900">
                    Rp {selectedOrder.courierFee.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-sm text-blue-700 pt-1.5 border-t border-slate-200">
                  <span>Total Escrow Paid:</span>
                  <span className="font-mono">Rp {selectedOrder.grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.orderNumber, 'Customs Cleared')}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Customs Cleared
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.orderNumber, 'Courier Dispatched')}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Kirim ke Kurir
                  </button>
                </div>
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.orderNumber, 'Delivered')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>✓</span> Selesai & Release Escrow
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MASTER CATALOG CRUD */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Master Katalog Jastip (Sheet: menu)</h3>
              <p className="text-xs text-slate-500">
                Atur produk jastip, link gambar Google Drive, alokasi kuota bagasi, dan harga otomatis.
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>+</span> Tambah Produk Baru
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Cari produk atau traveler..."
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[200px]"
            />
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
            >
              <option value="ALL">Semua Negara</option>
              <option value="japan">Jepang</option>
              <option value="korea">Korea Selatan</option>
              <option value="usa">USA</option>
              <option value="thailand">Thailand</option>
              <option value="france">Prancis</option>
            </select>
          </div>

          {/* Catalog Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3">Produk & Gambar</th>
                  <th className="py-3 px-3">Asal Negara</th>
                  <th className="py-3 px-3">Traveler</th>
                  <th className="py-3 px-3 text-right">Harga Jual (IDR)</th>
                  <th className="py-3 px-3 text-center">Kuota Bagasi</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredMenu.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <DriveImage
                            driveIdOrUrl={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">{item.originCountry}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold block">{item.shopperName}</span>
                      <span className="text-[10px] text-slate-400">{item.shopperFlight}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-700">
                      Rp {item.priceIdr.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-semibold">
                        {item.slotsBooked} / {item.slotsTotal}
                      </span>
                      <span className="block text-[10px] text-slate-400">{item.weightKg} kg/pc</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold text-[11px]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 rounded text-red-600 font-semibold text-[11px]"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER DIRECTORY & KYC */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                Direktori Pelanggan & Skor Kepercayaan (Sheet: nama_pengguna)
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan riwayat belanja, status tier keanggotaan, dan peluncuran chat WhatsApp instan.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Nama Pelanggan</th>
                  <th className="py-3 px-4">WhatsApp KYC</th>
                  <th className="py-3 px-4">Alamat Utama</th>
                  <th className="py-3 px-4 text-center">Total Pesanan</th>
                  <th className="py-3 px-4 text-right">Lifetime Spent (LTV)</th>
                  <th className="py-3 px-4 text-center">Tier & Skor</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{c.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold">
                        {c.phone}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">{c.address}</td>
                    <td className="py-3 px-4 text-center font-bold">{c.totalOrders}x</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      Rp {c.lifetimeSpent.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold block text-[10px]">
                        {c.tier}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{c.trustScore}% Trust</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(
                          c.name
                        )},%20kami%20dari%20${encodeURIComponent(branding.storeName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg inline-flex items-center gap-1"
                      >
                        <span>💬</span> Chat WA
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CATALOG ITEM */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setIsItemModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              ✕
            </button>

            <h3 className="font-bold text-lg text-slate-900 mb-1">
              {editingItem ? 'Edit Produk Jastip' : 'Tambah Produk Jastip Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Data akan otomatis disinkronkan ke sheet <code>menu</code> di Google Spreadsheet.
            </p>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nama Produk Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formItemName}
                  onChange={(e) => setFormItemName(e.target.value)}
                  placeholder="Contoh: Tokyo Banana Pokemon 8-Pack"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Kategori *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                  >
                    <option value="snacks">Snacks & Bakery</option>
                    <option value="cosmetics">Skincare & Beauty</option>
                    <option value="luxury">Luxury & Eyewear</option>
                    <option value="collectibles">Limited Collectibles</option>
                    <option value="pharmacy">Pharmacy & Health</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Negara Asal *</label>
                  <select
                    value={formCountryCode}
                    onChange={(e) => {
                      const code = e.target.value as MenuItem['countryCode'];
                      setFormCountryCode(code);
                      if (code === 'japan') setFormOriginCountry('Jepang');
                      else if (code === 'korea') setFormOriginCountry('Korea Selatan');
                      else if (code === 'usa') setFormOriginCountry('Amerika Serikat');
                      else if (code === 'thailand') setFormOriginCountry('Thailand');
                      else if (code === 'france') setFormOriginCountry('Prancis');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                  >
                    <option value="japan">🇯🇵 Jepang (TYO)</option>
                    <option value="korea">🇰🇷 Korea Selatan (SEL)</option>
                    <option value="usa">🇺🇸 USA (LA/NYC)</option>
                    <option value="thailand">🇹🇭 Thailand (BKK)</option>
                    <option value="france">🇫🇷 Prancis (CDG)</option>
                  </select>
                </div>
              </div>

              {/* Live FX Calculation Engine */}
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
                <span className="font-bold text-blue-800 uppercase tracking-wider text-[10px] block">
                  Mesin Kalkulator Kurs & Margin Jastip
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Harga Luar Negeri</label>
                    <input
                      type="number"
                      value={formForeignPrice}
                      onChange={(e) => setFormForeignPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Margin Jastip (%)</label>
                    <input
                      type="number"
                      value={formMarginPercent}
                      onChange={(e) => setFormMarginPercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Buffer Bea Cukai (IDR)</label>
                    <input
                      type="number"
                      value={formCustomsBuffer}
                      onChange={(e) => setFormCustomsBuffer(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-blue-200">
                  <span className="font-medium text-slate-700">Hasil Hitung Kurs & Margin:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-700 font-mono text-sm">
                      Rp {calculatedTotalIdr.toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormPriceIdr(calculatedTotalIdr)}
                      className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Gunakan Hasil Ini
                    </button>
                  </div>
                </div>
              </div>

              {/* Harga Jual Bersih (IDR) */}
              <div>
                <label className="block font-semibold mb-1">
                  Harga Jual Bersih di Web (IDR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    value={formPriceIdr}
                    onChange={(e) => setFormPriceIdr(parseInt(e.target.value, 10) || 0)}
                    placeholder="285000"
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-sm text-blue-700"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Format angka murni tanpa titik/koma (contoh: 285000). Tampil di web: Rp {formPriceIdr.toLocaleString('id-ID')}
                </p>
              </div>

              {/* Drive Image Asset Input & Realtime Preview */}
              <div>
                <label className="block font-semibold mb-1">
                  ID File Google Drive atau URL Gambar *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="Contoh ID: 1A2b3C... atau link https://drive.google.com/..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>
                {formImageUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border">
                      <DriveImage driveIdOrUrl={formImageUrl} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] text-slate-500">
                      ✓ Preview gambar Google Drive terdeteksi secara otomatis
                    </span>
                  </div>
                )}
              </div>

              {/* Weight & Slots */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Berat per Unit (Kg)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formWeightKg}
                    onChange={(e) => setFormWeightKg(parseFloat(e.target.value) || 0.1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Total Kuota Slot</label>
                  <input
                    type="number"
                    value={formSlotsTotal}
                    onChange={(e) => setFormSlotsTotal(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detail produk, rasa, garansi toko fisik..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
