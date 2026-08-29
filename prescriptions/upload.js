const API_URL =
  "https://script.google.com/macros/s/AKfycbw0jSrbe1SM596Kyv0EpB6VTKEXT81c2Cn8Wlc2lEQ_RzbrS9b6w-k4gyrflwPBTgpKSQ/exec";

const els = {
  uploadLoginView: document.getElementById("uploadLoginView"),
  uploadView: document.getElementById("uploadView"),
  uploadLoginForm: document.getElementById("uploadLoginForm"),
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
  uploadForm: document.getElementById("uploadForm"),
  fileInput: document.getElementById("fileInput"),
  fileInputLabel: document.getElementById("fileInputLabel"),
  uploadIntro: document.getElementById("uploadIntro"),
  uploadSubmitBtn: document.getElementById("uploadSubmitBtn"),
  uploadHint: document.getElementById("uploadHint"),
  uploadMessage: document.getElementById("uploadMessage")
};

let inactivityTimer = null;
let currentLang = "ar";

const INACTIVITY_LIMIT_MS =
  30 * 60 * 1000;

const UPLOAD_SESSION_USER_KEY =
  "mailUploadUsername";

const UPLOAD_SESSION_NAME_KEY =
  "mailUploadDisplayName";

const UPLOAD_SESSION_TOKEN_KEY =
  "mailUploadSessionToken";


const i18n = {
  ar: {
    pageTitle: "إرسال قائمة وصفات البريد اليومية",
    officialLine1: "تجمع المدينة المنورة الصحي",
    officialLine2: "مستشفى الملك فهد بالمدينة المنورة",
    officialLine3: "إدارة الرعاية الصيدلانية",
    username: "اسم المستخدم",
    pin: "PIN",
    login: "دخول",
    changePin: "تغيير PIN",
    logout: "خروج",
    uploadIntro: "ارفع ملف Excel أو CSV.",
    fileInput: "ملف القائمة",
    uploadSubmit: "إرسال قائمة",
    uploadHint: "سيتم حذف القائمة الحالية عند رفع قائمة جديدة.",
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
    readingFile: "جاري قراءة الملف...",
    noValidData: "لم يتم العثور على بيانات صالحة.",
    loginFirst: "سجّل الدخول أولاً.",
    uploadFailed: "فشل رفع البيانات.",
    uploaded: count => `تم رفع ${count} وصفة لقائمة اليوم.`,
    unsupportedFile: "نوع الملف غير مدعوم. استخدم Excel أو CSV فقط.",
    excelNotLoaded: "لم يتم تحميل قارئ Excel بعد. أعد المحاولة.",
    headerMissing: "لم يتم العثور على صف العناوين. يجب أن يحتوي على عمود رقم الملف أو File Number أو MRN، وعمود اسم المريض.",
    fileColumnMissing: "لم يتم العثور على عمود رقم الملف. يجب أن يكون عنوان العمود: رقم الملف أو File Number أو MRN.",
    patientColumnMissing: "لم يتم العثور على عمود اسم المريض. يجب أن يكون عنوان العمود: اسم المريض أو Patient Name.",
    readFailed: "تعذر قراءة الملف.",
    serverFailed: "تعذر الاتصال بالخادم.",
    sessionExpired: "انتهت الجلسة. سجّل الدخول مرة أخرى."
  },

  en: {
    pageTitle: "Submit Daily Prescription Mail List",
    officialLine1: "Madinah Health Cluster",
    officialLine2: "King Fahad Hospital - Madinah",
    officialLine3: "Pharmaceutical Care Administration",
    username: "Username",
    pin: "PIN",
    login: "Login",
    changePin: "Change PIN",
    logout: "Logout",
    uploadIntro: "Upload an Excel or CSV file.",
    fileInput: "List File",
    uploadSubmit: "Submit List",
    uploadHint: "The current list will be deleted when a new list is uploaded.",
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
    readingFile: "Reading file...",
    noValidData: "No valid data was found.",
    loginFirst: "Sign in first.",
    uploadFailed: "Failed to upload data.",
    uploaded: count => `${count} prescriptions were uploaded to today's list.`,
    unsupportedFile: "Unsupported file type. Use Excel or CSV only.",
    excelNotLoaded: "Excel reader has not loaded yet. Try again.",
    headerMissing: "Header row was not found. It must include File Number or MRN and Patient Name.",
    fileColumnMissing: "File Number column was not found. The column title must be File Number or MRN.",
    patientColumnMissing: "Patient Name column was not found. The column title must be Patient Name.",
    readFailed: "Unable to read the file.",
    serverFailed: "Unable to connect to the server.",
    sessionExpired: "Session expired. Please sign in again."
  }
};


