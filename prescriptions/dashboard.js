const API_URL = "https://script.google.com/macros/s/AKfycbw0jSrbe1SM596Kyv0EpB6VTKEXT81c2Cn8Wlc2lEQ_RzbrS9b6w-k4gyrflwPBTgpKSQ/exec";

const els = {
  dashboardLoginView: document.getElementById("dashboardLoginView"),
  supervisorPanel: document.getElementById("supervisorPanel"),
  dashboardLoginForm: document.getElementById("dashboardLoginForm"),
  adminUsername: document.getElementById("adminUsername"),
  adminPin: document.getElementById("adminPin"),
  languageToggle: document.getElementById("languageToggle"),
  officialLine1: document.getElementById("officialLine1"),
  officialLine2: document.getElementById("officialLine2"),
  officialLine3: document.getElementById("officialLine3"),
  pageTitle: document.getElementById("pageTitle"),
  usernameLabel: document.getElementById("usernameLabel"),
  pinLabel: document.getElementById("pinLabel"),
  loginBtn: document.getElementById("loginBtn"),
  dashboardLoginMessage: document.getElementById("dashboardLoginMessage"),
  dashboardChangePinLoginBtn: document.getElementById("dashboardChangePinLoginBtn"),
  dashboardLogoutBtn: document.getElementById("dashboardLogoutBtn"),
  refreshSupervisorBtn: document.getElementById("refreshSupervisorBtn"),
  printReportBtn: document.getElementById("printReportBtn"),
  dateBox: document.getElementById("dateBox"),
  reportDate: document.getElementById("reportDate"),
  printReportDate: document.getElementById("printReportDate"),
  totalCount: document.getElementById("totalCount"),
  preparedCount: document.getElementById("preparedCount"),
  pendingCount: document.getElementById("pendingCount"),
  totalLabel: document.getElementById("totalLabel"),
  preparedLabel: document.getElementById("preparedLabel"),
  pendingLabel: document.getElementById("pendingLabel"),
  allFilterBtn: document.getElementById("allFilterBtn"),
  preparedFilterBtn: document.getElementById("preparedFilterBtn"),
  pendingFilterBtn: document.getElementById("pendingFilterBtn"),
  statusFilter: document.getElementById("statusFilter"),
  fileHeader: document.getElementById("fileHeader"),
  patientHeader: document.getElementById("patientHeader"),
  statusHeader: document.getElementById("statusHeader"),
  preparedByHeader: document.getElementById("preparedByHeader"),
  timeHeader: document.getElementById("timeHeader"),
  printOfficialLine1: document.getElementById("printOfficialLine1"),
  printOfficialLine2: document.getElementById("printOfficialLine2"),
  printOfficialLine3: document.getElementById("printOfficialLine3"),
  printTitle: document.getElementById("printTitle"),
  printTotalLabel: document.getElementById("printTotalLabel"),
  printPreparedLabel: document.getElementById("printPreparedLabel"),
  printPendingLabel: document.getElementById("printPendingLabel"),
  printUsersTitle: document.getElementById("printUsersTitle"),
  printPreparedByHeader: document.getElementById("printPreparedByHeader"),
  printCountHeader: document.getElementById("printCountHeader"),
  printTotalCount: document.getElementById("printTotalCount"),
  printPreparedCount: document.getElementById("printPreparedCount"),
  printPendingCount: document.getElementById("printPendingCount"),
  printUserBody: document.getElementById("printUserBody"),
  fileSearchInput: document.getElementById("fileSearchInput"),
  fileSearchBtn: document.getElementById("fileSearchBtn"),
  dailyListBody: document.getElementById("dailyListBody"),
  supervisorMessage: document.getElementById("supervisorMessage"),
  filterButtons: document.querySelectorAll(".filter-btn")
};

let dailyRows = [];
let activeFilter = "all";
let refreshTimer = null;
let isLoadingSupervisorData = false;
let inactivityTimer = null;
let currentLang = "ar";
let lastSummary = null;
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

