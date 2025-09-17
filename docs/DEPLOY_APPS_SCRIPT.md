# Deploying the Google Apps Script and Setting up the Trigger

## 1. Deploying the Script as a Web App

1.  Open your Google Apps Script project.
2.  At the top right, click **Deploy** > **New deployment**.
3.  Next to "Select type," click the gear icon and select **Web app**.
4.  In the "Description" field, enter a description for your web app (e.g., "OurLibrary Coupon API").
5.  For "Execute as," select **Me**.
6.  For "Who has access," select **Anyone**.
7.  Click **Deploy**.
8.  Copy the **Web app URL**. This is your `couponApiUrl`. You will need to update this in `main.js`.
9.  Click **Done**.

## 2. Setting up the Daily Trigger

1.  In your Google Apps Script project, on the left, click **Triggers**.
2.  At the bottom right, click **Add Trigger**.
3.  Choose the following options:
    *   **Choose which function to run**: `dailyCouponReplenishment`
    *   **Choose which deployment should run**: `Head`
    *   **Select event source**: `Time-driven`
    *   **Select type of time-based trigger**: `Day timer`
    *   **Select time of day**: `Midnight to 1am` (or any other time you prefer)
4.  Click **Save**.

## 3. Updating the Configuration

1.  **`services/apps-script/Code.gs`**: 
    *   Replace `YOUR_SPREADSHEET_ID` with the ID of your Google Sheet.
    *   Replace `YOUR_SECRET_KEY` with the same secret key you used in `ourlibrary_secret.json`.
2.  **`config/ourlibrary_secret.json`** (copied from `config/templates/ourlibrary_secret.example.json`):
    *   Replace `GENERATE_A_RANDOM_64_CHAR_SECRET` with a strong, randomly generated secret key.
3.  **`app/main.js`**:
    *   Replace `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec` with the Web app URL you copied after deploying the script.
