/**
 * ============================================================
 * TABASHEER WELFARE FOUNDATION
 * TALENT HUNT EXAMINATION PORTAL
 * Google Apps Script + Google Sheets + Google Drive
 * ============================================================
 *
 * Features:
 * - Student registration
 * - Automatic Application ID
 * - Student confirmation email
 * - Admin notification email
 * - Passport photo upload
 * - Google Drive photo storage
 * - Admit Card Management with Yes/No publishing control
 * - Result Management with Yes/No publishing control
 * - Admit Card generation
 * - Result lookup
 * - Automatic yearly registration
 * - Permanent Exam Settings sheet for yearly examination date
 *
 * Admin Emails:
 * tabasheerfoundation@gmail.com
 * designfuzee@gmail.com
 */

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  FOUNDATION_NAME: 'Tabasheer Welfare Foundation',
  EXAM_NAME: 'Talent Hunt Examination',

  ADMIN_EMAILS: [
    'tabasheerfoundation@gmail.com',
    'designfuzee@gmail.com'
  ],

  TIMEZONE: 'Asia/Kolkata',

  APPLICATION_SHEET: 'Applications',
  ADMIT_CARD_SHEET: 'Admit Card Management',
  RESULT_SHEET: 'Result Management',
  EXAM_SETTINGS_SHEET: 'Exam Settings',

  PHOTO_FOLDER_NAME: 'Tabasheer Talent Hunt - Student Photos',

  // Official TWF signature used on Admit Cards and Results.
  TWF_SIGNATURE_FILE_ID: '1d2hbH0xPa35iqU5Ckp3eDXiy1Y_v07Q5',

  // Official TWF logo used in the portal, Admit Card, Result and favicon.
  TWF_LOGO_FILE_ID: '1YckO15_oT9dspFSpIgIgt-otTlLXUa-E',

  MAX_PHOTO_SIZE_BYTES: 2 * 1024 * 1024,

  BOARD_OPTIONS: [
    'CBSE',
    'ICSE',
    'BSEB',
    'Other'
  ],

  GENDER_OPTIONS: [
    'Male',
    'Female',
    'Other'
  ],

  MEDIUM_OPTIONS: [
    'English',
    'Hindi',
    'Other'
  ],

  // Change these whenever examination centres need to be updated.
  EXAM_CENTRES: [
    'Purnia',
    'Araria',
    'Katihar',
    'Kishanganj',
    'Other'
  ]
};



// ============================================================
// ADMIN MENU
// ============================================================

function onOpen() {

  SpreadsheetApp
    .getUi()
    .createMenu('Talent Hunt Admin')
    .addItem('Setup / Sync Management Sheets', 'setupProject')
    .addItem('Sync Management Sheets', 'syncManagementSheets_')
    .addToUi();
}


// ============================================================
// WEB APP
// ============================================================

function doGet() {
  return jsonResponse_({
    success: true,
    service: 'Tabasheer Welfare Foundation Talent Hunt Examination API',
    message: 'Backend is running.'
  });
}


// ============================================================
// VERCEL / HTTP API
// ============================================================

function doPost(e) {

  try {

    const raw = e && e.postData && e.postData.contents
      ? e.postData.contents
      : '{}';

    const request = JSON.parse(raw);
    const action = String(request.action || '').trim();
    const payload = request.payload || {};

    switch (action) {

      case 'getFormConfig':
        return jsonResponse_(getFormConfig());

      case 'submitApplication':
        return jsonResponse_(submitApplication(payload));

      case 'getAdmitCardStatus':
        return jsonResponse_(
          getAdmitCardStatus(payload.applicationId)
        );

      case 'getAdmitCard':
        return jsonResponse_(
          getAdmitCard(payload.applicationId)
        );

      case 'checkResult':
        return jsonResponse_(
          checkResult(payload.applicationId)
        );

      default:
        return jsonResponse_({
          success: false,
          message: 'Invalid API action.'
        });
    }

  } catch (error) {

    console.error('API error:', error);

    return jsonResponse_({
      success: false,
      message: error && error.message
        ? error.message
        : 'Unable to process request.'
    });
  }
}


function jsonResponse_(data) {

  return ContentService
    .createTextOutput(JSON.stringify(data || {}))
    .setMimeType(ContentService.MimeType.JSON);
}


// ============================================================
// INITIAL PROJECT SETUP
// ============================================================

