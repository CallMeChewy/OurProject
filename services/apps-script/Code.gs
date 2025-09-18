const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const ROSTER_SHEET = 'Roster';
const COUPON_BALANCES_SHEET = 'CouponBalances';
const COUPON_LEDGER_SHEET = 'CouponLedger';
const SECRET_KEY = PropertiesService.getScriptProperties().getProperty('SECRET_KEY');

function doGet(e) {
  return ContentService.createTextOutput('Invalid request method. Please use POST.');
}

function doPost(e) {
  var isValid = validateHmac(e);
  if (!isValid) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid signature' })).setMimeType(ContentService.MimeType.JSON);
  }

  var requestBody = JSON.parse(e.postData.contents);
  var eventUID = requestBody.eventUID;
  var deviceId = requestBody.deviceId;
  var bookId = requestBody.bookId;

  var isDuplicate = checkDuplicateEvent(eventUID);
  if (isDuplicate) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Duplicate event' })).setMimeType(ContentService.MimeType.JSON);
  }

  var couponConsumed = consumeCoupon(deviceId, bookId);
  if (!couponConsumed) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Insufficient coupons' })).setMimeType(ContentService.MimeType.JSON);
  }

  logTransaction(eventUID, deviceId, bookId);

  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function validateHmac(e) {
  const signature = e.headers['x-signature'];
  const body = e.postData.contents;
  const computedSignature = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, body, SECRET_KEY)
    .map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2))
    .join('');
  return signature === computedSignature;
}

function checkDuplicateEvent(eventUID) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(COUPON_LEDGER_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === eventUID) {
      return true;
    }
  }
  return false;
}

function consumeCoupon(deviceId, bookId) {
  const rosterSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ROSTER_SHEET);
  const balancesSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(COUPON_BALANCES_SHEET);

  const rosterData = rosterSheet.getDataRange().getValues();
  const balancesData = balancesSheet.getDataRange().getValues();

  let userTier = null;
  for (let i = 1; i < rosterData.length; i++) {
    if (rosterData[i][0] === deviceId) {
      userTier = rosterData[i][1];
      break;
    }
  }

  if (!userTier) {
    rosterSheet.appendRow([deviceId, 'Free']);
    balancesSheet.appendRow([deviceId, 2]);
    userTier = 'Free';
  }

  if (userTier === 'Premium') {
    return true;
  }

  for (let i = 1; i < balancesData.length; i++) {
    if (balancesData[i][0] === deviceId) {
      let balance = balancesData[i][1];
      if (balance > 0) {
        balancesSheet.getRange(i + 1, 2).setValue(balance - 1);
        return true;
      } else {
        return false;
      }
    }
  }

  balancesSheet.appendRow([deviceId, 1]);
  return true;
}

function logTransaction(eventUID, deviceId, bookId) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(COUPON_LEDGER_SHEET);
  sheet.appendRow([eventUID, deviceId, bookId, new Date()]);
}

function dailyCouponReplenishment() {
  const rosterSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ROSTER_SHEET);
  const balancesSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(COUPON_BALANCES_SHEET);

  const rosterData = rosterSheet.getDataRange().getValues();
  const balancesData = balancesSheet.getDataRange().getValues();

  for (let i = 1; i < rosterData.length; i++) {
    const deviceId = rosterData[i][0];
    const tier = rosterData[i][1];

    let balanceFound = false;
    for (let j = 1; j < balancesData.length; j++) {
      if (balancesData[j][0] === deviceId) {
        if (tier === 'Free') {
          balancesSheet.getRange(j + 1, 2).setValue(2);
        } else if (tier === 'Premium') {
          balancesSheet.getRange(j + 1, 2).setValue(9999);
        }
        balanceFound = true;
        break;
      }
    }

    if (!balanceFound) {
      if (tier === 'Free') {
        balancesSheet.appendRow([deviceId, 2]);
      } else if (tier === 'Premium') {
        balancesSheet.appendRow([deviceId, 9999]);
      }
    }
  }
}
