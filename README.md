# مشروع تتبع تحضير وصفات الصيدلية

مشروع ويب بسيط بواجهة عربية للجوال:

- تسجيل دخول المحضّر باسم المستخدم و PIN.
- حفظ اسم المستخدم في `localStorage` بعد أول دخول.
- فتح الكاميرا مباشرة بعد الدخول لقراءة الباركود أو QR.
- عرض رقم الملف واسم المريض فقط.
- تسجيل كل عملية تحضير في Google Sheet، ويسمح بتسجيل نفس رقم الملف أكثر من مرة.
- صفحة مستقلة لرفع ملف Excel أو CSV وحفظ عمودي رقم الملف واسم المريض فقط.
- صفحة Dashboard مستقلة للمشرف تعرض قائمة اليوم وحالة كل مريض مع زر طباعة تقرير يومي.

## صفحات الموقع

- `index.html`: صفحة التحضير وقراءة الباركود.
- `upload.html`: صفحة رفع قائمة اليوم.
- `dashboard.html`: صفحة المشرف والتقرير اليومي.

## 1. إنشاء Google Sheet

1. افتح Google Sheets وأنشئ ملفاً جديداً.
2. غيّر اسم الملف إلى اسم مناسب، مثل: `Pharmacy Preparation`.
3. أنشئ الشيتات الموضحة في القسم التالي بالأسماء نفسها تماماً.

## 2. أسماء الشيتات المطلوبة

أنشئ 3 شيتات:

### Users

الصف الأول:

| Username | PIN | Active |
|---|---|---|

مثال:

| Username | PIN | Active |
|---|---|---|
| ahmad | 1234 | TRUE |

### Prescriptions

الصف الأول:

| FileNumber | PatientName | UploadedAt | UploadedBy |
|---|---|---|---|

هذا الشيت يتم تعبئته من ملف Excel أو CSV. عند رفع ملف جديد يتم استبدال قائمة الوصفات الحالية، وتكون القائمة صالحة فقط في يوم رفعها.

### Prepared

الصف الأول:

| FileNumber | PatientName | PreparedBy | PreparedAt |
|---|---|---|---|

هذا الشيت يسجل كل عملية تحضير. إذا تم تحضير نفس رقم الملف أكثر من مرة، سيتم إضافة صف جديد لكل مرة.

## لوحة المشرف

لوحة المشرف في صفحة مستقلة:

```text
dashboard.html
```

إذا كان رابط صفحة التحضير:

```text
https://USER.github.io/REPO/
```

فرابط لوحة المشرف يكون:

```text
https://USER.github.io/REPO/dashboard.html
```

تعرض اللوحة:

- إجمالي قائمة اليوم.
- عدد الوصفات التي تم تحضيرها.
- عدد الوصفات تحت التحضير.
- رقم الملف واسم المريض وحالته واسم المحضّر ووقت التحضير.

زر `طباعة التقرير` يطبع ملخص اليوم وجدول القائمة الحالية فقط.

## 3. نشر Apps Script كـ Web App

1. من Google Sheet اختر: `Extensions` ثم `Apps Script`.
2. احذف أي كود موجود.
3. انسخ محتوى ملف `Code.gs` والصقه في محرر Apps Script.
4. اضغط `Save`.
5. اختر `Deploy` ثم `New deployment`.
6. اضغط أيقونة الترس واختر `Web app`.
7. في `Execute as` اختر: `Me`.
8. في `Who has access` اختر: `Anyone`.
9. اضغط `Deploy`.
10. وافق على الصلاحيات المطلوبة.
11. انسخ رابط `Web app URL`.

## 4. أين أضع رابط API في script.js

افتح ملف `script.js` وابحث عن السطر:

```js
const API_URL = "PUT_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
```

استبدل النص داخل علامات التنصيص برابط Web App الذي نسخته من Apps Script:

```js
const API_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
```

## 5. طريقة رفع الموقع على GitHub Pages

1. أنشئ مستودعاً جديداً في GitHub.
2. ارفع الملفات التالية إلى المستودع:
   - `index.html`
   - `upload.html`
   - `upload.js`
   - `dashboard.html`
   - `dashboard.js`
   - `style.css`
   - `script.js`
   - `README.md`
3. ادخل إلى `Settings` في المستودع.
4. اختر `Pages`.
5. من `Build and deployment` اختر:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. اضغط `Save`.
7. بعد دقيقة تقريباً سيظهر رابط الموقع.

ملاحظة: الكاميرا تعمل عادة عبر HTTPS فقط. GitHub Pages يستخدم HTTPS، لذلك يناسب تشغيل قارئ الباركود/QR.

## صيغة ملف Excel أو CSV

يفضل أن يحتوي الملف على أعمدة بهذه الأسماء:

| رقم الملف | اسم المريض |
|---|---|

يمكن أيضاً استخدام:

| FileNumber | PatientName |
|---|---|

إذا لم يجد النظام هذه الأسماء، سيقرأ أول عمودين في الملف كرقم الملف واسم المريض.
