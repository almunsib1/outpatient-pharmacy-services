const API_URL = "https://script.google.com/macros/s/AKfycbw0jSrbe1SM596Kyv0EpB6VTKEXT81c2Cn8Wlc2lEQ_RzbrS9b6w-k4gyrflwPBTgpKSQ/exec";

const els = {
  loginView: document.getElementById("loginView"),
  prepView: document.getElementById("prepView"),
  loginForm: document.getElementById("loginForm"),
  username: document.getElementById("username"),
  pin: document.getElementById("pin"),
  languageToggle: document.getElementById("languageToggle"),
  officialLine1: document.getElementById("officialLine1"),
  officialLine2: document.getElementById("officialLine2"),
  officialLine3: document.getElementById("officialLine3"),
  pageTitle: document.getElementById("pageTitle"),
  usernameLabel: document.getElementById("usernameLabel"),
  pinLabel: document.getElementById("pinLabel"),
  loginBtn: document.getElementById("loginBtn"),
  loginMessage: document.getElementById("loginMessage"),
  changePinLoginBtn: document.getElementById("changePinLoginBtn"),
  currentUser: document.getElementById("currentUser"),
  logoutBtn: document.getElementById("logoutBtn"),
  startCameraBtn: document.getElementById("startCameraBtn"),
  manualForm: document.getElementById("manualForm"),
  manualFileNumber: document.getElementById("manualFileNumber"),
  manualSearchBtn: document.getElementById("manualSearchBtn"),
  scanMessage: document.getElementById("scanMessage"),
  resultCard: document.getElementById("resultCard"),
  fileNumberLabel: document.getElementById("fileNumberLabel"),
  fileNumberText: document.getElementById("fileNumberText"),
  patientNameLabel: document.getElementById("patientNameLabel"),
  patientNameText: document.getElementById("patientNameText"),
  preparedMessage: document.getElementById("preparedMessage"),
  markPreparedBtn: document.getElementById("markPreparedBtn")
};

let scanner;
let selectedPrescription = null;
let isScanning = false;
let inactivityTimer = null;
let currentLang = "ar";
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
const PREP_SESSION_USER_KEY = "mailPrepUsername";
const PREP_SESSION_NAME_KEY = "mailPrepDisplayName";

