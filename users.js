const API_URL = "https://script.google.com/macros/s/AKfycbw0jSrbe1SM596Kyv0EpB6VTKEXT81c2Cn8Wlc2lEQ_RzbrS9b6w-k4gyrflwPBTgpKSQ/exec";

const els = {
  dateBox: document.getElementById("dateBox"),
  adminLoginView: document.getElementById("adminLoginView"),
  usersView: document.getElementById("usersView"),
  adminLoginForm: document.getElementById("adminLoginForm"),
  adminUsername: document.getElementById("adminUsername"),
  adminPin: document.getElementById("adminPin"),
  adminLoginMessage: document.getElementById("adminLoginMessage"),
  adminChangePinBtn: document.getElementById("adminChangePinBtn"),
  adminLogoutBtn: document.getElementById("adminLogoutBtn"),
  userForm: document.getElementById("userForm"),
  nameInput: document.getElementById("nameInput"),
  usernameInput: document.getElementById("usernameInput"),
  pinInput: document.getElementById("pinInput"),
  activeInput: document.getElementById("activeInput"),
  saveUserBtn: document.getElementById("saveUserBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  usersBody: document.getElementById("usersBody"),
  usersMessage: document.getElementById("usersMessage")
};

let editingUsername = "";
let inactivityTimer = null;
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

document.addEventListener("DOMContentLoaded", initUsers);

function initUsers() {
  renderDate();
  startInactivityWatcher();
  if (hasAdminSession()) showUsersView();
  els.adminLoginForm.addEventListener("submit", adminLogin);
  els.adminChangePinBtn.addEventListener("click", changeAdminPin);
  els.adminLogoutBtn.addEventListener("click", adminLogout);
  els.userForm.addEventListener("submit", saveUser);
  els.cancelEditBtn.addEventListener("click", resetForm);
}

async function adminLogin(event) {
  event.preventDefault();
  const adminUsername = els.adminUsername.value.trim();
  const adminPin = els.adminPin.value.trim();

  setAdminLoginMessage("جاري تسجيل الدخول...");
  try {
    const response = await api("adminLogin", { username: adminUsername, pin: adminPin });
    if (!response.ok) throw new Error(response.message || "بيانات الأدمن غير صحيحة.");
    sessionStorage.setItem("adminUsername", "Admin");
    sessionStorage.setItem("adminPin", adminPin);
    resetInactivityTimer();
    setAdminLoginMessage("");
    showUsersView();
  } catch (error) {
    setAdminLoginMessage(error.message, "error");
  }
}

function showUsersView() {
  els.adminLoginView.classList.add("hidden");
  els.usersView.classList.remove("hidden");
  loadUsers();
}

function adminLogout() {
  clearAdminSession();
  els.usersView.classList.add("hidden");
  els.adminLoginView.classList.remove("hidden");
  els.adminLoginForm.reset();
  setAdminLoginMessage("");
  setMessage("");
  resetForm();
}

function clearAdminSession() {
  sessionStorage.removeItem("adminUsername");
  sessionStorage.removeItem("adminPin");
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
    if (hasAdminSession()) adminLogout();
  }, INACTIVITY_LIMIT_MS);
}

function hasAdminSession() {
  return String(sessionStorage.getItem("adminUsername") || "").toLowerCase() === "admin" &&
    Boolean(sessionStorage.getItem("adminPin"));
}

