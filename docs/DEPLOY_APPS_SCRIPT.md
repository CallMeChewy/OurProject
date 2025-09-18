# Deploying the Google Apps Script and Setting up the Trigger

## 1. Deploying the Script as a Web App

1.  Open your Google Apps Script project.
2.  At the top right, click **Deploy** > **New deployment**.
3.  Next to "Select type," click the gear icon and select **Web app**.
4.  In the "Description" field, enter a description for your web app (e.g., "OurLibrary Coupon API").
5.  For "Execute as," select **Me**.
6.  For "Who has access," select **Anyone**.
7.  Click **Deploy**.
8.  Copy the **Web app URL**. Store it in your deployment configuration (e.g., `config/ourlibrary_secret.json`) for any clients that still call the coupon API.
9.  Click **Done**.

## 2. Setting up Script Properties

1. In the Apps Script editor, open **Project Settings** (gear icon).
2. Under **Script properties**, click **Add script property** twice and create:
   * Key: `SPREADSHEET_ID` → Value: the ID of your Google Sheet.
   * Key: `SECRET_KEY` → Value: the shared secret that clients must present.
3. Save the changes.

## 3. Setting up the Daily Trigger

1.  In your Google Apps Script project, on the left, click **Triggers**.
2.  At the bottom right, click **Add Trigger**.
3.  Choose the following options:
    *   **Choose which function to run**: `dailyCouponReplenishment`
    *   **Choose which deployment should run**: `Head`
    *   **Select event source**: `Time-driven`
    *   **Select type of time-based trigger**: `Day timer`
    *   **Select time of day**: `Midnight to 1am` (or any other time you prefer)
4.  Click **Save**.

## 4. Updating the Local Configuration

1.  **Script Properties**: `SPREADSHEET_ID` and `SECRET_KEY` must match the IDs/secret used by your deployment. Rotate the secret if exposure is suspected.
2.  **`config/ourlibrary_secret.json`** (copied from `config/templates/ourlibrary_secret.example.json`):
    *   Replace `GENERATE_A_RANDOM_64_CHAR_SECRET` with the same secret used for the Apps Script property.
3.  Update any client configuration (desktop beta builds, integration tests, etc.) that still call the coupon API so they use the new Web App URL and secret. The modern Firebase token service does not require this step.