function setupProject() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ----------------------------------------------------------
  // Exam Settings Sheet
  // ----------------------------------------------------------

  let examSettingsSheet =
    ss.getSheetByName(CONFIG.EXAM_SETTINGS_SHEET);

  if (!examSettingsSheet) {
    examSettingsSheet =
      ss.insertSheet(CONFIG.EXAM_SETTINGS_SHEET);
  }

  if (examSettingsSheet.getLastRow() === 0) {

    examSettingsSheet
      .getRange(1, 1, 2, 2)
      .setValues([
        ['Setting', 'Value'],
        ['Examination Date', '20 December 2026']
      ]);

    examSettingsSheet
      .getRange(1, 1, 1, 2)
      .setFontWeight('bold');

    examSettingsSheet.setFrozenRows(1);
  }

  // ----------------------------------------------------------
  // Applications Sheet
  // ----------------------------------------------------------

  let applicationSheet = ss.getSheetByName(CONFIG.APPLICATION_SHEET);

  if (!applicationSheet) {
    applicationSheet = ss.insertSheet(CONFIG.APPLICATION_SHEET);
  }

  const applicationHeaders = [
    'Timestamp',
    'Application ID',
    'Student Name',
    'Gender',
    'Date of Birth',
    'Phone',
    'Email',
    'Present School Name',
    '10th Board',
    'Other Board Name',
    'District',
    'Exam Centre',
    'Exam Paper Medium',
    'Full Address',
    'Photo File ID',
    'Photo File URL',
    'Admit Card Available Date',
    'Declaration'
  ];

  if (applicationSheet.getLastRow() === 0) {
    applicationSheet
      .getRange(1, 1, 1, applicationHeaders.length)
      .setValues([applicationHeaders]);

    applicationSheet
      .getRange(1, 1, 1, applicationHeaders.length)
      .setFontWeight('bold');

    applicationSheet.setFrozenRows(1);
  }

  // ----------------------------------------------------------
  // Admit Card Management Sheet
  // ----------------------------------------------------------

  let admitSheet = ss.getSheetByName(CONFIG.ADMIT_CARD_SHEET);

  if (!admitSheet) {
    admitSheet = ss.insertSheet(CONFIG.ADMIT_CARD_SHEET);
  }

  const admitHeaders = [
    'Application ID',
    'Student Name',
    'Gender',
    'Date of Birth',
    'Present School Name',
    '10th Board',
    'District',
    'Exam Centre',
    'Exam Paper Medium',
    'Full Address',
    'Application Date',
    'Photo File ID',
    'Admit Card Live?'
  ];

  if (admitSheet.getLastRow() === 0) {
    admitSheet
      .getRange(1, 1, 1, admitHeaders.length)
      .setValues([admitHeaders]);

    admitSheet
      .getRange(1, 1, 1, admitHeaders.length)
      .setFontWeight('bold');

    admitSheet.setFrozenRows(1);
  }

  // ----------------------------------------------------------
  // Result Management Sheet
  // ----------------------------------------------------------

  let resultSheet = ss.getSheetByName(CONFIG.RESULT_SHEET);

  if (!resultSheet) {
    resultSheet = ss.insertSheet(CONFIG.RESULT_SHEET);
  }

  const resultHeaders = [
    'Application ID',
    'Student Name',
    'Date of Birth',
    '10th Board',
    'Exam Paper Medium',
    'Result Status',
    'Marks',
    'Rank',
    'Remarks',
    'Result Live?'
  ];

  if (resultSheet.getLastRow() === 0) {
    resultSheet
      .getRange(1, 1, 1, resultHeaders.length)
      .setValues([resultHeaders]);

    resultSheet
      .getRange(1, 1, 1, resultHeaders.length)
      .setFontWeight('bold');

    resultSheet.setFrozenRows(1);
  }

  // Add Yes/No dropdowns to management sheets.
  applyManagementValidation_();

  // Synchronize all existing applications.
  syncManagementSheets_();

  // ----------------------------------------------------------
  // Drive Folder
  // ----------------------------------------------------------

  getPhotoFolder_();

  return {
    success: true,
    message: 'Project setup completed successfully.'
  };
}


// ============================================================
// FORM CONFIGURATION
// ============================================================

function getFormConfig() {

  return {
    gender: CONFIG.GENDER_OPTIONS,
    board: CONFIG.BOARD_OPTIONS,
    examCentre: CONFIG.EXAM_CENTRES,
    medium: CONFIG.MEDIUM_OPTIONS,
    logoDataUrl: getTWFLogoDataUrl_()
  };
}


// ============================================================
// SUBMIT APPLICATION
// ============================================================