const i18n = {
  ar: {
    pageTitle: "مؤشر وصفات البريد اليومي",
    officialLine1: "تجمع المدينة المنورة الصحي",
    officialLine2: "مستشفى الملك فهد بالمدينة المنورة",
    officialLine3: "إدارة الرعاية الصيدلانية",
    username: "اسم المستخدم",
    pin: "PIN",
    login: "دخول",
    changePin: "تغيير PIN",
    logout: "خروج",
    refresh: "تحديث",
    print: "طباعة التقرير",
    total: "إجمالي القائمة",
    prepared: "جاهزة للتسليم",
    pending: "تحت المعالجة",
    all: "الكل",
    filterLabel: "فلترة حالة الوصفات",
    search: "بحث",
    fileNumber: "رقم الملف",
    patientName: "اسم المريض",
    status: "الحالة",
    preparedBy: "معالجة بواسطة",
    time: "الوقت",
    count: "العدد",
    usersAchievement: "إنجاز الموظفين",
    printTitle: "المؤشر اليومي لوصفات البريد",
    loginLoading: "جاري تسجيل الدخول...",
    invalidAdmin: "بيانات الأدمن غير صحيحة.",
    promptUsername: "أدخل اسم المستخدم:",
    promptCurrentPin: "أدخل PIN الحالي:",
    promptNewPin: "أدخل PIN الجديد:",
    promptConfirmPin: "أعد إدخال PIN الجديد:",
    pinMismatch: "PIN الجديد غير متطابق.",
    pinChanging: "جاري تغيير مفتاح الدخول...",
    pinChangeFailed: "تعذر تغيير مفتاح الدخول.",
    pinChanged: "تم تغيير مفتاح الدخول بنجاح.",
    loadFailed: "تعذر تحميل قائمة اليوم.",
    lastUpdate: "آخر تحديث: ",
    noPrepared: "لا توجد وصفات جاهزة للتسليم.",
    noRows: "لا توجد قائمة مرفوعة لليوم.",
    serverFailed: "تعذر الاتصال بالخادم."
  },
  en: {
    pageTitle: "Daily Prescription Mail Dashboard",
    officialLine1: "Madinah Health Cluster",
    officialLine2: "King Fahad Hospital - Madinah",
    officialLine3: "Pharmaceutical Care Administration",
    username: "Username",
    pin: "PIN",
    login: "Login",
    changePin: "Change PIN",
    logout: "Logout",
    refresh: "Refresh",
    print: "Print Report",
    total: "Total List",
    prepared: "Ready for Pickup",
    pending: "In Progress",
    all: "All",
    filterLabel: "Filter prescription status",
    search: "Search",
    fileNumber: "File Number",
    patientName: "Patient Name",
    status: "Status",
    preparedBy: "Processed By",
    time: "Time",
    count: "Count",
    usersAchievement: "Employee Progress",
    printTitle: "Daily Prescription Mail Dashboard",
    loginLoading: "Signing in...",
    invalidAdmin: "Invalid admin credentials.",
    promptUsername: "Enter username:",
    promptCurrentPin: "Enter current PIN:",
    promptNewPin: "Enter new PIN:",
    promptConfirmPin: "Re-enter new PIN:",
    pinMismatch: "The new PIN does not match.",
    pinChanging: "Changing PIN...",
    pinChangeFailed: "Unable to change PIN.",
    pinChanged: "PIN changed successfully.",
    loadFailed: "Unable to load today's list.",
    lastUpdate: "Last update: ",
    noPrepared: "No prescriptions are ready for pickup.",
    noRows: "No list has been uploaded for today.",
    serverFailed: "Unable to connect to the server."
  }
};

function t(key) {
  return i18n[currentLang][key] || i18n.ar[key] || key;
}

document.addEventListener("DOMContentLoaded", initDashboard);

