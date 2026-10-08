/**
 * =========================================================================
 * BACKEND GOOGLE APPS SCRIPT (Code.gs) UNTUK WEB JASTIP TITIPX / JASTIPGO
 * VERSI: 2.0 (Fixed: Header Synchronization & Robust Price Formatting)
 * =========================================================================
 */

var SHEET_MENU = "menu";
var SHEET_USERS = "nama_pengguna";
var SHEET_ORDERS = "pesanan";

// Header Standar Sheet Menu
var HEADERS_MENU = [
  "ID", "Nama Produk", "SKU", "Kategori", "Negara Asal", "Kota Asal", "Kode Negara",
  "Nama Traveler", "Penerbangan", "Harga IDR", "Harga Asing", "Margin (%)",
  "Bobot (Kg)", "Total Kuota", "Kuota Terisi", "Status", "URL / ID Google Drive Gambar",
  "Rating", "Jumlah Review", "Deskripsi"
];

// Header Standar Sheet Pesanan
var HEADERS_ORDERS = [
  "Order ID", "Tanggal", "Nama Pelanggan", "Nomor WhatsApp", "Alamat Lengkap",
  "Daftar Item", "Subtotal", "Biaya Hand-carry", "Buffer Bea Cukai", "Biaya Kurir",
  "Diskon", "Total Pembayaran", "Metode Pembayaran", "Status", "Traveler", "Kode Penerbangan"
];

// Header Standar Sheet Pengguna
var HEADERS_USERS = [
  "ID Pengguna", "Nama Pengguna", "Nomor WhatsApp", "Alamat Utama",
  "Total Pesanan", "Total Belanja (LTV)", "Skor Kepercayaan", "Status Tier", "Terakhir Belanja"
];

/**
 * Handle GET Requests - Mengambil data menu, pengguna, atau pesanan
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getAll";

    var result = {
      status: "success",
      timestamp: new Date().toISOString()
    };

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

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * Handle POST Requests - Menerima transaksi pesanan, tambah menu, atau update status
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var postDataRaw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var payload = JSON.parse(postDataRaw);
    var action = payload.action || "createOrder";

    var responseData = {};

    if (action === "createOrder") {
      responseData = handleCreateOrder(ss, payload.data);
    } else if (action === "addMenuItem") {
      responseData = handleAddMenuItem(ss, payload.data);
    } else if (action === "updateMenuItem") {
      responseData = handleUpdateMenuItem(ss, payload.data);
    } else if (action === "deleteMenuItem") {
      responseData = handleDeleteMenuItem(ss, payload.id);
    } else if (action === "updateOrderStatus") {
      responseData = handleUpdateOrderStatus(ss, payload.orderId, payload.newStatus);
    } else {
      throw new Error("Action tidak dikenali: " + action);
    }

    return createJsonResponse({
      status: "success",
      message: "Operasi berhasil",
      data: responseData
    });
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * Fungsi membuat pesanan baru dan mencatat ke sheet "pesanan" & "nama_pengguna"
 */
function handleCreateOrder(ss, order) {
  if (!order) throw new Error("Data pesanan tidak boleh kosong");

  var orderSheet = getOrCreateSheet(ss, SHEET_ORDERS, HEADERS_ORDERS);
  var orderId = order.orderNumber || ("#JT-" + Math.floor(1000 + Math.random() * 9000));
  var dateStr = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

  var itemsSummary = "";
  if (Array.isArray(order.itemsDetail) && order.itemsDetail.length > 0) {
    itemsSummary = order.itemsDetail.map(function(item) {
      return item.quantity + "x " + item.name;
    }).join(", ");
  } else {
    itemsSummary = order.itemsSummary || "";
  }

  // Bersihkan harga jadi angka murni
  var subtotal = cleanNumber(order.subtotal);
  var travelerFee = cleanNumber(order.travelerFee);
  var customsBuffer = cleanNumber(order.customsBuffer);
  var courierFee = cleanNumber(order.courierFee);
  var discount = cleanNumber(order.discount);
  var grandTotal = cleanNumber(order.grandTotal);

  orderSheet.appendRow([
    orderId,
    dateStr,
    order.customerName || "Pelanggan",
    order.customerPhone || "-",
    order.customerAddress || "-",
    itemsSummary,
    subtotal,
    travelerFee,
    customsBuffer,
    courierFee,
    discount,
    grandTotal,
    order.paymentMethod || "QRIS Instant",
    order.status || "Pending Purchase",
    order.assignedTraveler || "Mei Ling",
    order.flightCode || "NH855"
  ]);

  // Sinkronisasi data ke sheet "nama_pengguna"
  upsertCustomer(ss, {
    name: order.customerName,
    phone: order.customerPhone,
    address: order.customerAddress,
    orderTotal: grandTotal
  });

  return {
    orderId: orderId,
    createdAt: dateStr,
    grandTotal: grandTotal
  };
}

