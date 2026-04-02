import { useEffect, useState } from 'react'
import api from '../services/api'

const TASK_OPTIONS = [
  { type:'coding',        label:'Coding',        loadThreshold:0.3,  icon:'{ }',  desc:'Deep focus work' },
  { type:'review',        label:'Code Review',   loadThreshold:0.55, icon:'⊡',    desc:'Analytical reading' },
  { type:'debugging',     label:'Debugging',     loadThreshold:0.65, icon:'⚙',    desc:'Problem solving' },
  { type:'testing',       label:'Testing',       loadThreshold:0.5,  icon:'✓',    desc:'Structured validation' },
  { type:'documentation', label:'Docs',          loadThreshold:0.8,  icon:'≡',    desc:'Low cognitive demand' },
  { type:'planning',      label:'Planning',      loadThreshold:0.7,  icon:'⊞',    desc:'Strategic thinking' },
]

const TASK_COLORS = {
  coding:        { color:'#58a6ff', bg:'rgba(88,166,255,0.08)'  },
  review:        { color:'#bc8cff', bg:'rgba(188,140,255,0.08)' },
  debugging:     { color:'#f0883e', bg:'rgba(240,136,62,0.08)'  },
  testing:       { color:'#3fb950', bg:'rgba(63,185,80,0.08)'   },
  documentation: { color:'#8b949e', bg:'rgba(139,148,158,0.08)' },
  planning:      { color:'#d29922', bg:'rgba(210,153,34,0.08)'  },
}

function TaskRecommendations({ currentLoad }) {
  const [recommendation, setRecommendation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chosen, setChosen] = useState(null)
  const [choosing, setChoosing] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const fetchRec = async () => {
      try {
        setLoading(true)
        const res = await api.post('/cognitive-load/task-recommendation', {
          currentLoad: currentLoad ?? 0.5,
          availableTasks: TASK_OPTIONS.map(t => t.type),
        })
        setRecommendation(res.data)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchRec()
  }, [currentLoad])

  const handleChoose = async (taskType) => {
    setChoosing(taskType)
    try {
      await api.post('/telemetry/record', {
        typingSpeed:0, pauseDuration:0, keystrokeVariance:0,
        windowSwitches:1, sessionId:`task-switch-${Date.now()}`, projectName:taskType,
      })
    } catch {}
    setChosen(taskType)
    const name = TASK_OPTIONS.find(t => t.type === taskType)?.label || taskType
    setSuccessMsg(`Switched to: ${name}`)
    setTimeout(() => setSuccessMsg(''), 4000)
    setChoosing(null)
  }

  const recType = recommendation?.recommended_task
  const taskList = (() => {
    const top = TASK_OPTIONS.find(t => t.type === recType)
    const rest = TASK_OPTIONS.filter(t => t.type !== recType).slice(0, 2)
    return top ? [top, ...rest] : TASK_OPTIONS.slice(0, 3)
  })()

  return (
    <div style={{ background:'#161b22', border:'1px solid #30363d', borderRadius:10, padding:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'#8b949e', textTransform:'uppercase', letterSpacing:1 }}>
            Recommended Tasks
          </div>
          {recommendation?.reason && (
            <div style={{ fontSize:12, color:'#8b949e', marginTop:4 }}>{recommendation.reason}</div>
          )}
        </div>
        {successMsg && (
          <div style={{
            fontSize:12, color:'#3fb950', background:'rgba(63,185,80,0.1)',
            border:'1px solid rgba(63,185,80,0.3)', borderRadius:6, padding:'4px 10px',
          }}>
            ✓ {successMsg}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height:56, borderRadius:8, background:'#1c2128', animation:'pulse 1.5s infinite' }}/>
          ))}
        </div>
      ) : (
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {taskList.map((task, idx) => {
            const isRec = task.type === recType
            const isChosen = chosen === task.type
            const isChoosing = choosing === task.type
            const colors = TASK_COLORS[task.type] || { color:'#8b949e', bg:'rgba(139,148,158,0.08)' }

            return (
              <div key={task.type} style={{
                flex:'1 1 200px', padding:'14px 16px',
                background: isChosen ? 'rgba(63,185,80,0.08)' : colors.bg,
                border: `1px solid ${isChosen ? '#3fb950' : isRec && idx===0 ? colors.color : '#30363d'}`,
                borderRadius:8, display:'flex', flexDirection:'column', gap:10,
                position:'relative',
              }}>
                {isRec && idx === 0 && !isChosen && (
                  <div style={{
                    position:'absolute', top:-1, right:10,
                    fontSize:10, color: colors.color, background:'#0d1117',
                    padding:'1px 8px', borderRadius:'0 0 6px 6px',
                    border:`1px solid ${colors.color}`, borderTop:'none',
                    fontFamily:'monospace', letterSpacing:0.5,
                  }}>
                    BEST MATCH
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{
                    fontSize:18, fontFamily:'monospace', color:colors.color,
                    width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center',
                    background:'rgba(0,0,0,0.2)', borderRadius:6,
                  }}>
                    {task.icon}
                  </span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#e6edf3' }}>{task.label}</div>
                    <div style={{ fontSize:11, color:'#8b949e' }}>{task.desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleChoose(task.type)}
                  disabled={!!isChoosing || !!chosen}
                  style={{
                    padding:'6px 12px', borderRadius:6, fontSize:12, fontWeight:600,
                    cursor: chosen ? 'default' : 'pointer',
                    border: isChosen ? '1px solid #3fb950' : `1px solid ${colors.color}55`,
                    background: isChosen ? 'rgba(63,185,80,0.15)' : 'transparent',
                    color: isChosen ? '#3fb950' : chosen ? '#484f58' : colors.color,
                    transition:'all 0.15s',
                  }}
                >
                  {isChoosing ? '...' : isChosen ? '✓ Chosen' : 'Switch →'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {chosen && (
        <button onClick={() => { setChosen(null); setSuccessMsg('') }}
          style={{ marginTop:14, fontSize:12, color:'#58a6ff', background:'none', border:'none', cursor:'pointer', padding:0 }}>
          ← Pick a different task
        </button>
      )}
    </div>
  )
}

export default TaskRecommendations
