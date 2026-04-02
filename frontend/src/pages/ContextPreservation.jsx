import { useState } from 'react'

const CONTEXTS = [
  {
    id:1, task:'Refactoring auth middleware',
    file:'src/middleware/auth.js', line:42,
    summary:'Mid-way through extracting JWT validation. Next: update route guards in /api/users.',
    load:'HIGH', time:'14:32', tags:['backend','auth','jwt'],
    notes:'Token refresh logic is broken for expired refresh tokens. Needs edge case handling.'
  },
  {
    id:2, task:'Fix dashboard chart rendering',
    file:'frontend/src/pages/Dashboard.jsx', line:87,
    summary:'Chart.js integration started. useEffect dependency array needs cleanup.',
    load:'MODERATE', time:'11:15', tags:['frontend','react','chartjs'],
    notes:'useEffect fires twice in dev mode. Suppress with cleanup function.'
  },
]

const LOAD_COLORS = {
  LOW:      { color:'#3fb950', bg:'rgba(63,185,80,0.1)' },
  MODERATE: { color:'#d29922', bg:'rgba(210,153,34,0.1)' },
  HIGH:     { color:'#f85149', bg:'rgba(248,81,73,0.1)' },
}

function ContextPreservation() {
  const [checkpoints, setCheckpoints] = useState(CONTEXTS)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ task:'', file:'', line:'', summary:'', notes:'', load:'MODERATE', tags:'' })
  const [expanded, setExpanded] = useState(null)

  const addCheckpoint = (e) => {
    e.preventDefault()
    const now = new Date()
    setCheckpoints(prev => [{
      id: Date.now(),
      task: form.task,
      file: form.file,
      line: parseInt(form.line) || 1,
      summary: form.summary,
      load: form.load,
      time: now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: form.notes,
    }, ...prev])
    setForm({ task:'', file:'', line:'', summary:'', notes:'', load:'MODERATE', tags:'' })
    setShowForm(false)
  }

  const deleteCheckpoint = (id) => setCheckpoints(prev => prev.filter(c => c.id !== id))

  const Card = ({ children, style }) => (
    <div style={{ background:'#161b22', border:'1px solid #30363d', borderRadius:10, padding:20, ...style }}>
      {children}
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#e6edf3', margin:'0 0 4px' }}>Checkpoints</h1>
          <p style={{ fontSize:13, color:'#8b949e', margin:0 }}>
            Mental snapshots to restore context when you context-switch
          </p>
        </div>
        <button onClick={() => setShowForm(f => !f)} style={{
          padding:'8px 14px', borderRadius:6, fontSize:13, fontWeight:600,
          background: showForm ? '#21262d' : '#1f6feb',
          border:`1px solid ${showForm ? '#30363d' : '#58a6ff55'}`,
          color: showForm ? '#8b949e' : '#e6edf3',
          cursor:'pointer', transition:'all 0.15s',
        }}>
          {showForm ? '✕ Cancel' : '+ New Checkpoint'}
        </button>
      </div>

      {showForm && (
        <Card>
          <div style={{ fontSize:11, fontFamily:'monospace', color:'#3fb950', marginBottom:16 }}>
            $ checkpoint --save
          </div>
          <form onSubmit={addCheckpoint} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:12, color:'#8b949e', display:'block', marginBottom:6, fontFamily:'monospace' }}>task name *</label>
                <input placeholder="e.g. Fix auth bug" value={form.task}
                  onChange={e => setForm(f => ({...f, task:e.target.value}))} required/>
              </div>
              <div>
                <label style={{ fontSize:12, color:'#8b949e', display:'block', marginBottom:6, fontFamily:'monospace' }}>current load</label>
                <select value={form.load} onChange={e => setForm(f => ({...f, load:e.target.value}))}>
                  <option value="LOW">LOW</option>
                  <option value="MODERATE">MODERATE</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:12, color:'#8b949e', display:'block', marginBottom:6, fontFamily:'monospace' }}>file path</label>
                <input placeholder="src/components/Auth.jsx" value={form.file}
                  onChange={e => setForm(f => ({...f, file:e.target.value}))}/>
              </div>
              <div>
                <label style={{ fontSize:12, color:'#8b949e', display:'block', marginBottom:6, fontFamily:'monospace' }}>line</label>
                <input type="number" placeholder="42" value={form.line}
                  onChange={e => setForm(f => ({...f, line:e.target.value}))}/>
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, color:'#8b949e', display:'block', marginBottom:6, fontFamily:'monospace' }}>context summary *</label>
              <textarea rows={2} placeholder="What were you doing? What's next?" value={form.summary}
                onChange={e => setForm(f => ({...f, summary:e.target.value}))} required
                style={{ resize:'none' }}/>
            </div>
            <div>
              <label style={{ fontSize:12, color:'#8b949e', display:'block', marginBottom:6, fontFamily:'monospace' }}>important notes</label>
              <textarea rows={2} placeholder="Edge cases, gotchas, decisions made..." value={form.notes}
                onChange={e => setForm(f => ({...f, notes:e.target.value}))}
                style={{ resize:'none' }}/>
            </div>
            <div>
              <label style={{ fontSize:12, color:'#8b949e', display:'block', marginBottom:6, fontFamily:'monospace' }}>tags (comma separated)</label>
              <input placeholder="backend, auth, urgent" value={form.tags}
                onChange={e => setForm(f => ({...f, tags:e.target.value}))}/>
            </div>
            <button type="submit" style={{
              padding:'9px 16px', borderRadius:6, fontSize:13, fontWeight:600,
              background:'#238636', border:'1px solid rgba(63,185,80,0.3)',
              color:'#e6edf3', cursor:'pointer', transition:'background 0.15s',
            }}>
              Save Checkpoint →
            </button>
          </form>
        </Card>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {checkpoints.length === 0 ? (
          <div style={{
            gridColumn:'1/-1', textAlign:'center', padding:'48px 24px',
            background:'#161b22', border:'1px solid #30363d', borderRadius:10,
            color:'#8b949e',
          }}>
            <div style={{ fontSize:32, marginBottom:12 }}>⊕</div>
            <div style={{ fontSize:14, marginBottom:6 }}>No checkpoints yet</div>
            <div style={{ fontSize:12 }}>Create one before you switch tasks to preserve your context</div>
          </div>
        ) : checkpoints.map(cp => {
          const lc = LOAD_COLORS[cp.load] || LOAD_COLORS.MODERATE
          const isExpanded = expanded === cp.id
          return (
            <div key={cp.id} style={{
              background:'#161b22', border:'1px solid #30363d', borderRadius:10,
              padding:18, display:'flex', flexDirection:'column', gap:12,
              transition:'border-color 0.15s',
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'#e6edf3', marginBottom:4 }}>{cp.task}</div>
                  {cp.file && (
                    <div style={{
                      fontSize:11, fontFamily:'monospace', color:'#58a6ff',
                      background:'rgba(88,166,255,0.08)', borderRadius:4, padding:'2px 8px',
                      display:'inline-block', border:'1px solid rgba(88,166,255,0.2)',
                    }}>
                      {cp.file}{cp.line ? `:${cp.line}` : ''}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                  <span style={{
                    fontSize:10, fontWeight:700, letterSpacing:0.5,
                    color:lc.color, background:lc.bg, border:`1px solid ${lc.color}55`,
                    borderRadius:20, padding:'2px 8px',
                  }}>
                    {cp.load}
                  </span>
                  <span style={{ fontSize:11, fontFamily:'monospace', color:'#8b949e' }}>{cp.time}</span>
                </div>
              </div>

              <div style={{ fontSize:13, color:'#8b949e', lineHeight:1.5, borderLeft:'2px solid #30363d', paddingLeft:10 }}>
                {cp.summary}
              </div>

              {isExpanded && cp.notes && (
                <div style={{
                  background:'#0d1117', borderRadius:6, padding:'10px 12px',
                  fontSize:12, color:'#8b949e', fontFamily:'monospace',
                  border:'1px solid #30363d', whiteSpace:'pre-wrap', lineHeight:1.6,
                }}>
                  {cp.notes}
                </div>
              )}

              {cp.tags.length > 0 && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {cp.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize:10, color:'#8b949e', background:'rgba(139,148,158,0.1)',
                      border:'1px solid #30363d', borderRadius:20, padding:'2px 8px',
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display:'flex', gap:8, paddingTop:4, borderTop:'1px solid #30363d' }}>
                <button onClick={() => setExpanded(isExpanded ? null : cp.id)} style={{
                  flex:1, padding:'5px 10px', borderRadius:5, fontSize:11,
                  background:'transparent', border:'1px solid #30363d',
                  color:'#8b949e', cursor:'pointer',
                }}>
                  {isExpanded ? '▲ Less' : '▼ Notes'}
                </button>
                <button onClick={() => deleteCheckpoint(cp.id)} style={{
                  padding:'5px 10px', borderRadius:5, fontSize:11,
                  background:'transparent', border:'1px solid rgba(248,81,73,0.3)',
                  color:'#f85149', cursor:'pointer',
                }}>
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ background:'#161b22', border:'1px solid #30363d', borderRadius:10, padding:18 }}>
        <div style={{ fontSize:12, color:'#8b949e', marginBottom:14, textTransform:'uppercase', letterSpacing:1 }}>How it works</div>
        <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
          {[
            { icon:'⊕', step:'1. Capture', desc:'Before switching tasks, record your current mental state and where you left off.' },
            { icon:'⊡', step:'2. Switch', desc:'Context-switch without losing your train of thought.' },
            { icon:'◈', step:'3. Resume', desc:'Return to the checkpoint to restore context instantly.' },
          ].map(s => (
            <div key={s.step} style={{ flex:'1 1 180px', display:'flex', gap:12 }}>
              <span style={{ fontSize:22, color:'#58a6ff', flexShrink:0, fontFamily:'monospace' }}>{s.icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#e6edf3', marginBottom:3 }}>{s.step}</div>
                <div style={{ fontSize:12, color:'#8b949e', lineHeight:1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ContextPreservation