/**
 * Update atau tambah data pengguna di sheet "nama_pengguna"
 */
function upsertCustomer(ss, cust) {
  if (!cust.phone) return;

  var userSheet = getOrCreateSheet(ss, SHEET_USERS, HEADERS_USERS);
  var data = userSheet.getDataRange().getValues();
  var foundRow = -1;

  var cleanPhone = String(cust.phone).replace(/[^0-9]/g, "");

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).replace(/[^0-9]/g, "") === cleanPhone) {
      foundRow = i + 1;
      break;
    }
  }

  var nowStr = new Date().toLocaleDateString("id-ID");
  var orderTotalNum = cleanNumber(cust.orderTotal);

  if (foundRow > -1) {
    var curOrders = Number(userSheet.getRange(foundRow, 5).getValue()) || 0;
    var curSpent = Number(userSheet.getRange(foundRow, 6).getValue()) || 0;

    var newOrders = curOrders + 1;
    var newSpent = curSpent + orderTotalNum;

    var tier = "Member";
    if (newSpent >= 25000000) tier = "Diamond VIP";
    else if (newSpent >= 10000000) tier = "Gold";
    else if (newSpent >= 3000000) tier = "Silver";

    userSheet.getRange(foundRow, 2).setValue(cust.name || userSheet.getRange(foundRow, 2).getValue());
    userSheet.getRange(foundRow, 4).setValue(cust.address || userSheet.getRange(foundRow, 4).getValue());
    userSheet.getRange(foundRow, 5).setValue(newOrders);
    userSheet.getRange(foundRow, 6).setValue(newSpent);
    userSheet.getRange(foundRow, 8).setValue(tier);
    userSheet.getRange(foundRow, 9).setValue(nowStr);
  } else {
    var newId = "CUST-ID-" + Math.floor(10000 + Math.random() * 90000);
    userSheet.appendRow([
      newId,
      cust.name || "Pelanggan Baru",
      cust.phone,
      cust.address || "-",
      1,
      orderTotalNum,
      "98.0%",
      "Member",
      nowStr
    ]);
  }
}

/**
 * Tambah item menu baru ke sheet "menu"
 */
function handleAddMenuItem(ss, item) {
  var menuSheet = getOrCreateSheet(ss, SHEET_MENU, HEADERS_MENU);
  var id = item.id || ("item-" + new Date().getTime());
  var priceIdr = cleanNumber(item.priceIdr);

  menuSheet.appendRow([
    id,
    item.name || "Item Jastip",
    item.sku || ("SKU-" + Math.floor(100 + Math.random() * 900)),
    item.category || "snacks",
    item.originCountry || "Jepang",
    item.originCity || "Tokyo",
    item.countryCode || "japan",
    item.shopperName || "Reza Pratama",
    item.shopperFlight || "NH855",
    priceIdr,
    item.originalPriceForeign || "¥ 1,500",
    Number(item.marginPercent) || 20,
    Number(item.weightKg) || 0.4,
    Number(item.slotsTotal) || 20,
    Number(item.slotsBooked) || 0,
    item.status || "Available",
    item.imageUrl || "",
    Number(item.rating) || 5.0,
    Number(item.reviewsCount) || 1,
    item.description || ""
  ]);

  return { id: id, name: item.name, priceIdr: priceIdr };
}

/**
 * Update item menu di sheet "menu" secara dinamis berdasarkan header
 */
