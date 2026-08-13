import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import BillClock from './components/BillClock'
import EnergyChart from './components/EnergyChart'
import PredictionChart from './components/PredictionChart'
import AnomalyPanel from './components/AnomalyPanel'
import AlertsPanel from './components/AlertsPanel'
import ScenariosPanel from './components/ScenariosPanel'
import ChatBot from './components/ChatBot'
import { fetchEnergy, fetchForecast, fetchAnomalies, fetchRecommendations } from './api/client'

/* ── Outline SVG icons ── */
const Icons = {
  Overview: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  Predictions: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Anomalies: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Recommendations: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 017 7c0 2.87-1.73 5.35-4.22 6.5V17a2 2 0 01-2 2h-1.56a2 2 0 01-2-2v-1.5C6.73 14.35 5 11.87 5 9a7 7 0 017-7z"/>
      <line x1="10" y1="21" x2="14" y2="21"/>
    </svg>
  ),
  Scenarios: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
}

const NAV = [
  { key: 'Overview',        Icon: Icons.Overview },
  { key: 'Predictions',     Icon: Icons.Predictions },
  { key: 'Anomalies',       Icon: Icons.Anomalies },
  { key: 'Recommendations', Icon: Icons.Recommendations },
  { key: 'Scenarios',       Icon: Icons.Scenarios },
]

const NAV_LABELS = {
  en: { Overview: 'Overview', Predictions: 'Predictions', Anomalies: 'Anomalies', Recommendations: 'Tips', Scenarios: 'Scenarios' },
  ta: { Overview: 'கண்ணோட்டம்', Predictions: 'கணிப்பு', Anomalies: 'அசாதாரணம்', Recommendations: 'குறிப்புகள்', Scenarios: 'காட்சிகள்' },
}

export default function App() {
  const [tab, setTab]             = useState('Overview')
  const [lang, setLang]           = useState('en')
  const [energy, setEnergy]       = useState([])
  const [forecast, setForecast]   = useState(null)
  const [anomalyData, setAnomaly] = useState(null)
  const [recs, setRecs]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    Promise.all([fetchEnergy(14), fetchForecast('day'), fetchAnomalies(30), fetchRecommendations()])
      .then(([e, f, a, r]) => { setEnergy(e); setForecast(f); setAnomaly(a); setRecs(r); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#111' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
        <p className="grad-text" style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Chennai Energy AI</p>
        <p style={{ fontSize: 13, color: '#888' }}>
          {lang === 'ta' ? 'சென்னை மின் தரவு ஏற்றுகிறோம்…' : 'Loading your energy data…'}
        </p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#111', padding: 24 }}>
      <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: 36, marginBottom: 12 }}>🔌</p>
        <p style={{ color: '#FF4D4D', fontWeight: 700, marginBottom: 6 }}>Backend not reachable</p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>{error}</p>
        <code style={{ display: 'block', fontSize: 11, background: '#000', borderRadius: 14, padding: 14, textAlign: 'left', color: 'var(--accent)', fontFamily: 'monospace', lineHeight: 1.7 }}>
          cd backend<br />
          venv\Scripts\activate<br />
          python -m uvicorn main:app --port 8000
        </code>
      </div>
    </div>
  )

  const todayUsage     = energy.slice(-24).reduce((s, r) => s + r.consumption_kwh, 0).toFixed(1)
  const tomorrowUsage  = forecast?.summary?.total_predicted_kwh?.toFixed(1) ?? '—'
  const alertCount     = anomalyData?.summary?.high ?? 0
  const now            = new Date('2026-04-21')
  const anomalyCount7d = anomalyData
    ? anomalyData.anomalies.filter(a => (now - new Date(a.timestamp)) / 86400000 <= 7).length
    : 0

  return (
    <div className="app-shell">
      {/* ══ SIDEBAR ══ */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#36D1C4,#4ADE80)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
              ⚡
            </div>
            <div>
              <p className="grad-text" style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.2 }}>Chennai Energy</p>
              <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>TANGEDCO · AI Monitor</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <p style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 12px 8px', marginBottom: 2 }}>
            Navigation
          </p>

          {NAV.map(({ key, Icon }) => (
            <button key={key} onClick={() => setTab(key)} className={`nav-item ${tab === key ? 'active' : ''}`}>
              <div className="icon-circle">
                <Icon />
              </div>
              <span>{NAV_LABELS[lang][key]}</span>
              {key === 'Anomalies' && alertCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#FF4D4D', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 999, minWidth: 18, textAlign: 'center' }}>
                  {alertCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="sidebar-bottom">
          <button
            onClick={() => setLang(l => l === 'en' ? 'ta' : 'en')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 13, background: 'var(--surface2)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text)', fontSize: 12, fontWeight: 500, width: '100%', transition: 'all 0.16s', fontFamily: 'inherit' }}
          >
            <span style={{ fontSize: 14 }}>{lang === 'en' ? '🇮🇳' : '🇬🇧'}</span>
            <span>{lang === 'en' ? 'Switch to Tamil' : 'Switch to English'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 13px', borderRadius: 13, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)' }}>
            <span className="pulse-dot green" />
            <span>Live · TANGEDCO Grid</span>
          </div>
        </div>
      </aside>

      {/* ══ MAIN AREA ══ */}
      <div className="main-wrapper">
        {/* Top nav */}
        <header className="topnav">
          <div style={{ flex: '0 0 auto' }}>
            <p style={{ fontSize: 14, fontWeight: 700 }}>{NAV_LABELS[lang][tab]}</p>
          </div>

          <div className="search-wrap">
            <span className="search-icon"><Icons.Search /></span>
            <input
              className="search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'ta' ? 'அசாதாரணங்கள், பரிந்துரைகள் தேடுங்கள்…' : 'Search anomalies, recommendations…'}
            />
          </div>

          <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{todayUsage} kWh today</span>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>Apr 2026 · Chennai</span>
          </div>
        </header>

        {/* Content */}
        <main className="content-area fade-up" key={tab}>
          {tab === 'Overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <BillClock energy={energy} lang={lang} />
              <Dashboard
                todayUsage={todayUsage}
                tomorrowUsage={tomorrowUsage}
                alertCount={alertCount}
                anomalyCount7d={anomalyCount7d}
                lang={lang}
              />
              <EnergyChart energy={energy} anomalies={anomalyData?.anomalies ?? []} lang={lang} />
            </div>
          )}
          {tab === 'Predictions'     && <PredictionChart forecast={forecast} energy={energy} lang={lang} />}
          {tab === 'Anomalies'       && <AnomalyPanel anomalyData={anomalyData} energy={energy} lang={lang} />}
          {tab === 'Recommendations' && <AlertsPanel recs={recs} anomalyData={anomalyData} lang={lang} />}
          {tab === 'Scenarios'       && <ScenariosPanel lang={lang} />}
        </main>
      </div>

      <ChatBot lang={lang} />
    </div>
  )
}
