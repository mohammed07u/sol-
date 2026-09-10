import Papa from 'papaparse'

/**
 * Fetches the word list from a Google Sheet that has been published to the
 * web as CSV (File > Share > Publish to web > CSV). No API key needed.
 * Expected columns: id, english, tamil, example_en, example_ta
 */
export async function fetchWords(csvUrl) {
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