const i18n = {
  ar: {
    pageTitle: "وصفات البريد الدوائي",
    officialLine1: "تجمع المدينة المنورة الصحي",
    officialLine2: "مستشفى الملك فهد بالمدينة المنورة",
    officialLine3: "إدارة الرعاية الصيدلانية",
    username: "اسم المستخدم",
    pin: "PIN",
    login: "دخول",
    changePin: "تغيير PIN",
    logout: "خروج",
    capture: "إلتقاط",
    stopCamera: "إيقاف الكاميرا",
    search: "بحث",
    fileNumber: "رقم الملف",
    patientName: "اسم المريض",
    send: "إرسال",
    loginLoading: "جاري تسجيل الدخول...",
    invalidLogin: "بيانات الدخول غير صحيحة.",
    promptUsername: "أدخل اسم المستخدم:",
    promptCurrentPin: "أدخل PIN الحالي:",
    promptNewPin: "أدخل PIN الجديد:",
    promptConfirmPin: "أعد إدخال PIN الجديد:",
    pinMismatch: "PIN الجديد غير متطابق.",
    pinChanging: "جاري تغيير مفتاح الدخول...",
    pinChangeFailed: "تعذر تغيير مفتاح الدخول.",
    pinChanged: "تم تغيير مفتاح الدخول بنجاح.",
    cameraOff: "الكاميرا متوقفة. اضغط زر الالتقاط لتشغيلها.",
    cameraNotLoaded: "لم يتم تحميل قارئ الكاميرا بعد. أعد المحاولة.",
    cameraStarting: "جاري تشغيل الكاميرا...",
    cameraGuide: "وجّه الكاميرا نحو الباركود أو QR.",
    cameraFailed: "تعذر تشغيل الكاميرا. تأكد من صلاحية الكاميرا أو استخدم الإدخال اليدوي.",
    cameraStopped: "تم إيقاف الكاميرا.",
    enterFile: "أدخل رقم الملف.",
    searching: "جاري البحث عن رقم الملف...",
    notFound: "لم يتم العثور على الوصفة.",
    alreadyPrepared: (name, time) => `تم تحضيرها سابقاً بواسطة ${name} الساعة ${time}. يمكنك تسجيل تحضير جديد.`,
    readSuccess: "تمت قراءة رقم الملف.",
    preparing: "جاري تسجيل التحضير...",
    prepareFailed: "لم يتم تسجيل التحضير.",
    sent: "تم الإرسال بنجاح.",
    scriptUrlMissing: "ضع رابط Google Apps Script Web App في ملف script.js أولاً.",
    serverFailed: "تعذر الاتصال بالخادم."
  },
  en: {
    pageTitle: "Mail Pharmacy Prescription",
    officialLine1: "Madinah Health Cluster",
    officialLine2: "King Fahad Hospital - Madinah",
    officialLine3: "Pharmaceutical Care Administration",
    username: "Username",
    pin: "PIN",
    login: "Login",
    changePin: "Change PIN",
    logout: "Logout",
    capture: "Capture",
    stopCamera: "Stop Camera",
    search: "Search",
    fileNumber: "File Number",
    patientName: "Patient Name",
    send: "Submit",
    loginLoading: "Signing in...",
    invalidLogin: "Invalid username or PIN.",
    promptUsername: "Enter username:",
    promptCurrentPin: "Enter current PIN:",
    promptNewPin: "Enter new PIN:",
    promptConfirmPin: "Re-enter new PIN:",
    pinMismatch: "The new PIN does not match.",
    pinChanging: "Changing PIN...",
    pinChangeFailed: "Unable to change PIN.",
    pinChanged: "PIN changed successfully.",
    cameraOff: "Camera is off. Press capture to start it.",
    cameraNotLoaded: "Camera reader has not loaded yet. Try again.",
    cameraStarting: "Starting camera...",
    cameraGuide: "Point the camera at the barcode or QR.",
    cameraFailed: "Unable to start camera. Check camera permission or use manual entry.",
    cameraStopped: "Camera stopped.",
    enterFile: "Enter the file number.",
    searching: "Searching for file number...",
    notFound: "Prescription was not found.",
    alreadyPrepared: (name, time) => `Previously prepared by ${name} at ${time}. You can record a new preparation.`,
    readSuccess: "File number was read.",
    preparing: "Recording preparation...",
    prepareFailed: "Preparation was not recorded.",
    sent: "Submitted successfully.",
    scriptUrlMissing: "Add the Google Apps Script Web App URL in script.js first.",
    serverFailed: "Unable to connect to the server."
  }
};

function t(key, ...args) {
  const value = i18n[currentLang][key] || i18n.ar[key] || key;
  return typeof value === "function" ? value(...args) : value;
}

document.addEventListener("DOMContentLoaded", init);

function init() {
  setLanguage("ar");
  startInactivityWatcher();
  const savedUser = sessionStorage.getItem(PREP_SESSION_USER_KEY);
  const savedName = sessionStorage.getItem(PREP_SESSION_NAME_KEY) || savedUser;
  if (savedUser) {
    showPrep(savedName);
  }

  els.loginForm.addEventListener("submit", handleLogin);
  if (els.languageToggle) els.languageToggle.addEventListener("click", toggleLanguage);
  els.changePinLoginBtn.addEventListener("click", changeLoginPin);
  els.logoutBtn.addEventListener("click", logout);
  els.startCameraBtn.addEventListener("click", toggleCamera);
  els.manualForm.addEventListener("submit", handleManualSearch);
  els.markPreparedBtn.addEventListener("click", markPrepared);
}

