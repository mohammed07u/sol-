import { useState } from 'react'
import DailyWords from './components/DailyWords.jsx'
import SpeakCorrect from './components/SpeakCorrect.jsx'

export default function App() {
  const [tab, setTab] = useState('words')

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            சொல்
          </span>
          <div>
            <h1>Sol — Learn English</h1>
            <p className="brand-sub">தினமும் பத்து சொற்கள், பேசும்போது திருத்தம்</p>
          </div>
        </div>
        <nav className="tabs" role="tablist" aria-label="Sections">
          <button
            role="tab"
            aria-selected={tab === 'words'}
            className={tab === 'words' ? 'active' : ''}
            onClick={() => setTab('words')}
          >
            Daily Words
          </button>
          <button
            role="tab"
            aria-selected={tab === 'speak'}
            className={tab === 'speak' ? 'active' : ''}
            onClick={() => setTab('speak')}
          >
            Speak &amp; Correct
          </button>
        </nav>
      </header>

      <main className="app-main">{tab === 'words' ? <DailyWords /> : <SpeakCorrect />}</main>

      <footer className="app-footer">
        <p>Built for Tamil speakers learning English, one day at a time.</p>
      </footer>
    </div>
  )
}