async function changeAdminPin() {
  resetInactivityTimer();
  const currentPin = sessionStorage.getItem("adminPin");
  if (!currentPin) return;

  const enteredCurrentPin = window.prompt("أدخل PIN الحالي:");
  if (!enteredCurrentPin) return;
  if (enteredCurrentPin !== currentPin) {
    setMessage("PIN الحالي غير صحيح.", "error");
    return;
  }

  const newPin = window.prompt("أدخل PIN الجديد:");
  if (!newPin) return;
  const confirmPin = window.prompt("أعد إدخال PIN الجديد:");
  if (newPin !== confirmPin) {
    setMessage("PIN الجديد غير متطابق.", "error");
    return;
  }

  setMessage("جاري تغيير PIN...");
  try {
    const response = await api("changeAdminPin", { newPin });
    if (!response.ok) throw new Error(response.message || "تعذر تغيير PIN.");
    sessionStorage.setItem("adminPin", newPin);
    setMessage(response.message || "تم تغيير PIN بنجاح.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function renderDate() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(now);
  const dayName = new Intl.DateTimeFormat("ar-SA", {
    timeZone: "Asia/Riyadh",
    weekday: "long"
  }).format(now);

  els.dateBox.textContent = `${dayName} - ${date}`;
}

async function loadUsers() {
  setMessage("");
  try {
    const response = await api("listUsers");
    if (!response.ok) throw new Error(response.message || "تعذر تحميل المستخدمين.");
    renderUsers(response.users || []);
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function renderUsers(users) {
  els.usersBody.innerHTML = "";

  if (!users.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5" class="empty-cell">لا يوجد مستخدمون.</td>`;
    els.usersBody.appendChild(row);
    return;
  }

  users.forEach(user => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="اسم الموظف">${escapeHtml(user.name)}</td>
      <td data-label="اسم المستخدم">${escapeHtml(user.username)}</td>
      <td data-label="الحالة">${user.active ? "نشط" : "غير نشط"}</td>
      <td data-label="تعديل">
        <button class="edit-user-btn" type="button" title="تعديل" aria-label="تعديل"
          data-name="${escapeHtml(user.name)}"
          data-username="${escapeHtml(user.username)}"
          data-active="${user.active ? "true" : "false"}">✎</button>
      </td>
      <td data-label="حذف">
        <button class="delete-user-btn" type="button" title="حذف" aria-label="حذف" data-username="${escapeHtml(user.username)}">×</button>
      </td>
    `;
    els.usersBody.appendChild(row);
  });

  els.usersBody.querySelectorAll(".edit-user-btn").forEach(button => {
    button.addEventListener("click", () => startEditUser(button.dataset));
  });

  els.usersBody.querySelectorAll(".delete-user-btn").forEach(button => {
    button.addEventListener("click", () => deleteUser(button.dataset.username));
  });
}

async function saveUser(event) {
  event.preventDefault();

  const payload = {
    name: els.nameInput.value.trim(),
    username: els.usernameInput.value.trim(),
    pin: els.pinInput.value.trim(),
    active: els.activeInput.checked
  };

  setMessage(editingUsername ? "جاري تحديث المستخدم..." : "جاري إضافة المستخدم...");

  try {
    const wasEditing = Boolean(editingUsername);
    const action = editingUsername ? "updateUser" : "addUser";
    const response = await api(action, {
      ...payload,
      originalUsername: editingUsername
    });
    if (!response.ok) throw new Error(response.message || "تعذر حفظ المستخدم.");
    resetForm();
    setMessage(wasEditing ? "تم تحديث المستخدم." : "تمت إضافة المستخدم.", "success");
    await loadUsers();
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function startEditUser(user) {
  editingUsername = user.username || "";
  els.nameInput.value = user.name || "";
  els.usernameInput.value = user.username || "";
  els.pinInput.value = "";
  els.pinInput.placeholder = "أدخل PIN الجديد أو الحالي";
  els.activeInput.checked = user.active === "true";
  els.saveUserBtn.textContent = "✓";
  els.saveUserBtn.title = "حفظ التعديل";
  els.saveUserBtn.setAttribute("aria-label", "حفظ التعديل");
  els.cancelEditBtn.classList.remove("hidden");
  setMessage("وضع تعديل المستخدم.");
  els.nameInput.focus();
}

function resetForm() {
  editingUsername = "";
  els.userForm.reset();
  els.activeInput.checked = true;
  els.pinInput.placeholder = "";
  els.saveUserBtn.textContent = "＋";
  els.saveUserBtn.title = "إضافة مستخدم";
  els.saveUserBtn.setAttribute("aria-label", "إضافة مستخدم");
  els.cancelEditBtn.classList.add("hidden");
}

async function deleteUser(username) {
  const confirmed = window.confirm(`حذف المستخدم ${username}؟`);
  if (!confirmed) return;

  setMessage("جاري حذف المستخدم...");

  try {
    const response = await api("deleteUser", { username });
    if (!response.ok) throw new Error(response.message || "تعذر حذف المستخدم.");
    setMessage("تم حذف المستخدم.", "success");
    await loadUsers();
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function setMessage(text, type = "") {
  els.usersMessage.textContent = text;
  els.usersMessage.className = `message ${type}`.trim();
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
    body: JSON.stringify({ action, ...adminPayload(), ...payload })
  });

  if (!response.ok) throw new Error("تعذر الاتصال بالخادم.");
  return response.json();
}

function adminPayload() {
  return {
    adminUsername: sessionStorage.getItem("adminUsername") || "",
    adminPin: sessionStorage.getItem("adminPin") || ""
  };
}

function setAdminLoginMessage(text, type = "") {
  els.adminLoginMessage.textContent = text;
  els.adminLoginMessage.className = `message ${type}`.trim();
}
