import Papa from 'papaparse'

/**
 * Fetches the word list from the Google Apps Script web app
 * (apps-script/Code.gs) deployed on top of your Google Sheet.
 * No API key needed — the script itself talks to the Sheet.
 * Expected columns in the sheet: id, english, tamil, example_en, example_ta
 */
export async function fetchWords(apiUrl) {
  const res = await fetch(`${apiUrl}?action=words`)
  if (!res.ok) {
    throw new Error(
      'Could not reach the Google Sheet backend. Check that VITE_SHEETS_API_URL is correct and the Apps Script is deployed as "Anyone" can access.'
    )
  }
  const payload = await res.json()
  if (!payload.ok) {
    throw new Error(payload.error || 'The Sheet backend returned an error.')
  }

  const words = (payload.words || [])
    .map((row, i) => ({
      id: (row.id || String(i)).trim(),
      english: (row.english || '').trim(),
      tamil: (row.tamil || '').trim(),
      exampleEn: (row.example_en || '').trim(),
      exampleTa: (row.example_ta || '').trim(),
    }))
    .filter((w) => w.english)

  if (words.length === 0) {
    throw new Error('The sheet loaded, but no rows had an "english" column filled in.')
  }
  return words
}

/**
 * Legacy path: fetches from a Google Sheet published to the web as CSV
 * (File > Share > Publish to web > CSV). Kept for anyone who prefers not
 * to set up Apps Script — not used by default anymore.
 */
export async function fetchWordsFromCsv(csvUrl) {
  const res = await fetch(csvUrl)
  if (!res.ok) {
    throw new Error(
      'Could not load words from the Google Sheet. Check that the sheet is published to the web as CSV.'
    )
  }
  const text = await res.text()
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true })

  const words = data
    .map((row, i) => ({
      id: (row.id || String(i)).trim(),
      english: (row.english || '').trim(),
      tamil: (row.tamil || '').trim(),
      exampleEn: (row.example_en || '').trim(),
      exampleTa: (row.example_ta || '').trim(),
    }))
    .filter((w) => w.english)

  if (words.length === 0) {
    throw new Error('The sheet loaded, but no rows had an "english" column filled in.')
  }
  return words
}

/**
 * Fire-and-forget: logs a speak-and-correct attempt back to the "Attempts"
 * tab via the Apps Script web app. Silently no-ops if apiUrl is missing,
 * and never throws — logging failures shouldn't break the UI.
 */
export async function logAttempt(apiUrl, { spoken, corrected, notes = '' } = {}) {
  if (!apiUrl) return
  try {
    await fetch(apiUrl, {
      method: 'POST',
      // text/plain avoids a CORS preflight, which Apps Script doesn't handle.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'logAttempt', spoken, corrected, notes }),
    })
  } catch {
    // Non-fatal — the app should keep working even if logging fails.
  }
}

/**
 * Deterministically picks the same `count` words for everyone on a given
 * calendar day, rotating through the full list day by day. No write-back
 * to the sheet is needed.
 */
export function pickDailyWords(words, count = 10) {
  if (words.length === 0) return []
  const dayIndex = Math.floor(Date.now() / 86400000)
  const start = (dayIndex * count) % words.length
  const picked = []
  for (let i = 0; i < Math.min(count, words.length); i++) {
    picked.push(words[(start + i) % words.length])
  }
  return picked
}
