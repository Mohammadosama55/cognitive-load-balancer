import { useEffect, useRef, useState } from 'react'
import api from '../services/api'

function buildHourlyForecast() {
  const now = new Date()
  const hour = now.getHours()
  const points = []
  for (let i = 0; i < 24; i++) {
    const h = (hour + i) % 24
    let base
    if (h >= 6 && h < 10)       base = 0.25 + Math.random() * 0.12
    else if (h >= 10 && h < 13) base = 0.35 + Math.random() * 0.15
    else if (h >= 13 && h < 15) base = 0.55 + Math.random() * 0.2
    else if (h >= 15 && h < 18) base = 0.40 + Math.random() * 0.15
    else if (h >= 18 && h < 22) base = 0.55 + Math.random() * 0.2
    else                         base = 0.70 + Math.random() * 0.2
    points.push({ hour: h, value: Math.min(0.99, Math.max(0.05, base)) })
  }
  return points
}

function BarChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.value), 0.01)
  const colors = data.map(d => {
    const v = d.value
    if (v > 0.7) return '#f85149'
    if (v > 0.45) return '#d29922'
    return '#3fb950'
  })

  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:160, padding:'0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{ flex:1, width:'100%', display:'flex', alignItems:'flex-end' }}>
            <div style={{
              width:'100%', borderRadius:'3px 3px 0 0',
              background: colors[i],
              height:`${(d.value / maxVal) * 100}%`,
              minHeight:3,
              opacity: 0.85,
              transition:'height 0.4s ease',
            }}/>
          </div>
          {i % 4 === 0 && (
            <span style={{ fontSize:9, color:'#8b949e', fontFamily:'monospace' }}>
              {String(d.hour).padStart(2,'0')}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function LineChart({ data }) {
  const W = 460, H = 120, PAD = 12
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.value), 0.01)
  const min = 0

  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((d.value - min) / (max - min)) * (H - PAD * 2),
    v: d.value,
  }))

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'100%' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#58a6ff" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#58a6ff" stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)"/>
      <path d={pathD} fill="none" stroke="#58a6ff" strokeWidth="2" strokeLinejoin="round"/>
      {pts.filter((_, i) => i % 4 === 0).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#58a6ff" stroke="#161b22" strokeWidth="1.5"/>
      ))}
    </svg>
  )
}

function InsightBadge({ color, title, desc }) {
  return (
    <div style={{
      borderLeft:`3px solid ${color}`, padding:'10px 14px',
      background:`rgba(0,0,0,0.2)`, borderRadius:'0 6px 6px 0',
    }}>
      <div style={{ fontSize:13, fontWeight:600, color:'#e6edf3' }}>{title}</div>
      <div style={{ fontSize:12, color:'#8b949e', marginTop:3 }}>{desc}</div>
    </div>
  )
}

