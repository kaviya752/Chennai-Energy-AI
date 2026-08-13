import { t } from '../i18n'

const PRIORITY = {
  high:   { badge: 'badge-high',   borderColor: 'rgba(255,77,77,0.25)',   icon: '🚨' },
  medium: { badge: 'badge-medium', borderColor: 'rgba(255,187,51,0.22)',  icon: '⚠️' },
  low:    { badge: 'badge-low',    borderColor: 'rgba(54,209,196,0.2)',   icon: '💡' },
}

function RecCard({ rec, lang }) {
  const s = PRIORITY[rec.priority] ?? PRIORITY.low
  return (
    <div className="card" style={{ borderLeft: `3px solid ${s.borderColor.replace('rgba', 'rgb').replace(/,[\d.]+\)/, ')')}`, display: 'flex', gap: 14, alignItems: 'flex-start', borderRadius: 18 }}>
      <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span className={s.badge}>{rec.priority.toUpperCase()}</span>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
            {rec.category}
          </span>
        </div>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 5 }}>{rec.title}</h3>
        <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--muted)' }}>{rec.description}</p>
        {rec.estimated_saving && (
          <p style={{ fontSize: 11, color: '#36D1C4', marginTop: 8, fontWeight: 600 }}>
            💰 {lang === 'ta' ? 'எதிர்பார்க்கப்படும் சேமிப்பு' : 'Est. saving'}: {rec.estimated_saving}
          </p>
        )}
      </div>
    </div>
  )
}

export default function AlertsPanel({ recs, anomalyData, lang }) {
  const recommendations = recs?.recommendations ?? []
  const recentHigh = (anomalyData?.anomalies ?? []).filter(a => a.severity === 'high').slice(-5).reverse()

  const fmtDate = ts => new Date(ts).toLocaleString(lang === 'ta' ? 'ta-IN' : 'en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Active alerts */}
      {recentHigh.length > 0 && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{t(lang, 'alerts', 'activeAlerts')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentHigh.map((a, i) => (
              <div key={i} className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderLeft: '3px solid #FF4D4D', borderRadius: 18 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span>
                <div>
                  <p style={{ fontSize: 11, color: '#FF4D4D', fontWeight: 700, marginBottom: 3 }}>{fmtDate(a.timestamp)}</p>
                  <p style={{ fontSize: 13 }}>{a.explanation}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{a.consumption_kwh} kWh · z={a.z_score}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{t(lang, 'alerts', 'aiRecommendations')}</h2>
        {recommendations.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t(lang, 'alerts', 'noRecs')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendations.map(r => <RecCard key={r.id} rec={r} lang={lang} />)}
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, textAlign: 'center', color: 'var(--muted)' }}>{t(lang, 'alerts', 'footer')}</p>
    </div>
  )
}