function t(key, ...args) {
  const value =
    i18n[currentLang][key] ||
    i18n.ar[key] ||
    key;

  return typeof value === "function"
    ? value(...args)
    : value;
}


document.addEventListener(
  "DOMContentLoaded",
  initUpload
);


async function initUpload() {
  setLanguage("ar");

  startInactivityWatcher();

  els.uploadLoginForm.addEventListener(
    "submit",
    handleLogin
  );

  if (els.languageToggle) {
    els.languageToggle.addEventListener(
      "click",
      toggleLanguage
    );
  }

  els.changePinLoginBtn.addEventListener(
    "click",
    changeLoginPin
  );

  els.logoutBtn.addEventListener(
    "click",
    logout
  );

  els.uploadForm.addEventListener(
    "submit",
    uploadFile
  );

  await restoreSession();
}


/* =========================================================
   RESTORE SESSION
========================================================= */

async function restoreSession() {
  const savedUser =
    sessionStorage.getItem(
      UPLOAD_SESSION_USER_KEY
    );

  const savedName =
    sessionStorage.getItem(
      UPLOAD_SESSION_NAME_KEY
    ) ||
    savedUser;

  const sessionToken =
    sessionStorage.getItem(
      UPLOAD_SESSION_TOKEN_KEY
    );

  if (
    !savedUser ||
    !sessionToken
  ) {
    clearAuthSession();
    return;
  }

  try {
    const response =
      await api(
        "validateSession"
      );

    if (
      !isSuccess(response)
    ) {
      clearAuthSession();
      return;
    }

    resetInactivityTimer();

    showUpload(
      response.user &&
      response.user.name
        ? response.user.name
        : savedName
    );

  } catch (error) {
    clearAuthSession();
  }
}


/* =========================================================
   LANGUAGE
========================================================= */

function setLanguage(lang) {
  currentLang = lang;

  document.documentElement.lang =
    lang;

  document.documentElement.dir =
    lang === "ar"
      ? "rtl"
      : "ltr";

  document.title =
    t("pageTitle");

  if (els.officialLine1) {
    els.officialLine1.textContent =
      t("officialLine1");
  }

  if (els.officialLine2) {
    els.officialLine2.textContent =
      t("officialLine2");
  }

  if (els.officialLine3) {
    els.officialLine3.textContent =
      t("officialLine3");
  }

  if (els.pageTitle) {
    els.pageTitle.textContent =
      t("pageTitle");
  }

  if (els.usernameLabel) {
    els.usernameLabel.textContent =
      t("username");
  }

  if (els.pinLabel) {
    els.pinLabel.textContent =
      t("pin");
  }

  if (els.loginBtn) {
    els.loginBtn.title =
      t("login");

    els.loginBtn.setAttribute(
      "aria-label",
      t("login")
    );
  }

  if (els.changePinLoginBtn) {
    els.changePinLoginBtn.title =
      t("changePin");

    els.changePinLoginBtn.setAttribute(
      "aria-label",
      t("changePin")
    );
  }

  if (els.logoutBtn) {
    els.logoutBtn.title =
      t("logout");

    els.logoutBtn.setAttribute(
      "aria-label",
      t("logout")
    );
  }

  if (els.uploadIntro) {
    els.uploadIntro.textContent =
      t("uploadIntro");
  }

  if (els.fileInputLabel) {
    els.fileInputLabel.textContent =
      t("fileInput");
  }

  if (els.uploadSubmitBtn) {
    els.uploadSubmitBtn.textContent =
      t("uploadSubmit");
  }

  if (els.uploadHint) {
    els.uploadHint.textContent =
      t("uploadHint");
  }

  if (els.languageToggle) {
    els.languageToggle.textContent =
      "🌐 ع | E";
  }

  renderDate();
}


