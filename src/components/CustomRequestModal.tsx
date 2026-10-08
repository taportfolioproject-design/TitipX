import React, { useState } from 'react';
import { BrandingConfig } from '../config/branding';

interface CustomRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: BrandingConfig;
  onSubmitted: (msg: string) => void;
}

export const CustomRequestModal: React.FC<CustomRequestModalProps> = ({
  isOpen,
  onClose,
  branding,
  onSubmitted,
}) => {
  const [country, setCountry] = useState('Jepang (Tokyo / Osaka)');
  const [itemName, setItemName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [estPrice, setEstPrice] = useState('');
  const [bountyTip, setBountyTip] = useState('Rp 50.000');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare message to send to WhatsApp Admin as well
    const textMsg = `Halo Admin ${branding.storeName}, saya ingin request jastip khusus:\n\n` +
      `📦 Barang: ${itemName}\n` +
      `📍 Negara Asal: ${country}\n` +
      `🔗 Link Referensi: ${linkUrl || '-'}\n` +
      `💰 Estimasi Harga: ${estPrice}\n` +
      `🎁 Tip/Bounty Traveler: ${bountyTip}\n` +
      `📝 Catatan: ${notes || '-'}`;

    const waUrl = `https://wa.me/${branding.contact.whatsappAdmin}?text=${encodeURIComponent(textMsg)}`;
    window.open(waUrl, '_blank');

    onSubmitted('Request kustom berhasil diajukan! Admin & traveler sedang memeriksa barang Anda.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="p-2 bg-blue-100 text-blue-700 rounded-xl text-lg">✈️</span>
          <div>
            <h3 className="font-bold text-lg text-slate-900">Ajukan Request Jastip Khusus</h3>
            <p className="text-xs text-slate-500">Punya barang incaran yang belum ada di katalog?</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs text-slate-700">
          <div>
            <label className="block font-semibold mb-1">Negara / Kota Asal Pembelian *</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option>🇯🇵 Jepang (Tokyo / Osaka / Fukuoka)</option>
              <option>🇰🇷 Korea Selatan (Seoul / Busan)</option>
              <option>🇺🇸 Amerika Serikat (Los Angeles / New York)</option>
              <option>🇹🇭 Thailand (Bangkok)</option>
              <option>🇫🇷 Prancis (Paris)</option>
              <option>🇬🇧 Inggris (London)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Nama Barang & Varian Spesifik *</label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Contoh: Starbucks Japan Sakura Tumbler 2024 / PopMart Labubu"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Link Referensi Toko / Foto (Opsional)</label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Link produk website resmi atau Google Drive"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Estimasi Harga Asli *</label>
              <input
                type="text"
                required
                value={estPrice}
                onChange={(e) => setEstPrice(e.target.value)}
                placeholder="Contoh: ¥ 3,000 / Rp 320.000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Penawaran Fee Jastip</label>
              <input
                type="text"
                value={bountyTip}
                onChange={(e) => setBountyTip(e.target.value)}
                placeholder="Contoh: Rp 50.000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Catatan Khusus</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sertakan struk asli toko, warna cadangan jika habis, dll."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-[11px] text-blue-900">
            <span>🛡️</span>
            <span>
              Dana diamankan dengan <strong>Sistem Rekber/Escrow</strong>. Traveler belanja langsung di toko fisik resmi.
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <span>💬</span>
              <span>Kirim ke Admin via WA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
