import React from 'react';
import { MenuItem } from '../types';
import { DriveImage } from './DriveImage';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: MenuItem[];
  currency: 'IDR' | 'USD';
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromWishlist: (itemId: string) => void;
  onClearWishlist: () => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlistItems,
  currency,
  onAddToCart,
  onRemoveFromWishlist,
  onClearWishlist,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-auto max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-red-100 text-red-600 rounded-xl text-lg">❤️</span>
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                Daftar Keinginan (Wishlist)
              </h3>
              <p className="text-xs text-slate-500">
                {wishlistItems.length} barang titipan tersimpan di perangkat Anda
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {wishlistItems.length > 0 && (
              <button
                type="button"
                onClick={onClearWishlist}
                className="text-xs text-red-600 hover:underline font-semibold px-2 py-1"
              >
                Hapus Semua
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        {wishlistItems.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <span className="text-4xl block">🤍</span>
            <h4 className="font-bold text-base text-slate-900">Wishlist Anda Masih Kosong</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Klik ikon hati di kartu produk untuk menyimpan barang jastip favorit Anda agar tidak lupa saat traveler terbang.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all mt-2"
            >
              Jelajahi Produk
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {wishlistItems.map((item) => {
              const formattedPrice =
                currency === 'IDR'
                  ? `Rp ${item.priceIdr.toLocaleString('id-ID')}`
                  : `$ ${(item.priceIdr / 15800).toFixed(2)}`;

              const isSoldOut = item.status === 'Sold Out';

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                      <DriveImage
                        driveIdOrUrl={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.2 rounded-full">
                          {item.originCity.split('•')[0]}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {item.shopperName}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug truncate max-w-xs sm:max-w-sm">
                        {item.name}
                      </h4>
                      <span className="font-bold text-sm text-blue-700 font-mono block mt-0.5">
                        {formattedPrice}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <button
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => {
                        onAddToCart(item);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 ${
                        isSoldOut
                          ? 'bg-slate-300 cursor-not-allowed opacity-60'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <span>🛍️</span>
                      <span>+ Keranjang</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveFromWishlist(item.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Hapus dari Wishlist"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
