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

export default function EnergyChart({ energy, anomalies, lang }) {
  const [days, setDays] = useState(7)

  const anomalyMap = useMemo(() => {
    const m = {}
    anomalies.forEach(a => { m[a.timestamp] = a })
    return m
  }, [anomalies])

  const lineData = useMemo(() =>
    energy.slice(-(days * 24)).map(r => ({ ...r, label: fmt(r.timestamp) })),
    [energy, days]
  )

  const scatterData = useMemo(() =>
    lineData.filter(r => anomalyMap[r.timestamp]).map(r => ({
      ...r,
      severity: anomalyMap[r.timestamp]?.severity ?? 'low',
      explanation: anomalyMap[r.timestamp]?.explanation ?? '',
    })),
    [lineData, anomalyMap]
  )

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="card" style={{ minWidth: 160, fontSize: 12 }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.label}</p>
        <p style={{ color: '#36D1C4' }}>{d.consumption_kwh} kWh</p>
        <p style={{ color: 'var(--muted)' }}>{d.temperature_c}°C</p>
        {d.is_peak_hour && <p style={{ color: '#FFBB33', marginTop: 4 }}>{t(lang, 'energy', 'peakHour')}</p>}
        {anomalyMap[d.timestamp] && <p style={{ color: '#FF4D4D', marginTop: 4 }}>{t(lang, 'energy', 'anomalyDetected')}</p>}
      </div>
    )
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{t(lang, 'energy', 'title')}</h2>
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>{t(lang, 'energy', 'subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`btn-ghost ${days === d ? 'active' : ''}`}
              style={{ padding: '5px 12px', fontSize: 11 }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={290}>
        <ComposedChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" data={lineData} tick={{ fontSize: 9, fill: 'var(--muted)' }} interval={Math.floor(lineData.length / 6)} />
          <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} unit=" kWh" width={55} />
          <ZAxis range={[60, 60]} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            data={lineData} type="monotone" dataKey="consumption_kwh"
            stroke="#36D1C4" strokeWidth={1.8} dot={false} name="kWh" isAnimationActive={false}
          />
          <Scatter
            data={scatterData} dataKey="consumption_kwh"
            shape={({ cx, cy, payload }) => (
              <circle cx={cx} cy={cy} r={5} fill={SEVERITY_COLOR[payload.severity] ?? '#FF4D4D'} stroke="var(--surface)" strokeWidth={1.5} />
            )}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF4D4D', display: 'inline-block' }} />
          {lang === 'ta' ? 'அசாதாரணம்' : 'Anomaly'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 12, height: 2, background: '#36D1C4', display: 'inline-block' }} />
          {lang === 'ta' ? 'நுகர்வு' : 'Consumption'}
        </span>
      </div>
    </div>
  )
}
