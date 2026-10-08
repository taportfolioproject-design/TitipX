import React from 'react';
import { BrandingConfig } from '../config/branding';

interface NavbarProps {
  branding: BrandingConfig;
  activeView: 'catalog' | 'cart' | 'admin';
  cartCount: number;
  wishlistCount: number;
  currency: 'IDR' | 'USD';
  onToggleCurrency: () => void;
  onNavigate: (view: 'catalog' | 'cart' | 'admin') => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onOpenWishlist: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  branding,
  activeView,
  cartCount,
  wishlistCount,
  currency,
  onToggleCurrency,
  onNavigate,
  onOpenSettings,
  onOpenGuide,
  onOpenWishlist,
}) => {
  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-[1440px] mx-auto h-16 sm:h-20 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Logo & Store Name */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => onNavigate('catalog')}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              ✈️
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
                  {branding.storeName}
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                  P2P
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                {branding.tagline}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Switcher */}
          <div className="hidden md:flex items-center p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === 'catalog'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Katalog Jastip
            </button>
            <button
              type="button"
              onClick={() => onNavigate('cart')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                activeView === 'cart'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Keranjang</span>
              {cartCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === 'admin'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin Portal
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency Switcher */}
            <button
              type="button"
              onClick={onToggleCurrency}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center gap-1"
              title="Ganti Mata Uang"
            >
              <span className="text-slate-400 text-[10px]">Mata Uang:</span>
              <span className="text-blue-600">{currency}</span>
            </button>

            {/* Quick Code.gs & Guide button */}
            <button
              type="button"
              onClick={onOpenGuide}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              title="Panduan Google Apps Script"
            >
              <span>📊</span>
              <span>Backend Code.gs</span>
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={onOpenWishlist}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center"
              title="Daftar Keinginan (Wishlist)"
            >
              <span>❤️</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold leading-tight">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Settings button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Konfigurasi Toko & Branding"
            >
              <span>⚙️</span>
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => onNavigate('cart')}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm active:scale-95 font-bold text-xs"
            >
              <span>🛍️</span>
              <span className="hidden sm:inline">Keranjang</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold leading-none">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-lg pb-safe">
        <div className="h-16 px-4 flex items-center justify-around">
          <button
            onClick={() => onNavigate('catalog')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeView === 'catalog' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <span className="text-lg">🏪</span>
            <span className="text-[10px] mt-0.5">Katalog</span>
          </button>
          <button
            onClick={onOpenWishlist}
            className="flex flex-col items-center justify-center flex-1 py-1 relative text-slate-500 transition-colors"
          >
            <div className="relative">
              <span className="text-lg">❤️</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Wishlist</span>
          </button>
          <button
            onClick={() => onNavigate('cart')}
            className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors ${
              activeView === 'cart' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <div className="relative">
              <span className="text-lg">🛍️</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Keranjang</span>
          </button>
          <button
            onClick={() => onNavigate('admin')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeView === 'admin' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <span className="text-lg">🛡️</span>
            <span className="text-[10px] mt-0.5">Admin</span>
          </button>
        </div>
      </nav>
    </>
  );
};
