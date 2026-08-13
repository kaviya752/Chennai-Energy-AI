import { useState, useEffect, useMemo } from 'react'

function slabRate(units) {
  if (units <= 100) return 0
  if (units <= 200) return 1.5
  if (units <= 500) return 3
  return 5
}

function slabName(units, lang) {
  if (lang === 'ta') {
    if (units <= 100) return 'அடுக்கு 1 · இலவசம்'
    if (units <= 200) return 'அடுக்கு 2 · ₹1.50/யூனிட்'
    if (units <= 500) return 'அடுக்கு 3 · ₹3/யூனிட்'
    return 'அடுக்கு 4 · ₹5/யூனிட்'
  }
  if (units <= 100) return 'Slab 1 · Free'
  if (units <= 200) return 'Slab 2 · ₹1.50/unit'
  if (units <= 500) return 'Slab 3 · ₹3/unit'
  return 'Slab 4 · ₹5/unit'
}

export default function BillClock({ energy, lang }) {
  const { todayKwh, monthlyKwh, initialBill, ratePerSec, rate, slab } = useMemo(() => {
    if (!energy || energy.length === 0) {
      return { todayKwh: 0, monthlyKwh: 0, initialBill: 0, ratePerSec: 0.0014, rate: 3, slab: 'Slab 3 · ₹3/unit' }
    }
    const todayKwh = energy.slice(-24).reduce((s, r) => s + r.consumption_kwh, 0)
    const monthlyKwh = energy.reduce((s, r) => s + r.consumption_kwh, 0)
    const rate = slabRate(monthlyKwh)
    const initialBill = todayKwh * (rate || 1.5)
    const recentAvg = energy.slice(-4).reduce((s, r) => s + r.consumption_kwh, 0) / 4
    const ratePerSec = (recentAvg * (rate || 1.5)) / 3600
    return { todayKwh, monthlyKwh, initialBill, ratePerSec: Math.max(ratePerSec, 0.0008), rate, slab: slabName(monthlyKwh, lang) }
  }, [energy, lang])

  const [bill, setBill] = useState(initialBill)

  useEffect(() => { setBill(initialBill) }, [initialBill])

  useEffect(() => {
    const id = setInterval(() => setBill(p => p + ratePerSec), 1000)
    return () => clearInterval(id)
  }, [ratePerSec])

  const rupees = Math.floor(bill)
  const paise = Math.round((bill - rupees) * 100)

  const infoItems = [
    { label: lang === 'ta' ? 'இன்று kWh' : 'Today usage', value: `${todayKwh.toFixed(1)} kWh`, color: 'var(--text)' },
    { label: lang === 'ta' ? 'தற்போதைய கட்டணம்' : 'Rate', value: rate ? `₹${rate}/unit` : 'Free', color: 'var(--muted)' },
    { label: lang === 'ta' ? 'வினாடிக்கு' : 'Per second', value: `₹${ratePerSec.toFixed(4)}`, color: '#FF6B6B' },
    { label: lang === 'ta' ? 'கட்டண அடுக்கு' : 'Tariff slab', value: slab, color: '#FFBB33' },
  ]

  return (
    <div className="bill-clock fade-up">
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--accent)', marginBottom: 5 }}>
            ⚡ {lang === 'ta' ? 'நேரடி மின் செலவு கடிகாரம்' : 'Live Bill Clock'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            {lang === 'ta'
              ? 'TANGEDCO கட்டணம் · ஒவ்வொரு வினாடியும் புதுப்பிக்கப்படுகிறது'
              : 'TANGEDCO tariff · ticking every second · estimated cost today'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(54,209,196,0.1)', border: '1px solid rgba(54,209,196,0.22)', flexShrink: 0 }}>
          <span className="pulse-dot green" />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>LIVE</span>
        </div>
      </div>

      {/* The big ticking number */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 6 }}>
        <span style={{ fontSize: 34, fontWeight: 800, color: 'var(--accent)', lineHeight: 1, opacity: 0.8 }}>₹</span>
        <span className="bill-amount">{rupees.toLocaleString('en-IN')}</span>
        <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', lineHeight: 1, opacity: 0.65, letterSpacing: -1 }}>
          .{String(paise).padStart(2, '0')}
        </span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
        {lang === 'ta' ? 'இன்று மதிப்பிடப்பட்ட செலவு' : 'estimated spend today'}
      </p>

      {/* Info boxes */}
      <div className="bill-info-grid">
        {infoItems.map((item, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '10px 13px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 5 }}>
              {item.label}
            </p>
            <p style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
