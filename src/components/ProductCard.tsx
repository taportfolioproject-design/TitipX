import React, { useState } from 'react';
import { MenuItem } from '../types';
import { DriveImage } from './DriveImage';

interface ProductCardProps {
  item: MenuItem;
  currency: 'IDR' | 'USD';
  isWishlisted: boolean;
  onAddToCart: (item: MenuItem) => void;
  onQuickView: (item: MenuItem) => void;
  onToggleWishlist: (item: MenuItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  currency,
  isWishlisted,
  onAddToCart,
  onQuickView,
  onToggleWishlist,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const formattedPrice =
    currency === 'IDR'
      ? `Rp ${item.priceIdr.toLocaleString('id-ID')}`
      : `$ ${(item.priceIdr / 15800).toFixed(2)}`;

  // Country Flag helper
  const getFlag = (code: string) => {
    switch (code) {
      case 'japan':
        return '🇯🇵';
      case 'korea':
        return '🇰🇷';
      case 'usa':
        return '🇺🇸';
      case 'thailand':
        return '🇹🇭';
      case 'france':
        return '🇫🇷';
      default:
        return '🌐';
    }
  };

  const getStatusBadge = (status: MenuItem['status']) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Limited Space':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'In-Flight':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Sold Out':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const isSoldOut = item.status === 'Sold Out';

  return (
    <article className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/80 flex flex-col justify-between">
      <div>
        {/* Thumbnail Area */}
        <div className="relative w-full aspect-square overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onQuickView(item)}>
          <DriveImage
            driveIdOrUrl={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-900 font-bold text-[11px] shadow-sm">
              <span>{getFlag(item.countryCode)}</span> {item.originCity.split('•')[0]}
            </span>
            {item.verifiedBadge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] shadow-sm">
                ✈️ {item.verifiedBadge}
              </span>
            )}
          </div>

          {/* Wishlist Heart Button */}
          <button
            type="button"
            aria-label={isWishlisted ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}
            title={isWishlisted ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(item);
            }}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-sm z-10 active:scale-125 ${
              isWishlisted
                ? 'bg-red-50 text-red-500 scale-105 ring-2 ring-red-400/50 shadow-md'
                : 'bg-white/90 text-slate-400 hover:text-red-500 hover:bg-white'
            }`}
          >
            <span className="text-base select-none">
              {isWishlisted ? '❤️' : '🤍'}
            </span>
          </button>

          {/* Shopper Info Overlay */}
          <div className="absolute bottom-2 left-2 right-2 z-10">
            <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center justify-between text-[11px] text-white shadow-sm">
              <span className="flex items-center gap-1 text-emerald-400 font-medium truncate">
                <span>🛡️</span> {item.shopperName}
              </span>
              <span className="text-slate-300 font-mono text-[10px] shrink-0">⭐ {item.rating}</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              {item.category}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                item.status
              )}`}
            >
              {item.status}
            </span>
          </div>

          <h3
            onClick={() => onQuickView(item)}
            className="font-bold text-sm sm:text-base text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug cursor-pointer"
          >
            {item.name}
          </h3>

          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>

          {/* Transparent Cost Breakdown pill */}
          <div className="relative mt-2.5">
            <button
              type="button"
              onClick={() => setShowTooltip(!showTooltip)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="w-full px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-between text-xs text-slate-600 transition-colors border border-slate-100"
            >
              <span className="flex items-center gap-1 font-medium">
                <span className="text-blue-600">ℹ️</span> Rincian Kurs & Jastip
              </span>
              <span className="font-semibold text-emerald-700 text-[11px]">All-in</span>
            </button>

            {showTooltip && (
              <div className="absolute left-0 bottom-full mb-1 w-64 bg-slate-900 text-white p-3 rounded-xl shadow-xl z-30 text-xs pointer-events-none animate-in fade-in">
                <p className="font-bold border-b border-slate-700 pb-1 mb-1.5 text-blue-400">
                  Transparansi Biaya ({item.originCountry})
                </p>
                <div className="flex justify-between text-slate-300 py-0.5">
                  <span>Estimasi Toko Fisik</span>
                  <span className="font-mono">{item.originalPriceForeign}</span>
                </div>
                <div className="flex justify-between text-slate-300 py-0.5">
                  <span>Margin Jastip & Bagasi</span>
                  <span className="font-mono">{item.marginPercent}%</span>
                </div>
                <div className="flex justify-between text-slate-300 py-0.5">
                  <span>Slot Kuota Bagasi</span>
                  <span className="font-mono">{item.slotsTotal - item.slotsBooked} slot tersisa</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold pt-1.5 mt-1 border-t border-slate-700">
                  <span>Harga Bersih Sampai Indo:</span>
                  <span>{formattedPrice}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Area */}
      <div className="p-4 pt-2 border-t border-slate-100">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Harga Terima Bersih
            </span>
            <span className="text-lg sm:text-xl font-bold text-blue-700 font-mono">
              {formattedPrice}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            {item.weightKg} kg / unit
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onQuickView(item)}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            Detail
          </button>
          <button
            type="button"
            disabled={isSoldOut}
            onClick={() => onAddToCart(item)}
            className={`py-2 px-3.5 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 ${
              isSoldOut
                ? 'bg-slate-300 cursor-not-allowed opacity-60'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <span>🛍️</span>
            <span>+ Keranjang</span>
          </button>
        </div>
      </div>
    </article>
  );
};
