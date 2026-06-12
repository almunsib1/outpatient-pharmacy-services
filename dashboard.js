const API_URL = "https://script.google.com/macros/s/AKfycbw0jSrbe1SM596Kyv0EpB6VTKEXT81c2Cn8Wlc2lEQ_RzbrS9b6w-k4gyrflwPBTgpKSQ/exec";

const els = {
  dashboardLoginView: document.getElementById("dashboardLoginView"),
  supervisorPanel: document.getElementById("supervisorPanel"),
  dashboardLoginForm: document.getElementById("dashboardLoginForm"),
  adminUsername: document.getElementById("adminUsername"),
  adminPin: document.getElementById("adminPin"),
  dashboardLoginMessage: document.getElementById("dashboardLoginMessage"),
  dashboardLogoutBtn: document.getElementById("dashboardLogoutBtn"),
  refreshSupervisorBtn: document.getElementById("refreshSupervisorBtn"),
  printReportBtn: document.getElementById("printReportBtn"),
  dateBox: document.getElementById("dateBox"),
  reportDate: document.getElementById("reportDate"),
  printReportDate: document.getElementById("printReportDate"),
  totalCount: document.getElementById("totalCount"),
  preparedCount: document.getElementById("preparedCount"),
  pendingCount: document.getElementById("pendingCount"),
  printTotalCount: document.getElementById("printTotalCount"),
  printPreparedCount: document.getElementById("printPreparedCount"),
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
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

document.addEventListener("DOMContentLoaded", initDashboard);

function initDashboard() {
  startInactivityWatcher();
  if (hasDashboardSession()) showDashboard();
  els.dashboardLoginForm.addEventListener("submit", dashboardLogin);
  els.dashboardLogoutBtn.addEventListener("click", dashboardLogout);
  els.refreshSupervisorBtn.addEventListener("click", loadSupervisorData);
  els.printReportBtn.addEventListener("click", () => window.print());
  els.filterButtons.forEach(button => {
    button.addEventListener("click", () => setStatusFilter(button.dataset.filter));
  });
  els.fileSearchInput.addEventListener("input", () => renderDailyRows(getFilteredRows()));
  els.fileSearchBtn.addEventListener("click", applyFileSearch);
  renderDate();
}

function dashboardLogin(event) {
  event.preventDefault();
  const username = els.adminUsername.value.trim();
  const pin = els.adminPin.value.trim();

  if (username.toLowerCase() !== "admin" || pin !== "3414") {
    setLoginMessage("بيانات الأدمن غير صحيحة.", "error");
    return;
  }

  sessionStorage.setItem("dashboardAdminUsername", username);
  sessionStorage.setItem("dashboardAdminPin", pin);
  resetInactivityTimer();
  showDashboard();
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
    sessionStorage.getItem("dashboardAdminPin") === "3414";
}

function renderDate(extraText = "") {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(now);
  const dayName = new Intl.DateTimeFormat("ar-SA", {
    timeZone: "Asia/Riyadh",
    weekday: "long"
  }).format(now);

  els.dateBox.textContent = `${dayName} - ${date}`;
  els.reportDate.textContent = extraText ? extraText.replace(/^ \| /, "") : "";
}

async function loadSupervisorData() {
  if (isLoadingSupervisorData) return;
  isLoadingSupervisorData = true;
  els.refreshSupervisorBtn.disabled = true;
  els.refreshSupervisorBtn.classList.add("is-loading");
  setMessage(els.supervisorMessage, "");

  try {
    const response = await api("getDailyStatus");
    if (!response.ok) throw new Error(response.message || "تعذر تحميل قائمة اليوم.");

    renderSupervisorSummary(response.summary);
    renderPrintReport(response.summary);
    dailyRows = response.rows || [];
    renderDailyRows(getFilteredRows());
    renderDate("آخر تحديث: " + (response.dateText || formatDateTime(new Date())));
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
  els.printReportDate.textContent = els.dateBox.textContent;
  els.printTotalCount.textContent = summary.total || 0;
  els.printPreparedCount.textContent = summary.prepared || 0;
  renderPrintUsers(summary.preparedByUser || []);
}

function renderPrintUsers(users) {
  els.printUserBody.innerHTML = "";

  if (!users.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="2">لا توجد وصفات جاهزة للإرسال.</td>`;
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
    row.innerHTML = `<td colspan="5" class="empty-cell">لا توجد قائمة مرفوعة لليوم.</td>`;
    els.dailyListBody.appendChild(row);
    return;
  }

  rows.forEach(item => {
    const row = document.createElement("tr");
    row.className = item.status === "prepared" ? "row-prepared" : "row-pending";
    row.innerHTML = `
      <td data-label="رقم الملف">${escapeHtml(item.fileNumber)}</td>
      <td data-label="اسم المريض">${escapeHtml(item.patientName)}</td>
      <td data-label="الحالة"><span class="status-pill ${item.status === "prepared" ? "prepared" : "pending"}">${item.statusText}</span></td>
      <td data-label="معالجة بواسطة">${escapeHtml(item.preparedBy || "-")}</td>
      <td data-label="الوقت">${item.preparedAt ? formatDateTime(item.preparedAt) : "-"}</td>
    `;
    els.dailyListBody.appendChild(row);
  });
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

  if (!response.ok) throw new Error("تعذر الاتصال بالخادم.");
  return response.json();
}