function toggleLanguage() {
  setLanguage(
    currentLang === "ar"
      ? "en"
      : "ar"
  );
}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(
  event
) {
  event.preventDefault();

  const username =
    els.username.value.trim();

  const pin =
    els.pin.value.trim();

  setMessage(
    els.loginMessage,
    t("loginLoading")
  );

  try {
    const response =
      await authenticateLogin(
        username,
        pin
      );

    if (
      !response.sessionToken
    ) {
      throw new Error(
        t("serverFailed")
      );
    }

    sessionStorage.setItem(
      UPLOAD_SESSION_USER_KEY,
      response.username ||
      username
    );

    sessionStorage.setItem(
      UPLOAD_SESSION_NAME_KEY,
      response.displayName ||
      username
    );

    sessionStorage.setItem(
      UPLOAD_SESSION_TOKEN_KEY,
      response.sessionToken
    );

    resetInactivityTimer();

    showUpload(
      response.displayName ||
      username
    );

  } catch (error) {
    setMessage(
      els.loginMessage,
      error.message,
      "error"
    );
  }
}


async function authenticateLogin(
  username,
  pin
) {
  const response =
    await api(
      "login",
      {
        username,
        pin
      },
      false
    );

  if (
    isSuccess(response)
  ) {
    return response;
  }

  if (
    username.toLowerCase() ===
    "admin"
  ) {
    const adminResponse =
      await api(
        "adminLogin",
        {
          username,
          pin
        },
        false
      );

    if (
      isSuccess(
        adminResponse
      )
    ) {
      return {
        ...adminResponse,
        displayName:
          adminResponse.displayName ||
          "Admin"
      };
    }
  }

  throw new Error(
    response.message ||
    t("invalidLogin")
  );
}


function isSuccess(
  response
) {
  return Boolean(
    response &&
    (
      response.ok ||
      response.success
    )
  );
}


/* =========================================================
   CHANGE PIN
========================================================= */

async function changeLoginPin() {
  const username =
    els.username.value.trim() ||
    window.prompt(
      t("promptUsername")
    );

  if (!username) {
    return;
  }

  const currentPin =
    window.prompt(
      t("promptCurrentPin")
    );

  if (!currentPin) {
    return;
  }

  const newPin =
    window.prompt(
      t("promptNewPin")
    );

  if (!newPin) {
    return;
  }

  const confirmPin =
    window.prompt(
      t("promptConfirmPin")
    );

  if (
    newPin !==
    confirmPin
  ) {
    setMessage(
      els.loginMessage,
      t("pinMismatch"),
      "error"
    );

    return;
  }

  setMessage(
    els.loginMessage,
    t("pinChanging")
  );

  try {
    const response =
      await api(
        "changeLoginPin",
        {
          username,
          currentPin,
          newPin
        },
        false
      );

    if (
      !isSuccess(response)
    ) {
      throw new Error(
        response.message ||
        t("pinChangeFailed")
      );
    }

    clearAuthSession();

    setMessage(
      els.loginMessage,
      t("pinChanged"),
      "success"
    );

    setTimeout(
      () =>
        window.location.reload(),
      1200
    );

  } catch (error) {
    setMessage(
      els.loginMessage,
      error.message,
      "error"
    );
  }
}


/* =========================================================
   VIEW
========================================================= */

function showUpload(
  username
) {
  els.currentUser.textContent =
    username;

  els.uploadLoginView
    .classList
    .add(
      "hidden"
    );

  els.uploadView
    .classList
    .remove(
      "hidden"
    );
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {
  clearAuthSession();

  els.uploadView
    .classList
    .add(
      "hidden"
    );

  els.uploadLoginView
    .classList
    .remove(
      "hidden"
    );

  els.uploadLoginForm.reset();

  setMessage(
    els.loginMessage,
    ""
  );
}


function clearAuthSession() {
  sessionStorage.removeItem(
    UPLOAD_SESSION_USER_KEY
  );

  sessionStorage.removeItem(
    UPLOAD_SESSION_NAME_KEY
  );

  sessionStorage.removeItem(
    UPLOAD_SESSION_TOKEN_KEY
  );
}


/* =========================================================
   INACTIVITY
========================================================= */

function startInactivityWatcher() {
  [
    "click",
    "keydown",
    "touchstart",
    "mousemove"
  ].forEach(
    eventName => {
      window.addEventListener(
        eventName,
        resetInactivityTimer,
        {
          passive: true
        }
      );
    }
  );

  resetInactivityTimer();
}


function resetInactivityTimer() {
  window.clearTimeout(
    inactivityTimer
  );

  inactivityTimer =
    window.setTimeout(
      () => {
        if (
          sessionStorage.getItem(
            UPLOAD_SESSION_TOKEN_KEY
          )
        ) {
          logout();
        }
      },
      INACTIVITY_LIMIT_MS
    );
}


/* =========================================================
   DATE
========================================================= */

function renderDate() {
  const dateBox =
    document.getElementById(
      "dateBox"
    );

  if (!dateBox) {
    return;
  }

  const now =
    new Date();

  const date =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Riyadh"
      }
    ).format(now);

  const dayName =
    new Intl.DateTimeFormat(
      currentLang === "ar"
        ? "ar-SA"
        : "en-US",
      {
        timeZone:
          "Asia/Riyadh",
        weekday:
          "long"
      }
    ).format(now);

  dateBox.textContent =
    `${dayName} - ${date}`;
}


