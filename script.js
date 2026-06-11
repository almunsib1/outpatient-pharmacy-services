const API_URL = "https://script.google.com/macros/s/AKfycbw0jSrbe1SM596Kyv0EpB6VTKEXT81c2Cn8Wlc2lEQ_RzbrS9b6w-k4gyrflwPBTgpKSQ/exec";

const els = {
  loginView: document.getElementById("loginView"),
  prepView: document.getElementById("prepView"),
  loginForm: document.getElementById("loginForm"),
  username: document.getElementById("username"),
  pin: document.getElementById("pin"),
  loginMessage: document.getElementById("loginMessage"),
  currentUser: document.getElementById("currentUser"),
  logoutBtn: document.getElementById("logoutBtn"),
  startCameraBtn: document.getElementById("startCameraBtn"),
  manualBtn: document.getElementById("manualBtn"),
  manualForm: document.getElementById("manualForm"),
  manualFileNumber: document.getElementById("manualFileNumber"),
  scanMessage: document.getElementById("scanMessage"),
  resultCard: document.getElementById("resultCard"),
  fileNumberText: document.getElementById("fileNumberText"),
  patientNameText: document.getElementById("patientNameText"),
  preparedMessage: document.getElementById("preparedMessage"),
  markPreparedBtn: document.getElementById("markPreparedBtn"),
  uploadForm: document.getElementById("uploadForm"),
  fileInput: document.getElementById("fileInput"),
  uploadMessage: document.getElementById("uploadMessage")
};

let scanner;
let selectedPrescription = null;
let isScanning = false;

document.addEventListener("DOMContentLoaded", init);

function init() {
  const savedUser = localStorage.getItem("preparerUsername");
  if (savedUser) {
    showPrep(savedUser);
  }

  els.loginForm.addEventListener("submit", handleLogin);
  els.logoutBtn.addEventListener("click", logout);
  els.startCameraBtn.addEventListener("click", startCamera);
  els.manualBtn.addEventListener("click", () => els.manualForm.classList.toggle("hidden"));
  els.manualForm.addEventListener("submit", handleManualSearch);
  els.markPreparedBtn.addEventListener("click", markPrepared);
  els.uploadForm.addEventListener("submit", uploadFile);
}

async function handleLogin(event) {
  event.preventDefault();
  const username = els.username.value.trim();
  const pin = els.pin.value.trim();

  setMessage(els.loginMessage, "جاري تسجيل الدخول...");
  try {
    const response = await api("login", { username, pin });
    if (!response.ok) throw new Error(response.message || "بيانات الدخول غير صحيحة.");
    localStorage.setItem("preparerUsername", username);
    showPrep(username);
  } catch (error) {
    setMessage(els.loginMessage, error.message, "error");
  }
}

function showPrep(username) {
  els.currentUser.textContent = username;
  els.loginView.classList.add("hidden");
  els.prepView.classList.remove("hidden");
  startCamera();
}

function logout() {
  localStorage.removeItem("preparerUsername");
  stopCamera();
  selectedPrescription = null;
  els.prepView.classList.add("hidden");
  els.loginView.classList.remove("hidden");
  els.loginForm.reset();
  clearResult();
}

async function startCamera() {
  if (!window.Html5Qrcode) {
    setMessage(els.scanMessage, "لم يتم تحميل قارئ الكاميرا بعد. أعد المحاولة.", "error");
    return;
  }
  if (isScanning) return;

  scanner = scanner || new Html5Qrcode("reader");
  setMessage(els.scanMessage, "جاري تشغيل الكاميرا...");

  try {
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      handleScanSuccess
    );
    isScanning = true;
    setMessage(els.scanMessage, "وجّه الكاميرا نحو الباركود أو QR.");
  } catch (error) {
    setMessage(els.scanMessage, "تعذر تشغيل الكاميرا. تأكد من صلاحية الكاميرا أو استخدم الإدخال اليدوي.", "error");
  }
}

async function stopCamera() {
  if (!scanner || !isScanning) return;
  try {
    await scanner.stop();
  } catch (error) {
    console.warn(error);
  } finally {
    isScanning = false;
  }
}

async function handleScanSuccess(decodedText) {
  const fileNumber = normalizeFileNumber(decodedText);
  if (!fileNumber) return;
  if (scanner && isScanning) scanner.pause(true);
  await lookupPrescription(fileNumber);
}

async function handleManualSearch(event) {
  event.preventDefault();
  const fileNumber = normalizeFileNumber(els.manualFileNumber.value);
  if (!fileNumber) {
    setMessage(els.scanMessage, "أدخل رقم الملف.", "error");
    return;
  }
  await lookupPrescription(fileNumber);
}