function handleUpdateMenuItem(ss, item) {
  var menuSheet = ss.getSheetByName(SHEET_MENU);
  if (!menuSheet) throw new Error("Sheet menu tidak ditemukan");

  var data = menuSheet.getDataRange().getValues();
  if (data.length <= 1) throw new Error("Sheet menu kosong");

  var headers = data[0];
  var colPrice = findColIndex(headers, ["Harga IDR", "priceIdr", "Harga", "price"]);
  var colName = findColIndex(headers, ["Nama Produk", "name", "Nama"]);
  var colWeight = findColIndex(headers, ["Bobot (Kg)", "weightKg", "Berat"]);
  var colSlotsTotal = findColIndex(headers, ["Total Kuota", "slotsTotal"]);
  var colSlotsBooked = findColIndex(headers, ["Kuota Terisi", "slotsBooked"]);
  var colStatus = findColIndex(headers, ["Status", "status"]);
  var colImage = findColIndex(headers, ["URL / ID Google Drive Gambar", "imageUrl", "Gambar"]);

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(item.id)) {
      var row = i + 1;
      if (item.name && colName > 0) menuSheet.getRange(row, colName).setValue(item.name);
      if (item.priceIdr !== undefined && colPrice > 0) menuSheet.getRange(row, colPrice).setValue(cleanNumber(item.priceIdr));
      if (item.weightKg !== undefined && colWeight > 0) menuSheet.getRange(row, colWeight).setValue(Number(item.weightKg));
      if (item.slotsTotal !== undefined && colSlotsTotal > 0) menuSheet.getRange(row, colSlotsTotal).setValue(Number(item.slotsTotal));
      if (item.slotsBooked !== undefined && colSlotsBooked > 0) menuSheet.getRange(row, colSlotsBooked).setValue(Number(item.slotsBooked));
      if (item.status && colStatus > 0) menuSheet.getRange(row, colStatus).setValue(item.status);
      if (item.imageUrl !== undefined && colImage > 0) menuSheet.getRange(row, colImage).setValue(item.imageUrl);
      return { id: item.id, updated: true };
    }
  }
  throw new Error("Item tidak ditemukan dengan ID: " + item.id);
}

/**
 * Hapus item menu dari sheet "menu"
 */
function handleDeleteMenuItem(ss, id) {
  var menuSheet = ss.getSheetByName(SHEET_MENU);
  if (!menuSheet) throw new Error("Sheet menu tidak ditemukan");

  var data = menuSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      menuSheet.deleteRow(i + 1);
      return { id: id, deleted: true };
    }
  }
  throw new Error("Item tidak ditemukan");
}

/**
 * Update status pesanan di sheet "pesanan"
 */
function handleUpdateOrderStatus(ss, orderId, newStatus) {
  var sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) throw new Error("Sheet pesanan tidak ditemukan");

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) throw new Error("Sheet pesanan kosong");

  var headers = data[0];
  var colStatus = findColIndex(headers, ["Status", "status", "Status Pesanan"]);
  if (colStatus <= 0) colStatus = 14;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(orderId)) {
      sheet.getRange(i + 1, colStatus).setValue(newStatus);
      return { orderId: orderId, status: newStatus };
    }
  }
  throw new Error("Order ID tidak ditemukan: " + orderId);
}

/**
 * Helper: Ambil data tabel sheet sebagai array of objects yang lengkap
 */
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
      var rawHeader = String(headers[j]).trim();

      // Simpan dengan key asli
      rowObj[rawHeader] = val;

      // Simpan dengan key lowercase tanpa spasi
      var normKey = rawHeader.toLowerCase().replace(/[^a-z0-9]/g, "");
      rowObj[normKey] = val;

      // Alias cerdas untuk kolom umum
      if (normKey === "hargaidr" || normKey === "harga") {
        rowObj["priceIdr"] = cleanNumber(val);
      } else if (normKey === "namaproduk" || normKey === "nama") {
        rowObj["name"] = val;
      } else if (normKey === "totalpembayaran" || normKey === "total") {
        rowObj["grandTotal"] = cleanNumber(val);
      } else if (normKey === "urlidgoogledrivegambar" || normKey === "gambar") {
        rowObj["imageUrl"] = val;
      } else if (normKey === "orderid" || normKey === "nopesanan") {
        rowObj["orderNumber"] = val;
      }
    }
    rows.push(rowObj);
  }
  return rows;
}

