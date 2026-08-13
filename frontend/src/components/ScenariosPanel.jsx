import { useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine,
} from 'recharts'

const SCENARIOS = [
  {
    id: 'summer',
    icon: '🌡️',
    color: '#f97316',
    borderColor: '#7c2d12',
    title: { en: 'Summer Heatwave', ta: 'கோடை வெப்ப அலை' },
    subtitle: { en: 'AC overload detected in May', ta: 'மே மாதம் AC அதிக பயன்பாடு கண்டறியப்பட்டது' },
    description: {
      en: "It's May in Chennai — temperature hits 42°C. Every home is running AC all day. Your consumption jumps to 3× the normal level. The AI predicts your monthly bill will cross ₹1,800 (Slab 4) if this continues.",
      ta: "சென்னையில் மே மாதம் — வெப்பநிலை 42°C. ஒவ்வொரு வீட்டிலும் AC இயங்குகிறது. உங்கள் நுகர்வு வழக்கத்தை விட 3 மடங்கு அதிகமாகிறது. இது தொடர்ந்தால் மாதப் பில் ₹1,800 தாண்டும் என AI கணிக்கிறது.",
    },
    what_happened: {
      en: '⚠️ Anomaly: 3× spike at 2 PM daily (peak AC usage + peak tariff hours)',
      ta: '⚠️ அசாதாரணம்: தினமும் மதியம் 2 மணிக்கு 3× அதிர்வு (AC + peak கட்டண நேரம்)',
    },
    fix: {
      en: '✅ Fix: Pre-cool to 22°C before 5:30 PM, then set to 26°C during peak hours. Save ₹400/month.',
      ta: '✅ தீர்வு: மாலை 5:30க்கு முன் 22°C-ல் குளிர்விக்கவும், பின் 26°C-க்கு மாற்றவும். மாதம் ₹400 சேமிக்கலாம்.',
    },
    data: Array.from({ length: 24 }, (_, h) => ({
      hour: `${h}:00`,
      normal: 3 + Math.sin(h / 4) * 1.5,
      actual: h >= 10 && h <= 22 ? 9 + Math.random() * 2 : 3.5 + Math.random(),
      threshold: 6,
    })),
    badge: 'high',
    stat: { label: { en: 'Above normal', ta: 'வழக்கத்தை விட' }, value: '3×' },
  },
  {
    id: 'festival',
    icon: '🎉',
    color: '#a855f7',
    borderColor: '#4a044e',
    title: { en: 'Festival Season Surge', ta: 'திருவிழா காலம் அதிர்வு' },
    subtitle: { en: 'Pongal lighting spike — Jan 14', ta: 'பொங்கல் விளக்கு அதிர்வு — ஜன. 14' },
    description: {
      en: "Pongal celebrations! Decorative lights, extra cooking, and extended TV use push consumption to nearly 2× on Jan 14–15. This is a predictable seasonal spike — not a fault.",
      ta: "பொங்கல் கொண்டாட்டம்! அலங்கார விளக்குகள், அதிக சமையல், நீண்ட TV பயன்பாடு ஆகியவை ஜன. 14–15 இல் நுகர்வை கிட்டத்தட்ட 2× அதிகரிக்கின்றன. இது ஒரு கணிக்கக்கூடிய திருவிழா அதிர்வு — கோளாறல்ல.",
    },
    what_happened: {
      en: '📅 Predicted: AI flags Jan 14 as festival window. No maintenance needed.',
      ta: '📅 கணிக்கப்பட்டது: AI ஜன. 14-ஐ திருவிழா நேரமாக குறிக்கிறது. பராமரிப்பு தேவையில்லை.',
    },
    fix: {
      en: '✅ Tip: Switch to LED string lights. They use 90% less power than incandescent bulbs.',
      ta: '✅ குறிப்பு: LED string lights பயன்படுத்துங்கள். அவை 90% குறைவான மின்சாரம் பயன்படுத்துகின்றன.',
    },
    data: Array.from({ length: 24 }, (_, h) => ({
      hour: `${h}:00`,
      normal: 3 + Math.sin(h / 4) * 1,
      actual: h >= 17 ? (5 + Math.random() * 3) : (2.5 + Math.random()),
      threshold: 6,
    })),
    badge: 'medium',
    stat: { label: { en: 'Evening surge', ta: 'மாலை அதிர்வு' }, value: '1.8×' },
  },
  {
    id: 'fault',
    icon: '⚡',
    color: '#ef4444',
    borderColor: '#7f1d1d',
    title: { en: 'Equipment Fault Detected', ta: 'சாதன கோளாறு கண்டறியப்பட்டது' },
    subtitle: { en: 'Fridge compressor stuck ON at 3 AM', ta: 'குளிர்சாதனம் compressor இரவு 3 மணிக்கு நிற்காமல் இயங்குகிறது' },
    description: {
      en: "At 3 AM — when everyone is asleep and nothing should be running — consumption spikes to 8 kWh/h. The AI flags this as a HIGH severity anomaly. A stuck fridge compressor or faulty water heater is the likely cause.",
      ta: "இரவு 3 மணிக்கு — அனைவரும் தூங்கும்போது — நுகர்வு 8 kWh/மணி வரை அதிகரிக்கிறது. AI இதை HIGH severity அசாதாரணமாக குறிக்கிறது. குளிர்சாதன compressor அல்லது water heater கோளாறே காரணமாக இருக்கலாம்.",
    },
    what_happened: {
      en: '🚨 Alert: Nighttime spike (3 AM) with z-score > 3.5 — far outside normal range.',
      ta: '🚨 எச்சரிக்கை: இரவு அதிர்வு (3 மணி) z-score > 3.5 — வழக்கமான வரம்பை மிகவும் தாண்டியது.',
    },
    fix: {
      en: '✅ Action: Unplug fridge for 2 hours, check if spike stops. If yes, call an appliance technician.',
      ta: '✅ நடவடிக்கை: குளிர்சாதனத்தை 2 மணி நேரம் மூடி, அதிர்வு நிற்கிறதா பாருங்கள். ஆமாம் என்றால் technician-ஐ அழையுங்கள்.',
    },
    data: Array.from({ length: 24 }, (_, h) => ({
      hour: `${h}:00`,
      normal: h >= 22 || h <= 5 ? 1.5 : 4,
      actual: h === 3 || h === 4 ? 8 + Math.random() : (h >= 22 || h <= 5 ? 1.2 + Math.random() * 0.5 : 3.5 + Math.random()),
      threshold: 5,
    })),
    badge: 'high',
    stat: { label: { en: 'Nighttime z-score', ta: 'இரவு z-score' }, value: '3.5σ' },
  },
  {
    id: 'slab',
    icon: '💰',
    color: '#22c55e',
    borderColor: '#14532d',
    title: { en: 'Bill Slab Warning', ta: 'பில் அடுக்கு எச்சரிக்கை' },
    subtitle: { en: 'You\'re 15 units away from Slab 3', ta: 'நீங்கள் அடுக்கு 3-இல் இருந்து 15 யூனிட் தூரத்தில் இருக்கிறீர்கள்' },
    description: {
      en: "You've used 185 units by the 25th of the month. At your current rate, you'll hit 210 units by month-end — crossing into Slab 3 (₹3/unit) from Slab 2 (₹1.50/unit). The extra 10 units will cost ₹30 more.",
      ta: "மாதத்தின் 25-ஆம் தேதிக்கு 185 யூனிட் பயன்படுத்தியிருக்கிறீர்கள். இந்த வேகத்தில் மாத இறுதிக்கு 210 யூனிட் ஆகும் — அடுக்கு 3 (₹3/யூனிட்) தாண்டும். 10 யூனிட் அதிகத்திற்கு ₹30 கூடுதலாக செலுத்த வேண்டும்.",
    },
    what_happened: {
      en: '💡 Prediction: 5 days left in billing cycle. Reducing by 3 kWh/day keeps you in Slab 2.',
      ta: '💡 கணிப்பு: பில் சுழற்சியில் 5 நாட்கள் மீதம். தினம் 3 kWh குறைத்தால் அடுக்கு 2-ல் இருக்கலாம்.',
    },
    fix: {
      en: '✅ Easy wins: Skip the dryer (use clothesline), reduce AC by 1°C, cook 2 meals together.',
      ta: '✅ எளிய வழிகள்: dryer தவிர்க்கவும் (கயிறில் உலர்த்தவும்), AC-ஐ 1°C அதிகரிக்கவும், ஒரே நேரத்தில் 2 வேளை சமைக்கவும்.',
    },
    data: Array.from({ length: 30 }, (_, d) => ({
      day: `Day ${d + 1}`,
      cumulative: Math.min(185 + (d - 24) * 5.5, 215),
      target: 200,
    })).map((r, i) => ({ ...r, cumulative: i <= 24 ? (i + 1) * 7.4 : r.cumulative })),
    badge: 'medium',
    stat: { label: { en: 'Units used', ta: 'பயன்படுத்தியவை' }, value: '185/200' },
  },
  {
    id: 'offpeak',
    icon: '🌙',
    color: '#38bdf8',
    borderColor: '#0c4a6e',
    title: { en: 'Smart Night Shift Savings', ta: 'இரவு நேர சேமிப்பு திட்டம்' },
    subtitle: { en: 'Shifting loads saves ₹150/month', ta: 'சாதனங்களை மாற்றுவதால் மாதம் ₹150 சேமிப்பு' },
    description: {
      en: "By simply moving your washing machine, water heater, and dishwasher to run after 11 PM (off-peak), you avoid TANGEDCO's peak tariff. Over 30 days, this saves roughly 30 kWh — about ₹150 on your bill with zero lifestyle change.",
      ta: "washing machine, water heater, dishwasher ஆகியவற்றை இரவு 11 மணிக்கு பிறகு (off-peak) இயக்குவதால் TANGEDCO peak கட்டணத்தை தவிர்க்கலாம். 30 நாட்களில் சுமார் 30 kWh சேமிப்பு — வாழ்க்கை முறை மாறாமல் ₹150 பில் குறைக்கலாம்.",
    },
    what_happened: {
      en: '📊 Data: Peak-hour usage = 45 kWh/month. Off-peak equivalent = 45 kWh at lower tariff.',
      ta: '📊 தரவு: Peak நேர நுகர்வு = மாதம் 45 kWh. Off-peak-ல் அதே 45 kWh குறைந்த கட்டணத்தில்.',
    },
    fix: {
      en: '✅ Set timer on washing machine to 11 PM. Use geyser timer to heat at 5 AM (before morning peak).',
      ta: '✅ washing machine-ஐ இரவு 11 மணிக்கு timer வையுங்கள். geyser-ஐ காலை 5 மணிக்கு சூடாக்க timer வையுங்கள்.',
    },
    data: Array.from({ length: 24 }, (_, h) => ({
      hour: `${h}:00`,
      before: h >= 6 && h <= 9 ? 7 + Math.random() : h >= 18 && h <= 22 ? 8 + Math.random() : 2.5 + Math.random(),
      after: h >= 23 || h <= 5 ? 4.5 + Math.random() : h >= 6 && h <= 9 ? 2.5 + Math.random() : h >= 18 && h <= 22 ? 3 + Math.random() : 2.5 + Math.random(),
      peak_zone: (h >= 6 && h <= 9) || (h >= 18 && h <= 22) ? 10 : 0,
    })),
    badge: 'ok',
    stat: { label: { en: 'Monthly saving', ta: 'மாதச் சேமிப்பு' }, value: '₹150' },
  },
]

