const LEVEL_CONFIG = {
  very_low: { color:'#3fb950', bg:'rgba(63,185,80,0.12)', label:'VERY LOW',  bar:'#3fb950' },
  low:      { color:'#58a6ff', bg:'rgba(88,166,255,0.12)', label:'LOW',       bar:'#58a6ff' },
  medium:   { color:'#d29922', bg:'rgba(210,153,34,0.12)', label:'MODERATE',  bar:'#d29922' },
  high:     { color:'#f0883e', bg:'rgba(240,136,62,0.12)', label:'HIGH',      bar:'#f0883e' },
  very_high:{ color:'#f85149', bg:'rgba(248,81,73,0.12)', label:'CRITICAL',  bar:'#f85149' },
}

const FACTOR_KEYS = [
  { key:'typing_pattern',      label:'Typing Pattern',      icon:'⌨' },
  { key:'pause_analysis',      label:'Pause Analysis',      icon:'⏸' },
  { key:'keystroke_dynamics',  label:'Keystroke Dynamics',  icon:'◈' },
  { key:'context_switching',   label:'Context Switching',   icon:'⇄' },
]

function CognitiveLoadCard({ load, level, factors }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.medium
  const pct = Math.round((load || 0) * 100)

  const factorEntries = factors && typeof factors === 'object' && !Array.isArray(factors)
    ? FACTOR_KEYS.map(f => ({ ...f, value: factors[f.key] ?? null })).filter(f => f.value !== null)
    : []

  return (
    <div style={{
      background:'#161b22', border:'1px solid #30363d', borderRadius:10,
      padding:20, display:'flex', flexDirection:'column', gap:16,
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:13, fontWeight:600, color:'#8b949e', textTransform:'uppercase', letterSpacing:1 }}>
          Current Load
        </div>
        <div style={{
          padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
          color: cfg.color, background: cfg.bg, border:`1px solid ${cfg.color}55`,
          letterSpacing:1,
        }}>
          {cfg.label}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'flex-end', gap:12 }}>
        <div style={{ fontSize:52, fontWeight:800, color: cfg.color, lineHeight:1, fontFamily:'monospace' }}>
          {pct}
        </div>
        <div style={{ fontSize:20, color:'#8b949e', paddingBottom:6, fontFamily:'monospace' }}>%</div>
        <div style={{ marginLeft:'auto', paddingBottom:4 }}>
          <div style={{ position:'relative', width:44, height:44 }}>
            <div style={{
              position:'absolute', inset:0, borderRadius:'50%',
              background: cfg.bg, border:`2px solid ${cfg.color}`,
              opacity: pct > 75 ? 0.8 : 0.4,
            }}/>
            {pct > 75 && (
              <div style={{
                position:'absolute', inset:0, borderRadius:'50%',
                border:`2px solid ${cfg.color}`,
                animation:'pulse-ring 1.5s ease-out infinite',
              }}/>
            )}
          </div>
        </div>
      </div>

      <div style={{ background:'#0d1117', borderRadius:6, height:8, overflow:'hidden' }}>
        <div style={{
          height:'100%', borderRadius:6,
          width:`${pct}%`,
          background:`linear-gradient(90deg, ${cfg.bar}88, ${cfg.bar})`,
          transition:'width 0.8s ease',
        }}/>
      </div>

      {factorEntries.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ fontSize:11, color:'#8b949e', textTransform:'uppercase', letterSpacing:1 }}>
            Signal Breakdown
          </div>
          {factorEntries.map(f => {
            const v = typeof f.value === 'number' ? f.value : 0.5
            const barColor = v > 0.7 ? '#f85149' : v > 0.4 ? '#d29922' : '#3fb950'
            return (
              <div key={f.key} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:12, width:14, textAlign:'center', flexShrink:0 }}>{f.icon}</span>
                <span style={{ fontSize:11, color:'#8b949e', width:140, flexShrink:0 }}>{f.label}</span>
                <div style={{ flex:1, background:'#0d1117', borderRadius:4, height:5 }}>
                  <div style={{
                    height:'100%', borderRadius:4, background:barColor,
                    width:`${Math.round(v * 100)}%`, transition:'width 0.6s ease',
                  }}/>
                </div>
                <span style={{ fontSize:11, fontFamily:'monospace', color:'#8b949e', width:34, textAlign:'right', flexShrink:0 }}>
                  {Math.round(v * 100)}%
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div style={{
        paddingTop:10, borderTop:'1px solid #30363d',
        display:'flex', alignItems:'center', gap:6,
      }}>
        <span style={{ width:7, height:7, borderRadius:'50%', background:'#3fb950', display:'inline-block', flexShrink:0 }}/>
        <span style={{ fontSize:11, color:'#8b949e', fontFamily:'monospace' }}>
          ML model · live browser signals
        </span>
      </div>
    </div>
  )
}

export default CognitiveLoadCard
