const API_URL = "https://script.google.com/macros/s/AKfycbw0jSrbe1SM596Kyv0EpB6VTKEXT81c2Cn8Wlc2lEQ_RzbrS9b6w-k4gyrflwPBTgpKSQ/exec";

const els = {
  refreshSupervisorBtn: document.getElementById("refreshSupervisorBtn"),
  printReportBtn: document.getElementById("printReportBtn"),
  dateBox: document.getElementById("dateBox"),
  reportDate: document.getElementById("reportDate"),
  totalCount: document.getElementById("totalCount"),
  preparedCount: document.getElementById("preparedCount"),
  pendingCount: document.getElementById("pendingCount"),
  dailyListBody: document.getElementById("dailyListBody"),
  supervisorMessage: document.getElementById("supervisorMessage"),
  filterButtons: document.querySelectorAll(".filter-btn")
};

let dailyRows = [];
let activeFilter = "all";
let refreshTimer = null;

document.addEventListener("DOMContentLoaded", initDashboard);

function initDashboard() {
  els.refreshSupervisorBtn.addEventListener("click", loadSupervisorData);
  els.printReportBtn.addEventListener("click", () => window.print());
  els.filterButtons.forEach(button => {
    button.addEventListener("click", () => setStatusFilter(button.dataset.filter));
  });
  renderDate();
  loadSupervisorData();
  refreshTimer = setInterval(loadSupervisorData, 30000);
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
  setMessage(els.supervisorMessage, "جاري تحميل قائمة اليوم...");

  try {
    const response = await api("getDailyStatus");
    if (!response.ok) throw new Error(response.message || "تعذر تحميل قائمة اليوم.");

    renderSupervisorSummary(response.summary);
    dailyRows = response.rows || [];
    renderDailyRows(getFilteredRows());
    renderDate("آخر تحديث: " + (response.dateText || formatDateTime(new Date())));
    setMessage(els.supervisorMessage, "تم تحديث لوحة المشرف.", "success");
  } catch (error) {
    setMessage(els.supervisorMessage, error.message, "error");
  }
}

function setStatusFilter(filter) {
  activeFilter = filter || "all";
  els.filterButtons.forEach(button => {
    button.classList.toggle("active-filter", button.dataset.filter === activeFilter);
  });
  renderDailyRows(getFilteredRows());
}

function getFilteredRows() {
  if (activeFilter === "all") return dailyRows;
  return dailyRows.filter(item => item.status === activeFilter);
}

function renderSupervisorSummary(summary = {}) {
  els.totalCount.textContent = summary.total || 0;
  els.preparedCount.textContent = summary.prepared || 0;
  els.pendingCount.textContent = summary.pending || 0;
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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
