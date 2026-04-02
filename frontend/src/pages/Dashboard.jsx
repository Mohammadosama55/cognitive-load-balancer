import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../services/api'
import CognitiveLoadCard from '../components/CognitiveLoadCard'
import TaskRecommendations from '../components/TaskRecommendations'
import { useBrowserTelemetry } from '../hooks/useBrowserTelemetry'

function MetricBox({ label, value, unit, color }) {
  return (
    <div style={{
      background:'#161b22', border:'1px solid #30363d', borderRadius:8,
      padding:'12px 14px', flex:'1 1 100px',
    }}>
      <div style={{ fontSize:10, color:'#8b949e', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:'monospace', fontSize:20, fontWeight:700, color: color || '#e6edf3' }}>
        {value}<span style={{ fontSize:12, color:'#8b949e', marginLeft:3 }}>{unit}</span>
      </div>
    </div>
  )
}

function Dashboard() {
  const user = useSelector(state => state.auth.user)
  const [cognitiveLoad, setCognitiveLoad] = useState(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [measuring, setMeasuring] = useState(true)
  const [forecast, setForecast] = useState([])
  const [rawMetrics, setRawMetrics] = useState(null)

  const browserMetrics = useBrowserTelemetry()

  useEffect(() => {
    if (!browserMetrics) return
    const fetchData = async () => {
      try {
        setMeasuring(false)
        setPageLoading(true)
        setRawMetrics(browserMetrics)

        const metricsPayload = {
          typing_speed: browserMetrics.typing_speed,
          pause_duration: browserMetrics.pause_duration,
          eye_fixation: browserMetrics.eye_fixation,
          keystroke_variance: browserMetrics.keystroke_variance,
          window_switches: browserMetrics.window_switches,
          typing_rhythm_score: browserMetrics.typing_rhythm_score,
        }

        const response = await api.post('/cognitive-load/predict', { metrics: metricsPayload })
        setCognitiveLoad(response.data)

        const historicalBase = [
          browserMetrics.eye_fixation,
          1 - browserMetrics.keystroke_variance,
          browserMetrics.typing_rhythm_score,
          Math.min(1, browserMetrics.typing_speed / 80),
          Math.max(0, 1 - browserMetrics.pause_duration / 10),
        ]
        const forecastResponse = await api.post('/cognitive-load/forecast', {
          historicalData: historicalBase, hoursAhead: 8,
        })
        setForecast(forecastResponse.data.forecast || [])
      } catch (err) {
        console.error('[CognitiveLB] fetch error', err)
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [browserMetrics])

  if (measuring) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:16 }}>
        <div style={{ position:'relative', width:56, height:56 }}>
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            border:'3px solid #30363d',
          }}/>
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            border:'3px solid #58a6ff', borderTopColor:'transparent',
            animation:'spin 0.9s linear infinite',
          }}/>
        </div>
        <div style={{ fontSize:15, fontWeight:600, color:'#e6edf3' }}>Measuring cognitive state...</div>
        <div style={{ fontSize:12, color:'#8b949e', fontFamily:'monospace' }}>
          Sampling browser telemetry — ~4 sec
        </div>
      </div>
    )
  }

  if (pageLoading) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:12 }}>
        <div style={{ fontSize:13, color:'#8b949e', fontFamily:'monospace' }}>Running ML prediction...</div>
      </div>
    )
  }

  const now = new Date()

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#e6edf3', margin:0 }}>
            Hey, <span style={{ color:'#58a6ff' }}>{user?.name}</span>
          </h1>
          <p style={{ fontSize:13, color:'#8b949e', margin:'4px 0 0' }}>
            {now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
            {' · '}
            <span style={{ fontFamily:'monospace' }}>
              {now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
            </span>
          </p>
        </div>
        {rawMetrics && (
          <div style={{
            fontSize:11, fontFamily:'monospace', color:'#8b949e',
            background:'#161b22', border:'1px solid #30363d',
            borderRadius:6, padding:'4px 10px',
          }}>
            session · {rawMetrics._debug?.keyCount || 0} keys · {rawMetrics._debug?.clicks || 0} clicks
          </div>
        )}
      </div>

      {rawMetrics && (
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <MetricBox
            label="Typing Speed" unit="wpm"
            value={Math.round(rawMetrics.typing_speed || 0)}
            color="#58a6ff"
          />
          <MetricBox
            label="Keystroke Var." unit=""
            value={(rawMetrics.keystroke_variance || 0).toFixed(2)}
            color="#bc8cff"
          />
          <MetricBox
            label="Pause Duration" unit="s"
            value={(rawMetrics.pause_duration || 0).toFixed(1)}
            color="#d29922"
          />
          <MetricBox
            label="Rhythm Score" unit=""
            value={(rawMetrics.typing_rhythm_score || 0).toFixed(2)}
            color="#3fb950"
          />
          <MetricBox
            label="Win Switches" unit=""
            value={rawMetrics.window_switches || 0}
            color="#f0883e"
          />
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {cognitiveLoad && (
          <CognitiveLoadCard
            load={cognitiveLoad.cognitive_load}
            level={cognitiveLoad.load_level}
            factors={cognitiveLoad.factors}
          />
        )}

        <div style={{ background:'#161b22', border:'1px solid #30363d', borderRadius:10, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#8b949e', textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>
            8-Hour Forecast
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {forecast.slice(0, 8).map((val, idx) => {
              const hour = (now.getHours() + idx) % 24
              const pct = Math.round(val * 100)
              const barColor = pct > 70 ? '#f85149' : pct > 45 ? '#d29922' : '#3fb950'
              return (
                <div key={idx} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:11, fontFamily:'monospace', color:'#8b949e', width:38, flexShrink:0 }}>
                    {String(hour).padStart(2,'0')}:00
                  </span>
                  <div style={{ flex:1, background:'#0d1117', borderRadius:4, height:6 }}>
                    <div style={{
                      height:'100%', borderRadius:4, background:barColor,
                      width:`${pct}%`, transition:'width 0.5s ease',
                    }}/>
                  </div>
                  <span style={{ fontSize:11, fontFamily:'monospace', color:barColor, width:32, textAlign:'right', flexShrink:0 }}>
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <TaskRecommendations currentLoad={cognitiveLoad?.cognitive_load} />
    </div>
  )
}

export default Dashboard