function initDashboard() {
  startInactivityWatcher();
  setLanguage("ar");
  if (hasDashboardSession()) showDashboard();
  els.dashboardLoginForm.addEventListener("submit", dashboardLogin);
  if (els.languageToggle) els.languageToggle.addEventListener("click", toggleLanguage);
  els.dashboardChangePinLoginBtn.addEventListener("click", changeLoginPin);
  els.dashboardLogoutBtn.addEventListener("click", dashboardLogout);
  els.refreshSupervisorBtn.addEventListener("click", loadSupervisorData);
  els.printReportBtn.addEventListener("click", () => window.print());
  els.filterButtons.forEach(button => {
    button.addEventListener("click", () => setStatusFilter(button.dataset.filter));
  });
  els.fileSearchInput.addEventListener("input", () => renderDailyRows(getFilteredRows()));
  els.fileSearchBtn.addEventListener("click", applyFileSearch);
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
  if (els.dashboardChangePinLoginBtn) {
    els.dashboardChangePinLoginBtn.title = t("changePin");
    els.dashboardChangePinLoginBtn.setAttribute("aria-label", t("changePin"));
  }
  if (els.dashboardLogoutBtn) {
    els.dashboardLogoutBtn.title = t("logout");
    els.dashboardLogoutBtn.setAttribute("aria-label", t("logout"));
  }
  if (els.refreshSupervisorBtn) {
    els.refreshSupervisorBtn.title = t("refresh");
    els.refreshSupervisorBtn.setAttribute("aria-label", t("refresh"));
  }
  if (els.printReportBtn) {
    els.printReportBtn.title = t("print");
    els.printReportBtn.setAttribute("aria-label", t("print"));
  }
  if (els.totalLabel) els.totalLabel.textContent = t("total");
  if (els.preparedLabel) els.preparedLabel.textContent = t("prepared");
  if (els.pendingLabel) els.pendingLabel.textContent = t("pending");
  if (els.allFilterBtn) els.allFilterBtn.textContent = t("all");
  if (els.preparedFilterBtn) els.preparedFilterBtn.textContent = t("prepared");
  if (els.pendingFilterBtn) els.pendingFilterBtn.textContent = t("pending");
  if (els.statusFilter) els.statusFilter.setAttribute("aria-label", t("filterLabel"));
  if (els.fileSearchBtn) {
    els.fileSearchBtn.title = t("search");
    els.fileSearchBtn.setAttribute("aria-label", t("search"));
  }
  if (els.fileHeader) els.fileHeader.textContent = t("fileNumber");
  if (els.patientHeader) els.patientHeader.textContent = t("patientName");
  if (els.statusHeader) els.statusHeader.textContent = t("status");
  if (els.preparedByHeader) els.preparedByHeader.textContent = t("preparedBy");
  if (els.timeHeader) els.timeHeader.textContent = t("time");
  if (els.printOfficialLine1) els.printOfficialLine1.textContent = t("officialLine1");
  if (els.printOfficialLine2) els.printOfficialLine2.textContent = t("officialLine2");
  if (els.printOfficialLine3) els.printOfficialLine3.textContent = t("officialLine3");
  if (els.printTitle) els.printTitle.textContent = t("printTitle");
  if (els.printTotalLabel) els.printTotalLabel.textContent = t("total");
  if (els.printPreparedLabel) els.printPreparedLabel.textContent = t("prepared");
  if (els.printPendingLabel) els.printPendingLabel.textContent = t("pending");
  if (els.printUsersTitle) els.printUsersTitle.textContent = t("usersAchievement");
  if (els.printPreparedByHeader) els.printPreparedByHeader.textContent = t("preparedBy");
  if (els.printCountHeader) els.printCountHeader.textContent = t("count");
  if (els.languageToggle) els.languageToggle.textContent = "🌐 ع | E";
  renderDate(els.reportDate ? els.reportDate.textContent : "");
  renderDailyRows(getFilteredRows());
  if (lastSummary) renderPrintReport(lastSummary);
}

