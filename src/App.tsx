/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { MenuItem, CartItem, OrderRecord, CustomerRecord, CategoryType, CountryCode } from './types';
import { getBranding, BrandingConfig } from './config/branding';
import { fetchCatalog, fetchOrders, fetchCustomers } from './services/api';
import { INITIAL_HUBS } from './data/initialData';
import { Navbar } from './components/Navbar';
import { DepartureHubs } from './components/DepartureHubs';
import { ProductCard } from './components/ProductCard';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { CustomRequestModal } from './components/CustomRequestModal';
import { CartView } from './components/CartView';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginGate } from './components/AdminLoginGate';
import { BrandingSettingsModal } from './components/BrandingSettingsModal';
import { BackendGuideModal } from './components/BackendGuideModal';
import { WishlistModal } from './components/WishlistModal';

export default function App() {
  const [branding, setBranding] = useState<BrandingConfig>(getBranding());
  const [activeView, setActiveView] = useState<'catalog' | 'cart' | 'admin'>('catalog');
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('titipx_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  // Database State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [dbSource, setDbSource] = useState<'google_sheets' | 'local_fallback'>('local_fallback');

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('titipx_cart_items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Wishlist State (Persisted in localStorage)
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('titipx_wishlist_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Filter States
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'wishlist'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'trending' | 'price-low' | 'price-high' | 'rating'>('trending');

  // Modal States
  const [quickViewItem, setQuickViewItem] = useState<MenuItem | null>(null);
  const [isCustomRequestOpen, setIsCustomRequestOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('titipx_cart_items', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Save wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('titipx_wishlist_ids', JSON.stringify(wishlistIds));
    } catch {
      // ignore
    }
  }, [wishlistIds]);

  const handleToggleWishlist = (item: MenuItem) => {
    setWishlistIds((prev) => {
      const isAlready = prev.includes(item.id);
      if (isAlready) {
        showToast(`"${item.name.substring(0, 24)}..." dihapus dari Wishlist.`);
        return prev.filter((id) => id !== item.id);
      } else {
        showToast(`❤️ "${item.name.substring(0, 24)}..." disimpan ke Wishlist!`);
        return [...prev, item.id];
      }
    });
  };

  // Load initial catalog, orders, and customers
  const loadDatabase = async () => {
    setIsLoadingCatalog(true);
    try {
      const catalogRes = await fetchCatalog();
      setMenuItems(catalogRes.data);
      setDbSource(catalogRes.source);

      const ordersRes = await fetchOrders();
      setOrders(ordersRes.data);

      const customersRes = await fetchCustomers();
      setCustomers(customersRes.data);
    } catch (err) {
      console.error('Failed to load database:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, [branding.appsScriptUrl]);

  // Cart Handlers
  const handleAddToCart = (item: MenuItem, qty = 1, notes = '') => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((c) => c.item.id === item.id);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += qty;
        if (notes) next[existingIdx].notes = notes;
        return next;
      }
      return [...prev, { item, quantity: qty, notes }];
    });
    showToast(`"${item.name.substring(0, 24)}..." masuk keranjang!`);
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.item.id === itemId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
    showToast('Item dihapus dari keranjang.');
  };

  const handleClearCart = () => {
    setCart([]);
    showToast('Keranjang telah dikosongkan.');
  };

  // Filtered & Sorted Menu
  const filteredProducts = menuItems
    .filter((item) => {
      const matchesCountry = selectedCountry === 'all' || item.countryCode === selectedCountry;
      const matchesCat =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'wishlist'
          ? wishlistIds.includes(item.id)
          : item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.originCountry.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCountry && matchesCat && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOption === 'price-low') return a.priceIdr - b.priceIdr;
      if (sortOption === 'price-high') return b.priceIdr - a.priceIdr;
      if (sortOption === 'rating') return b.rating - a.rating;
      return 0; // trending
    });

  const cartTotalItems = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col font-['Hanken_Grotesk']">
      {/* Top Navbar */}
      <Navbar
        branding={branding}
        activeView={activeView}
        cartCount={cartTotalItems}
        wishlistCount={wishlistIds.length}
        currency={currency}
        onToggleCurrency={() => setCurrency(currency === 'IDR' ? 'USD' : 'IDR')}
        onNavigate={(v) => {
          setActiveView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenWishlist={() => setIsWishlistModalOpen(true)}
      />

      {/* Main Content Areas */}
      <main className="flex-1 pb-20 md:pb-12">
        {activeView === 'catalog' && (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 space-y-6">
            {/* Live Carrier Boarding Ticker */}
            <div className="bg-slate-900 text-white rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm border border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                  Live Courier Flight
                </span>
                <span className="text-xs text-slate-300 font-medium truncate">
                  Tokyo Narita (NRT) ➔ Jakarta (CGK) boarding dalam 14 jam
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">Flight JL725 / NH855</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    dbSource === 'google_sheets'
                      ? 'bg-emerald-900 text-emerald-300 border border-emerald-700'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}
                >
                  {dbSource === 'google_sheets' ? '● Terhubung Google Sheets' : '● Demo Mode Lokal'}
                </span>
              </div>
            </div>

            {/* Departure Hubs Carousel */}
            <DepartureHubs
              hubs={INITIAL_HUBS}
              selectedHub={selectedCountry}
              onSelectHub={(code) => setSelectedCountry(code as CountryCode)}
            />

            {/* Search, Sort & Category Controls */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari jajanan Jepang, skincare Korea, PopMart Labubu, tumbler..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Sorter */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-slate-500">Urutkan:</span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                  >
                    <option value="trending">🔥 Terpopuler</option>
                    <option value="price-low">💰 Harga: Termurah</option>
                    <option value="price-high">💎 Harga: Tertinggi</option>
                    <option value="rating">⭐ Rating Tertinggi</option>
                  </select>
                </div>
              </div>

              {/* Category Badges */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'Semua Produk', icon: '✨' },
                  { id: 'wishlist', label: `Wishlist (${wishlistIds.length})`, icon: '❤️' },
                  { id: 'snacks', label: 'Snacks & Bakery', icon: '🍬' },
                  { id: 'cosmetics', label: 'Skincare & Beauty', icon: '💄' },
                  { id: 'collectibles', label: 'Limited Toys', icon: '🧸' },
                  { id: 'luxury', label: 'Luxury & Fashion', icon: '👜' },
                  { id: 'pharmacy', label: 'Pharmacy Care', icon: '💊' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as CategoryType | 'wishlist')}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : cat.id === 'wishlist' && wishlistIds.length > 0
                        ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trust Highlights Ribbon */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-base">🛡️</span>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">100% Proteksi Rekber</span>
                  <span className="text-[11px] text-slate-500">Dana aman di platform hingga tiba</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl text-base">🧾</span>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Struk Toko Resmi</span>
                  <span className="text-[11px] text-slate-500">Foto cash register & toko fisik</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl text-base">🛃</span>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Bea Cukai Beres</span>
                  <span className="text-[11px] text-slate-500">Bebas biaya siluman di bandara</span>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div>
              <div className="flex items-baseline justify-between mb-4 px-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedCategory === 'wishlist' ? 'Daftar Keinginan (Wishlist)' : 'Katalog Batch Pilihan'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Menampilkan {filteredProducts.length} barang titipan
                  </span>
                </div>
              </div>

              {isLoadingCatalog ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-72 bg-slate-200/70 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {filteredProducts.map((item) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      currency={currency}
                      isWishlisted={wishlistIds.includes(item.id)}
                      onAddToCart={(it) => handleAddToCart(it)}
                      onQuickView={(it) => setQuickViewItem(it)}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
                  <span className="text-4xl block mb-2">
                    {selectedCategory === 'wishlist' ? '🤍' : '🔍'}
                  </span>
                  <h4 className="font-bold text-slate-900 text-base">
                    {selectedCategory === 'wishlist'
                      ? 'Wishlist Anda Masih Kosong'
                      : 'Tidak ada barang yang cocok'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    {selectedCategory === 'wishlist'
                      ? 'Klik ikon hati pada produk untuk menyimpannya ke daftar favorit.'
                      : 'Belum menemukan barang yang Anda cari? Ajukan pesanan khusus langsung ke traveler.'}
                  </p>
                  <button
                    onClick={() => {
                      if (selectedCategory === 'wishlist') {
                        setSelectedCategory('all');
                      } else {
                        setIsCustomRequestOpen(true);
                      }
                    }}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700"
                  >
                    {selectedCategory === 'wishlist' ? 'Lihat Semua Produk' : 'Ajukan Request Jastip Kustom'}
                  </button>
                </div>
              )}
            </div>

            {/* Custom Request Banner Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="max-w-xl space-y-2 z-10 relative">
                <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider">
                  Jastip Khusus / Custom Request
                </span>
                <h3 className="text-xl sm:text-2xl font-bold leading-tight">
                  Tidak menemukan barang luar negeri yang Anda inginkan?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Cukup kirimkan nama barang, foto, atau link toko. Traveler terverifikasi yang sedang berada di kota tujuan akan memberikan penawaran kuota bagasi secara langsung.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => setIsCustomRequestOpen(true)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
                  >
                    + Ajukan Request Khusus
                  </button>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold rounded-xl transition-all"
                  >
                    Hubungi Admin Toko
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View: Cart & Checkout */}
        {activeView === 'cart' && (
          <CartView
            cart={cart}
            branding={branding}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onContinueShopping={() => setActiveView('catalog')}
            onOrderSuccess={(order) => {
              setOrders((prev) => [order, ...prev]);
              showToast(`Pesanan ${order.orderNumber} berhasil dicatat!`);
            }}
          />
        )}

        {/* View: Admin Ops Portal (Protected with Password) */}
        {activeView === 'admin' && (
          !isAdminAuthenticated ? (
            <AdminLoginGate
              correctPassword={branding.adminPassword || 'admin123'}
              onSuccess={() => {
                setIsAdminAuthenticated(true);
                try {
                  sessionStorage.setItem('titipx_admin_auth', 'true');
                } catch {
                  // ignore
                }
                showToast('Akses Admin Portal berhasil dibuka.');
              }}
              onCancel={() => setActiveView('catalog')}
            />
          ) : (
            <AdminDashboard
              menu={menuItems}
              orders={orders}
              customers={customers}
              branding={branding}
              onRefreshData={loadDatabase}
              onOpenGuide={() => setIsGuideOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onLogout={() => {
                setIsAdminAuthenticated(false);
                try {
                  sessionStorage.removeItem('titipx_admin_auth');
                } catch {
                  // ignore
                }
                setActiveView('catalog');
                showToast('Anda telah keluar dari Admin Portal.');
              }}
            />
          )
        )}
      </main>

      {/* Modals */}
      <ProductQuickViewModal
        item={quickViewItem}
        isOpen={Boolean(quickViewItem)}
        isWishlisted={quickViewItem ? wishlistIds.includes(quickViewItem.id) : false}
        onClose={() => setQuickViewItem(null)}
        onAddToCart={(it, qty, notes) => handleAddToCart(it, qty, notes)}
        onToggleWishlist={handleToggleWishlist}
      />

      <WishlistModal
        isOpen={isWishlistModalOpen}
        onClose={() => setIsWishlistModalOpen(false)}
        wishlistItems={menuItems.filter((m) => wishlistIds.includes(m.id))}
        currency={currency}
        onAddToCart={(it) => handleAddToCart(it)}
        onRemoveFromWishlist={(id) => {
          const target = menuItems.find((m) => m.id === id);
          if (target) handleToggleWishlist(target);
        }}
        onClearWishlist={() => {
          setWishlistIds([]);
          showToast('Wishlist telah dikosongkan.');
        }}
      />

      <CustomRequestModal
        isOpen={isCustomRequestOpen}
        onClose={() => setIsCustomRequestOpen(false)}
        branding={branding}
        onSubmitted={(msg) => showToast(msg)}
      />

      <BrandingSettingsModal
        branding={branding}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={(updated) => {
          setBranding(updated);
          showToast('Konfigurasi toko berhasil disimpan!');
        }}
        onOpenGuide={() => {
          setIsSettingsOpen(false);
          setIsGuideOpen(true);
        }}
      />

      <BackendGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        appsScriptUrl={branding.appsScriptUrl}
        onSaveUrl={(url) => {
          setBranding((prev) => ({ ...prev, appsScriptUrl: url }));
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <span className="text-emerald-400">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{branding.storeName}</span>
            <span>•</span>
            <span>Jasa Titip (Jastip) Hand-Carry P2P Bergaransi Escrow</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsGuideOpen(true)} className="hover:text-blue-600 underline">
              Panduan Google Sheets Backend
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="hover:text-blue-600 underline">
              Konfigurasi Branding
            </button>
            <a
              href={`https://wa.me/${branding.contact.whatsappAdmin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 font-bold hover:underline"
            >
              WhatsApp Admin ({branding.contact.whatsappDisplay})
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