/**
 * Helper: Cari index kolom berdasarkan daftar kemungkinan nama header (1-indexed)
 */
function findColIndex(headers, possibleNames) {
  var targets = possibleNames.map(function(s) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, "");
  });

  for (var j = 0; j < headers.length; j++) {
    var normHeader = String(headers[j]).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (targets.indexOf(normHeader) > -1) {
      return j + 1;
    }
  }
  return -1;
}

/**
 * Helper: Bersihkan string harga (Rp 285.000, 285.000, dll.) jadi integer murni
 */
function cleanNumber(val) {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : Math.round(val);

  var s = String(val).trim().replace(/[^0-9.,]/g, "");
  if (!s) return 0;

  // Format ribuan titik e.g. "285.000" atau "1.485.000"
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
    var n = parseFloat(s);
    return isNaN(n) ? 0 : Math.round(n);
  }

  // Format koma e.g. "285,000"
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
    s = s.replace(/,/g, "");
    var n = parseFloat(s);
    return isNaN(n) ? 0 : Math.round(n);
  }

  var n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? 0 : Math.round(n);
}

/**
 * Helper: Ambil sheet atau buat jika belum ada dengan header
 */
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0F52FF");
      headerRange.setFontColor("#FFFFFF");
    }
  }
  return sheet;
}

/**
 * Format Response JSON untuk REST API
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * =========================================================================
 * FUNGSI SETUP DATABASE AWAL (Jalankan sekali dari editor Apps Script)
 * =========================================================================
 */
function setupInitialDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Buat Sheet Menu
  var sheetMenu = getOrCreateSheet(ss, SHEET_MENU, HEADERS_MENU);
  if (sheetMenu.getLastRow() <= 1) {
    sheetMenu.appendRow([
      "item-1", "Tokyo Banana x Pokémon Pikachu 8-Pack", "ISH-TYO-092", "snacks", "Jepang", "Tokyo", "japan",
      "Reza Pratama", "NH855 (Arr 28 Nov)", 285000, "¥ 1,400", 20, 0.45, 20, 18, "Available",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA9Hd0mMJJesU8RU6eV63lnR93rNFSVtsxb6tDh4iU-I1VZKJr_GL_OIT7gbmoffB-Qji9pjsikaMGWs7l8mZwSwNObgnc-1DwS6-z7gUBOPDczDJi7Zo0chFAVYb1RqPY6HJetRO-qhER0QSEYuvaWN9em-nxyWqecDRi7c94Abzovd5qapfZAO9KIWvazV-1dV2YYBgwBKEYajEG56uoN-RlJsjh60nSj6LXtHA",
      4.9, 124, "Sponge cake pisang lembut kolaborasi resmi Pokémon dengan krim pisang custard asli."
    ]);
    sheetMenu.appendRow([
      "item-2", "Tamburins Egg Perfume 14ml Late Autumn", "TAM-SEL-882", "cosmetics", "Korea Selatan", "Seoul", "korea",
      "Dewi Lestari", "OZ761 (Arr 29 Nov)", 720000, "₩ 45,800", 20, 0.20, 35, 34, "Limited Space",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCSYwiwo8mVCF2KKGPL-nv1qRp8DGTFrm4A1x0Mj5xhiontSe4_GYQfKdcwbP-h2ljNZPJcFG3SsWr1UMkbjsaNdCtZQrSvpkgTKNBhaqgEQm7grj8C1WDE_xueNfifdNTc-7kCutd4tVfMtp34Ojcn5dLt1Fwa6iqQYXIGI1WN27gK-ucejB6gAWfT9VA38PYp2FbUM-fZzvltTsWC_9HYrc1QAXPoOpmoZPehfA",
      5.0, 89, "Parfum bentuk telur matte silver aroma Late Autumn edisi terbatas dari flagship Haus Dosan Seoul."
    ]);
    sheetMenu.appendRow([
      "item-3", "Trader Joe's Canvas Mini Tote & Ube Spread", "TJ-LA-441", "collectibles", "Amerika Serikat", "Los Angeles", "usa",
      "Aris Handoko", "SQ25 (Arr 31 Nov)", 195000, "$ 6.98", 25, 0.35, 25, 25, "Sold Out",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC5bgagXmQu1bF8iWDjLoVfEx1dJNvTlQQXdl3M42cfQ56gGeNnKawmq126LId9sBJSAtHZoZfjMyxQLf03VM67ruj2FgAWPKhmuFKkN2MvQYbj5It4hQJtiL4XYRuWSXR9ubiO0-Eyf4AxPjelX1yIFmTk0K3b8Sl_eytcBSERiHdgYvKzfogv9x7PquGQxKc5r7qsmqA6rUoDq4TlKVrEAcZa4ZnSu3kTMp3mdg",
      4.8, 63, "Tas tote canvas mini viral Trader Joe's bundling dengan selai ube authentic."
    ]);
    sheetMenu.appendRow([
      "item-4", "Gentle Monster 'Dadah 01' Oval Sunglasses", "GM-SEL-019", "luxury", "Korea Selatan", "Seoul", "korea",
      "Dewi Lestari", "OZ761 (Arr 29 Nov)", 3850000, "₩ 280,000", 18, 0.40, 10, 8, "Available",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuArXMFTZnofIn5rdLt9W6_-UXKU5TBe6Q9JLX6-VjJalFlnL_9YwSxWvrvznjnyGpfyP9CHpL7vrfBL4J4VC7lAWJFHl2g5TrgwLe7CGNe00RebOhVb2dmZjgNSGePBJ99aIF-L_yNtVLc9mirHpV8SUsu2yF_6dXsUlmH-alWlBhLe1NbRRoStqxrOP5hIzWnipE0iLt_ObVbBtR09Zizkv55cOc6nSMJn8Ebumw",
      5.0, 41, "Kacamata hitam desainer Gentle Monster seri Dadah 01 dengan case dan invoice resmi."
    ]);
  }

  // 2. Buat Sheet Pengguna
  var sheetUsers = getOrCreateSheet(ss, SHEET_USERS, HEADERS_USERS);
  if (sheetUsers.getLastRow() <= 1) {
    sheetUsers.appendRow([
      "CUST-ID-88219", "Clarissa Angela", "+62 812-4491-0021", "Menteng Residences Blok C-12, Jakarta Pusat",
      42, 38450000, "99.8%", "Diamond VIP", "28/11/2024"
    ]);
    sheetUsers.appendRow([
      "CUST-ID-41092", "Farhan Syahputra", "+62 821-9901-3314", "Apartemen Pakubuwono Terrace 18A, Jakarta Selatan",
      19, 14820000, "98.2%", "Gold", "28/11/2024"
    ]);
  }

  // 3. Buat Sheet Pesanan
  var sheetOrders = getOrCreateSheet(ss, SHEET_ORDERS, HEADERS_ORDERS);
  if (sheetOrders.getLastRow() <= 1) {
    sheetOrders.appendRow([
      "#JT-8821", "28/11/2024, 14:22:10", "Nadya Wulandari", "+62 812-9988-3412",
      "Senopati Suites Tower 2 Unit 18B, Jakarta Selatan", "2x Tokyo Banana x Pokémon, 1x Shiseido Fino",
      1199660, 180000, 45000, 32000, 50000, 1485000, "QRIS Instant", "Proof Uploaded", "Mei Ling", "NH855"
    ]);
    sheetOrders.appendRow([
      "#JT-8820", "28/11/2024, 11:05:40", "Dimas Anggara", "+62 812-3456-7880",
      "Surabaya Barat, Jawa Timur", "1x Gentle Monster Frida 01",
      3850000, 250000, 150000, 45000, 0, 4250000, "Transfer Bank BCA", "In-Transit", "Kevin Sanjaya", "KE627"
    ]);
  }

  Logger.log("Database TitipX berhasil diinisialisasi dengan 3 sheet standar!");
}
