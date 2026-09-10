import { useRef, useState } from 'react'
import { checkGrammar, applyBestCorrections } from '../lib/grammar'
import { logAttempt } from '../lib/sheet'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const API_URL = import.meta.env.VITE_SHEETS_API_URL

export default function SpeakCorrect() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [matches, setMatches] = useState([])
  const [corrected, setCorrected] = useState('')
  const [status, setStatus] = useState('idle') // idle | listening | checking | done | error
  const [errorMsg, setErrorMsg] = useState('')
  const recognitionRef = useRef(null)

  const supported = !!SpeechRecognition

  function startListening() {
    setTranscript('')
    setMatches([])
    setCorrected('')
    setErrorMsg('')

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript
      setTranscript(text)
      setStatus('checking')
      try {
        const found = await checkGrammar(text)
        const fixed = applyBestCorrections(text, found)
        setMatches(found)
        setCorrected(fixed)
        setStatus('done')
        logAttempt(API_URL, {
          spoken: text,
          corrected: fixed,
          notes: found.map((m) => m.shortMessage || m.ruleCategory || 'Tip').join('; '),
        })
      } catch (err) {
        setErrorMsg(err.message)
        setStatus('error')
      }
    }

    recognition.onerror = () => {
      setErrorMsg('Could not hear you clearly — check your microphone and try again.')
      setStatus('error')
      setListening(false)
    }

    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
    setStatus('listening')
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  function playCorrected() {
    if (!corrected || !('speechSynthesis' in window)) return
    const utter = new SpeechSynthesisUtterance(corrected)
    utter.lang = 'en-US'
    window.speechSynthesis.speak(utter)
  }

  if (!supported) {
    return (
      <p className="empty-state">
        Voice correction needs a browser with speech recognition — try the latest Chrome or Edge,
        on desktop or Android.
      </p>
    )
  }

  return (
    <div className="speak-panel">
      <p className="section-lede">Speak one sentence in English. We'll listen and mark it up.</p>

      <div className="mic-stage">
        <button
          className={`mic-button ${listening ? 'is-listening' : ''}`}
          onClick={listening ? stopListening : startListening}
          aria-pressed={listening}
        >
          <span className="mic-dot" aria-hidden="true" />
          {listening ? 'Listening… tap to stop' : 'Tap and speak a sentence'}
        </button>
        {status === 'checking' && <p className="status-line">Checking your grammar…</p>}
      </div>

      {transcript && (
        <div className="result-sheet">
          <div className="result-block">
            <span className="result-label">You said</span>
            <p className="original-text">{markMistakes(transcript, matches)}</p>
          </div>

          {corrected && corrected !== transcript && (
            <div className="result-block corrected">
              <span className="result-label">Corrected</span>
              <p className="corrected-text">{corrected}</p>
              <button className="listen-button" onClick={playCorrected}>
                🔊 Hear it correctly
              </button>
            </div>
          )}

          {matches.length > 0 && (
            <div className="notes">
              <span className="result-label">Notes</span>
              <ul>
                {matches.map((m, i) => (
                  <li key={i}>
                    <strong>{m.shortMessage || m.ruleCategory || 'Tip'}:</strong> {m.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {matches.length === 0 && <p className="all-good">No mistakes found — well said!</p>}
        </div>
      )}

      {errorMsg && <p className="error-line">{errorMsg}</p>}
    </div>
  )
}

function markMistakes(text, matches) {
  if (!matches.length) return text
  const sorted = [...matches].sort((a, b) => a.offset - b.offset)
  const parts = []
  let cursor = 0
  sorted.forEach((m, i) => {
    if (m.offset > cursor) parts.push(text.slice(cursor, m.offset))
    parts.push(<mark key={i}>{text.slice(m.offset, m.offset + m.length)}</mark>)
    cursor = m.offset + m.length
  })
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}
