/**
 * Sol — Google Sheets backend (Apps Script)
 * ------------------------------------------
 * Deploy this bound to your Google Sheet (Extensions > Apps Script), then
 * publish it as a Web App. It exposes:
 *
 *   GET  ?action=words        -> JSON array of words from the "Words" sheet
 *   POST { action: "logAttempt", spoken, corrected, notes }
 *                              -> appends a row to the "Attempts" sheet
 *
 * SHEET SETUP
 * "Words" tab, first row = headers, must include at least: id, english
 * Optional columns: tamil, example_en, example_ta
 *
 * "Attempts" tab is created automatically the first time someone logs
 * an attempt — you don't need to make it yourself.
 *
 * DEPLOY
 * 1. Open your Google Sheet -> Extensions -> Apps Script.
 * 2. Delete any starter code, paste this file in.
 * 3. Click Deploy -> New deployment -> type: Web app.
 *      Execute as: Me
 *      Who has access: Anyone
 * 4. Copy the Web app URL (ends in /exec) into your React app's .env as
 *      VITE_SHEETS_API_URL=<that url>
 * 5. Whenever you edit this script, make a NEW deployment version
 *    (Deploy -> Manage deployments -> pencil icon -> New version) —
 *    otherwise the live URL keeps serving the old code.
 */

const SHEET_NAME_WORDS = 'Words'
const SHEET_NAME_ATTEMPTS = 'Attempts'

function doGet(e) {
  const action = ((e.parameter && e.parameter.action) || 'words').toLowerCase()

  if (action === 'words') {
    return jsonResponse_({ ok: true, words: getWords_() })
  }
  return jsonResponse_({ ok: false, error: 'Unknown action: ' + action })
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents)
    const action = (body.action || '').toLowerCase()

    if (action === 'logattempt') {
      logAttempt_(body)
      return jsonResponse_({ ok: true })
    }
    return jsonResponse_({ ok: false, error: 'Unknown action: ' + action })
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message })
  }
}

/** Reads the Words sheet and returns an array of plain objects. */
function getWords_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_WORDS)
  if (!sheet) return []

  const values = sheet.getDataRange().getValues()
  if (values.length < 2) return []

  const headers = values.shift().map((h) => String(h).trim().toLowerCase())

  return values
    .filter((row) => row.some((cell) => String(cell).trim() !== ''))
    .map((row, i) => {
      const obj = {}
      headers.forEach((header, idx) => {
        obj[header] = row[idx] !== undefined ? String(row[idx]).trim() : ''
      })
      if (!obj.id) obj.id = String(i + 1)
      return obj
    })
}

/** Appends one row to the Attempts sheet, creating it (with headers) if missing. */
function logAttempt_(body) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(SHEET_NAME_ATTEMPTS)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_ATTEMPTS)
    sheet.appendRow(['timestamp', 'spoken', 'corrected', 'notes'])
  }
  sheet.appendRow([new Date(), body.spoken || '', body.corrected || '', body.notes || ''])
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  )
}
