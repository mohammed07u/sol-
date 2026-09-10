import { useState } from 'react'
import DailyWords from './components/DailyWords.jsx'
import SpeakCorrect from './components/SpeakCorrect.jsx'

export default function App() {
  const [tab, setTab] = useState('words')

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-row">
          <div className="brand">
            <div className="brand-mark-wrap">
              <span className="brand-mark" aria-hidden="true">
                சொல்
              </span>
            </div>
            <div>
              <h1>Sol — Learn English</h1>
              <p className="brand-sub">தினமும் பத்து சொற்கள், பேசும்போது திருத்தம்</p>
            </div>
          </div>
          <nav className={`tabs tabs-${tab}`} role="tablist" aria-label="Sections">
            <span className="tab-indicator" aria-hidden="true" />
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
        </div>
      </header>

      <main className="app-main">{tab === 'words' ? <DailyWords /> : <SpeakCorrect />}</main>

      <footer className="app-footer">
        <p>Built for Tamil speakers learning English, one day at a time.</p>
      </footer>
    </div>
  )
}