function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.title = t("pageTitle");
  if (els.officialLine1) els.officialLine1.textContent = t("officialLine1");
  if (els.officialLine2) els.officialLine2.textContent = t("officialLine2");
  if (els.officialLine3) els.officialLine3.textContent = t("officialLine3");
  if (els.pageTitle) els.pageTitle.textContent = t("pageTitle");
  if (els.usernameLabel) els.usernameLabel.textContent = t("username");
  if (els.pinLabel) els.pinLabel.textContent = t("pin");
  if (els.loginBtn) {
    els.loginBtn.title = t("login");
    els.loginBtn.setAttribute("aria-label", t("login"));
  }
  if (els.changePinLoginBtn) {
    els.changePinLoginBtn.title = t("changePin");
    els.changePinLoginBtn.setAttribute("aria-label", t("changePin"));
  }
  if (els.logoutBtn) {
    els.logoutBtn.title = t("logout");
    els.logoutBtn.setAttribute("aria-label", t("logout"));
  }
  if (els.manualSearchBtn) {
    els.manualSearchBtn.title = t("search");
    els.manualSearchBtn.setAttribute("aria-label", t("search"));
  }
  if (els.fileNumberLabel) els.fileNumberLabel.textContent = t("fileNumber");
  if (els.patientNameLabel) els.patientNameLabel.textContent = t("patientName");
  if (els.markPreparedBtn) {
    els.markPreparedBtn.title = t("send");
    els.markPreparedBtn.setAttribute("aria-label", t("send"));
  }
  if (els.languageToggle) els.languageToggle.textContent = "🌐 ع | E";
  renderDate();
  updateCameraButton();
}

function toggleLanguage() {
  setLanguage(currentLang === "ar" ? "en" : "ar");
}

function renderDate() {
  const dateBox = document.getElementById("dateBox");
  if (!dateBox) return;

  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(now);
  const dayName = new Intl.DateTimeFormat(currentLang === "ar" ? "ar-SA" : "en-US", {
    timeZone: "Asia/Riyadh",
    weekday: "long"
  }).format(now);

  dateBox.textContent = `${dayName} - ${date}`;
}

async function handleLogin(event) {
  event.preventDefault();
  const username = els.username.value.trim();
  const pin = els.pin.value.trim();

  setMessage(els.loginMessage, t("loginLoading"));
  try {
    const response = await authenticateLogin(username, pin);
    sessionStorage.setItem(PREP_SESSION_USER_KEY, username);
    sessionStorage.setItem(PREP_SESSION_NAME_KEY, response.displayName || username);
    resetInactivityTimer();
    showPrep(response.displayName || username);
  } catch (error) {
    setMessage(els.loginMessage, error.message, "error");
  }
}

async function authenticateLogin(username, pin) {
  const response = await api("login", { username, pin });
  if (isSuccess(response)) return response;

  if (username.toLowerCase() === "admin") {
    const adminResponse = await api("adminLogin", { username, pin });
    if (isSuccess(adminResponse)) {
      return { ...adminResponse, displayName: adminResponse.displayName || "Admin" };
    }
  }

  throw new Error(response.message || t("invalidLogin"));
}

function isSuccess(response) {
  return Boolean(response && (response.ok || response.success));
}

async function changeLoginPin() {
  const username = els.username.value.trim() || window.prompt(t("promptUsername"));
  if (!username) return;
  const currentPin = window.prompt(t("promptCurrentPin"));
  if (!currentPin) return;
  const newPin = window.prompt(t("promptNewPin"));
  if (!newPin) return;
  const confirmPin = window.prompt(t("promptConfirmPin"));
  if (newPin !== confirmPin) {
    setMessage(els.loginMessage, t("pinMismatch"), "error");
    return;
  }

  setMessage(els.loginMessage, t("pinChanging"));
  try {
    const response = await api("changeLoginPin", { username, currentPin, newPin });
    if (!response.ok) throw new Error(response.message || t("pinChangeFailed"));
    setMessage(els.loginMessage, t("pinChanged"), "success");
    setTimeout(() => window.location.reload(), 1200);
  } catch (error) {
    setMessage(els.loginMessage, error.message, "error");
  }
}