/* =========================================================
   UPLOAD
========================================================= */

async function uploadFile(
  event
) {
  event.preventDefault();

  const file =
    els.fileInput.files[0];

  if (!file) {
    return;
  }

  const sessionToken =
    sessionStorage.getItem(
      UPLOAD_SESSION_TOKEN_KEY
    );

  if (!sessionToken) {
    setMessage(
      els.uploadMessage,
      t("loginFirst"),
      "error"
    );

    return;
  }

  setMessage(
    els.uploadMessage,
    t("readingFile")
  );

  try {
    const rows =
      await readPrescriptionFile(
        file
      );

    if (!rows.length) {
      throw new Error(
        t("noValidData")
      );
    }

    resetInactivityTimer();

    /*
      لا نرسل uploadedBy.
      الـ Backend يحدد المستخدم
      الحقيقي من sessionToken.
    */
    const response =
      await api(
        "uploadPrescriptions",
        {
          rows
        }
      );

    if (
      !isSuccess(
        response
      )
    ) {
      throw new Error(
        response.message ||
        t("uploadFailed")
      );
    }

    els.uploadForm.reset();

    setMessage(
      els.uploadMessage,
      t(
        "uploaded",
        response.count
      ),
      "success"
    );

  } catch (error) {
    setMessage(
      els.uploadMessage,
      error.message,
      "error"
    );
  }
}


/* =========================================================
   READ FILE
========================================================= */

async function readPrescriptionFile(
  file
) {
  const extension =
    getFileExtension(
      file.name
    );

  if (
    [
      "xlsx",
      "xls",
      "csv"
    ].includes(
      extension
    )
  ) {
    return readSpreadsheetFile(
      file
    );
  }

  throw new Error(
    t("unsupportedFile")
  );
}


async function readSpreadsheetFile(
  file
) {
  if (
    !window.XLSX
  ) {
    throw new Error(
      t("excelNotLoaded")
    );
  }

  const arrayBuffer =
    await readAsArrayBuffer(
      file
    );

  const workbook =
    XLSX.read(
      arrayBuffer,
      {
        type:
          "array"
      }
    );

  const sheet =
    workbook.Sheets[
      workbook.SheetNames[0]
    ];

  const data =
    XLSX.utils
      .sheet_to_json(
        sheet,
        {
          header: 1,
          defval: ""
        }
      );

  return extractPrescriptionRows(
    data
  );
}


/* =========================================================
   EXTRACT ROWS
========================================================= */

function extractPrescriptionRows(
  data
) {
  const nonEmptyRows =
    data.filter(
      row =>
        row.some(
          cell =>
            String(
              cell
            ).trim() !==
            ""
        )
    );

  if (
    nonEmptyRows.length <
    2
  ) {
    return [];
  }

  const headerRowIndex =
    nonEmptyRows.findIndex(
      row => {
        const normalized =
          row.map(
            normalizeHeader
          );

        return (
          normalized.some(
            isFileNumberHeader
          ) &&
          normalized.some(
            isPatientNameHeader
          )
        );
      }
    );

  if (
    headerRowIndex === -1
  ) {
    throw new Error(
      t("headerMissing")
    );
  }

  const headers =
    nonEmptyRows[
      headerRowIndex
    ].map(
      normalizeHeader
    );

  const fileIndex =
    headers.findIndex(
      isFileNumberHeader
    );

  const nameIndex =
    headers.findIndex(
      isPatientNameHeader
    );

  if (
    fileIndex === -1
  ) {
    throw new Error(
      t("fileColumnMissing")
    );
  }

  if (
    nameIndex === -1
  ) {
    throw new Error(
      t("patientColumnMissing")
    );
  }

  return nonEmptyRows
    .slice(
      headerRowIndex + 1
    )
    .map(
      row => {
        const fileNumber =
          normalizeFileNumber(
            row[fileIndex]
          );

        return {
          fileNumber:
            fileNumber,

          patientName:
            String(
              row[nameIndex] ||
              ""
            ).trim()
        };
      }
    )
    .filter(
      row =>
        row.fileNumber &&
        row.patientName
    );
}


