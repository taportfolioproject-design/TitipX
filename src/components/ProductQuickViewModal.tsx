import React, { useState } from 'react';
import { MenuItem } from '../types';
import { DriveImage } from './DriveImage';

interface ProductQuickViewModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  isWishlisted?: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, notes: string) => void;
  onToggleWishlist?: (item: MenuItem) => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  item,
  isOpen,
  isWishlisted = false,
  onClose,
  onAddToCart,
  onToggleWishlist,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  if (!isOpen || !item) return null;

  const handleAdd = () => {
    onAddToCart(item, quantity, notes);
    onClose();
    setQuantity(1);
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors z-10"
        >
          ✕
        </button>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Image */}
          <div className="sm:w-1/2 aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
            <DriveImage
              driveIdOrUrl={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="sm:w-1/2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                  {item.originCity}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {item.status}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 leading-snug">{item.name}</h2>
              <p className="text-2xl font-bold text-blue-600 mt-2 font-mono">
                Rp {item.priceIdr.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Estimasi harga toko: {item.originalPriceForeign} • Berat: {item.weightKg} kg
              </p>

              <div className="my-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Traveler Shopper:</span>
                  <span className="font-bold">{item.shopperName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Penerbangan:</span>
                  <span className="font-semibold text-blue-700">{item.shopperFlight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sisa Kuota Bagasi:</span>
                  <span className="font-bold text-emerald-600">
                    {item.slotsTotal - item.slotsBooked} dari {item.slotsTotal} slot
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">{item.description}</p>

              {/* Note input */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan untuk Traveler (Warna/Varian/Bubble wrap):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Mohon box tetap mulus dengan ekstra bubble wrap"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold text-slate-700">Jumlah:</span>
                <div className="flex items-center border border-slate-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100 font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="w-7 h-7 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onToggleWishlist && (
                <button
                  type="button"
                  onClick={() => onToggleWishlist(item)}
                  title={isWishlisted ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'}
                  className={`p-3 rounded-xl border text-base font-bold transition-all flex items-center justify-center shrink-0 ${
                    isWishlisted
                      ? 'bg-red-50 border-red-300 text-red-500 shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  }`}
                >
                  {isWishlisted ? '❤️' : '🤍'}
                </button>
              )}
              <button
                onClick={handleAdd}
                disabled={item.status === 'Sold Out'}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>🛍️</span>
                <span>Masukkan ke Keranjang (Rp {(item.priceIdr * quantity).toLocaleString('id-ID')})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