function showPrep(username) {
  els.currentUser.textContent = username;
  els.loginView.classList.add("hidden");
  els.prepView.classList.remove("hidden");
  updateCameraButton();
  setMessage(els.scanMessage, t("cameraOff"));
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
  sessionStorage.removeItem(PREP_SESSION_USER_KEY);
  sessionStorage.removeItem(PREP_SESSION_NAME_KEY);
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
    if (sessionStorage.getItem(PREP_SESSION_USER_KEY)) logout();
  }, INACTIVITY_LIMIT_MS);
}

async function startCamera() {
  if (!window.Html5Qrcode) {
    setMessage(els.scanMessage, t("cameraNotLoaded"), "error");
    return;
  }
  if (isScanning) return;

  scanner = scanner || new Html5Qrcode("reader");
  setMessage(els.scanMessage, t("cameraStarting"));

  try {
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      handleScanSuccess
    );
    isScanning = true;
    updateCameraButton();
    setMessage(els.scanMessage, t("cameraGuide"));
  } catch (error) {
    updateCameraButton();
    setMessage(els.scanMessage, t("cameraFailed"), "error");
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
    setMessage(els.scanMessage, t("cameraStopped"));
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
  els.startCameraBtn.setAttribute("title", isScanning ? t("stopCamera") : t("capture"));
  els.startCameraBtn.setAttribute("aria-label", isScanning ? t("stopCamera") : t("capture"));
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
    setMessage(els.scanMessage, t("enterFile"), "error");
    return;
  }
  await lookupPrescription(fileNumber);
}

async function lookupPrescription(fileNumber) {
  resetInactivityTimer();
  clearResult();
  setMessage(els.scanMessage, t("searching"));

  try {
    const response = await api("lookupPrescription", { fileNumber });
    if (!response.ok) throw new Error(response.message || t("notFound"));

    selectedPrescription = {
      fileNumber: response.fileNumber,
      patientName: response.patientName
    };

    els.fileNumberText.textContent = response.fileNumber;
    els.patientNameText.textContent = response.patientName;
    els.resultCard.classList.remove("hidden");

    if (response.prepared && isTodayRiyadh(response.preparedAt)) {
      const timeText = formatDateTime(response.preparedAt);
      els.preparedMessage.textContent = t("alreadyPrepared", response.preparedBy, timeText);
      els.preparedMessage.classList.remove("hidden");
    }
    els.markPreparedBtn.disabled = false;

    setMessage(els.scanMessage, t("readSuccess"), "success");
  } catch (error) {
    setMessage(els.scanMessage, error.message, "error");
    selectedPrescription = null;
  }
}

async function markPrepared() {
  if (!selectedPrescription) return;
  resetInactivityTimer();
  const preparedBy = sessionStorage.getItem(PREP_SESSION_NAME_KEY) || sessionStorage.getItem(PREP_SESSION_USER_KEY);

  els.markPreparedBtn.disabled = true;
  setMessage(els.scanMessage, t("preparing"));

  try {
    const response = await api("markPrepared", {
      fileNumber: selectedPrescription.fileNumber,
      preparedBy
    });

    if (!response.ok) throw new Error(response.message || t("prepareFailed"));

    setMessage(els.scanMessage, t("sent"), "success");
    setTimeout(() => {
      window.location.reload();
    }, 1500);
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
  return date.toLocaleString(currentLang === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function isTodayRiyadh(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return false;
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" });
  return formatter.format(date) === formatter.format(new Date());
}

async function api(action, payload = {}) {
  if (!API_URL || API_URL.includes("PUT_GOOGLE_APPS_SCRIPT")) {
    throw new Error(t("scriptUrlMissing"));
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload })
  });

  if (!response.ok) {
    throw new Error(t("serverFailed"));
  }

  return response.json();
}
