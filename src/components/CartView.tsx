import React, { useState } from 'react';
import { CartItem, PaymentMethodId, OrderRecord } from '../types';
import { BrandingConfig } from '../config/branding';
import { DriveImage } from './DriveImage';
import { PaymentModal } from './PaymentModal';
import { submitOrder } from '../services/api';

interface CartViewProps {
  cart: CartItem[];
  branding: BrandingConfig;
  onUpdateQty: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onContinueShopping: () => void;
  onOrderSuccess: (order: OrderRecord) => void;
}

export const CartView: React.FC<CartViewProps> = ({
  cart,
  branding,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onContinueShopping,
  onOrderSuccess,
}) => {
  const [recipientName, setRecipientName] = useState('Adinda Laksmi Putri');
  const [recipientPhone, setRecipientPhone] = useState('+62 812-9988-3412');
  const [recipientAddress, setRecipientAddress] = useState(
    'Apartemen Senopati Suites Tower 2 Unit 18B, Jl. Senopati No. 41, Kebayoran Baru, Jakarta Selatan 12190'
  );
  const [courierFee, setCourierFee] = useState(32000);
  const [courierName, setCourierName] = useState('Paxel Next-Day Safe Cargo');
  const [specialInstructions, setSpecialInstructions] = useState(
    'Mohon sertakan struk pembelian asli toko fisik dalam amplop untuk bukti otentikasi.'
  );

  const [promoCode, setPromoCode] = useState('FIRSTJASTIP');
  const [isPromoApplied, setIsPromoApplied] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<OrderRecord | null>(null);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.item.priceIdr * item.quantity, 0);
  const travelerFee = cart.length > 0 ? 180000 : 0;
  const customsBuffer = cart.length > 0 ? 75000 : 0;
  const platformFee = cart.length > 0 ? 5000 : 0;
  const promoDiscount = isPromoApplied ? 50000 : 0;

  const grandTotal = Math.max(
    0,
    subtotal + travelerFee + customsBuffer + courierFee + platformFee - promoDiscount
  );

  const handleCourierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fee = parseInt(e.target.value, 10);
    setCourierFee(fee);
    if (fee === 32000) setCourierName('Paxel Next-Day Safe Cargo');
    else if (fee === 45000) setCourierName('JNE YES Next-Day');
    else setCourierName('Instant Courier Same-Day');
  };

  const handleConfirmPayment = async (method: PaymentMethodId) => {
    setIsSubmitting(true);
    const orderNumber = '#JT-' + Math.floor(1000 + Math.random() * 9000);

    const itemsSummary = cart
      .map((c) => `${c.quantity}x ${c.item.name}`)
      .join(', ');

    const newOrder: OrderRecord = {
      id: 'ord-' + Date.now(),
      orderNumber,
      customerName: recipientName,
      customerPhone: recipientPhone,
      customerAddress: recipientAddress,
      itemsSummary,
      itemsDetail: cart.map((c) => ({
        name: c.item.name,
        quantity: c.quantity,
        price: c.item.priceIdr,
        subtotal: c.item.priceIdr * c.quantity,
      })),
      subtotal,
      travelerFee,
      customsBuffer,
      courierFee,
      discount: promoDiscount,
      grandTotal,
      paymentMethod:
        method === 'qris'
          ? 'QRIS Instant'
          : method === 'transfer'
          ? `Transfer Bank (${branding.payment.bankName})`
          : 'Cash On Delivery (Hub T3)',
      status: 'Pending Purchase',
      assignedTraveler: 'Mei Ling (Traveler)',
      flightCode: 'NH855 (HND ➔ CGK)',
      createdAt: new Date().toLocaleString('id-ID'),
    };

    try {
      await submitOrder(newOrder);
      setLastPlacedOrder(newOrder);
      onOrderSuccess(newOrder);
      onClearCart();
      setIsPaymentModalOpen(false);
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan pesanan: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS STATE
  if (lastPlacedOrder) {
    const waText =
      `Halo Admin ${branding.storeName},\n\n` +
      `Saya sudah melakukan checkout pesanan dengan rincian:\n` +
      `🔖 No. Pesanan: ${lastPlacedOrder.orderNumber}\n` +
      `👤 Nama: ${lastPlacedOrder.customerName}\n` +
      `📦 Daftar Barang: ${lastPlacedOrder.itemsSummary}\n` +
      `💰 Total: Rp ${lastPlacedOrder.grandTotal.toLocaleString('id-ID')}\n` +
      `💳 Metode: ${lastPlacedOrder.paymentMethod}\n` +
      `📍 Alamat: ${lastPlacedOrder.customerAddress}\n\n` +
      `Mohon konfirmasi dan verifikasi ketersediaan bagasi traveler. Terima kasih!`;

    const waLink = `https://wa.me/${branding.contact.whatsappAdmin}?text=${encodeURIComponent(
      waText
    )}`;

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          ✓
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
          Pesanan Berhasil Dicatat!
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
          Terima Kasih, {lastPlacedOrder.customerName}
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Nomor Pesanan Anda: <strong className="font-mono text-blue-600">{lastPlacedOrder.orderNumber}</strong>
        </p>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
          Data transaksi telah berhasil disinkronkan ke sistem database Google Spreadsheet.
        </p>

        <div className="my-6 p-4 bg-white border border-slate-200 rounded-2xl text-left text-xs space-y-2 max-w-md mx-auto shadow-sm">
          <div className="flex justify-between font-bold border-b pb-2">
            <span>Rincian Transaksi</span>
            <span className="text-blue-600 font-mono">
              Rp {lastPlacedOrder.grandTotal.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Metode Pembayaran:</span>
            <span className="font-semibold text-slate-900">{lastPlacedOrder.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Status Escrow:</span>
            <span className="font-bold text-emerald-600">100% Dilindungi Platform</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Traveler Ditugaskan:</span>
            <span className="font-semibold text-slate-900">{lastPlacedOrder.assignedTraveler}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <span>💬</span>
            <span>Konfirmasi Bukti ke WhatsApp Admin</span>
          </a>
          <button
            onClick={() => {
              setLastPlacedOrder(null);
              onContinueShopping();
            }}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl"
          >
            Kembali Belanja
          </button>
        </div>
      </div>
    );
  }

  // EMPTY STATE
  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          🛍️
        </div>
        <h2 className="text-xl font-bold text-slate-900">Keranjang Belanja Kosong</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Pilih barang-barang favorit dari Tokyo, Seoul, LA, atau Paris dan tambahkan ke keranjang Anda.
        </p>
        <button
          onClick={onContinueShopping}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all"
        >
          Lihat Katalog Jastip
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top Banner Carrier Flight */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            ✈️
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900">
              Konsolidasi Bagasi Carrier #JG-882 (Mei Ling)
            </p>
            <p className="text-xs text-slate-600">
              Tiba CGK Terminal 3: <strong className="text-slate-900">28 Nov 2024, 17:40 WIB</strong>. Kurir lokal mulai jalan 29 Nov.
            </p>
          </div>
        </div>
        <span className="self-start sm:self-center px-3 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
          Slot Bagasi Diamankan
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Items List & Delivery Form */}
        <div className="w-full lg:w-2/3 space-y-6">
          {/* Header Cart */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl font-bold text-slate-900">Barang Titipan Anda</h1>
              <span className="text-xs text-slate-500">({cart.length} Request)</span>
            </div>
            <button
              onClick={onClearCart}
              className="text-xs text-red-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>🗑️</span> Kosongkan
            </button>
          </div>

          {/* Cart Item Cards */}
          <div className="space-y-3">
            {cart.map(({ item, quantity, notes }) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row gap-4 transition-all hover:shadow-md"
              >
                <div className="relative w-full sm:w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                  <DriveImage
                    driveIdOrUrl={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-white/90 text-slate-900 font-bold text-[9px]">
                    {item.originCity.split('•')[0]}
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">{item.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.shopperName} • {item.originCity}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="font-bold text-base text-blue-700 font-mono">
                        Rp {(item.priceIdr * quantity).toLocaleString('id-ID')}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Rp {item.priceIdr.toLocaleString('id-ID')} / unit
                      </p>
                    </div>
                  </div>

                  {notes && (
                    <div className="my-1.5 p-2 bg-slate-50 rounded-lg text-xs text-slate-600 italic">
                      "{notes}"
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                    <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <span>🧾</span> Disertai struk toko fisik
                    </span>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-slate-200 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100 font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-xs font-bold">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100 font-bold text-xs"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="text-slate-400 hover:text-red-500 text-xs p-1"
                        title="Hapus"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recipient & Shipping Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <span className="p-2 bg-blue-100 text-blue-700 rounded-xl text-base">📦</span>
              <div>
                <h2 className="font-bold text-base text-slate-900">Alamat Pengiriman & Ekspedisi</h2>
                <p className="text-xs text-slate-500">
                  Dikirim langsung setelah traveler menyelesaikan pemeriksaan bea cukai
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Penerima *</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp (Untuk Live Update Resi) *
                </label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap Penerima *</label>
                <textarea
                  rows={2}
                  required
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Pilihan Ekspedisi Kurir Lokal *</label>
                <select
                  value={courierFee}
                  onChange={handleCourierChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value={32000}>Paxel Next-Day Safe Cargo (Rp 32.000) - Rekomendasi Makanan/Skincare</option>
                  <option value={45000}>JNE YES Next-Day Super Kilat (Rp 45.000)</option>
                  <option value={65000}>Instant Same-Day Courier Jadetabek (Rp 65.000)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Tambahan untuk Traveler / Tim QC:
                </label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Contoh: Mohon dipacking kardus tebal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Cost Ledger & Summary */}
        <div className="w-full lg:w-1/3 sticky top-24 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-base text-slate-900">Rincian Pembayaran</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Rekber Terlindungi
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal Barang ({cart.reduce((s, i) => s + i.quantity, 0)} item)</span>
                <span className="font-semibold text-slate-900">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Jastip & Hand-carry</span>
                <span className="font-semibold text-slate-900">Rp {travelerFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Buffer Bea Cukai / Kuota Impor</span>
                <span className="font-semibold text-slate-900">Rp {customsBuffer.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Kurir Domestik ({courierName.split(' ')[0]})</span>
                <span className="font-semibold text-slate-900">Rp {courierFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Rekber & Proteksi Paket</span>
                <span className="font-semibold text-slate-900">Rp {platformFee.toLocaleString('id-ID')}</span>
              </div>

              {isPromoApplied && (
                <div className="flex justify-between text-emerald-600 font-bold pt-1">
                  <span>Diskon Kupon ('{promoCode}')</span>
                  <span>-Rp {promoDiscount.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            {/* Promo Code Input */}
            <div className="flex gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Kode Promo"
                className="flex-1 bg-transparent px-2 text-xs font-bold uppercase outline-none"
              />
              <button
                type="button"
                onClick={() => setIsPromoApplied(!isPromoApplied)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  isPromoApplied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {isPromoApplied ? 'TERPASANG' : 'GUNAKAN'}
              </button>
            </div>

            {/* Total Display */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Yang Harus Dibayar
                </span>
                <span className="text-2xl font-bold text-blue-700 font-mono">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
              <span className="text-xs text-slate-400">≈ ${(grandTotal / 15800).toFixed(2)} USD</span>
            </div>

            {/* Guarantee Callout */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 flex items-start gap-2">
              <span className="text-base">🛡️</span>
              <p className="leading-relaxed">
                <strong>Garansi Rekber 100%:</strong> Dana Anda hanya akan diteruskan ke traveler setelah Anda memeriksa foto struk fisik dan kondisi barang saat tiba.
              </p>
            </div>

            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>🔒</span>
              <span>Lanjut Pilih Metode Pembayaran</span>
            </button>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        grandTotal={grandTotal}
        branding={branding}
        onConfirm={handleConfirmPayment}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
