const API_URL = "https://script.google.com/macros/s/AKfycbw0jSrbe1SM596Kyv0EpB6VTKEXT81c2Cn8Wlc2lEQ_RzbrS9b6w-k4gyrflwPBTgpKSQ/exec";

const els = {
  loginView: document.getElementById("loginView"),
  prepView: document.getElementById("prepView"),
  loginForm: document.getElementById("loginForm"),
  username: document.getElementById("username"),
  pin: document.getElementById("pin"),
  loginMessage: document.getElementById("loginMessage"),
  currentUser: document.getElementById("currentUser"),
  changePinBtn: document.getElementById("changePinBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  startCameraBtn: document.getElementById("startCameraBtn"),
  manualForm: document.getElementById("manualForm"),
  manualFileNumber: document.getElementById("manualFileNumber"),
  scanMessage: document.getElementById("scanMessage"),
  resultCard: document.getElementById("resultCard"),
  fileNumberText: document.getElementById("fileNumberText"),
  patientNameText: document.getElementById("patientNameText"),
  preparedMessage: document.getElementById("preparedMessage"),
  markPreparedBtn: document.getElementById("markPreparedBtn")
};

let scanner;
let selectedPrescription = null;
let isScanning = false;
let inactivityTimer = null;
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

document.addEventListener("DOMContentLoaded", init);

function init() {
  renderDate();
  startInactivityWatcher();
  const savedUser = sessionStorage.getItem("preparerUsername");
  const savedName = sessionStorage.getItem("preparerDisplayName") || savedUser;
  if (savedUser) {
    showPrep(savedName);
  }

  els.loginForm.addEventListener("submit", handleLogin);
  els.changePinBtn.addEventListener("click", changePin);
  els.logoutBtn.addEventListener("click", logout);
  els.startCameraBtn.addEventListener("click", toggleCamera);
  els.manualForm.addEventListener("submit", handleManualSearch);
  els.markPreparedBtn.addEventListener("click", markPrepared);
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

async function handleLogin(event) {
  event.preventDefault();
  const username = els.username.value.trim();
  const pin = els.pin.value.trim();

  setMessage(els.loginMessage, "جاري تسجيل الدخول...");
  try {
    const response = await api("login", { username, pin });
    if (!response.ok) throw new Error(response.message || "بيانات الدخول غير صحيحة.");
    sessionStorage.setItem("preparerUsername", username);
    sessionStorage.setItem("preparerDisplayName", response.displayName || username);
    resetInactivityTimer();
    showPrep(response.displayName || username);
  } catch (error) {
    setMessage(els.loginMessage, error.message, "error");
  }
}

function showPrep(username) {
  els.currentUser.textContent = username;
  els.loginView.classList.add("hidden");
  els.prepView.classList.remove("hidden");
  updateCameraButton();
  setMessage(els.scanMessage, "الكاميرا متوقفة. اضغط زر الالتقاط لتشغيلها.");
}

function logout() {
  clearAuthSession();
  stopCamera();
  selectedPrescription = null;
  els.prepView.classList.add("hidden");
  els.loginView.classList.remove("hidden");
  els.loginForm.reset();
  clearResult();
}

function clearAuthSession() {
  sessionStorage.removeItem("preparerUsername");
  sessionStorage.removeItem("preparerDisplayName");
}

function startInactivityWatcher() {
  ["click", "keydown", "touchstart", "mousemove", "scan-activity"].forEach(eventName => {
    window.addEventListener(eventName, resetInactivityTimer, { passive: true });
  });
  resetInactivityTimer();
}

function resetInactivityTimer() {
  window.clearTimeout(inactivityTimer);
  inactivityTimer = window.setTimeout(() => {
    if (sessionStorage.getItem("preparerUsername")) logout();
  }, INACTIVITY_LIMIT_MS);
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
    updateCameraButton();
    setMessage(els.scanMessage, "وجّه الكاميرا نحو الباركود أو QR.");
  } catch (error) {
    updateCameraButton();
    setMessage(els.scanMessage, "تعذر تشغيل الكاميرا. تأكد من صلاحية الكاميرا أو استخدم الإدخال اليدوي.", "error");
  }
}

async function stopCamera() {
  if (!scanner || !isScanning) {
    updateCameraButton();
    return;
  }
  try {
    await scanner.stop();
  } catch (error) {
    console.warn(error);
  } finally {
    isScanning = false;
    updateCameraButton();
    setMessage(els.scanMessage, "تم إيقاف الكاميرا.");
  }
}

async function toggleCamera() {
  if (isScanning) {
    await stopCamera();
  } else {
    await startCamera();
  }
}

function updateCameraButton() {
  const text = document.getElementById("cameraButtonText");
  els.startCameraBtn.classList.toggle("is-on", isScanning);
  els.startCameraBtn.setAttribute("aria-pressed", String(isScanning));
  els.startCameraBtn.setAttribute("title", isScanning ? "إيقاف الكاميرا" : "إلتقاط");
  els.startCameraBtn.setAttribute("aria-label", isScanning ? "إيقاف الكاميرا" : "إلتقاط");
  if (text) text.textContent = isScanning ? "■" : "📷";
}

async function handleScanSuccess(decodedText) {
  resetInactivityTimer();
  const fileNumber = normalizeFileNumber(decodedText);
  if (!fileNumber) return;
  if (scanner && isScanning) scanner.pause(true);
  await lookupPrescription(fileNumber);
}

async function handleManualSearch(event) {
  event.preventDefault();
  resetInactivityTimer();
  const fileNumber = normalizeFileNumber(els.manualFileNumber.value);
  if (!fileNumber) {
    setMessage(els.scanMessage, "أدخل رقم الملف.", "error");
    return;
  }
  await lookupPrescription(fileNumber);
}

async function lookupPrescription(fileNumber) {
  resetInactivityTimer();
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
      els.preparedMessage.textContent = `تم تحضيرها سابقاً بواسطة ${response.preparedBy} الساعة ${timeText}. يمكنك تسجيل تحضير جديد.`;
      els.preparedMessage.classList.remove("hidden");
    }
    els.markPreparedBtn.disabled = false;

    setMessage(els.scanMessage, "تمت قراءة رقم الملف.", "success");
  } catch (error) {
    setMessage(els.scanMessage, error.message, "error");
    selectedPrescription = null;
  }
}

