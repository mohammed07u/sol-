/**
 * Sends text to the free public LanguageTool API and returns a simplified
 * list of grammar/spelling issues. No API key required, but the free
 * endpoint is rate-limited — fine for personal use, not for heavy traffic.
 */
export async function checkGrammar(text) {
  const params = new URLSearchParams()
  params.append('text', text)
  params.append('language', 'en-US')

  const res = await fetch('https://api.languagetool.org/v2/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })

  if (!res.ok) {
    throw new Error('The grammar checker is unavailable right now. Try again in a moment.')
  }

  const data = await res.json()
  return (data.matches || []).map((m) => ({
    message: m.message,
    shortMessage: m.shortMessage,
    offset: m.offset,
    length: m.length,
    suggestions: (m.replacements || []).slice(0, 3).map((r) => r.value),
    ruleCategory: m.rule?.category?.name || '',
  }))
}

/** Applies the top suggestion for each match, from the end of the string
 * backwards so earlier offsets stay valid. */
export function applyBestCorrections(text, matches) {
  let corrected = text
  const sorted = [...matches].sort((a, b) => b.offset - a.offset)
  for (const m of sorted) {
    if (m.suggestions.length > 0) {
      corrected =
        corrected.slice(0, m.offset) + m.suggestions[0] + corrected.slice(m.offset + m.length)
    }
  }
  return corrected
}
