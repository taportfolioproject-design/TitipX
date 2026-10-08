import React, { useState } from 'react';
import { BrandingConfig } from '../config/branding';
import { PaymentMethodId } from '../types';
import { DriveImage } from './DriveImage';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  branding: BrandingConfig;
  onConfirm: (method: PaymentMethodId) => void;
  isSubmitting?: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  branding,
  onConfirm,
  isSubmitting = false,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('qris');
  const [copiedBank, setCopiedBank] = useState(false);

  if (!isOpen) return null;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(branding.payment.accountNumber);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-600 text-white rounded-xl text-sm">🔒</span>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900">
                Pilih Metode Pembayaran Escrow
              </h3>
              <p className="text-xs text-slate-500">
                Dana diamankan sistem rekber hingga barang Anda tiba
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Payable Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">
                Total Nominal Pembayaran
              </span>
              <span className="text-xl sm:text-2xl font-bold text-blue-900 font-mono">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
              🛡️ 100% Bergaransi
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            {/* Method 1: QRIS */}
            <label
              onClick={() => setSelectedMethod('qris')}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedMethod === 'qris'
                  ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={selectedMethod === 'qris'}
                onChange={() => setSelectedMethod('qris')}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>📱</span> QRIS Instant (Semua Bank & E-Wallet)
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Tercepat
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scan barcode langsung dari BCA Mobile, Livin', GoPay, OVO, ShopeePay, Dana.
                </p>

                {selectedMethod === 'qris' && (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 flex flex-col items-center">
                    <div className="w-48 h-48 rounded-lg overflow-hidden border border-slate-200 p-2 bg-white flex items-center justify-center shadow-inner">
                      <DriveImage
                        driveIdOrUrl={branding.payment.qrisImageUrl}
                        alt="QRIS Barcode"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 text-center">
                      Simpan barcode atau scan sekarang. Simpan bukti transfer untuk verifikasi admin.
                    </p>
                  </div>
                )}
              </div>
            </label>

            {/* Method 2: Transfer Bank */}
            <label
              onClick={() => setSelectedMethod('transfer')}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedMethod === 'transfer'
                  ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={selectedMethod === 'transfer'}
                onChange={() => setSelectedMethod('transfer')}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>🏦</span> Transfer Bank ({branding.payment.bankName})
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                    Manual
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Transfer ke rekening resmi operasional TitipX.
                </p>

                {selectedMethod === 'transfer' && (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Bank Tujuan:</span>
                      <span className="font-bold text-slate-900">{branding.payment.bankName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Atas Nama:</span>
                      <span className="font-bold text-slate-900">{branding.payment.accountHolder}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Nomor Rekening:</span>
                        <span className="font-mono font-bold text-base text-blue-700">
                          {branding.payment.accountNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                      >
                        {copiedBank ? ' Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </label>

            {/* Method 3: Cash On Delivery / Hub Pickup */}
            <label
              onClick={() => setSelectedMethod('cash')}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedMethod === 'cash'
                  ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={selectedMethod === 'cash'}
                onChange={() => setSelectedMethod('cash')}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>💵</span> Bayar Tunai di Hub TitipX (COD)
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    Hub T3 / Pick-up
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bayar tunai saat mengambil paket langsung di meeting point / Hub Bandara Soetta T3.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
          >
            Kembali
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onConfirm(selectedMethod)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Menyimpan ke Google Sheets...</span>
            ) : (
              <>
                <span>Selesaikan Transaksi</span>
                <span>➔</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
