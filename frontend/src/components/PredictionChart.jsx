import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { fetchForecast } from '../api/client'
import { t } from '../i18n'

const fmt = ts => {
  const d = new Date(ts)
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:00`
}

export default function PredictionChart({ forecast: initialForecast, energy, lang }) {
  const [horizon, setHorizon]   = useState('day')
  const [forecast, setForecast] = useState(initialForecast)
  const [loading, setLoading]   = useState(false)

  const switchHorizon = async (h) => {
    if (h === horizon) return
    setLoading(true)
    const data = await fetchForecast(h)
    setForecast(data)
    setHorizon(h)
    setLoading(false)
  }

  const actualMap = useMemo(() => {
    const m = {}
    energy.slice(-48).forEach(r => { m[r.timestamp] = r.consumption_kwh })
    return m
  }, [energy])

  const chartData = useMemo(() => {
    if (!forecast) return []
    return forecast.forecast.map(f => ({
      label: fmt(f.timestamp),
      yhat: f.yhat,
      range: [f.yhat_lower, f.yhat_upper],
      actual: actualMap[f.timestamp] ?? null,
    }))
  }, [forecast, actualMap])

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="card" style={{ minWidth: 155, fontSize: 12 }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.label}</p>
        {d.actual != null && <p style={{ color: '#36D1C4' }}>{lang === 'ta' ? 'உண்மை' : 'Actual'}: {d.actual} kWh</p>}
        <p style={{ color: '#A78BFA' }}>{lang === 'ta' ? 'கணிப்பு' : 'Forecast'}: {d.yhat} kWh</p>
      </div>
    )
  }

  const s = forecast?.summary

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{t(lang, 'predict', 'title')}</h2>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>{t(lang, 'predict', 'subtitle')}</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['day', t(lang, 'predict', 'next24h')], ['week', t(lang, 'predict', 'next7days')]].map(([h, label]) => (
              <button key={h} onClick={() => switchHorizon(h)} className={`btn-ghost ${horizon === h ? 'active' : ''}`} style={{ fontSize: 11 }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--muted)' }}>
            {t(lang, 'predict', 'computing')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={290}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--muted)' }} interval={Math.floor(chartData.length / 6)} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} unit=" kWh" width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="range" fill="#A78BFA" fillOpacity={0.12} stroke="none" name={lang === 'ta' ? 'நம்பகத்தன்மை' : 'Confidence'} isAnimationActive={false} />
              <Line type="monotone" dataKey="yhat" stroke="#A78BFA" strokeWidth={2} strokeDasharray="5 3" dot={false} name={lang === 'ta' ? 'கணிப்பு (kWh)' : 'Forecast (kWh)'} isAnimationActive={false} />
              <Line type="monotone" dataKey="actual" stroke="#36D1C4" strokeWidth={2} dot={false} name={lang === 'ta' ? 'உண்மை (kWh)' : 'Actual (kWh)'} connectNulls={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {s && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { label: t(lang, 'predict', 'totalPredicted'), value: `${s.total_predicted_kwh} kWh`, sub: `${lang === 'ta' ? 'அடுத்த' : 'Next'} ${horizon === 'day' ? (lang === 'ta' ? '24 மணி நேரம்' : '24h') : (lang === 'ta' ? '7 நாட்கள்' : '7 days')}`, color: '#A78BFA' },
            { label: t(lang, 'predict', 'peakHour'),       value: `${s.peak_hour}:00`,            sub: t(lang, 'predict', 'highestLoad'), color: '#FFBB33' },
            { label: t(lang, 'predict', 'savingWindow'),   value: s.best_saving_window,            sub: t(lang, 'predict', 'shiftLoads'), color: '#36D1C4' },
          ].map(c => (
            <div key={c.label} className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 6 }}>{c.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: c.color, marginBottom: 4 }}>{c.value}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>{c.sub}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
