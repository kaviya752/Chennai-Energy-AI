import { useEffect, useState } from 'react'
import { t } from '../i18n'

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const num = parseFloat(target)
    if (isNaN(num)) { setVal(target); return }
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal((num * ease).toFixed(1))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return val
}

const StatIcons = {
  power: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 11-12.73 0"/>
      <line x1="12" y1="2" x2="12" y2="12"/>
    </svg>
  ),
  forecast: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  alert: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  anomaly: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
}

function StatCard({ Icon, label, value, sub, accent, trend, pct }) {
  const animated = useCountUp(parseFloat(value) ?? 0)
  const display  = isNaN(parseFloat(value)) ? value : animated

  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${accent}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="icon-circle" style={{ color: accent, background: `${accent}18`, borderColor: `${accent}35` }}>
          <Icon />
        </div>
        {trend && (
          <span style={{
            fontSize: 9.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, lineHeight: 1.4,
            background: trend === 'up' ? 'rgba(255,77,77,0.14)' : trend === 'down' ? 'rgba(54,209,196,0.14)' : 'rgba(255,255,255,0.05)',
            color:      trend === 'up' ? '#FF6B6B' : trend === 'down' ? '#36D1C4' : 'var(--muted)',
            border:     `1px solid ${trend === 'up' ? 'rgba(255,77,77,0.28)' : trend === 'down' ? 'rgba(54,209,196,0.28)' : 'var(--border)'}`,
          }}>
            {trend === 'up' ? '▲ High' : trend === 'down' ? '▼ Normal' : '● Stable'}
          </span>
        )}
      </div>

      <p style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 30, fontWeight: 900, color: accent, lineHeight: 1, marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
        {display}
      </p>
      <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: pct !== undefined ? 12 : 0 }}>{sub}</p>

      {pct !== undefined && (
        <>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: pct > 80 ? '#FF4D4D' : pct > 50 ? '#FFBB33' : accent }} />
          </div>
          <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{pct}% of daily budget</p>
        </>
      )}
    </div>
  )
}

export default function Dashboard({ todayUsage, tomorrowUsage, alertCount, anomalyCount7d, lang }) {
  const dailyBudget = (200 / 30) * 24
  const pct = Math.min(Math.round((parseFloat(todayUsage) / dailyBudget) * 100), 100)

  return (
    <div className="stat-grid">
      <StatCard
        Icon={StatIcons.power}
        label={t(lang, 'cards', 'todayUsage')}
        value={todayUsage}
        sub={t(lang, 'cards', 'last24h')}
        accent="#36D1C4"
        pct={pct}
        trend={parseFloat(todayUsage) > 180 ? 'up' : 'stable'}
      />
      <StatCard
        Icon={StatIcons.forecast}
        label={t(lang, 'cards', 'predictedTomorrow')}
        value={tomorrowUsage}
        sub={t(lang, 'cards', 'aiModel')}
        accent="#A78BFA"
        trend={parseFloat(tomorrowUsage) > parseFloat(todayUsage) ? 'up' : 'down'}
      />
      <StatCard
        Icon={StatIcons.alert}
        label={t(lang, 'cards', 'activeHighAlerts')}
        value={String(alertCount)}
        sub={t(lang, 'cards', 'last30d')}
        accent={alertCount > 0 ? '#FF4D4D' : '#36D1C4'}
        trend={alertCount > 0 ? 'up' : 'down'}
      />
      <StatCard
        Icon={StatIcons.anomaly}
        label={t(lang, 'cards', 'anomalies7d')}
        value={String(anomalyCount7d)}
        sub={t(lang, 'cards', 'detectedByAI')}
        accent={anomalyCount7d > 3 ? '#FFBB33' : '#36D1C4'}
        trend={anomalyCount7d > 3 ? 'up' : 'stable'}
      />
    </div>
  )
}
