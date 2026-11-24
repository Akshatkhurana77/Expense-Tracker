# My Expense Tracker

A lightweight, responsive personal expense tracker. No account or server is required. Transactions and budget are saved in the browser's local storage on the device.

## Features
- Add, edit and delete income and expense transactions
- Dashboard totals in Indian rupees (INR)
- Search and filter by type/category
- Monthly spending breakdown
- Monthly budget progress
- Export transactions to CSV
- PWA install support and basic offline caching

## Run locally
1. Extract this ZIP.
2. Open a terminal in the extracted folder.
3. Run `python3 -m http.server 8000`
4. Visit `http://localhost:8000`

For PWA installation, use localhost or deploy over HTTPS. Opening `index.html` directly with `file://` will show the app but service-worker installation will not work.

## Deploy to Netlify
1. Log in to Netlify.
2. Choose **Add new site** → **Deploy manually** (or drag and drop).
3. Drag the extracted `expense-tracker` folder (the folder containing `index.html`) into the deploy area.
4. Wait for the deploy to finish and open the HTTPS site URL.

No build command or publish directory is needed for this static app.

## Install on Android
1. Open your Netlify HTTPS URL in Chrome.
2. Open Chrome's three-dot menu.
3. Tap **Install app** or **Add to Home screen**.
4. Confirm. The app icon will appear on your home screen.

## Important data note
Data is stored only in this browser on this device. It is not synced to another phone or browser. Clearing browser/site data can erase it. Use **Export CSV** regularly to keep a backup. The CSV export contains transactions; it does not include the monthly budget.

## Customize
- Change categories and icons in `app.js`.
- Change colors and layout in `styles.css`.