/* =========================================================
   HEADERS
========================================================= */

function normalizeHeader(
  value
) {
  return String(
    value ||
    ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /[()[\]{}:؛،,.#_/-]/g,
      ""
    )
    .replace(
      /\s+/g,
      ""
    )
    .replace(
      /أ|إ|آ/g,
      "ا"
    )
    .replace(
      /ى/g,
      "ي"
    )
    .replace(
      /ة/g,
      "ه"
    );
}


function isFileNumberHeader(
  header
) {
  const exactMatches = [
    "رقمالملف",
    "رقمالمريض",
    "ملف",
    "mrn",
    "medicalrecordnumber",
    "filenumber",
    "fileno",
    "file",
    "patientid",
    "patientnumber"
  ];

  return (
    exactMatches.includes(
      header
    ) ||
    header.includes(
      "رقمالملف"
    ) ||
    header.includes(
      "رقمالمريض"
    ) ||
    header.includes(
      "mrn"
    ) ||
    header.includes(
      "filenumber"
    ) ||
    header.includes(
      "medicalrecordnumber"
    )
  );
}


function isPatientNameHeader(
  header
) {
  const exactMatches = [
    "اسمالمريض",
    "المريض",
    "patientname",
    "patient",
    "name",
    "fullname"
  ];

  return (
    exactMatches.includes(
      header
    ) ||
    header.includes(
      "اسمالمريض"
    ) ||
    header.includes(
      "patientname"
    )
  );
}


/* =========================================================
   FILE NUMBER
========================================================= */

function normalizeFileNumber(
  value
) {
  if (
    value instanceof Date
  ) {
    return "";
  }

  const fileNumber =
    String(
      value ||
      ""
    )
      .trim()
      .replace(
        /\s+/g,
        ""
      );

  if (
    isDateOrTimeLike(
      fileNumber
    )
  ) {
    return "";
  }

  return fileNumber;
}


function isDateOrTimeLike(
  value
) {
  return (
    /^\d{1,2}:\d{2}(:\d{2})?$/.test(
      value
    ) ||
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(
      value
    ) ||
    /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(
      value
    )
  );
}


function getFileExtension(
  fileName
) {
  return String(
    fileName ||
    ""
  )
    .split(".")
    .pop()
    .toLowerCase();
}


/* =========================================================
   FILE READER
========================================================= */

function readAsArrayBuffer(
  file
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();

      reader.onload =
        () =>
          resolve(
            reader.result
          );

      reader.onerror =
        () =>
          reject(
            new Error(
              t("readFailed")
            )
          );

      reader.readAsArrayBuffer(
        file
      );
    }
  );
}


/* =========================================================
   MESSAGE
========================================================= */

function setMessage(
  element,
  text,
  type = ""
) {
  element.textContent =
    text;

  element.className =
    `message ${type}`.trim();
}


/* =========================================================
   API
========================================================= */

async function api(
  action,
  payload = {},
  includeSession = true
) {
  const requestData = {
    action,
    ...payload
  };

  if (
    includeSession
  ) {
    const sessionToken =
      sessionStorage.getItem(
        UPLOAD_SESSION_TOKEN_KEY
      );

    if (sessionToken) {
      requestData.sessionToken =
        sessionToken;
    }
  }

  const response =
    await fetch(
      API_URL,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body:
          JSON.stringify(
            requestData
          )
      }
    );

  if (!response.ok) {
    throw new Error(
      t("serverFailed")
    );
  }

  const data =
    await response.json();

  if (
    data &&
    (
      data.code ===
        "INVALID_SESSION" ||
      data.code ===
        "MISSING_SESSION" ||
      data.code ===
        "NO_PERMISSION"
    )
  ) {
    clearAuthSession();

    if (
      els.uploadView &&
      !els.uploadView
        .classList
        .contains(
          "hidden"
        )
    ) {
      logout();
    }

    throw new Error(
      t("sessionExpired")
    );
  }

  return data;
}