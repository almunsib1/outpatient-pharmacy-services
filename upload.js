const API_URL = "https://script.google.com/macros/s/AKfycbw0jSrbe1SM596Kyv0EpB6VTKEXT81c2Cn8Wlc2lEQ_RzbrS9b6w-k4gyrflwPBTgpKSQ/exec";

const els = {
  uploadLoginView: document.getElementById("uploadLoginView"),
  uploadView: document.getElementById("uploadView"),
  uploadLoginForm: document.getElementById("uploadLoginForm"),
  username: document.getElementById("username"),
  pin: document.getElementById("pin"),
  loginMessage: document.getElementById("loginMessage"),
  currentUser: document.getElementById("currentUser"),
  logoutBtn: document.getElementById("logoutBtn"),
  uploadForm: document.getElementById("uploadForm"),
  fileInput: document.getElementById("fileInput"),
  uploadMessage: document.getElementById("uploadMessage")
};

document.addEventListener("DOMContentLoaded", initUpload);

function initUpload() {
  renderDate();
  const savedUser = localStorage.getItem("preparerUsername");
  const savedName = localStorage.getItem("preparerDisplayName") || savedUser;
  if (savedUser) showUpload(savedName);
  els.uploadLoginForm.addEventListener("submit", handleLogin);
  els.logoutBtn.addEventListener("click", logout);
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
    localStorage.setItem("preparerDisplayName", response.displayName || username);
    showUpload(response.displayName || username);
  } catch (error) {
    setMessage(els.loginMessage, error.message, "error");
  }
}

function showUpload(username) {
  els.currentUser.textContent = username;
  els.uploadLoginView.classList.add("hidden");
  els.uploadView.classList.remove("hidden");
}

function logout() {
  localStorage.removeItem("preparerUsername");
  localStorage.removeItem("preparerDisplayName");
  els.uploadView.classList.add("hidden");
  els.uploadLoginView.classList.remove("hidden");
  els.uploadLoginForm.reset();
  setMessage(els.loginMessage, "");
}

function renderDate() {
  const dateBox = document.getElementById("dateBox");
  if (!dateBox) return;

  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(now);
  const dayName = new Intl.DateTimeFormat("ar-SA", {
    timeZone: "Asia/Riyadh",
    weekday: "long"
  }).format(now);

  dateBox.textContent = `${dayName} - ${date}`;
}

async function uploadFile(event) {
  event.preventDefault();
  const file = els.fileInput.files[0];
  if (!file) return;

  setMessage(els.uploadMessage, "جاري قراءة الملف...");

  try {
    const rows = await readPrescriptionFile(file);
    if (!rows.length) throw new Error("لم يتم العثور على بيانات صالحة.");

    const uploadedBy = localStorage.getItem("preparerDisplayName") || localStorage.getItem("preparerUsername");
    if (!uploadedBy) throw new Error("سجّل الدخول أولاً.");
    const response = await api("uploadPrescriptions", { rows, uploadedBy });
    if (!response.ok) throw new Error(response.message || "فشل رفع البيانات.");

    els.uploadForm.reset();
    setMessage(els.uploadMessage, `تم رفع ${response.count} وصفة لقائمة اليوم.`, "success");
  } catch (error) {
    setMessage(els.uploadMessage, error.message, "error");
  }
}

async function readPrescriptionFile(file) {
  const extension = getFileExtension(file.name);

  if (["xlsx", "xls", "csv"].includes(extension)) {
    return readSpreadsheetFile(file);
  }
  throw new Error("نوع الملف غير مدعوم. استخدم Excel أو CSV فقط.");
}

async function readSpreadsheetFile(file) {
  if (!window.XLSX) throw new Error("لم يتم تحميل قارئ Excel بعد. أعد المحاولة.");

  const arrayBuffer = await readAsArrayBuffer(file);
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  return extractPrescriptionRows(data);
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

function getFileExtension(fileName) {
  return String(fileName || "").split(".").pop().toLowerCase();
}

function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("تعذر قراءة الملف."));
    reader.readAsArrayBuffer(file);
  });
}

function setMessage(element, text, type = "") {
  element.textContent = text;
  element.className = `message ${type}`.trim();
}

async function api(action, payload = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload })
  });

  if (!response.ok) throw new Error("تعذر الاتصال بالخادم.");
  return response.json();
}
