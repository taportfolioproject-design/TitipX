import React, { useState } from 'react';
import { BrandingConfig, saveBranding } from '../config/branding';

interface BrandingSettingsModalProps {
  branding: BrandingConfig;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: BrandingConfig) => void;
  onOpenGuide: () => void;
}

export const BrandingSettingsModal: React.FC<BrandingSettingsModalProps> = ({
  branding,
  isOpen,
  onClose,
  onSaved,
  onOpenGuide,
}) => {
  const [formData, setFormData] = useState<BrandingConfig>(branding);
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!formData.appsScriptUrl) {
      setTestResult('Silakan masukkan URL Apps Script terlebih dahulu.');
      return;
    }
    setIsTestingUrl(true);
    setTestResult(null);
    try {
      const url = formData.appsScriptUrl.includes('?')
        ? `${formData.appsScriptUrl}&action=getAll`
        : `${formData.appsScriptUrl}?action=getAll`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'success') {
        setTestResult(' Terkoneksi! Spreadsheet berhasil diakses via Google Apps Script.');
      } else {
        setTestResult(` Gagal: ${data.message || 'Format respons tidak valid'}`);
      }
    } catch (err) {
      setTestResult(' Error: Pastikan Web App di-deploy dengan akses "Anyone" (Siapa saja).');
    } finally {
      setIsTestingUrl(false);
    }
  };

  const handleSave = () => {
    const updated = saveBranding(formData);
    onSaved(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-600 text-white rounded-lg text-sm font-bold">⚙️</span>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Konfigurasi Toko & Branding</h3>
              <p className="text-xs text-slate-500">Edit data toko tanpa mengubah kode komponen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
          {/* Section: Google Apps Script Backend URL */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Integrasi Google Apps Script (REST API)
              </span>
              <button
                type="button"
                onClick={onOpenGuide}
                className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                📖 Buka Panduan Kode Code.gs
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Web App URL (Google Apps Script)
              </label>
              <input
                type="url"
                value={formData.appsScriptUrl || ''}
                onChange={(e) => setFormData({ ...formData, appsScriptUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Jika kosong, sistem otomatis memakai mode demo offline dengan penyimpanan lokal.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingUrl || !formData.appsScriptUrl}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isTestingUrl ? 'Menguji...' : 'Uji Koneksi API'}
              </button>
              {testResult && (
                <span className="text-xs font-medium text-slate-700">{testResult}</span>
              )}
            </div>
          </div>

          {/* Section: Identitas Toko */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 border-b pb-1">Identitas Toko</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Toko</label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL Logo Toko</label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Section: Kontak & WhatsApp */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 border-b pb-1">Kontak & WhatsApp Admin</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WA (Format: 628xxx)</label>
                <input
                  type="text"
                  value={formData.contact.whatsappAdmin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: { ...formData.contact, whatsappAdmin: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tampilan Nomor WA</label>
                <input
                  type="text"
                  value={formData.contact.whatsappDisplay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: { ...formData.contact, whatsappDisplay: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Akun Instagram</label>
                <input
                  type="text"
                  value={formData.contact.instagram}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: { ...formData.contact, instagram: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Dukungan</label>
                <input
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: { ...formData.contact, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Rekening Bank & QRIS */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 border-b pb-1">Pembayaran & Rekening Bank</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Bank</label>
                <input
                  type="text"
                  value={formData.payment.bankName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment: { ...formData.payment, bankName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  value={formData.payment.accountNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment: { ...formData.payment, accountNumber: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Atas Nama (Rekening)</label>
                <input
                  type="text"
                  value={formData.payment.accountHolder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment: { ...formData.payment, accountHolder: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL Gambar Barcode QRIS / Google Drive ID
              </label>
              <input
                type="text"
                value={formData.payment.qrisImageUrl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    payment: { ...formData.payment, qrisImageUrl: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-200 font-medium"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm"
          >
            Simpan Konfigurasi
          </button>
        </div>
      </div>
    </div>
  );
};
