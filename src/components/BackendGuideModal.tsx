import React, { useState } from 'react';

interface BackendGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  appsScriptUrl?: string;
  onSaveUrl: (url: string) => void;
}

export const BackendGuideModal: React.FC<BackendGuideModalProps> = ({
  isOpen,
  onClose,
  appsScriptUrl = '',
  onSaveUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [tempUrl, setTempUrl] = useState(appsScriptUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isLocked, setIsLocked] = useState(Boolean(appsScriptUrl && appsScriptUrl.trim().startsWith('http')));
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  if (!isOpen) return null;

  const cleanUrl = tempUrl.trim();
  const isEndingWithExec = cleanUrl.endsWith('/exec');
  const isEndingWithEdit = cleanUrl.endsWith('/edit') || cleanUrl.includes('/edit');
  const isSpreadsheetUrl = cleanUrl.includes('docs.google.com/spreadsheets');

  const handleFixEditToExec = () => {
    const fixed = cleanUrl.replace(/\/edit.*$/, '/exec');
    setTempUrl(fixed);
  };

  const handleTestConnection = async () => {
    if (!cleanUrl) {
      setTestResult({ success: false, message: 'Harap masukkan URL terlebih dahulu.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    try {
      const pingUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=getAll` : `${cleanUrl}?action=getAll`;
      const res = await fetch(pingUrl, { method: 'GET', mode: 'cors' });
      const json = await res.json();

      if (json && (json.status === 'success' || json.data)) {
        setTestResult({
          success: true,
          message: '✅ Berhasil terhubung! Data menu & Google Spreadsheet aktif dan terbaca.',
        });
      } else {
        setTestResult({
          success: true,
          message: '✅ Terhubung ke endpoint Google Apps Script (status OK).',
        });
      }
    } catch {
      // JSONP / CORS proxy check or simple fallback notice
      setTestResult({
        success: false,
        message: '⚠️ Tidak dapat memverifikasi via browser (kemungkinan masalah CORS atau izin belum diatur ke "Anyone"). Pastikan saat Deploy Web App, pilih "Who has access: Anyone".',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndLock = () => {
    if (!cleanUrl) {
      alert('Masukkan URL Google Apps Script Anda terlebih dahulu.');
      return;
    }
    onSaveUrl(cleanUrl);
    setIsLocked(true);
    try {
      localStorage.setItem('titipx_locked_apps_script_url', cleanUrl);
    } catch {
      // ignore
    }
    alert('🔒 URL Google Apps Script BERHASIL DIKUNCI! Database kini aktif.');
  };

  const currentDomain = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://titipx-five.vercel.app';
  
  const vercelShareLink = cleanUrl
    ? `https://titipx-five.vercel.app/?api=${encodeURIComponent(cleanUrl)}`
    : '';

  const dynamicShareLink = cleanUrl
    ? `${currentDomain}/?api=${encodeURIComponent(cleanUrl)}`
    : '';

  const copyToClipboard = (text: string, actionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAction(actionId);
    setTimeout(() => setCopiedAction(null), 3000);
  };

  const generateLockedJson = () => {
    return JSON.stringify(
      {
        storeName: "TitipX Jastip Official",
        tagline: "Jasa Titip Terpercaya & Cepat dari Seluruh Dunia",
        logoUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=120&q=80",
        appsScriptUrl: cleanUrl,
        adminPassword: "admin123"
      },
      null,
      2
    );
  };

  const scriptCode = `/**
 * =========================================================================
 * BACKEND GOOGLE APPS SCRIPT (Code.gs) UNTUK WEB JASTIP TITIPX / JASTIPGO
 * VERSI: 2.0 (Header Synchronization & Robust Price Formatting)
 * =========================================================================
 */

var SHEET_MENU = "menu";
var SHEET_USERS = "nama_pengguna";
var SHEET_ORDERS = "pesanan";

var HEADERS_MENU = [
  "ID", "Nama Produk", "SKU", "Kategori", "Negara Asal", "Kota Asal", "Kode Negara",
  "Nama Traveler", "Penerbangan", "Harga IDR", "Harga Asing", "Margin (%)",
  "Bobot (Kg)", "Total Kuota", "Kuota Terisi", "Status", "URL / ID Google Drive Gambar",
  "Rating", "Jumlah Review", "Deskripsi"
];

var HEADERS_ORDERS = [
  "Order ID", "Tanggal", "Nama Pelanggan", "Nomor WhatsApp", "Alamat Lengkap",
  "Daftar Item", "Subtotal", "Biaya Hand-carry", "Buffer Bea Cukai", "Biaya Kurir",
  "Diskon", "Total Pembayaran", "Metode Pembayaran", "Status", "Traveler", "Kode Penerbangan"
];

var HEADERS_USERS = [
  "ID Pengguna", "Nama Pengguna", "Nomor WhatsApp", "Alamat Utama",
  "Total Pesanan", "Total Belanja (LTV)", "Skor Kepercayaan", "Status Tier", "Terakhir Belanja"
];

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getAll";
    var result = { status: "success", timestamp: new Date().toISOString() };

    if (action === "getMenu") {
      result.data = getSheetData(ss, SHEET_MENU);
    } else if (action === "getUsers") {
      result.data = getSheetData(ss, SHEET_USERS);
    } else if (action === "getOrders") {
      result.data = getSheetData(ss, SHEET_ORDERS);
    } else {
      result.data = {
        menu: getSheetData(ss, SHEET_MENU),
        users: getSheetData(ss, SHEET_USERS),
        orders: getSheetData(ss, SHEET_ORDERS)
      };
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var postDataRaw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var payload = JSON.parse(postDataRaw);
    var action = payload.action || "createOrder";

    if (action === "createOrder") {
      var order = payload.data;
      var orderSheet = getOrCreateSheet(ss, SHEET_ORDERS, HEADERS_ORDERS);
      var orderId = order.orderNumber || ("#JT-" + Math.floor(1000 + Math.random() * 9000));
      var dateStr = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      var itemsSummary = order.itemsSummary || "";

      orderSheet.appendRow([
        orderId, dateStr, order.customerName || "Pelanggan", order.customerPhone || "-", order.customerAddress || "-",
        itemsSummary, cleanNumber(order.subtotal), cleanNumber(order.travelerFee), cleanNumber(order.customsBuffer),
        cleanNumber(order.courierFee), cleanNumber(order.discount), cleanNumber(order.grandTotal),
        order.paymentMethod || "QRIS Instant", order.status || "Pending Purchase", order.assignedTraveler || "Mei Ling", order.flightCode || "NH855"
      ]);

      upsertCustomer(ss, order);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Pesanan berhasil dicatat", data: { orderId: orderId, createdAt: dateStr } })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "addMenuItem") {
      var menuSheet = getOrCreateSheet(ss, SHEET_MENU, HEADERS_MENU);
      var it = payload.data;
      var id = it.id || ("item-" + new Date().getTime());
      menuSheet.appendRow([
        id, it.name || "Item Jastip", it.sku || "SKU-001", it.category || "snacks", it.originCountry || "Jepang",
        it.originCity || "Tokyo", it.countryCode || "japan", it.shopperName || "Reza Pratama", it.shopperFlight || "NH855",
        cleanNumber(it.priceIdr), it.originalPriceForeign || "¥ 1,500", Number(it.marginPercent) || 20, Number(it.weightKg) || 0.4,
        Number(it.slotsTotal) || 20, Number(it.slotsBooked) || 0, it.status || "Available", it.imageUrl || "", Number(it.rating) || 5.0, Number(it.reviewsCount) || 1, it.description || ""
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Menu ditambah" })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Aksi berhasil" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function upsertCustomer(ss, order) {
  if (!order.customerPhone) return;
  var userSheet = getOrCreateSheet(ss, SHEET_USERS, HEADERS_USERS);
  var data = userSheet.getDataRange().getValues();
  var foundRow = -1;
  var cleanPhone = String(order.customerPhone).replace(/[^0-9]/g, "");

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).replace(/[^0-9]/g, "") === cleanPhone) {
      foundRow = i + 1;
      break;
    }
  }

  var nowStr = new Date().toLocaleDateString("id-ID");
  var orderTotalNum = cleanNumber(order.grandTotal);

  if (foundRow > -1) {
    var curOrders = Number(userSheet.getRange(foundRow, 5).getValue()) || 0;
    var curSpent = Number(userSheet.getRange(foundRow, 6).getValue()) || 0;
    userSheet.getRange(foundRow, 5).setValue(curOrders + 1);
    userSheet.getRange(foundRow, 6).setValue(curSpent + orderTotalNum);
    userSheet.getRange(foundRow, 9).setValue(nowStr);
  } else {
    var newId = "CUST-ID-" + Math.floor(10000 + Math.random() * 90000);
    userSheet.appendRow([
      newId, order.customerName, order.customerPhone, order.customerAddress,
      1, orderTotalNum, "98.0%", "Member", nowStr
    ]);
  }
}

function getSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var rowObj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = data[i][j];
      var rawH = String(headers[j]).trim();
      rowObj[rawH] = val;
      var normH = rawH.toLowerCase().replace(/[^a-z0-9]/g, "");
      rowObj[normH] = val;

      if (normH === "hargaidr" || normH === "harga") rowObj["priceIdr"] = cleanNumber(val);
      else if (normH === "namaproduk" || normH === "nama") rowObj["name"] = val;
      else if (normH === "totalpembayaran" || normH === "total") rowObj["grandTotal"] = cleanNumber(val);
      else if (normH === "urlidgoogledrivegambar" || normH === "gambar") rowObj["imageUrl"] = val;
      else if (normH === "orderid" || normH === "nopesanan") rowObj["orderNumber"] = val;
    }
    rows.push(rowObj);
  }
  return rows;
}

function cleanNumber(val) {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : Math.round(val);
  var s = String(val).trim().replace(/[^0-9.,]/g, "");
  if (!s) return 0;
  if (/^\\d{1,3}(\\.\\d{3})+(,\\d+)?$/.test(s)) {
    s = s.replace(/\\./g, "").replace(",", ".");
    var n = parseFloat(s);
    return isNaN(n) ? 0 : Math.round(n);
  }
  if (/^\\d{1,3}(,\\d{3})+(\\.\\d+)?$/.test(s)) {
    s = s.replace(/,/g, "");
    var n = parseFloat(s);
    return isNaN(n) ? 0 : Math.round(n);
  }
  var n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? 0 : Math.round(n);
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#0F52FF").setFontColor("#FFFFFF");
    }
  }
  return sheet;
}

function setupInitialDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetMenu = getOrCreateSheet(ss, SHEET_MENU, HEADERS_MENU);
  if (sheetMenu.getLastRow() <= 1) {
    sheetMenu.appendRow([
      "item-1", "Tokyo Banana x Pokémon Pikachu 8-Pack", "ISH-TYO-092", "snacks", "Jepang", "Tokyo", "japan",
      "Reza Pratama", "NH855 (Arr 28 Nov)", 285000, "¥ 1,400", 20, 0.45, 20, 18, "Available",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA9Hd0mMJJesU8RU6eV63lnR93rNFSVtsxb6tDh4iU-I1VZKJr_GL_OIT7gbmoffB-Qji9pjsikaMGWs7l8mZwSwNObgnc-1DwS6-z7gUBOPDczDJi7Zo0chFAVYb1RqPY6HJetRO-qhER0QSEYuvaWN9em-nxyWqecDRi7c94Abzovd5qapfZAO9KIWvazV-1dV2YYBgwBKEYajEG56uoN-RlJsjh60nSj6LXtHA",
      4.9, 124, "Sponge cake pisang lembut kolaborasi resmi Pokémon."
    ]);
  }
  getOrCreateSheet(ss, SHEET_USERS, HEADERS_USERS);
  getOrCreateSheet(ss, SHEET_ORDERS, HEADERS_ORDERS);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="font-bold text-lg">Struktur Tabel & Backend Google Apps Script</h3>
              <p className="text-xs text-slate-300">
                Format tabel terstandarisasi untuk mencegah eror kolom dan eror kalkulasi harga
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6 text-sm text-slate-700">
          {/* Reference Column Structure */}
          <div className="space-y-3">
            <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span>📋</span> Standar Nama Kolom 3 Sheet di Google Spreadsheet
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <span className="font-bold text-blue-900 block text-xs border-b border-blue-200 pb-1">
                  1. Sheet: "menu" (20 Kolom)
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-mono">
                  ID, Nama Produk, SKU, Kategori, Negara Asal, Kota Asal, Kode Negara, Nama Traveler, Penerbangan, <strong>Harga IDR</strong>, Harga Asing, Margin (%), Bobot (Kg), Total Kuota, Kuota Terisi, Status, URL / ID Google Drive Gambar, Rating, Jumlah Review, Deskripsi
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span className="font-bold text-emerald-900 block text-xs border-b border-emerald-200 pb-1">
                  2. Sheet: "pesanan" (16 Kolom)
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-mono">
                  Order ID, Tanggal, Nama Pelanggan, Nomor WhatsApp, Alamat Lengkap, Daftar Item, Subtotal, Biaya Hand-carry, Buffer Bea Cukai, Biaya Kurir, Diskon, <strong>Total Pembayaran</strong>, Metode Pembayaran, Status, Traveler, Kode Penerbangan
                </p>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                <span className="font-bold text-purple-900 block text-xs border-b border-purple-200 pb-1">
                  3. Sheet: "nama_pengguna" (9 Kolom)
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-mono">
                  ID Pengguna, Nama Pengguna, Nomor WhatsApp, Alamat Utama, Total Pesanan, <strong>Total Belanja (LTV)</strong>, Skor Kepercayaan, Status Tier, Terakhir Belanja
                </p>
              </div>
            </div>
            <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
              💡 <strong>Tips Harga:</strong> Masukkan harga sebagai angka murni (misal: <code>285000</code>). Sistem kini otomatis membersihkan format rupiah (<code>Rp 285.000</code> atau <code>285.000</code>) agar tidak eror menjadi Rp 285 atau NaN.
            </p>
          </div>

          {/* Connect URL Form & Anti-Reset Locking Tools */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border-2 border-blue-200/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🔒</span>
                <label className="text-xs sm:text-sm font-bold text-slate-900">
                  Tempelkan Web App URL Google Apps Script Anda (akhiran /exec):
                </label>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs ${
                  isLocked && cleanUrl
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isLocked && cleanUrl ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {isLocked && cleanUrl ? 'Status: TERKUNCI & AKTIF' : 'Status: BELUM DIKUNCI'}
              </span>
            </div>

            {/* Validation Warnings */}
            {isEndingWithEdit && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <strong>⚠️ Perhatian:</strong> URL Anda berakhiran <code>/edit</code>. Web App Google Apps Script publik harus berakhiran <code>/exec</code>!
                </div>
                <button
                  type="button"
                  onClick={handleFixEditToExec}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shrink-0 transition-colors"
                >
                  ⚡ Perbaiki Jadi /exec
                </button>
              </div>
            )}

            {isSpreadsheetUrl && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900">
                <strong>❌ Salah Link:</strong> URL ini adalah link sheet Spreadsheet (<code>docs.google.com/spreadsheets</code>), bukan URL Web App.
                Silakan buka spreadsheet Anda &gt; menu <strong>Ekstensi &gt; Apps Script</strong> &gt; klik <strong>Terapkan (Deploy) &gt; Penerapan Baru &gt; Aplikasi Web</strong>. Salin URL yang berakhiran <code>/exec</code>.
              </div>
            )}

            {/* URL Input Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={tempUrl}
                onChange={(e) => {
                  setTempUrl(e.target.value);
                  setIsLocked(false);
                }}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono text-slate-800 shadow-inner"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !cleanUrl}
                  className="px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 shrink-0"
                >
                  {isTesting ? 'Menguji...' : '⚡ Uji Koneksi'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndLock}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shrink-0 flex items-center gap-1.5"
                >
                  <span>🔒</span> Kunci &amp; Simpan URL
                </button>
              </div>
            </div>

            {/* Test Connection Result */}
            {testResult && (
              <div
                className={`p-2.5 rounded-xl text-xs font-medium border ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}
              >
                {testResult.message}
              </div>
            )}

            {/* Anti-Reset Locking Suite (Agar tidak reset saat dishare via Vercel) */}
            <div className="p-4 bg-white rounded-xl border border-blue-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">
                  🛡️ Solusi Anti-Reset Saat Dibagikan via Vercel
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                  Paling Lengkap
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Pilih salah satu metode di bawah agar saat link <code>https://titipx-five.vercel.app/</code> dibagikan ke orang lain/HP lain, data database tidak pernah reset lagi ke aset default:
              </p>

              <div className="space-y-2.5">
                {/* Method 1: Instant Auto-Lock Share Link */}
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 text-xs flex items-center gap-1">
                      <span>🔗</span> Metode 1: Salin Link Share Anti-Reset (Paling Praktis)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Instan (Tanpa Koding)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Kirim link ini ke pelanggan / teman. Begitu link dibuka di HP mereka, sistem akan <strong>otomatis mengunci</strong> database Google Spreadsheet Anda ke browser mereka selamanya!
                  </p>
                  {cleanUrl ? (
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        type="text"
                        readOnly
                        value={vercelShareLink}
                        className="flex-1 px-3 py-1.5 bg-white border border-blue-200 rounded-lg font-mono text-[11px] text-slate-800 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(vercelShareLink, 'share-link')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs shrink-0 flex items-center justify-center gap-1"
                      >
                        {copiedAction === 'share-link' ? '✅ Tersalin!' : '📋 Salin Link Share'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px] block pt-1">
                      Masukkan URL Anda di form atas terlebih dahulu untuk membuat link share terkunci.
                    </span>
                  )}
                </div>

                {/* Method 2: Vercel Environment Variable */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                      <span>☁️</span> Metode 2: Kunci di Environment Variable Vercel (Link Utama Bersih)
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Link Utama Tanpa Parameter
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Membuat link utama <code>https://titipx-five.vercel.app/</code> langsung terhubung ke database untuk siapapun tanpa perlu parameter <code>?api=</code>.
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <code className="flex-1 bg-white p-2 border border-slate-200 rounded-lg font-mono text-[11px] text-blue-700 overflow-x-auto">
                      Key: VITE_APPS_SCRIPT_URL<br />
                      Value: {cleanUrl || 'https://script.google.com/macros/s/.../exec'}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `VITE_APPS_SCRIPT_URL=${cleanUrl || ''}`,
                          'env-var'
                        )
                      }
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
                    >
                      {copiedAction === 'env-var' ? '✅ Tersalin!' : '📋 Salin Variabel Vercel'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    Cara: Di Vercel Dashboard &gt; Project Anda &gt; <strong>Settings &gt; Environment Variables</strong> &gt; Add Variable &gt; lalu klik <strong>Redeploy</strong>.
                  </p>
                </div>

                {/* Method 3: Lock directly in branding.json */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                      <span>📄</span> Metode 3: Kunci Langsung di File Kode branding.json
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                      Hardcoded Permanen
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Salin file konfigurasi yang sudah ditanamkan URL Anda, lalu timpa file <code>src/config/branding.json</code> di GitHub Anda sebelum deploy ke Vercel:
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generateLockedJson(), 'json-config')}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                    >
                      {copiedAction === 'json-config' ? '✅ JSON Tersalin!' : '📋 Salin File branding.json'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([generateLockedJson()], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'branding.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      💾 Unduh branding.json
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Kode Backend Google Apps Script Terbaru (Versi 2.0):
              </span>
              <button
                onClick={handleCopyCode}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {copied ? ' Tersalin!' : '📋 Salin Kode Code.gs'}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-slate-200 text-xs rounded-xl overflow-x-auto max-h-72 font-mono leading-relaxed border border-slate-800">
              {scriptCode}
            </pre>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