function submitApplication(data) {

  try {

    validateApplication_(data);

    const lock = LockService.getScriptLock();

    lock.waitLock(30000);

    try {

      const ss = SpreadsheetApp.getActiveSpreadsheet();

      const sheet = ss.getSheetByName(CONFIG.APPLICATION_SHEET);

      if (!sheet) {
        throw new Error(
          'Applications sheet not found. Please run setupProject() first.'
        );
      }

      // ------------------------------------------------------
      // Generate Application ID
      // ------------------------------------------------------

      const timestamp = new Date();

      const applicationId = generateApplicationId_(sheet, timestamp);

      // ------------------------------------------------------
      // Photo
      // ------------------------------------------------------

      let photoFileId = '';
      let photoFileUrl = '';

      if (data.photo && data.photo.base64) {

        const photo = saveStudentPhoto_(
          data.photo,
          applicationId,
          data.studentName
        );

        photoFileId = photo.fileId;
        photoFileUrl = photo.url;
      }

      // ------------------------------------------------------
      // Medium
      // ------------------------------------------------------

      const finalMedium =
        data.medium === 'Other'
          ? String(data.mediumOther || '').trim()
          : String(data.medium || '').trim();

      // ------------------------------------------------------
      // Board
      // ------------------------------------------------------

      const finalBoard =
        data.board === 'Other'
          ? String(data.boardOther || '').trim()
          : String(data.board || '').trim();

      // ------------------------------------------------------
      // Save Application
      // ------------------------------------------------------

      const row = [
        timestamp,
        applicationId,
        data.studentName,
        data.gender,
        data.dob,
        data.phone,
        data.email,
        data.school,
        finalBoard,
        data.board === 'Other' ? data.boardOther : '',
        data.district,
        data.examCentre,
        finalMedium,
        String(data.address || '').trim(),
        photoFileId,
        photoFileUrl,
        '',
        data.declaration ? 'Accepted' : 'Not Accepted'
      ];

      sheet.appendRow(row);

      // Keep management sheets synchronized with the new application.
      syncManagementSheets_();

      // ------------------------------------------------------
      // Student Email
      // ------------------------------------------------------

      sendStudentConfirmationEmail_({
        applicationId: applicationId,
        timestamp: timestamp,
        studentName: data.studentName,
        gender: data.gender,
        dob: data.dob,
        phone: data.phone,
        email: data.email,
        school: data.school,
        board: finalBoard,
        district: data.district,
        examCentre: data.examCentre,
        medium: finalMedium,
        address: String(data.address || '').trim()
      });

      // ------------------------------------------------------
      // Admin Email
      // ------------------------------------------------------

      sendAdminNotificationEmail_({
        applicationId: applicationId,
        timestamp: timestamp,
        studentName: data.studentName,
        email: data.email,
        phone: data.phone,
        school: data.school,
        board: finalBoard,
        district: data.district,
        examCentre: data.examCentre,
        medium: finalMedium
      });

      return {
        success: true,
        applicationId: applicationId,
        studentName: data.studentName,
        applicationDate: formatDate_(timestamp),
        examinationDate: getExaminationDate_(),
        message:
          'Congratulations! Your application has been successfully submitted.'
      };

    } finally {

      lock.releaseLock();
    }

  } catch (error) {

    console.error(error);

    return {
      success: false,
      message: error.message || 'Unable to submit application.'
    };
  }
}


// ============================================================
// VALIDATE APPLICATION
// ============================================================

function validateApplication_(data) {

  if (!data) {
    throw new Error('Invalid application data.');
  }

  const required = [
    ['studentName', 'Student name'],
    ['gender', 'Gender'],
    ['dob', 'Date of birth'],
    ['phone', 'Phone number'],
    ['email', 'Email address'],
    ['school', 'School name'],
    ['board', '10th Board'],
    ['district', 'District'],
    ['examCentre', 'Examination centre'],
    ['medium', 'Exam paper medium'],
    ['address', 'Full address']
  ];

  required.forEach(function(item) {

    const key = item[0];
    const label = item[1];

    if (!data[key] || String(data[key]).trim() === '') {
      throw new Error(label + ' is required.');
    }
  });

  if (
    data.board === 'Other' &&
    (!data.boardOther || String(data.boardOther).trim() === '')
  ) {
    throw new Error('Please enter the board name.');
  }

  if (
    data.medium === 'Other' &&
    (!data.mediumOther || String(data.mediumOther).trim() === '')
  ) {
    throw new Error('Please enter the exam language.');
  }

  if (!data.declaration) {
    throw new Error('Please accept the declaration.');
  }

  const phone = String(data.phone).replace(/\D/g, '');

  if (phone.length < 10 || phone.length > 15) {
    throw new Error('Please enter a valid phone number.');
  }

  const email = String(data.email).trim();

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address.');
  }

  // ----------------------------------------------------------
  // Photo Validation
  // ----------------------------------------------------------

  if (!data.photo || !data.photo.base64) {
    throw new Error('Passport size photograph is required.');
  }

  if (
    data.photo.size &&
    Number(data.photo.size) > CONFIG.MAX_PHOTO_SIZE_BYTES
  ) {
    throw new Error('Photo size must not exceed 2 MB.');
  }

  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  if (
    data.photo.mimeType &&
    allowedTypes.indexOf(data.photo.mimeType.toLowerCase()) === -1
  ) {
    throw new Error('Only JPG, JPEG or PNG photographs are allowed.');
  }
}