async function markPrepared() {
  if (!selectedPrescription) return;
  resetInactivityTimer();
  const preparedBy = sessionStorage.getItem("preparerDisplayName") || sessionStorage.getItem("preparerUsername");

  els.markPreparedBtn.disabled = true;
  setMessage(els.scanMessage, "جاري تسجيل التحضير...");

  try {
    const response = await api("markPrepared", {
      fileNumber: selectedPrescription.fileNumber,
      preparedBy
    });

    if (!response.ok) throw new Error(response.message || "لم يتم تسجيل التحضير.");

    setMessage(els.scanMessage, "تم الإرسال بنجاح.", "success");
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error) {
    setMessage(els.scanMessage, error.message, "error");
  }
}

async function changePin() {
  resetInactivityTimer();
  const username = sessionStorage.getItem("preparerUsername");
  if (!username) return;

  const currentPin = window.prompt("أدخل PIN الحالي:");
  if (!currentPin) return;
  const newPin = window.prompt("أدخل PIN الجديد:");
  if (!newPin) return;
  const confirmPin = window.prompt("أعد إدخال PIN الجديد:");
  if (newPin !== confirmPin) {
    setMessage(els.scanMessage, "PIN الجديد غير متطابق.", "error");
    return;
  }

  setMessage(els.scanMessage, "جاري تغيير PIN...");
  try {
    const response = await api("changePin", { username, currentPin, newPin });
    if (!response.ok) throw new Error(response.message || "تعذر تغيير PIN.");
    setMessage(els.scanMessage, response.message || "تم تغيير PIN بنجاح.", "success");
  } catch (error) {
    setMessage(els.scanMessage, error.message, "error");
  }
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
