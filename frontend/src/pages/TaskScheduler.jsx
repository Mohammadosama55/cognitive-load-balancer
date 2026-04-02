import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const TASK_TYPES = [
  { value:'coding',        label:'Coding',        icon:'{ }', difficulty:'high'   },
  { value:'review',        label:'Code Review',   icon:'⊡',   difficulty:'medium' },
  { value:'debugging',     label:'Debugging',     icon:'⚙',   difficulty:'high'   },
  { value:'testing',       label:'Testing',       icon:'✓',   difficulty:'medium' },
  { value:'documentation', label:'Docs',          icon:'≡',   difficulty:'low'    },
  { value:'planning',      label:'Planning',      icon:'⊞',   difficulty:'medium' },
  { value:'meeting',       label:'Meeting',       icon:'⇄',   difficulty:'low'    },
]

const PRIORITY_STYLES = {
  low:      { color:'#3fb950', bg:'rgba(63,185,80,0.1)',   border:'rgba(63,185,80,0.3)'   },
  medium:   { color:'#d29922', bg:'rgba(210,153,34,0.1)',  border:'rgba(210,153,34,0.3)'  },
  high:     { color:'#f0883e', bg:'rgba(240,136,62,0.1)',  border:'rgba(240,136,62,0.3)'  },
  critical: { color:'#f85149', bg:'rgba(248,81,73,0.1)',   border:'rgba(248,81,73,0.3)'   },
}

const STATUS_STYLES = {
  pending:     { color:'#8b949e', bg:'rgba(139,148,158,0.1)', label:'pending'      },
  in_progress: { color:'#58a6ff', bg:'rgba(88,166,255,0.1)',  label:'in progress'  },
  completed:   { color:'#3fb950', bg:'rgba(63,185,80,0.1)',   label:'completed'    },
  postponed:   { color:'#d29922', bg:'rgba(210,153,34,0.1)',  label:'postponed'    },
}

function timeLabel(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}

function smartSlots() {
  const now = new Date()
  const offsets = [
    { label:'Peak focus window',    hoursFromNow: Math.max(1, 9 - now.getHours()),             note:'Low load · morning' },
    { label:'Post-lunch window',    hoursFromNow: Math.max(2, 14 - now.getHours()),            note:'Light tasks preferred' },
    { label:'Tomorrow morning',     hoursFromNow: Math.max(3, 24 + 9 - now.getHours()),        note:'Fresh start' },
  ]
  return offsets.map(o => {
    const d = new Date(now)
    d.setHours(d.getHours() + o.hoursFromNow, 0, 0, 0)
    return { ...o, iso: d.toISOString(), display: d.toLocaleString(undefined, { weekday:'short', hour:'2-digit', minute:'2-digit' }) }
  })
}

const SMART_SLOTS = smartSlots()

const Field = ({ label, children }) => (
  <div>
    <label style={{ fontSize:12, color:'#8b949e', display:'block', marginBottom:6, fontFamily:'monospace' }}>{label}</label>
    {children}
  </div>
)

const Card = ({ children, style }) => (
  <div style={{ background:'#161b22', border:'1px solid #30363d', borderRadius:10, padding:20, ...style }}>
    {children}
  </div>
)

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom:14 }}>
    <div style={{ fontSize:13, fontWeight:600, color:'#8b949e', textTransform:'uppercase', letterSpacing:1 }}>{children}</div>
    {sub && <div style={{ fontSize:12, color:'#484f58', marginTop:3 }}>{sub}</div>}
  </div>
)