// ============================================================
// APPLICATION ID
// ============================================================

function generateApplicationId_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Applications");

  const startNumber = 110;
  const lastRow = sheet.getLastRow();

  // If there are no student applications yet
  if (lastRow < 2) {
    return "TWF-TH-00110-DF";
  }

  // Application ID is assumed to be in Column B
  const ids = sheet
    .getRange(2, 2, lastRow - 1, 1)
    .getValues()
    .flat()
    .filter(String);

  let highestNumber = startNumber - 1;

  ids.forEach(function(id) {
    const match = String(id).match(/^TWF-TH-(\d+)-DF$/);

    if (match) {
      const number = parseInt(match[1], 10);

      if (number > highestNumber) {
        highestNumber = number;
      }
    }
  });

  const nextNumber = highestNumber + 1;

  return `TWF-TH-${String(nextNumber).padStart(5, "0")}-DF`;
}


// ============================================================
// SAVE STUDENT PHOTO
// ============================================================

function saveStudentPhoto_(photo, applicationId, studentName) {

  const folder = getPhotoFolder_();

  const base64 = String(photo.base64);

  const commaIndex = base64.indexOf(',');

  const encoded =
    commaIndex >= 0
      ? base64.substring(commaIndex + 1)
      : base64;

  const bytes = Utilities.base64Decode(encoded);

  if (bytes.length > CONFIG.MAX_PHOTO_SIZE_BYTES) {
    throw new Error('Photo size must not exceed 2 MB.');
  }

  const mimeType =
    photo.mimeType || 'image/jpeg';

  const extension =
    mimeType === 'image/png'
      ? 'png'
      : 'jpg';

  const safeName =
    String(studentName || 'Student')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_');

  const fileName =
    applicationId +
    '_' +
    safeName +
    '.' +
    extension;

  const blob = Utilities.newBlob(
    bytes,
    mimeType,
    fileName
  );

  const file = folder.createFile(blob);

  return {
    fileId: file.getId(),
    url: file.getUrl()
  };
}


// ============================================================
// PHOTO FOLDER
// ============================================================

function getPhotoFolder_() {

  const properties =
    PropertiesService.getScriptProperties();

  const existingFolderId =
    properties.getProperty('PHOTO_FOLDER_ID');

  if (existingFolderId) {

    try {
      return DriveApp.getFolderById(existingFolderId);
    } catch (error) {
      // Folder no longer exists. Create a new one.
    }
  }

  const folders = DriveApp.getFoldersByName(
    CONFIG.PHOTO_FOLDER_NAME
  );

  let folder;

  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(
      CONFIG.PHOTO_FOLDER_NAME
    );
  }

  properties.setProperty(
    'PHOTO_FOLDER_ID',
    folder.getId()
  );

  return folder;
}


// ============================================================
// ADMIT CARD STATUS
// ============================================================

function getAdmitCardStatus(applicationId) {

  try {

    const application =
      findApplication_(applicationId);

    if (!application) {

      return {
        success: false,
        message: 'Application ID not found.'
      };
    }

    const live =
      isAdmitCardLive_(application.applicationId);

    if (!live) {

      return {
        success: true,
        available: false,
        applicationId: application.applicationId,
        studentName: application.studentName,
        message:
          'Your Admit Card has not been released yet. Please check again later.'
      };
    }

    return {
      success: true,
      available: true,
      applicationId: application.applicationId,
      studentName: application.studentName
    };

  } catch (error) {

    return {
      success: false,
      message: error.message
    };
  }
}


// ============================================================
// GET ADMIT CARD
// ============================================================

function getAdmitCard(applicationId) {

  try {

    const application =
      findApplication_(applicationId);

    if (!application) {

      return {
        success: false,
        message: 'Application ID not found.'
      };
    }

    // --------------------------------------------------------
    // SERVER-SIDE MANAGEMENT CHECK
    // --------------------------------------------------------

    if (!isAdmitCardLive_(application.applicationId)) {

      return {
        success: false,
        locked: true,
        message:
          'Your Admit Card has not been released yet. Please chec