function toggleLanguage() {
  setLanguage(currentLang === "ar" ? "en" : "ar");
}

async function dashboardLogin(event) {
  event.preventDefault();
  const username = els.adminUsername.value.trim();
  const pin = els.adminPin.value.trim();

  setLoginMessage(t("loginLoading"));
  try {
    const response = await api("adminLogin", { username, pin });
    if (!isSuccess(response)) throw new Error(response.message || t("invalidAdmin"));
    sessionStorage.setItem("dashboardAdminUsername", "Admin");
    sessionStorage.setItem("dashboardAdminPin", pin);
    resetInactivityTimer();
    setLoginMessage("");
    showDashboard();
  } catch (error) {
    setLoginMessage(error.message, "error");
  }
}

function showDashboard() {
  els.dashboardLoginView.classList.add("hidden");
  els.supervisorPanel.classList.remove("hidden");
  loadSupervisorData();
  if (!refreshTimer) refreshTimer = setInterval(loadSupervisorData, 30000);
}

function dashboardLogout() {
  clearDashboardSession();
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  els.supervisorPanel.classList.add("hidden");
  els.dashboardLoginView.classList.remove("hidden");
  els.dashboardLoginForm.reset();
  setLoginMessage("");
}

function clearDashboardSession() {
  sessionStorage.removeItem("dashboardAdminUsername");
  sessionStorage.removeItem("dashboardAdminPin");
}

function startInactivityWatcher() {
  ["click", "keydown", "touchstart", "mousemove"].forEach(eventName => {
    window.addEventListener(eventName, resetInactivityTimer, { passive: true });
  });
  resetInactivityTimer();
}

function resetInactivityTimer() {
  window.clearTimeout(inactivityTimer);
  inactivityTimer = window.setTimeout(() => {
    if (hasDashboardSession()) dashboardLogout();
  }, INACTIVITY_LIMIT_MS);
}

function hasDashboardSession() {
  return String(sessionStorage.getItem("dashboardAdminUsername") || "").toLowerCase() === "admin" &&
    Boolean(sessionStorage.getItem("dashboardAdminPin"));
}

function isSuccess(response) {
  return Boolean(response && (response.ok || response.success));
}

async function changeLoginPin() {
  const username = els.adminUsername.value.trim() || window.prompt(t("promptUsername"));
  if (!username) return;
  const currentPin = window.prompt(t("promptCurrentPin"));
  if (!currentPin) return;
  const newPin = window.prompt(t("promptNewPin"));
  if (!newPin) return;
  const confirmPin = window.prompt(t("promptConfirmPin"));
  if (newPin !== confirmPin) {
    setLoginMessage(t("pinMismatch"), "error");
    return;
  }

  setLoginMessage(t("pinChanging"));
  try {
    const response = await api("changeLoginPin", { username, currentPin, newPin });
    if (!response.ok) throw new Error(response.message || t("pinChangeFailed"));
    setLoginMessage(t("pinChanged"), "success");
    setTimeout(() => window.location.reload(), 1200);
  } catch (error) {
    setLoginMessage(error.message, "error");
  }
}

function renderDate(extraText = "") {
  els.dateBox.textContent = getTodayLabel();
  els.reportDate.textContent = extraText ? extraText.replace(/^ \| /, "") : "";
}

function getTodayLabel() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(now);
  const dayName = new Intl.DateTimeFormat(currentLang === "ar" ? "ar-SA" : "en-US", {
    timeZone: "Asia/Riyadh",
    weekday: "long"
  }).format(now);
  return `${dayName} - ${date}`;
}