export default function TaskScheduler() {
  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [form, setForm] = useState({
    title:'', taskType:'coding', scheduledFor: SMART_SLOTS[0].iso,
    priority:'medium', estimatedDuration:60, description:'',
  })
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoadingTasks(true)
      const res = await api.get('/cognitive-load/scheduled-tasks')
      setTasks(res.data.tasks || [])
    } catch {}
    finally { setLoadingTasks(false) }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleSchedule = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await api.post('/cognitive-load/schedule-task', form)
      setSuccessMsg(`"${form.title}" scheduled`)
      setForm(f => ({ ...f, title:'', description:'' }))
      await fetchTasks()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to schedule task')
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (taskId, status) => {
    setUpdatingId(taskId)
    try {
      const res = await api.patch(`/cognitive-load/scheduled-tasks/${taskId}`, { status })
      setTasks(prev => prev.map(t => t._id === taskId ? res.data.task : t))
    } catch {}
    finally { setUpdatingId(null) }
  }

  const typeInfo = TASK_TYPES.find(t => t.value === form.taskType) || TASK_TYPES[0]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 style={{ fontSize:20, fontWeight:700, color:'#e6edf3', margin:'0 0 4px' }}>Task Scheduler</h1>
        <p style={{ fontSize:13, color:'#8b949e', margin:0 }}>Schedule work around your cognitive load forecast</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card>
          <SectionTitle sub="Optimal windows based on load forecast">Smart Slots</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {SMART_SLOTS.map((slot, idx) => {
              const active = form.scheduledFor === slot.iso
              return (
                <button key={idx} onClick={() => setForm(f => ({...f, scheduledFor: slot.iso}))} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'12px 14px', borderRadius:7, border:`1px solid ${active ? '#58a6ff55' : '#30363d'}`,
                  background: active ? 'rgba(31,111,235,0.12)' : '#1c2128',
                  cursor:'pointer', textAlign:'left', transition:'all 0.15s',
                }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color: active ? '#58a6ff' : '#e6edf3', fontFamily:'monospace' }}>
                      {slot.display}
                    </div>
                    <div style={{ fontSize:11, color:'#8b949e', marginTop:2 }}>{slot.note}</div>
                    <div style={{ fontSize:11, color: active ? '#58a6ff' : '#484f58', marginTop:2 }}>{slot.label}</div>
                  </div>
                  {active && <span style={{ color:'#58a6ff', fontSize:16 }}>✓</span>}
                </button>
              )
            })}
          </div>
        </Card>

        <Card>
          <SectionTitle>Schedule Task</SectionTitle>

          {successMsg && (
            <div style={{
              marginBottom:14, padding:'8px 12px', borderRadius:6, fontSize:12,
              background:'rgba(63,185,80,0.1)', border:'1px solid rgba(63,185,80,0.3)', color:'#3fb950',
            }}>✓ {successMsg}</div>
          )}
          {errorMsg && (
            <div style={{
              marginBottom:14, padding:'8px 12px', borderRadius:6, fontSize:12,
              background:'rgba(248,81,73,0.1)', border:'1px solid rgba(248,81,73,0.3)', color:'#f85149',
            }}>{errorMsg}</div>
          )}

          <form onSubmit={handleSchedule} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <Field label="task name">
              <input type="text" required placeholder="e.g. Review PR #42"
                value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))}/>
            </Field>
            <Field label="task type">
              <select value={form.taskType} onChange={e => setForm(f => ({...f, taskType:e.target.value}))}>
                {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon}  {t.label}</option>)}
              </select>
            </Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label="priority">
                <select value={form.priority} onChange={e => setForm(f => ({...f, priority:e.target.value}))}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
              </Field>
              <Field label="duration (min)">
                <input type="number" min="15" max="480" value={form.estimatedDuration}
                  onChange={e => setForm(f => ({...f, estimatedDuration:parseInt(e.target.value)}))}/>
              </Field>
            </div>
            <Field label="scheduled time">
              <input type="datetime-local" value={form.scheduledFor.slice(0,16)}
                onChange={e => setForm(f => ({...f, scheduledFor: new Date(e.target.value).toISOString()}))}/>
            </Field>
            <Field label="notes (optional)">
              <textarea rows={2} placeholder="Context, blockers, dependencies..."
                value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))}
                style={{ resize:'none' }}/>
            </Field>
            <button type="submit" disabled={submitting} style={{
              padding:'9px 16px', borderRadius:6, fontSize:13, fontWeight:600,
              background: submitting ? '#21262d' : '#1f6feb',
              border:'1px solid rgba(88,166,255,0.3)',
              color: submitting ? '#8b949e' : '#e6edf3',
              cursor: submitting ? 'not-allowed' : 'pointer', transition:'all 0.15s',
            }}>
              {submitting ? 'Scheduling...' : `Schedule ${typeInfo.icon} ${typeInfo.label} →`}
            </button>
          </form>
        </Card>
      </div>

      <Card>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <SectionTitle>{`Scheduled Tasks (${tasks.length})`}</SectionTitle>
          <button onClick={fetchTasks} style={{
            fontSize:12, color:'#58a6ff', background:'none', border:'none', cursor:'pointer', padding:0,
          }}>↻ Refresh</button>
        </div>

        {loadingTasks ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height:60, borderRadius:7, background:'#1c2128' }}/>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign:'center', padding:'36px 24px', color:'#8b949e' }}>
            <div style={{ fontSize:28, marginBottom:10 }}>◷</div>
            <div style={{ fontSize:13 }}>No tasks scheduled yet — use the form above</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {tasks.map(task => {
              const typeEmoji = TASK_TYPES.find(t => t.value === task.taskType)?.icon || '⊞'
              const pStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
              const sStyle = STATUS_STYLES[task.status] || STATUS_STYLES.pending
              return (
                <div key={task._id} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'12px 14px', borderRadius:7,
                  border:'1px solid #30363d', background:'#1c2128',
                  gap:12,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
                    <span style={{ fontFamily:'monospace', color:'#58a6ff', fontSize:16, flexShrink:0 }}>{typeEmoji}</span>
                    <div style={{ minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:13, fontWeight:600, color:'#e6edf3', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {task.title}
                        </span>
                        <span style={{
                          fontSize:10, padding:'2px 8px', borderRadius:20, fontWeight:600,
                          color:pStyle.color, background:pStyle.bg, border:`1px solid ${pStyle.border}`,
                        }}>{task.priority}</span>
                        <span style={{
                          fontSize:10, padding:'2px 8px', borderRadius:20,
                          color:sStyle.color, background:sStyle.bg,
                        }}>{sStyle.label}</span>
                      </div>
                      <div style={{ fontSize:11, color:'#8b949e', fontFamily:'monospace', marginTop:3 }}>
                        {timeLabel(task.scheduledFor)} · {task.estimatedDuration}min
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    {task.status === 'pending' && (
                      <button onClick={() => updateStatus(task._id, 'in_progress')}
                        disabled={updatingId === task._id}
                        style={{
                          padding:'5px 12px', fontSize:11, fontWeight:600,
                          background:'rgba(88,166,255,0.12)', border:'1px solid rgba(88,166,255,0.3)',
                          color:'#58a6ff', borderRadius:6, cursor:'pointer',
                        }}>
                        {updatingId === task._id ? '...' : 'Start'}
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button onClick={() => updateStatus(task._id, 'completed')}
                        disabled={updatingId === task._id}
                        style={{
                          padding:'5px 12px', fontSize:11, fontWeight:600,
                          background:'rgba(63,185,80,0.12)', border:'1px solid rgba(63,185,80,0.3)',
                          color:'#3fb950', borderRadius:6, cursor:'pointer',
                        }}>
                        {updatingId === task._id ? '...' : 'Complete'}
                      </button>
                    )}
                    {task.status === 'completed' && (
                      <span style={{ fontSize:11, color:'#3fb950', padding:'5px 12px' }}>✓ Done</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
