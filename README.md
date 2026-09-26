# Tabasheer Welfare Foundation — Talent Hunt Examination

## Vercel + GitHub Production Package

This package separates the public website frontend from the Google Apps Script backend:

```text
Student Browser
      │
      ▼
Vercel
├── index.html
└── /api/twf
      │ HTTPS
      ▼
Google Apps Script Web App
└── backend/Code.gs
      │
      ├── Google Sheets
      ├── Google Drive
      └── Email
```

The browser **does not use `google.script.run`**. It calls the same-origin Vercel endpoint `/api/twf`, and the Vercel serverless function forwards the request to the Google Apps Script Web App.

---

## 1. Package Structure

```text
Tabasheer-Vercel-Ready/
│
├── index.html
├── vercel.json
├── .env.example
├── README.md
│
├── api/
│   └── twf.js
│
└── backend/
    └── Code.gs
```

---

## 2. What Is Already Included

### Frontend

- Tabasheer Welfare Foundation branding
- Talent Hunt Examination registration
- Automatic current-year registration label
- Day/night mode
- Student registration form
- Student photo upload
- Application ID display
- Admit Card lookup
- Result lookup
- Examination Date display
- Student photo on Admit Card
- TWF signature on Admit Card and Result
- TWF logo on portal, Admit Card and Result
- TWF logo used as favicon
- Contact information
- Design Fuze footer credit
- Mobile responsive layout

### Google Apps Script backend

- Google Sheets application storage
- Automatic Application ID generation
- Student photo storage in Google Drive
- Confirmation email
- Admin notification email
- Admit Card Management
- Result Management
- Exam Settings
- Examination Date from `Exam Settings!B2`
- Admit Card `Live?` publishing control
- Result `Live?` publishing control
- TWF logo and signature loading

---

## 3. Google Apps Script Setup

The file:

```text
backend/Code.gs
```

must remain a Google Apps Script project. Vercel cannot execute `.gs` files directly.

### Step 1 — Open the existing Apps Script project

Use the Apps Script project connected to the Tabasheer Google Sheet.

Replace the existing `Code.gs` with:

```text
backend/Code.gs
```

Keep the Apps Script project connected to the correct Google Spreadsheet.

### Step 2 — Run setup

From Apps Script, run:

```text
setupProject()
```

once after updating the backend.

Authorize Google Sheets, Drive and Gmail permissions when Google asks.

---

## 4. Deploy the Google Apps Script Backend

In Apps Script:

**Deploy → New deployment → Web app**

Use:

```text
Execute as: Me
Who has access: Anyone
```

Copy the deployed URL ending in:

```text
/exec
```

Example:

```text
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Do not use:

```text
/dev
```

for production.

### Important

After changing `Code.gs`, update the existing deployment to a **new version** and deploy it again.

---

## 5. GitHub Setup

Create a GitHub repository and upload the contents of this package.

The repository root should contain:

```text
index.html
vercel.json
README.md
api/twf.js
backend/Code.gs
.env.example
```

Commit and push the files.

---

## 6. Vercel Setup

Import the GitHub repository into Vercel.

This is a plain HTML + Vercel Serverless Function project. No React, Next.js or build command is required.

Recommended Vercel settings:

```text
Framework Preset: Other
Build Command: leave empty
Output Directory: leave empty
Install Command: leave empty
```

Vercel automatically detects:

```text
/api/twf.js
```

as the API endpoint:

```text
/api/twf
```

---

## 7. Required Vercel Environment Variable

In Vercel:

**Project → Settings → Environment Variables**

Add:

```text
Name:
GAS_WEB_APP_URL

Value:
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Enable it for the production environment.

Then redeploy the project.

The `.env.example` file is included only as a reference. Do not put a real production secret or private URL into GitHub unless you intentionally want it public.

---

## 8. How Requests Work

The frontend sends requests such as:

```text
POST /api/twf
```

with an action:

```json
{
  "action": "getAdmitCard",
  "payload": {
    "applicationId": "TWF-TH-00110-DF"
  }
}
```

Vercel forwards the request to Apps Script.

Apps Script receives it through:

```javascript
doPost(e)
```

and routes the action to the existing backend functions.

Supported actions:

```text
getFormConfig
submitApplication
getAdmitCardStatus
getAdmitCard
checkResult
```

---

## 9. Google Sheets Structure

### Applications

```text
Timestamp
Application ID
Student Name
Gender
Date of Birth
Phone
Email
Present School Name
10th Board
Other Board Name
District
Exam Centre
Exam Paper Medium
Full Address
Photo File ID
Photo File URL
Admit Card Available Date
Declaration
```

The old `Admit Card Available Date` column may remain for legacy compatibility, but the old automatic 10-day waiting rule is not used.

