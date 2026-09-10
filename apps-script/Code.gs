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
 * 3. Run the one-time setup: in the toolbar dropdown next to "Debug", select
 *    the function "setupSheet", then click Run (▶). Approve the permission
 *    prompt (it's your own script acting on your own sheet). This creates
 *    the "Words" tab with the correct headers and 3 sample rows so you can
 *    confirm the connection works end to end.
 * 4. Click Deploy -> New deployment -> type: Web app.
 *      Execute as: Me
 *      Who has access: Anyone
 * 5. Copy the Web app URL (ends in /exec) into your React app's .env as
 *      VITE_SHEETS_API_URL=<that url>
 * 6. Whenever you edit this script, make a NEW deployment version
 *    (Deploy -> Manage deployments -> pencil icon -> New version) —
 *    otherwise the live URL keeps serving the old code.
 */

const SHEET_NAME_WORDS = 'Words'
const SHEET_NAME_ATTEMPTS = 'Attempts'
const WORDS_HEADERS = ['id', 'english', 'tamil', 'example_en', 'example_ta']

/**
 * Run this once, manually, from the Apps Script editor (select it in the
 * function dropdown, click Run). Creates the "Words" tab with the right
 * headers if it doesn't exist yet, and adds 3 sample rows so you have
 * something to see immediately. Safe to run again later — it won't
 * duplicate the tab or overwrite existing rows.
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(SHEET_NAME_WORDS)

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_WORDS)
  }

  const firstRow = sheet.getRange(1, 1, 1, WORDS_HEADERS.length).getValues()[0]
  const hasHeaders = firstRow.some((cell) => String(cell).trim() !== '')

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, WORDS_HEADERS.length).setValues([WORDS_HEADERS])
    sheet.setFrozenRows(1)
    sheet.getRange(1, 1, 1, WORDS_HEADERS.length).setFontWeight('bold')

    const sampleRows = [
      ['1', 'gratitude', 'நன்றி உணர்வு', 'She wrote a letter to express her gratitude.', 'அவள் தன் நன்றியை தெரிவிக்க கடிதம் எழுதினாள்.'],
      ['2', 'ambitious', 'லட்சிய', 'He is an ambitious young engineer.', 'அவன் லட்சியமுள்ள இளம் பொறியாளர்.'],
      ['3', 'reliable', 'நம்பகமான', 'She is a reliable friend.', 'அவள் ஒரு நம்பகமான தோழி.'],
    ]
    sheet.getRange(2, 1, sampleRows.length, WORDS_HEADERS.length).setValues(sampleRows)
  }

  Logger.log('Words tab is ready with headers: ' + WORDS_HEADERS.join(', '))
}

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
