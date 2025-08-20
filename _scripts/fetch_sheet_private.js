import { google } from "googleapis";
import fs from "fs";

// Read environment variables
const sheetId = process.env.SHEET_ID;
const sheetRange = process.env.SHEET_RANGE;
const outputPath = process.env.OUTPUT_PATH || "assets/json/table_data.json";
const saPath = process.env.GOOGLE_SA_JSON_PATH;

if (!sheetId || !sheetRange || !saPath) {
  console.error("❌ Missing environment variables: SHEET_ID, SHEET_RANGE, or GOOGLE_SA_JSON_PATH");
  process.exit(1);
}

// Load the service account JSON
let saCredentials;
try {
  saCredentials = JSON.parse(fs.readFileSync(saPath, "utf8"));
} catch (err) {
  console.error("❌ Failed to read or parse service account JSON:", err);
  process.exit(1);
}

// Authenticate with Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: saCredentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

async function fetchSheet() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetRange,
    });

    const rows = res.data.values || [];
    fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2));
    console.log(`✅ Sheet data written to ${outputPath}`);
  } catch (err) {
    console.error("❌ Error fetching sheet:", err);
    process.exit(1);
  }
}

fetchSheet();
