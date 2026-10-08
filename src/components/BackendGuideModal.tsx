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
 * BACKEND GOOGLE APPS SCRIPT (Code.gs) UNTUK WEB JASTIP TITIPX / JASTIPGO
 * Tempelkan kode ini di Google Sheets > Ekstensi > Apps Script.
 */

var SHEET_MENU = "menu";
var SHEET_USERS = "nama_pengguna";
var SHEET_ORDERS = "pesanan";

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
      var orderSheet = getOrCreateSheet(ss, SHEET_ORDERS, [
        "Order ID", "Tanggal", "Nama Pelanggan", "Nomor WhatsApp", "Alamat Lengkap",
        "Daftar Item", "Subtotal", "Biaya Hand-carry", "Buffer Bea Cukai", "Biaya Kurir",
        "Diskon", "Total Pembayaran", "Metode Pembayaran", "Status", "Traveler", "Kode Penerbangan"
      ]);

      var orderId = order.orderNumber || ("#JT-" + Math.floor(1000 + Math.random() * 9000));
      var dateStr = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      var itemsSummary = order.itemsSummary || "";

      orderSheet.appendRow([
        orderId, dateStr, order.customerName, order.customerPhone, order.customerAddress,
        itemsSummary, order.subtotal, order.travelerFee, order.customsBuffer, order.courierFee,
        order.discount, order.grandTotal, order.paymentMethod, "Pending Purchase", order.assignedTraveler || "Mei Ling", order.flightCode || "NH855"
      ]);

      // Update / Catat Pengguna ke sheet nama_pengguna
      upsertCustomer(ss, order);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Pesanan berhasil dicatat ke Google Sheets",
        data: { orderId: orderId, createdAt: dateStr }
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Action processed" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function upsertCustomer(ss, order) {
  if (!order.customerPhone) return;
  var userSheet = getOrCreateSheet(ss, SHEET_USERS, [
    "ID Pengguna", "Nama Pengguna", "Nomor WhatsApp", "Alamat Utama",
    "Total Pesanan", "Total Belanja (LTV)", "Skor Kepercayaan", "Status Tier", "Terakhir Belanja"
  ]);

  var data = userSheet.getDataRange().getValues();
  var foundRow = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).replace(/[^0-9]/g, "") === String(order.customerPhone).replace(/[^0-9]/g, "")) {
      foundRow = i + 1;
      break;
    }
  }

  var nowStr = new Date().toLocaleDateString("id-ID");
  if (foundRow > -1) {
    var curOrders = Number(userSheet.getRange(foundRow, 5).getValue()) || 0;
    var curSpent = Number(userSheet.getRange(foundRow, 6).getValue()) || 0;
    userSheet.getRange(foundRow, 5).setValue(curOrders + 1);
    userSheet.getRange(foundRow, 6).setValue(curSpent + Number(order.grandTotal || 0));
    userSheet.getRange(foundRow, 9).setValue(nowStr);
  } else {
    var newId = "CUST-ID-" + Math.floor(10000 + Math.random() * 90000);
    userSheet.appendRow([
      newId, order.customerName, order.customerPhone, order.customerAddress,
      1, order.grandTotal || 0, "98.0%", "Member", nowStr
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
      var key = String(headers[j]).toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, function(m, c) { return c.toUpperCase(); }).replace(/[^a-zA-Z0-9]/g, "");
      rowObj[key] = data[i][j];
    }
    rows.push(rowObj);
  }
  return rows;
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
  // Jalankan fungsi ini sekali dari editor Apps Script untuk membuat 3 sheet awal otomatis!
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateSheet(ss, SHEET_MENU, ["id", "name", "sku", "category", "originCountry", "originCity", "countryCode", "shopperName", "shopperFlight", "priceIdr", "originalPriceForeign", "marginPercent", "weightKg", "slotsTotal", "slotsBooked", "status", "imageUrl", "rating", "reviewsCount", "description"]);
  getOrCreateSheet(ss, SHEET_USERS, ["id", "name", "phone", "address", "totalOrders", "lifetimeSpent", "trustScore", "tier", "lastOrderDate"]);
  getOrCreateSheet(ss, SHEET_ORDERS, ["orderNumber", "createdAt", "customerName", "customerPhone", "customerAddress", "itemsSummary", "subtotal", "travelerFee", "customsBuffer", "courierFee", "discount", "grandTotal", "paymentMethod", "status", "assignedTraveler", "flightCode"]);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="font-bold text-lg">Panduan Backend Google Spreadsheet & Apps Script</h3>
              <p className="text-xs text-slate-300">Menghubungkan frontend Vercel ke Google Sheets secara REST API</p>
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
          {/* Step-by-Step */}
          <div className="space-y-4">
            <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              Langkah Cepat Setup Google Spreadsheet
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 pl-2 leading-relaxed">
              <li>
                Buat Google Spreadsheet baru di <strong>sheets.google.com</strong>.
              </li>
              <li>
                Buka menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.
              </li>
              <li>
                Salin seluruh kode <strong>Code.gs</strong> di bawah, lalu paste di editor Apps Script.
              </li>
              <li>
                Pilih fungsi <code>setupInitialDatabase</code> di toolbar atas lalu klik <strong>Jalankan (Run)</strong> untuk membuat sheet <code>menu</code>, <code>nama_pengguna</code>, dan <code>pesanan</code> otomatis.
              </li>
              <li>
                Klik tombol biru <strong>Terapkan (Deploy)</strong> &gt; <strong>Penerapan Baru (New deployment)</strong>.
              </li>
              <li>
                Pilih jenis: <strong>Aplikasi Web (Web App)</strong>.
              </li>
              <li>
                Set <em>Who has access (Yang memiliki akses)</em> menjadi: <strong className="text-blue-600">Anyone (Siapa saja)</strong>.
              </li>
              <li>
                Salin <strong>Web App URL</strong> yang berakhiran <code>/exec</code> dan masukkan ke form di bawah!
              </li>
            </ol>
          </div>

          {/* Connect URL Form */}
          <div className="p-4 bg-slate-100 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Tempelkan Web App URL Google Apps Script Anda:
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
                Kode Backend Lengkap (Code.gs):
              </span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1 bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors"
              >
                {copied ? ' Tersalin!' : '📋 Salin Kode Code.gs'}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-slate-200 text-xs rounded-xl overflow-x-auto max-h-72 font-mono leading-relaxed border border-slate-800">
              {scriptCode}
            </pre>
          </div>

          {/* Drive Asset Instructions */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-950">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <span>🖼️</span> Cara Memasukkan Gambar Produk dari Google Drive:
            </div>
            <p>
              Pada kolom <code>imageUrl</code> di sheet <strong>menu</strong>, Anda dapat memasukkan:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-emerald-900">
              <li>
                <strong>ID File Google Drive</strong> saja (misal: <code>1AbC9XyZ...</code>)
              </li>
              <li>
                Atau <strong>Share Link Google Drive</strong> (misal: <code>https://drive.google.com/file/d/1AbC9.../view?usp=sharing</code>)
              </li>
              <li>
                Pastikan hak akses file di Google Drive disetel ke <em>"Anyone with the link can view" (Siapa saja yang memiliki link dapat melihat)</em>.
              </li>
              <li>
                Frontend aplikasi ini akan otomatis mengonversi ID tersebut menjadi gambar beresolusi tinggi secara langsung dan cepat!
              </li>
            </ul>
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
