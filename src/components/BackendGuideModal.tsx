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

  if (!isOpen) return null;

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

          {/* Connect URL Form */}
          <div className="p-4 bg-slate-100 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Tempelkan Web App URL Google Apps Script Anda (akhiran /exec):
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  onSaveUrl(tempUrl);
                  alert('URL Google Apps Script disimpan!');
                }}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
              >
                Simpan URL
              </button>
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