const BADGE_COLORS = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  ok: 'text-green-400',
  low: 'text-blue-400',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card text-xs shadow-xl" style={{ minWidth: 140 }}>
      <p className="font-medium mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {parseFloat(p.value).toFixed(1)} kWh</p>
      ))}
    </div>
  )
}

export default function ScenariosPanel({ lang }) {
  const [active, setActive] = useState(SCENARIOS[0])

  const L = lang === 'ta' ? 'ta' : 'en'

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div className="card-glow">
        <h2 className="grad-text" style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
          {L === 'ta' ? '🔬 சோதனை காட்சிகள்' : '🔬 Test Case Scenarios'}
        </h2>
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>
          {L === 'ta'
            ? 'நிஜ வாழ்க்கை சூழல்களை பாருங்கள் — AI எவ்வாறு கண்டறிந்து தீர்வு சொல்கிறது என புரிந்துகொள்ளுங்கள்.'
            : 'See real-life situations — understand how the AI detects problems and what to do about them.'}
        </p>
      </div>

      {/* Scenario selector cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {SCENARIOS.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s)}
            className={`scenario-card text-left ${active.id === s.id ? 'active' : ''}`}
          >
            <span className="text-2xl block mb-2">{s.icon}</span>
            <p className="text-xs font-semibold leading-snug" style={{ color: active.id === s.id ? 'var(--accent)' : 'var(--text)' }}>
              {s.title[L]}
            </p>
            <p className={`text-xs font-bold mt-1 ${BADGE_COLORS[s.badge]}`}>{s.stat.value}</p>
          </button>
        ))}
      </div>

      {/* Active scenario detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left: story */}
        <div className="card-glow space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{active.icon}</span>
            <div>
              <h3 className="text-lg font-bold">{active.title[L]}</h3>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{active.subtitle[L]}</p>
            </div>
            <span className={`badge-${active.badge} ml-auto`}>{active.badge.toUpperCase()}</span>
          </div>

          {/* What happened */}
          <div className="rounded-xl p-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
              {L === 'ta' ? 'என்ன நடந்தது?' : 'What Happened?'}
            </p>
            <p className="text-sm leading-relaxed">{active.description[L]}</p>
          </div>

          {/* AI detection */}
          <div className="rounded-xl p-4" style={{ background: '#0f1f3d', border: '1px solid #1e3a5f' }}>
            <p className="text-xs font-semibold text-sky-400 mb-2">
              {L === 'ta' ? '🤖 AI கண்டறிந்தது' : '🤖 AI Detection'}
            </p>
            <p className="text-sm text-sky-100">{active.what_happened[L]}</p>
          </div>

          {/* Fix */}
          <div className="rounded-xl p-4" style={{ background: '#052e16', border: '1px solid #14532d' }}>
            <p className="text-xs font-semibold text-green-400 mb-2">
              {L === 'ta' ? '💡 என்ன செய்வது?' : '💡 What To Do?'}
            </p>
            <p className="text-sm text-green-100">{active.fix[L]}</p>
          </div>

          {/* Stat pill */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg)' }}>
            <div className="pulse-dot" style={{ background: active.color, boxShadow: `0 0 8px ${active.color}` }} />
            <span className="text-sm" style={{ color: 'var(--muted)' }}>{active.stat.label[L]}</span>
            <span className="text-xl font-bold ml-auto" style={{ color: active.color }}>{active.stat.value}</span>
          </div>
        </div>

        {/* Right: chart */}
        <div className="card">
          <p className="text-sm font-semibold mb-1">
            {L === 'ta' ? '📈 மின் நுகர்வு வரைபடம்' : '📈 Consumption Chart'}
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
            {L === 'ta' ? 'இந்த காட்சியின் மின் வடிவம்' : 'Energy pattern for this scenario'}
          </p>

          <ResponsiveContainer width="100%" height={280}>
            {active.id === 'slab' ? (
              <AreaChart data={active.data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--muted)' }} interval={4} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} unit=" u" width={40} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={200} stroke="#f59e0b" strokeDasharray="5 3" label={{ value: 'Slab limit', fill: '#f59e0b', fontSize: 10 }} />
                <Area type="monotone" dataKey="cumulative" stroke={active.color} fill={active.color} fillOpacity={0.15} name="Usage" strokeWidth={2} dot={false} />
              </AreaChart>
            ) : active.id === 'offpeak' ? (
              <AreaChart data={active.data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'var(--muted)' }} interval={3} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} unit=" kW" width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="before" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="Before" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="after" stroke={active.color} fill={active.color} fillOpacity={0.15} name="After" strokeWidth={2} dot={false} />
              </AreaChart>
            ) : (
              <AreaChart data={active.data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'var(--muted)' }} interval={3} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} unit=" kW" width={40} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={active.data[0]?.threshold} stroke="#f59e0b" strokeDasharray="4 2"
                  label={{ value: L === 'ta' ? 'வரம்பு' : 'Threshold', fill: '#f59e0b', fontSize: 10 }} />
                <Area type="monotone" dataKey="normal" stroke="#4ade80" fill="#4ade80" fillOpacity={0.1} name={L === 'ta' ? 'வழக்கமான' : 'Normal'} strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="actual" stroke={active.color} fill={active.color} fillOpacity={0.2} name={L === 'ta' ? 'உண்மையான' : 'Actual'} strokeWidth={2.5} dot={false} />
              </AreaChart>
            )}
          </ResponsiveContainer>

          <div className="flex gap-4 mt-3 text-xs" style={{ color: 'var(--muted)' }}>
            {active.id === 'offpeak' ? (
              <>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block" /> {L === 'ta' ? 'முன்பு' : 'Before'}</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-sky-400 inline-block" /> {L === 'ta' ? 'பிறகு' : 'After'}</span>
              </>
            ) : active.id === 'slab' ? (
              <>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: active.color }} /> {L === 'ta' ? 'திரட்டல்' : 'Cumulative'}</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-400 inline-block" style={{ borderTop: '2px dashed #f59e0b', display: 'inline-block', marginTop: 4 }} /> {L === 'ta' ? 'வரம்பு' : 'Slab limit'}</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-400 inline-block" /> {L === 'ta' ? 'வழக்கம்' : 'Normal'}</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: active.color }} /> {L === 'ta' ? 'உண்மை' : 'Actual'}</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-400 inline-block" style={{ borderTop: '2px dashed #f59e0b', display: 'inline-block', marginTop: 4 }} /> {L === 'ta' ? 'வரம்பு' : 'Threshold'}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
