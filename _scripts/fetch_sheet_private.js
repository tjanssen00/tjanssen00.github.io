// .github/scripts/fetch_sheet_private.js
// Usage: node .github/scripts/fetch_sheet_private.js
// Reads Google Sheet (private via Service Account) and writes assets/json/table_data.json

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  SHEET_ID,
  SHEET_RANGE = "Sheet1!A1:Z",
  GOOGLE_SA_JSON_BASE64,
  OUTPUT_PATH = "activities_table.json",
} = process.env;

// --- Validate env ---
if (!SHEET_ID || !GOOGLE_SA_JSON_BASE64) {
  console.error("❌ Missing env: SHEET_ID and GOOGLE_SA_JSON_BASE64 are required.");
  process.exit(1);
}

// --- Decode service account JSON ---
let saJson;
try {
  saJson = JSON.parse(Buffer.from(GOOGLE_SA_JSON_BASE64, "base64").toString("utf8"));
} catch (err) {
  console.error("❌ Failed to parse GOOGLE_SA_JSON_BASE64:", err);
  process.exit(1);
}

// --- Setup Google Sheets auth ---
const scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
const auth = new google.auth.JWT(
  saJson.client_email,
  undefined,
  saJson.private_key,
  scopes
);

const sheets = google.sheets({ version: "v4", auth });

// --- Convert sheet rows to objects ---
function rowsToObjects(values) {
  if (!values || values.length === 0) return [];
  const headers = values[0].map(h => String(h).trim());
  const rows = values.slice(1);
  return rows.map(r => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = r[i] ?? "";
      // Optional: auto-number cast for numeric columns
      if (["id", "price", "amount", "qty"].includes(h.toLowerCase())) {
        const n = Number(obj[h]);
        if (!Number.isNaN(n) && obj[h] !== "") obj[h] = n;
      }
    });
    return obj;
  });
}

// --- Main function ---
(async () => {
  try {
    // Test authentication
    await auth.authorize();
    console.log("✅ Service account authorized successfully.");

    // Fetch sheet values
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    if (!data.values || data.values.length === 0) {
      console.warn(`⚠️ Sheet range "${SHEET_RANGE}" is empty or missing.`);
    }

    const records = rowsToObjects(data.values || []);
    const outAbs = path.join(process.cwd(), OUTPUT_PATH);

    await fs.mkdir(path.dirname(outAbs), { recursive: true });
    await fs.writeFile(outAbs, JSON.stringify(records, null, 2) + "\n", "utf8");

    console.log(`✅ Wrote ${records.length} records to ${OUTPUT_PATH}`);
  } catch (err) {
    console.error("❌ Error fetching sheet:", err?.response?.data || err.message || err);
    process.exit(1);
  }
})();