function CognitiveWeather() {
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('bar')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const seed = [0.3, 0.4, 0.35, 0.45, 0.5]
        const res = await api.post('/cognitive-load/forecast', { historicalData: seed, hoursAhead: 24 })
        const raw = res.data.forecast || []
        const now = new Date()
        setForecast(raw.map((v, i) => ({ hour: (now.getHours() + i) % 24, value: v })))
      } catch {
        setForecast(buildHourlyForecast())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const peakHour = forecast.reduce((best, d) => d.value > (best?.value ?? 0) ? d : best, null)
  const lowHour  = forecast.reduce((best, d) => d.value < (best?.value ?? 1) ? d : best, null)
  const avgLoad  = forecast.length ? (forecast.reduce((s, d) => s + d.value, 0) / forecast.length) : 0

  const Card = ({ children, style }) => (
    <div style={{
      background:'#161b22', border:'1px solid #30363d', borderRadius:10,
      padding:20, ...style,
    }}>
      {children}
    </div>
  )

  const SectionTitle = ({ children }) => (
    <div style={{ fontSize:13, fontWeight:600, color:'#8b949e', textTransform:'uppercase', letterSpacing:1, marginBottom:14 }}>
      {children}
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 style={{ fontSize:20, fontWeight:700, color:'#e6edf3', margin:'0 0 4px' }}>Load Forecast</h1>
        <p style={{ fontSize:13, color:'#8b949e', margin:0 }}>24-hour cognitive load prediction based on circadian patterns</p>
      </div>

      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {[
          { label:'Avg Load Today', value:`${Math.round(avgLoad*100)}%`, color: avgLoad>0.6?'#f85149':avgLoad>0.4?'#d29922':'#3fb950' },
          { label:'Peak Hour', value: peakHour ? `${String(peakHour.hour).padStart(2,'0')}:00` : '--', color:'#f85149' },
          { label:'Peak Load', value: peakHour ? `${Math.round(peakHour.value*100)}%` : '--', color:'#f0883e' },
          { label:'Low Load Window', value: lowHour ? `${String(lowHour.hour).padStart(2,'0')}:00` : '--', color:'#3fb950' },
        ].map(m => (
          <div key={m.label} style={{
            flex:'1 1 120px', background:'#161b22', border:'1px solid #30363d',
            borderRadius:8, padding:'12px 14px',
          }}>
            <div style={{ fontSize:10, color:'#8b949e', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:m.color, fontFamily:'monospace' }}>{m.value}</div>
          </div>
        ))}
      </div>

      <Card>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <SectionTitle>24-Hour Timeline</SectionTitle>
          <div style={{ display:'flex', gap:6 }}>
            {['bar','line'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding:'4px 12px', borderRadius:5, fontSize:11, fontWeight:600,
                cursor:'pointer', transition:'all 0.15s',
                background: view===v ? '#1f6feb' : 'transparent',
                border: view===v ? '1px solid #58a6ff55' : '1px solid #30363d',
                color: view===v ? '#e6edf3' : '#8b949e',
              }}>{v === 'bar' ? 'Bar' : 'Line'}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ height:160, background:'#1c2128', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:12, color:'#8b949e', fontFamily:'monospace' }}>Loading forecast...</span>
          </div>
        ) : (
          <div style={{ height:160 }}>
            {view === 'bar' ? <BarChart data={forecast}/> : <LineChart data={forecast}/>}
          </div>
        )}

        <div style={{ display:'flex', gap:16, marginTop:12, paddingTop:12, borderTop:'1px solid #30363d' }}>
          {[
            { color:'#3fb950', label:'Low  (< 45%)' },
            { color:'#d29922', label:'Moderate (45–70%)' },
            { color:'#f85149', label:'High (> 70%)' },
          ].map(l => (
            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:10, height:10, borderRadius:2, background:l.color }}/>
              <span style={{ fontSize:11, color:'#8b949e' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card>
          <SectionTitle>Actionable Insights</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {peakHour && (
              <InsightBadge
                color="#f85149"
                title={`Peak at ${String(peakHour.hour).padStart(2,'0')}:00`}
                desc="Avoid context switches. Schedule deep work before this window."
              />
            )}
            {lowHour && (
              <InsightBadge
                color="#3fb950"
                title={`Recovery window at ${String(lowHour.hour).padStart(2,'0')}:00`}
                desc="Best time for code reviews, planning, and documentation."
              />
            )}
            <InsightBadge
              color="#d29922"
              title="Post-lunch dip expected"
              desc="13:00–15:00 typically shows elevated load. Schedule light tasks."
            />
          </div>
        </Card>

        <Card>
          <SectionTitle>Task Scheduling Guide</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { time:'Early morning', range:'06–09', icon:'{ }', label:'Complex coding, architecture', color:'#58a6ff' },
              { time:'Mid morning',   range:'09–12', icon:'⊡',   label:'Code reviews, pair programming', color:'#bc8cff' },
              { time:'Early afternoon',range:'12–14', icon:'≡',  label:'Documentation, meetings', color:'#8b949e' },
              { time:'Late afternoon',range:'15–18', icon:'✓',   label:'Testing, bug fixes', color:'#3fb950' },
              { time:'Evening',       range:'18–21', icon:'⊞',   label:'Planning, reading', color:'#d29922' },
            ].map(r => (
              <div key={r.time} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:12, fontFamily:'monospace', color:'#8b949e', width:40, flexShrink:0 }}>{r.range}</span>
                <span style={{ fontSize:13, color:r.color, width:20, textAlign:'center', flexShrink:0, fontFamily:'monospace' }}>{r.icon}</span>
                <span style={{ fontSize:12, color:'#e6edf3' }}>{r.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default CognitiveWeather