### Admit Card Management

```text
Application ID
Student Name
Gender
Date of Birth
Present School Name
10th Board
District
Exam Centre
Exam Paper Medium
Full Address
Application Date
Photo File ID
Admit Card Live?
```

### Result Management

```text
Application ID
Student Name
DOB / Date of Birth
10th Board
Exam Medium / Exam Paper Medium
Result Status
Marks
Rank
Remarks
Result Live?
```

### Exam Settings

```text
A1 = Setting
B1 = Value
A2 = Examination Date
B2 = [exam date]
```

For a new year, only `B2` needs to be changed.

---

## 10. Publishing Controls

### Admit Card

The public portal checks:

```text
Admit Card Management → Admit Card Live?
```

If it is `No`, the student cannot open the Admit Card.

If it is `Yes`, the student can retrieve it using the Application ID.

### Result

The public portal checks:

```text
Result Management → Result Live?
```

If it is `No`, the result remains unpublished.

---

## 11. Current Application ID Format

The backend generates IDs in this format:

```text
TWF-TH-00110-DF
TWF-TH-00111-DF
TWF-TH-00112-DF
...
```

The sequence is generated from existing IDs in the `Applications` sheet.

---

## 12. TWF Logo and Signature

The backend is configured to use the official Google Drive assets:

### TWF Logo

```text
1YckO15_oT9dspFSpIgIgt-otTlLXUa-E
```

Used for:

- Portal header
- Favicon
- Admit Card
- Result

### TWF Signature

```text
1d2hbH0xPa35iqU5Ckp3eDXiy1Y_v07Q5
```

Used at the bottom-right of:

- Admit Card
- Result

The signature image is a visual/digital representation and is not a cryptographic Digital Signature Certificate (DSC).

---

## 13. Email Configuration

Student and administration emails are configured in `Code.gs`.

Current admin recipients:

```text
tabasheerfoundation@gmail.com
designfuzee@gmail.com
```

---

## 14. Testing Checklist

After deployment, test these in order:

### Frontend

- [ ] Vercel homepage opens
- [ ] TWF logo appears
- [ ] Favicon appears
- [ ] Current year appears
- [ ] Day/night toggle works
- [ ] Form fields load
- [ ] Board `Other` field works
- [ ] Medium `Other` field works
- [ ] Photo upload works
- [ ] Declaration is mandatory

### Application

- [ ] Submit a test application
- [ ] Application ID is generated
- [ ] Application appears in Google Sheets
- [ ] Photo is saved to Google Drive
- [ ] Student confirmation email is received
- [ ] Admin emails are received

### Admit Card

- [ ] Set `Admit Card Live?` to `No`
- [ ] Portal shows the card is not released
- [ ] Set `Admit Card Live?` to `Yes`
- [ ] Portal opens the Admit Card
- [ ] Student photo appears
- [ ] Examination Date appears
- [ ] TWF logo appears
- [ ] Signature appears bottom-right
- [ ] Print works

### Result

- [ ] Set `Result Live?` to `No`
- [ ] Portal says result is not published
- [ ] Enter marks/rank/remarks
- [ ] Set `Result Live?` to `Yes`
- [ ] Portal displays the result
- [ ] TWF logo appears
- [ ] Signature appears bottom-right

---

## 15. Updating the Backend

Whenever `backend/Code.gs` is changed:

1. Copy the updated code into the Apps Script project.
2. Save it.
3. Run `setupProject()` if the sheet structure needs syncing.
4. Deploy a new version of the Apps Script Web App.
5. Confirm the `/exec` URL remains the URL stored in Vercel's `GAS_WEB_APP_URL`.
6. Redeploy Vercel only if frontend/API files changed.

---

## 16. Updating the Frontend

Whenever `index.html` or `api/twf.js` changes:

1. Commit the changes to GitHub.
2. Push to the connected branch.
3. Vercel automatically creates a new deployment.
4. Test the production Vercel URL.

---

## 17. Custom Domain

After the Vercel project is working, connect a preferred domain or subdomain from:

```text
Vercel → Project → Settings → Domains
```

For example:

```text
https://exam.tabasheer.in
```

The exact DNS records shown by Vercel should be followed for the selected domain.

---

## 18. Important Architecture Note

Do not put the Google Apps Script `.gs` file inside the public Vercel frontend expecting Vercel to execute it.

The correct separation is:

```text
GitHub / Vercel
│
├── index.html       → public frontend
├── api/twf.js       → Vercel server-side proxy
└── vercel.json      → Vercel configuration

Google Apps Script
│
└── Code.gs          → Google Sheets / Drive / Email backend
```

This structure removes the dependency on `google.script.run` from the public frontend and is suitable for a GitHub + Vercel deployment.