async function lookupPrescription(fileNumber) {
  clearResult();
  setMessage(els.scanMessage, "جاري البحث عن رقم الملف...");

  try {
    const response = await api("lookupPrescription", { fileNumber });
    if (!response.ok) throw new Error(response.message || "لم يتم العثور على الوصفة.");

    selectedPrescription = {
      fileNumber: response.fileNumber,
      patientName: response.patientName
    };

    els.fileNumberText.textContent = response.fileNumber;
    els.patientNameText.textContent = response.patientName;
    els.resultCard.classList.remove("hidden");

    if (response.prepared) {
      const timeText = formatDateTime(response.preparedAt);
      els.preparedMessage.textContent = `تم تحضيرها مسبقاً بواسطة ${response.preparedBy} الساعة ${timeText}.`;
      els.preparedMessage.classList.remove("hidden");
      els.markPreparedBtn.disabled = true;
    } else {
      els.markPreparedBtn.disabled = false;
    }

    setMessage(els.scanMessage, "تمت قراءة رقم الملف.", "success");
  } catch (error) {
    setMessage(els.scanMessage, error.message, "error");
    selectedPrescription = null;
  }
}

async function markPrepared() {
  if (!selectedPrescription) return;
  const preparedBy = localStorage.getItem("preparerUsername");

  els.markPreparedBtn.disabled = true;
  setMessage(els.scanMessage, "جاري تسجيل التحضير...");

  try {
    const response = await api("markPrepared", {
      fileNumber: selectedPrescription.fileNumber,
      preparedBy
    });

    if (!response.ok) {
      if (response.prepared) {
        const timeText = formatDateTime(response.preparedAt);
        els.preparedMessage.textContent = `تم تحضيرها مسبقاً بواسطة ${response.preparedBy} الساعة ${timeText}.`;
        els.preparedMessage.classList.remove("hidden");
      }
      throw new Error(response.message || "لم يتم تسجيل التحضير.");
    }

    setMessage(els.scanMessage, "تم تسجيل التحضير بنجاح.", "success");
    setTimeout(() => {
      clearResult();
      if (scanner && isScanning) scanner.resume();
    }, 1200);
  } catch (error) {
    setMessage(els.scanMessage, error.message, "error");
  }
}

async function uploadFile(event) {
  event.preventDefault();
  const file = els.fileInput.files[0];
  if (!file) return;

  setMessage(els.uploadMessage, "جاري قراءة الملف...");

  try {
    const rows = await readPrescriptionFile(file);
    if (!rows.length) throw new Error("لم يتم العثور على بيانات صالحة.");

    const uploadedBy = localStorage.getItem("preparerUsername");
    const response = await api("uploadPrescriptions", { rows, uploadedBy });
    if (!response.ok) throw new Error(response.message || "فشل رفع البيانات.");

    els.uploadForm.reset();
    setMessage(els.uploadMessage, `تم رفع ${response.count} وصفة.`, "success");
  } catch (error) {
    setMessage(els.uploadMessage, error.message, "error");
  }
}

function readPrescriptionFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        resolve(extractPrescriptionRows(data));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("تعذر قراءة الملف."));
    reader.readAsArrayBuffer(file);
  });
}

function extractPrescriptionRows(data) {
  const nonEmptyRows = data.filter(row => row.some(cell => String(cell).trim() !== ""));
  if (nonEmptyRows.length < 2) return [];

  const headers = nonEmptyRows[0].map(normalizeHeader);
  let fileIndex = headers.findIndex(header => ["رقمالملف", "filenumber", "file", "mrn"].includes(header));
  let nameIndex = headers.findIndex(header => ["اسمالمريض", "patientname", "patient"].includes(header));

  if (fileIndex === -1 || nameIndex === -1) {
    fileIndex = 0;
    nameIndex = 1;
  }

  return nonEmptyRows.slice(1)
    .map(row => ({
      fileNumber: normalizeFileNumber(row[fileIndex]),
      patientName: String(row[nameIndex] || "").trim()
    }))
    .filter(row => row.fileNumber && row.patientName);
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

function normalizeFileNumber(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "");
}

function clearResult() {
  selectedPrescription = null;
  els.resultCard.classList.add("hidden");
  els.preparedMessage.classList.add("hidden");
  els.preparedMessage.textContent = "";
  els.markPreparedBtn.disabled = true;
  els.fileNumberText.textContent = "";
  els.patientNameText.textContent = "";
}

function setMessage(element, text, type = "") {
  element.textContent = text;
  element.className = `message ${type}`.trim();
}

function formatDateTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return value || "";
  return date.toLocaleString("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function api(action, payload = {}) {
  if (!API_URL || API_URL.includes("PUT_GOOGLE_APPS_SCRIPT")) {
    throw new Error("ضع رابط Google Apps Script Web App في ملف script.js أولاً.");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload })
  });

  if (!response.ok) {
    throw new Error("تعذر الاتصال بالخادم.");
  }

  return response.json();
}
