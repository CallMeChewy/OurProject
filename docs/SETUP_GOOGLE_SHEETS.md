# Setting up Google Sheets for the Coupon System

To use the coupon-based download system, you need to create a Google Sheet with three tabs: `Roster`, `CouponBalances`, and `CouponLedger`.

## 1. Create a new Google Sheet

1.  Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2.  Rename the spreadsheet to "OurLibrary Coupon System".

## 2. Create the `Roster` sheet

1.  Rename the first sheet (usually "Sheet1") to `Roster`.
2.  Add the following headers in the first row:
    *   `A1`: `DeviceID`
    *   `B1`: `Tier`

## 3. Create the `CouponBalances` sheet

1.  Click the "+" button at the bottom left to add a new sheet.
2.  Rename the new sheet to `CouponBalances`.
3.  Add the following headers in the first row:
    *   `A1`: `DeviceID`
    *   `B1`: `Balance`

## 4. Create the `CouponLedger` sheet

1.  Click the "+" button at the bottom left to add a new sheet.
2.  Rename the new sheet to `CouponLedger`.
3.  Add the following headers in the first row:
    *   `A1`: `EventUID`
    *   `B1`: `DeviceID`
    *   `C1`: `BookID`
    *   `D1`: `Timestamp`

## 5. Get the Spreadsheet ID

1.  The Spreadsheet ID is part of the URL of your Google Sheet.
2.  The URL looks like this: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3.  Copy the `SPREADSHEET_ID` part of the URL. You will need it to configure the Google Apps Script.
