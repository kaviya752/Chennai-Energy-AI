import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, ComposedChart, Line, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ZAxis,
} from 'recharts'
import { t } from '../i18n'

const fmt = ts => {
  const d = new Date(ts)
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:00`
}

const SEVERITY_COLOR = { high: '#FF4D4D', medium: '#FFBB33', low: '#36D1C4' }

const filterLabels = {
  en: { all: 'All', high: 'High', medium: 'Medium', low: 'Low' },
  ta: { all: 'அனைத்தும்', high: 'உயர்', medium: 'நடுத்தரம்', low: 'குறைவு' },
}

export default function AnomalyPanel({ anomalyData, energy, lang }) {
  const [filter, setFilter] = useState('all')

  const anomalies = anomalyData?.anomalies ?? []
  const summary   = anomalyData?.summary   ?? {}

  const filtered = useMemo(() =>
    filter === 'all' ? anomalies : anomalies.filter(a => a.severity === filter),
    [anomalies, filter]
  )

  const lineData = useMemo(() =>
    energy.slice(-30 * 24).map(r => ({ label: fmt(r.timestamp), consumption_kwh: r.consumption_kwh, timestamp: r.timestamp })),
    [energy]
  )

  const scatterData = useMemo(() =>
    filtered.map(a => ({ label: fmt(a.timestamp), consumption_kwh: a.consumption_kwh, timestamp: a.timestamp, severity: a.severity, z_score: a.z_score, explanation: a.explanation })),
    [filtered]
  )

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    if (!d.severity) return null
    return (
      <div className="card" style={{ fontSize: 12 }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>{fmt(d.timestamp)}</p>
        <p style={{ color: '#FF4D4D' }}>{d.consumption_kwh} kWh (z={d.z_score})</p>
        <p style={{ marginTop: 4, color: 'var(--muted)' }}>{d.explanation}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t(lang, 'anomaly', 'filter')}</span>
        {['all', 'high', 'medium', 'low'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`btn-ghost ${filter === s ? 'active' : ''}`}
            style={{ fontSize: 11, padding: '4px 11px', textTransform: 'capitalize' }}
          >
            {filterLabels[lang][s]} {s !== 'all' && `(${summary[s] ?? 0})`}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{t(lang, 'anomaly', 'title')}</h2>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>{t(lang, 'anomaly', 'subtitle')}</p>
        <ResponsiveContainer width="100%" height={270}>
          <ComposedChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" data={lineData} tick={{ fontSize: 9, fill: 'var(--muted)' }} interval={Math.floor(lineData.length / 7)} />
            <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} unit=" kWh" width={55} />
            <ZAxis range={[60, 60]} />
            <Tooltip content={<CustomTooltip />} />
            <Line data={lineData} type="monotone" dataKey="consumption_kwh" stroke="var(--border-hover)" strokeWidth={1.2} dot={false} isAnimationActive={false} />
            <Scatter data={scatterData} dataKey="consumption_kwh"
              shape={({ cx, cy, payload }) => (
                <circle cx={cx} cy={cy} r={6} fill={SEVERITY_COLOR[payload.severity] ?? '#FF4D4D'} stroke="var(--surface)" strokeWidth={1.5} />
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Event list */}
      <div className="card">
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
          {filtered.length} {t(lang, 'anomaly', 'detected')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
          {filtered.length === 0 && (
            <p style={{ fontSize: 13, textAlign: 'center', padding: '32px 0', color: 'var(--muted)' }}>
              {t(lang, 'anomaly', 'noAnomalies')}
            </p>
          )}
          {filtered.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '11px 14px', borderRadius: 16, background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <span className={`badge-${a.severity}`} style={{ flexShrink: 0, marginTop: 1 }}>{a.severity.toUpperCase()}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{fmt(a.timestamp)}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{a.explanation}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 10, color: 'var(--muted)' }}>
                  <span>{a.consumption_kwh} kWh</span>
                  <span>z={a.z_score}</span>
                  {a.is_peak_hour && <span style={{ color: '#FFBB33' }}>{t(lang, 'anomaly', 'peakHour')}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
