import { useEffect, useState } from 'react'
import { fetchWords, pickDailyWords } from '../lib/sheet'

const CSV_URL = import.meta.env.VITE_SHEET_CSV_URL

export default function DailyWords() {
  const [words, setWords] = useState([])
  const [status, setStatus] = useState('loading') // loading | done | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!CSV_URL) {
      setStatus('error')
      setErrorMsg(
        'No Google Sheet connected yet. Add VITE_SHEET_CSV_URL in your .env file, then rebuild.'
      )
      return
    }
    fetchWords(CSV_URL)
      .then((all) => {
        setWords(pickDailyWords(all, 10))
        setStatus('done')
      })
      .catch((err) => {
        setErrorMsg(err.message)
        setStatus('error')
      })
  }, [])

  function speak(text) {
    if (!('speechSynthesis' in window)) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-US'
    window.speechSynthesis.speak(utter)
  }

  if (status === 'loading') return <p className="status-line">Loading today's words…</p>
  if (status === 'error') return <p className="empty-state">{errorMsg}</p>

  return (
    <div>
      <p className="section-lede">
        Today's set — same 10 words for everyone today, a fresh set tomorrow.
      </p>
      <div className="ticket-grid">
        {words.map((w, i) => (
          <article className="ticket" key={w.id + i}>
            <div className="ticket-index">{String(i + 1).padStart(2, '0')} / 10</div>
            <h3 className="ticket-word">{w.english}</h3>
            {w.tamil && <p className="ticket-tamil">{w.tamil}</p>}
            {w.exampleEn && <p className="ticket-example">“{w.exampleEn}”</p>}
            {w.exampleTa && <p className="ticket-example-ta">{w.exampleTa}</p>}
            <button className="ticket-listen" onClick={() => speak(w.english)}>
              🔊 Listen
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
