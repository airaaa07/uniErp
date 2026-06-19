# 🎓 Student Application Process — End-to-End Guide

> **University ERP System** | Complete walkthrough of how a student's application moves from a public inquiry form through to a fully enrolled student, and every system change that happens along the way.

---

## Table of Contents

1. [Overview & Status State Machine](#1-overview--status-state-machine)
2. [Stage 0 — Public Inquiry Form (No Login Required)](#2-stage-0--public-inquiry-form-no-login-required)
3. [Stage 1 — Student First Login & Force Password Change](#3-stage-1--student-first-login--force-password-change)
4. [Stage 2 — Counsellor Review & College/Stream Assignment](#4-stage-2--counsellor-review--collegestream-assignment)
5. [Stage 3 — Student Self-Service (Documents + Payment)](#5-stage-3--student-self-service-documents--payment)
6. [Stage 4 — Finance Verification](#6-stage-4--finance-verification)
7. [Stage 5 — Admission Officer Review & Scholarship](#7-stage-5--admission-officer-review--scholarship)
8. [Stage 6 — Registrar Matriculation & Enrollment ID](#8-stage-6--registrar-matriculation--enrollment-id)
9. [What Changes at Each Stage (Database + Code)](#9-what-changes-at-each-stage-database--code)
10. [Test Credentials Quick Reference](#10-test-credentials-quick-reference)
11. [API Endpoints Used at Each Stage](#11-api-endpoints-used-at-each-stage)
12. [Payment Options Explained](#12-payment-options-explained)
13. [Error & Edge Cases](#13-error--edge-cases)

---

## 1. Overview & Status State Machine

The application lifecycle is tracked by the `inquiry_status` field inside the student's record in the `inquiry_master` module (stored as JSONB in the `records` table).

```
                          ┌─────────────────────────────────────────────────────────┐
                          │           STUDENT APPLICATION LIFECYCLE                  │
                          └─────────────────────────────────────────────────────────┘

  [Public Web Form]
        │
        ▼
  ┌──────────┐    Counsellor     ┌─────────────────┐   Student submits   ┌───────────┐
  │  Open    │ ──────────────▶  │ Payment Pending  │ ──────────────────▶ │ Submitted │
  └──────────┘  approves &       └─────────────────┘   docs + payment    └───────────┘
                requests                                                       │
                payment                                                        │ Finance
                                                                               │ verifies
                                                                               ▼
  ┌──────────┐   Registrar      ┌──────────┐         Officer             ┌──────────┐
  │ Enrolled │ ◀────────────── │ Approved │ ◀────────────────────────── │ Fee Paid │
  └──────────┘  matriculates    └──────────┘         approves            └──────────┘
      ✅                                              admission
```

### Status Values Summary

| Status | Set By | Meaning |
|:---|:---|:---|
| `Open` | **System** (on public form submit) | Inquiry received, awaiting counsellor review |
| `Payment Pending` | **Counsellor** | College + Stream assigned; student must upload docs & pay |
| `Submitted` | **Student** | Documents uploaded, payment done, application submitted |
| `Fee Paid` | **Finance Controller** | Payment reference verified by finance team |
| `Approved` | **Admission Officer** | Marksheets verified, scholarship entered, admission granted |
| `Enrolled` | **Registrar** | Matriculated; unique Enrollment ID generated |

---

## 2. Stage 0 — Public Inquiry Form (No Login Required)

### What happens from the student's perspective

The prospective student visits the public URL (no login needed):

```
http://localhost:5173/erp/register
```

They fill in the inquiry form, which is **dynamically rendered** from the `inquiry_master` module definition. The form fields are fetched from:

```
GET /api/erp/public/modules/inquiry_master/layout
```

**Typical fields collected:**
| Field Key | Label | Type | Notes |
|:---|:---|:---|:---|
| `inq_fname` | First Name | text | Required |
| `inq_lname` | Last Name | text | Required |
| `mobile_no` | Mobile Number | phone | Becomes the **username** |
| `dob` | Date of Birth | date | Becomes the **initial password** |
| `email` | Email Address | email | Optional |
| `course` | Course Interested | select | Options from `course_master` module |
| `college_pref` | Preferred College | select | Options from `institute_master` module |

On clicking **Submit**, the browser POSTs to:

```
POST /api/erp/public/records
Body: { "module_key": "inquiry_master", "data": { ...form fields... } }
```

### What changes in the system (Backend: `PublicCreateRecord`)

The backend function `PublicCreateRecord()` in [`record_service.go`](./backend/services/erp/record_service.go) does all of the following atomically:

#### ① Force-sets `inquiry_status = "Open"`
The client cannot override this. Even if the HTTP body includes a different value, the server ignores it:
```go
// publicWriteProtected fields are always forced server-side
req.Data["inquiry_status"] = "Open"
```

#### ② Creates a student user account automatically
```go
username = mobile_no           // e.g. "9876543210"
email    = username + "@university.edu"

// Password derived from Date of Birth
// DOB: 2002-05-15  →  password: "15052002"  (DDMMYYYY format)
password = DD + MM + YYYY

// Password is bcrypt-hashed before storage — plaintext never saved
hashedPassword = bcrypt.Hash(password)

INSERT INTO users (
  username, email, password_hash,
  first_name, last_name,
  force_password_change   -- ← always TRUE for auto-created students
) VALUES (...)
```

#### ③ Assigns the "Student" role (Role ID 11)
```sql
INSERT INTO user_roles (user_id, role_id)
VALUES (<new_user_id>, 11)
ON CONFLICT DO NOTHING
```

#### ④ Saves the inquiry record to the `records` table
```sql
INSERT INTO records (record_id, module_key, data, created_by)
VALUES (UUID, 'inquiry_master', '{"inquiry_status":"Open",...}'::jsonb, <user_id>)
```

#### ⑤ Returns the generated credentials in the response
```json
{
  "generated_username": "9876543210",
  "generated_password_format": "Your Date of Birth in DDMMYYYY format"
}
```

### Duplicate handling
If the mobile number already exists as a username, the system **does not create a new user** — it links the new inquiry record to the existing user account.

---

## 3. Stage 1 — Student First Login & Force Password Change

### Login

The student navigates to:
```
http://localhost:5173/erp/login
```

They log in with:
- **Username:** Their mobile number (e.g. `9876543210`)
- **Password:** DOB in `DDMMYYYY` format (e.g. `15052002`)

Login API:
```
POST /api/erp/auth/login
Body: { "username": "9876543210", "password": "15052002" }
```

On success, the backend returns:
```json
{
  "access_token": "<JWT — valid 24h>",
  "refresh_token": "<token — valid 7 days>",
  "user": {
    "force_password_change": true,
    ...
  }
}
```

### Force Password Change Dialog (cannot be skipped)

Because `force_password_change = TRUE`, the **ERP `AuthContext`** detects this and the [`DashboardLayout.tsx`](./frontend/src/apps/erp/components/DashboardLayout.tsx) renders a **blocking MUI Dialog**:

- `disableEscapeKeyDown` — pressing Escape does nothing
- The dialog covers the entire dashboard; the student cannot interact with anything else
- The student must enter their current DOB password + a new password + confirm

API called:
```
POST /api/erp/auth/change-password
Body: { "old_password": "15052002", "new_password": "myNewPass123" }
```

### What changes in the database

```sql
UPDATE users
SET password_hash = bcrypt(<new_password>),
    force_password_change = FALSE,
    updated_at = NOW()
WHERE user_id = <student_id>
```

After this, the dialog is dismissed and the student can access their dashboard — but the dashboard content is still **limited** until the counsellor acts.

### Student Dashboard at this stage (`inquiry_status = "Open"`)

The [`StudentDashboard.tsx`](./frontend/src/apps/erp/pages/student/StudentDashboard.tsx) loads the student's linked inquiry record and shows:

- ✅ Application status: **Open**
- ❌ No document upload slots (locked)
- ❌ No payment options (locked)
- ℹ️ Message: *"Your application is under review by a counsellor."*

---

## 4. Stage 2 — Counsellor Review & College/Stream Assignment

### Who acts: Counsellor (Role ID 6)

Login:
```
Username: counsellor
Password: admin123
Dashboard: http://localhost:5173/erp/counsellor/dashboard
```

### What the counsellor sees

The [`CounsellorDashboard.tsx`](./frontend/src/apps/erp/pages/counsellor/CounsellorDashboard.tsx) fetches all inquiry records with status `Open` or `Assigned`:

```
GET /api/erp/records?module_key=inquiry_master
```

The counsellor sees a table/list of pending applicants. For each applicant they can:

1. Open the applicant's detail panel
2. View the inquiry form data (name, DOB, course interest, etc.)
3. Select **College** (from `institute_master`) and **Stream** (from `stream_master`)
4. Click **"Approve & Request Payment"**

### What changes in the database

The counsellor's approval triggers:

```
PUT /api/erp/records/<record_id>
Body: {
  "data": {
    ...existing_fields...,
    "assigned_college": "<college_name>",
    "assigned_stream": "<stream_name>",
    "inquiry_status": "Payment Pending",
    "counsellor_id": "<counsellor_user_id>",
    "counselled_at": "<timestamp>"
  }
}
```

The `inquiry_status` field inside the JSONB data column changes from `"Open"` → `"Payment Pending"`.

---

## 5. Stage 3 — Student Self-Service (Documents + Payment)

### Student Dashboard unlocks

When the student next views their dashboard (or refreshes), the system re-fetches their inquiry record and sees `inquiry_status = "Payment Pending"`. The UI now unlocks:

1. **Academic Marks Entry** — 10th and 12th percentage inputs
2. **Document Upload** — 4 slots:
   - Class 10 Marksheet
   - Class 12 Marksheet
   - Passport Photo
   - Signature
3. **Payment Section** — two options

### 5a. Document Upload

Each document is uploaded as a **base64-encoded file** stored directly inside the JSONB data field of the record:

```json
{
  "doc_class10": "data:application/pdf;base64,...",
  "doc_class12": "data:application/pdf;base64,...",
  "doc_photo":   "data:image/jpeg;base64,...",
  "doc_sign":    "data:image/png;base64,..."
}
```

### 5b. Payment Option A — Online (Razorpay)

The [`StudentDashboard.tsx`](./frontend/src/apps/erp/pages/student/StudentDashboard.tsx) dynamically loads the Razorpay JS SDK from CDN and opens the checkout modal:

```javascript
const options = {
  key: "rzp_test_RvORW1HCWwBwoy",   // Test Key ID
  amount: <fee_amount_in_paise>,
  currency: "INR",
  name: "University ERP",
  handler: function(response) {
    // response.razorpay_payment_id = "pay_XXXXXXXXXXXX"
    // Save payment_id into the inquiry record
  }
};
new window.Razorpay(options).open();
```

On payment success, the `payment_id` (e.g. `pay_AbCd1234XyZz`) is saved into the record data:

```json
{ "payment_id": "pay_AbCd1234XyZz", "payment_mode": "online" }
```

**Test card to use:**
```
Card: 4111 1111 1111 1111
Expiry: Any future date  |  CVV: Any 3 digits  |  OTP: 1234
```

### 5b. Payment Option B — Offline (Bank UTR)

The student enters a **UTR (Unique Transaction Reference)** number from their bank receipt:

```json
{ "utr_reference": "HDFC202606190001", "payment_mode": "offline" }
```

### 5c. Submit Application

After documents + payment are done, the student clicks **"Submit Completed Application"**. This updates the record:

```
PUT /api/erp/records/<record_id>
Body: {
  "data": {
    ...all_previous_fields...,
    "marks_10th": "85.5",
    "marks_12th": "91.2",
    "doc_class10": "base64...",
    "doc_class12": "base64...",
    "doc_photo":   "base64...",
    "doc_sign":    "base64...",
    "payment_id":  "pay_XXXXXXXXXXXX",
    "payment_mode": "online",
    "inquiry_status": "Submitted",
    "submitted_at": "<timestamp>"
  }
}
```

**Status changes:** `"Payment Pending"` → `"Submitted"`

---

## 6. Stage 4 — Finance Verification

### Who acts: Finance Controller (Role ID 10)

Login:
```
Username: finance
Password: admin123
Dashboard: http://localhost:5173/erp/finance/dashboard
```

### What the finance controller sees

The [`FinanceDashboard.tsx`](./frontend/src/apps/erp/pages/finance/FinanceDashboard.tsx) shows all applications with status `"Submitted"`. For each record they see:

- Student name, mobile, assigned college/stream
- Payment mode (Online / Offline)
- Payment ID (`pay_XXXXXXXXXXXX`) or UTR reference number
- Submitted documents preview

### Action: Verify Fee

The finance controller cross-checks the payment reference against their payment gateway records or bank statement, then clicks **"Verify Fee"**:

```
PUT /api/erp/records/<record_id>
Body: {
  "data": {
    ...existing...,
    "inquiry_status": "Fee Paid",
    "fee_verified_by": "<finance_user_id>",
    "fee_verified_at": "<timestamp>"
  }
}
```

**Status changes:** `"Submitted"` → `"Fee Paid"`

---

## 7. Stage 5 — Admission Officer Review & Scholarship

### Who acts: Admission Officer (Role ID 7)

Login:
```
Username: officer
Password: admin123
Dashboard: http://localhost:5173/erp/officer/dashboard
```

### What the officer sees

The [`OfficerDashboard.tsx`](./frontend/src/apps/erp/pages/officer/OfficerDashboard.tsx) shows all applications with status `"Fee Paid"`. For each record they see:

- Student's academic marks (10th & 12th %)
- Downloadable/viewable document slots (marksheets, photo, signature)
- Scholarship input field
- Remarks input field

### Action: Approve Admission

The officer verifies the physical documents match the uploads, optionally enters a scholarship/discount percentage, writes any remarks, and clicks **"Approve Admission"**:

```
PUT /api/erp/records/<record_id>
Body: {
  "data": {
    ...existing...,
    "inquiry_status": "Approved",
    "scholarship_pct": "10.0",
    "officer_remarks": "Marksheets verified. Merit scholarship applied.",
    "approved_by": "<officer_user_id>",
    "approved_at": "<timestamp>"
  }
}
```

**Status changes:** `"Fee Paid"` → `"Approved"`

---

## 8. Stage 6 — Registrar Matriculation & Enrollment ID

### Who acts: Registrar (Role ID 8)

Login:
```
Username: registrar
Password: admin123
Dashboard: http://localhost:5173/erp/registrar/dashboard
```

### What the registrar sees

The [`RegistrarDashboard.tsx`](./frontend/src/apps/erp/pages/registrar/RegistrarDashboard.tsx) shows all applications with status `"Approved"`. For each record they see the full candidate summary including college, stream, scholarship, documents.

### Action: Matriculate & Enroll

The registrar clicks **"Matriculate & Enroll"**. The system:

1. **Generates a unique Enrollment ID** in the format `EN{YEAR}{6-digit-seq}`:
   - Example: `EN2026000001`, `EN2026000002`, …
   - The sequence is a global auto-increment counter stored in the database

2. **Updates the inquiry record:**

```
PUT /api/erp/records/<record_id>
Body: {
  "data": {
    ...existing...,
    "inquiry_status": "Enrolled",
    "enrollment_id": "EN2026000001",
    "enrolled_by": "<registrar_user_id>",
    "enrolled_at": "<timestamp>"
  }
}
```

**Status changes:** `"Approved"` → `"Enrolled"` ✅

### Student dashboard after enrollment

The student's dashboard now shows:
- ✅ **Status:** Enrolled
- 🎓 **Enrollment ID:** `EN2026000001`
- 📋 Full summary of their journey (college, stream, scholarship %)

---

## 9. What Changes at Each Stage (Database + Code)

This section maps every status transition to the exact database change and the code responsible.

| Stage | Trigger | `inquiry_status` value | DB field changed | Code location |
|:---|:---|:---|:---|:---|
| Public form submit | Student submits `/erp/register` | `"Open"` | `records.data.inquiry_status` | [`record_service.go → PublicCreateRecord()`](./backend/services/erp/record_service.go#L33) |
| Student auto-created | Same as above | N/A | `users` row inserted; `user_roles` row inserted | [`record_service.go L86–L107`](./backend/services/erp/record_service.go#L86) |
| Force password change | Student completes first-login dialog | N/A | `users.force_password_change = FALSE` | [`auth_service.go → ChangePassword()`](./backend/services/erp/auth_service.go) |
| Counsellor approves | Counsellor clicks "Approve & Request Payment" | `"Payment Pending"` | `records.data` (JSONB update) | [`record_service.go → UpdateRecord()`](./backend/services/erp/record_service.go#L250) |
| Student submits docs + payment | Student clicks "Submit Completed Application" | `"Submitted"` | `records.data` (JSONB update, adds doc base64 + payment ref) | [`record_service.go → UpdateRecord()`](./backend/services/erp/record_service.go#L250) |
| Finance verifies fee | Finance clicks "Verify Fee" | `"Fee Paid"` | `records.data` (JSONB update) | [`record_service.go → UpdateRecord()`](./backend/services/erp/record_service.go#L250) |
| Officer approves admission | Officer clicks "Approve Admission" | `"Approved"` | `records.data` (JSONB update, adds scholarship_pct) | [`record_service.go → UpdateRecord()`](./backend/services/erp/record_service.go#L250) |
| Registrar enrolls | Registrar clicks "Matriculate & Enroll" | `"Enrolled"` | `records.data` (JSONB update, adds enrollment_id) | [`record_service.go → UpdateRecord()`](./backend/services/erp/record_service.go#L250) |

### Key database tables involved

```sql
-- All inquiry data (including status) lives here as JSONB
records (record_id, module_key='inquiry_master', data JSONB, created_by, created_at)

-- Student user created on public form submission
users (user_id, username=mobile_no, password_hash, force_password_change=TRUE)

-- Role assignment: links student to role_id=11 ("Student")
user_roles (user_id, role_id)

-- Every data change is logged here
audit_logs (user_id, action_type, entity_name, record_id, old_value, new_value)
```

### JSONB data evolution example

Here is what the `records.data` JSONB field looks like at each stage for a single applicant:

```jsonc
// Stage 0: After public form submit
{
  "inq_fname": "Kiran",
  "inq_lname": "Kumar",
  "mobile_no": "9876543210",
  "dob": "2002-05-15",
  "inquiry_status": "Open",
  "generated_username": "9876543210"
}

// Stage 2: After counsellor approval
{
  // ...all above fields...
  "inquiry_status": "Payment Pending",
  "assigned_college": "ABC Engineering College",
  "assigned_stream": "Computer Science"
}

// Stage 3: After student submits
{
  // ...all above fields...
  "inquiry_status": "Submitted",
  "marks_10th": "85.5",
  "marks_12th": "91.2",
  "doc_class10": "data:application/pdf;base64,...",
  "doc_class12": "data:application/pdf;base64,...",
  "doc_photo":   "data:image/jpeg;base64,...",
  "doc_sign":    "data:image/png;base64,...",
  "payment_id":  "pay_AbCd1234XyZz",
  "payment_mode": "online"
}

// Stage 4: After finance verifies
{
  // ...all above fields...
  "inquiry_status": "Fee Paid"
}

// Stage 5: After officer approves
{
  // ...all above fields...
  "inquiry_status": "Approved",
  "scholarship_pct": "10.0",
  "officer_remarks": "Merit scholarship applied."
}

// Stage 6: Final enrolled state
{
  // ...all above fields...
  "inquiry_status": "Enrolled",
  "enrollment_id": "EN2026000001"
}
```

---

## 10. Test Credentials Quick Reference

| Role | Username | Password | Dashboard URL |
|:---|:---|:---|:---|
| Super Admin | `admin` | `admin123` | `/erp/admin/dashboard` |
| University Admin | `univadmin` | `admin123` | `/erp/admin/dashboard` |
| Counsellor | `counsellor` | `admin123` | `/erp/counsellor/dashboard` |
| Finance Controller | `finance` | `admin123` | `/erp/finance/dashboard` |
| Admission Officer | `officer` | `admin123` | `/erp/officer/dashboard` |
| Registrar | `registrar` | `admin123` | `/erp/registrar/dashboard` |
| College Admin | `collegeadmin` | `admin123` | `/erp/college/dashboard` |
| Student (pre-seeded) | `9988776655` | `student123` | `/erp/student/dashboard` |

### New student auto-credentials (from public form)

| Field | Value |
|:---|:---|
| **Username** | Mobile number entered in the form |
| **Initial Password** | Date of Birth as `DDMMYYYY` (e.g. `15052002` for 15-May-2002) |
| **First Login** | Forced to change password before accessing dashboard |

---

## 11. API Endpoints Used at Each Stage

| Stage | Method | Endpoint | Auth Required |
|:---|:---|:---|:---|
| Fetch inquiry form schema | `GET` | `/api/erp/public/modules/inquiry_master/layout` | ❌ None |
| Submit inquiry form | `POST` | `/api/erp/public/records` | ❌ None |
| Student login | `POST` | `/api/erp/auth/login` | ❌ None |
| Force password change | `POST` | `/api/erp/auth/change-password` | ✅ JWT |
| Get current user info | `GET` | `/api/erp/auth/me` | ✅ JWT |
| Fetch student's inquiry record | `GET` | `/api/erp/records?module_key=inquiry_master` | ✅ JWT |
| Counsellor: update record | `PUT` | `/api/erp/records/<record_id>` | ✅ JWT + Counsellor role |
| Student: update docs + payment | `PUT` | `/api/erp/records/<record_id>` | ✅ JWT + Student role |
| Finance: verify fee | `PUT` | `/api/erp/records/<record_id>` | ✅ JWT + Finance role |
| Officer: approve admission | `PUT` | `/api/erp/records/<record_id>` | ✅ JWT + Officer role |
| Registrar: enroll student | `PUT` | `/api/erp/records/<record_id>` | ✅ JWT + Registrar role |

---

## 12. Payment Options Explained

### Option A — Online Payment (Razorpay Checkout)

The Razorpay SDK is loaded dynamically in the student dashboard from CDN (no npm package).

**Flow:**
1. Backend (or frontend config) provides the Razorpay Key ID
2. Student clicks "Pay Online via Razorpay"
3. Razorpay checkout modal opens in-browser
4. Student completes test payment
5. On success, `razorpay_payment_id` (format: `pay_XXXXXXXXXXXX`) is saved in record data
6. Finance controller cross-checks this ID in the Razorpay dashboard

**Test details:**
```
Card:   4111 1111 1111 1111
Expiry: Any future date
CVV:    Any 3 digits
OTP:    1234
Key ID: rzp_test_RvORW1HCWwBwoy  (test mode — no real money)
```

### Option B — Offline Payment (Bank UTR)

1. Student pays at any bank branch via NEFT/RTGS/IMPS
2. Student enters the **UTR (Unique Transaction Reference)** number from their bank receipt
3. The UTR is saved in the record as `utr_reference`
4. Finance controller cross-checks the UTR in the bank's reconciliation system

---

## 13. Error & Edge Cases

| Scenario | What happens |
|:---|:---|
| Student submits form with a mobile number that already exists as a username | System skips user creation and links the new inquiry record to the existing user account |
| Student tries to skip force-password-change | The MUI Dialog blocks all interaction; `disableEscapeKeyDown` prevents dismissal |
| Public form attempts to set `inquiry_status` to anything other than `"Open"` | Server-side `publicWriteProtected` map overrides the client value with `"Open"` regardless |
| Module key not in server whitelist on public routes | Server returns `403 Forbidden` |
| JWT access token expires | Client gets `401`; `AuthContext` should trigger a token refresh via `POST /api/erp/auth/refresh` |
| Student tries to submit without uploading all 4 documents | Frontend validation blocks submission; fields marked `is_mandatory = TRUE` in the form schema |
| DOB not provided or malformed | Password defaults to `"student123"` (fallback in `record_service.go` line 71) |

---

## 📁 Key Source Files

| File | Purpose |
|:---|:---|
| [`backend/services/erp/record_service.go`](./backend/services/erp/record_service.go) | `PublicCreateRecord()` — auto-creates student user on form submit |
| [`backend/services/erp/auth_service.go`](./backend/services/erp/auth_service.go) | `ChangePassword()` — clears `force_password_change` |
| [`frontend/src/apps/erp/pages/Register.tsx`](./frontend/src/apps/erp/pages/Register.tsx) | Public inquiry form page |
| [`frontend/src/apps/erp/pages/student/StudentDashboard.tsx`](./frontend/src/apps/erp/pages/student/StudentDashboard.tsx) | Student self-service — docs, payment, status |
| [`frontend/src/apps/erp/pages/counsellor/CounsellorDashboard.tsx`](./frontend/src/apps/erp/pages/counsellor/CounsellorDashboard.tsx) | Counsellor inquiry pipeline |
| [`frontend/src/apps/erp/pages/finance/FinanceDashboard.tsx`](./frontend/src/apps/erp/pages/finance/FinanceDashboard.tsx) | Finance fee verification queue |
| [`frontend/src/apps/erp/pages/officer/OfficerDashboard.tsx`](./frontend/src/apps/erp/pages/officer/OfficerDashboard.tsx) | Officer credentials & scholarship approval |
| [`frontend/src/apps/erp/pages/registrar/RegistrarDashboard.tsx`](./frontend/src/apps/erp/pages/registrar/RegistrarDashboard.tsx) | Registrar matriculation & enrollment ID |
| [`frontend/src/apps/erp/components/DashboardLayout.tsx`](./frontend/src/apps/erp/components/DashboardLayout.tsx) | Force-password-change blocking dialog |
| [`frontend/src/apps/erp/components/DynamicFormRenderer.tsx`](./frontend/src/apps/erp/components/DynamicFormRenderer.tsx) | Renders any module's form from JSON schema |

---

*For general system setup, infrastructure, and API reference see [README.md](./README.md). For test login credentials see [credentials.md](./credentials.md).*