async function loadSupervisorData() {
  if (isLoadingSupervisorData) return;
  isLoadingSupervisorData = true;
  els.refreshSupervisorBtn.disabled = true;
  els.refreshSupervisorBtn.classList.add("is-loading");
  setMessage(els.supervisorMessage, "");

  try {
    const response = await api("getDailyStatus");
    if (!response.ok) throw new Error(response.message || t("loadFailed"));

    lastSummary = response.summary || {};
    renderSupervisorSummary(lastSummary);
    renderPrintReport(lastSummary);
    dailyRows = response.rows || [];
    renderDailyRows(getFilteredRows());
    renderDate(t("lastUpdate") + (response.dateText || formatDateTime(new Date())));
    setMessage(els.supervisorMessage, "");
  } catch (error) {
    setMessage(els.supervisorMessage, error.message, "error");
  } finally {
    isLoadingSupervisorData = false;
    els.refreshSupervisorBtn.disabled = false;
    els.refreshSupervisorBtn.classList.remove("is-loading");
  }
}

function applyFileSearch() {
  renderDailyRows(getFilteredRows());
  els.fileSearchInput.focus();
}

function setStatusFilter(filter) {
  activeFilter = filter || "all";
  els.filterButtons.forEach(button => {
    button.classList.toggle("active-filter", button.dataset.filter === activeFilter);
  });
  renderDailyRows(getFilteredRows());
}

function getFilteredRows() {
  const searchValue = normalizeSearch(els.fileSearchInput.value);
  return dailyRows.filter(item => {
    const matchesStatus = activeFilter === "all" || item.status === activeFilter;
    const matchesSearch = !searchValue || normalizeSearch(item.fileNumber).includes(searchValue);
    return matchesStatus && matchesSearch;
  });
}

function renderSupervisorSummary(summary = {}) {
  els.totalCount.textContent = summary.total || 0;
  els.preparedCount.textContent = summary.prepared || 0;
  els.pendingCount.textContent = summary.pending || 0;
}

function renderPrintReport(summary = {}) {
  els.printReportDate.textContent = getTodayLabel();
  els.printTotalCount.textContent = summary.total || 0;
  els.printPreparedCount.textContent = summary.prepared || 0;
  els.printPendingCount.textContent = summary.pending || 0;
  renderPrintUsers(summary.preparedByUser || []);
}

function renderPrintUsers(users) {
  els.printUserBody.innerHTML = "";

  if (!users.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="2">${t("noPrepared")}</td>`;
    els.printUserBody.appendChild(row);
    return;
  }

  users.forEach(user => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(user.name)}</td>
      <td>${user.count || 0}</td>
    `;
    els.printUserBody.appendChild(row);
  });
}

function renderDailyRows(rows) {
  els.dailyListBody.innerHTML = "";

  if (!rows.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5" class="empty-cell">${t("noRows")}</td>`;
    els.dailyListBody.appendChild(row);
    return;
  }

  rows.forEach(item => {
    const row = document.createElement("tr");
    row.className = item.status === "prepared" ? "row-prepared" : "row-pending";
    row.innerHTML = `
      <td data-label="${t("fileNumber")}">${escapeHtml(item.fileNumber)}</td>
      <td data-label="${t("patientName")}">${escapeHtml(item.patientName)}</td>
      <td data-label="${t("status")}"><span class="status-pill ${item.status === "prepared" ? "prepared" : "pending"}">${item.status === "prepared" ? t("prepared") : t("pending")}</span></td>
      <td data-label="${t("preparedBy")}">${escapeHtml(item.preparedBy || "-")}</td>
      <td data-label="${t("time")}">${item.preparedAt ? formatDateTime(item.preparedAt) : "-"}</td>
    `;
    els.dailyListBody.appendChild(row);
  });
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

function setMessage(element, text, type = "") {
  element.textContent = text;
  element.className = `message ${type}`.trim();
}

function setLoginMessage(text, type = "") {
  els.dashboardLoginMessage.textContent = text;
  els.dashboardLoginMessage.className = `message ${type}`.trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeSearch(value) {
  return String(value || "").trim().replace(/\s+/g, "");
}

async function api(action, payload = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload })
  });

  if (!response.ok) throw new Error(t("serverFailed"));
  return response.json();
}
