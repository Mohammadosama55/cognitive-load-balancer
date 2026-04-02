import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/slices/authSlice'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '▦' },
  { path: '/cognitive-weather', label: 'Load Forecast', icon: '◉' },
  { path: '/task-scheduler', label: 'Task Scheduler', icon: '◷' },
  { path: '/context-preservation', label: 'Checkpoints', icon: '⊕' },
  { path: '/profile', label: 'Profile', icon: '◎' },
]

const S = {
  root: { display:'flex', height:'100vh', background:'#0d1117' },
  aside: {
    width: 220, background:'#161b22', borderRight:'1px solid #30363d',
    display:'flex', flexDirection:'column', flexShrink:0,
  },
  logo: { padding:'18px 16px 14px', borderBottom:'1px solid #30363d', display:'flex', alignItems:'center', gap:10 },
  logoIcon: {
    width:32, height:32, borderRadius:8, fontSize:18,
    background:'linear-gradient(135deg,#58a6ff 0%,#3fb950 100%)',
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  logoTitle: { fontSize:13, fontWeight:700, color:'#e6edf3', lineHeight:1.2 },
  logoLive: { fontSize:10, color:'#3fb950', fontFamily:'monospace', marginTop:2 },
  nav: { flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:2 },
  footer: { padding:'10px 8px', borderTop:'1px solid #30363d' },
  userCard: {
    padding:'8px 10px', borderRadius:6, background:'#1c2128',
    border:'1px solid #30363d', marginBottom:8,
  },
  userName: { fontSize:12, color:'#e6edf3', fontWeight:500 },
  userEmail: { fontSize:11, color:'#8b949e', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  header: {
    padding:'11px 24px', borderBottom:'1px solid #30363d', background:'#161b22',
    display:'flex', alignItems:'center', gap:8,
  },
  main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  content: { flex:1, overflowY:'auto', padding:24 },
}

function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const user = useSelector(state => state.auth.user)

  const handleLogout = () => { dispatch(logout()); navigate('/login') }
  const current = navItems.find(n => n.path === location.pathname) || navItems[0]

  return (
    <div style={S.root}>
      <aside style={S.aside}>
        <div style={S.logo}>
          <div style={S.logoIcon}>🧠</div>
          <div>
            <div style={S.logoTitle}>CognitiveLB</div>
            <div style={S.logoLive}>● LIVE</div>
          </div>
        </div>

        <nav style={S.nav}>
          {navItems.map(({ path, label, icon }) => {
            const active = location.pathname === path
            return (
              <Link key={path} to={path} style={{
                display:'flex', alignItems:'center', gap:10, padding:'7px 10px',
                borderRadius:6, textDecoration:'none', fontSize:13,
                fontWeight: active ? 600 : 400,
                color: active ? '#e6edf3' : '#8b949e',
                background: active ? 'rgba(31,111,235,0.15)' : 'transparent',
                borderLeft: active ? '2px solid #58a6ff' : '2px solid transparent',
                transition:'all 0.15s',
              }}>
                <span style={{ color: active ? '#58a6ff' : '#6e7681', fontSize:14 }}>{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        <div style={S.footer}>
          <div style={S.userCard}>
            <div style={S.userName}>{user?.name}</div>
            <div style={S.userEmail}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} style={{
            width:'100%', padding:'6px 10px', background:'transparent',
            border:'1px solid rgba(248,81,73,0.35)', borderRadius:6,
            color:'#f85149', fontSize:12, cursor:'pointer', transition:'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(248,81,73,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
          >Sign out</button>
        </div>
      </aside>

      <main style={S.main}>
        <div style={S.header}>
          <span style={{ color:'#58a6ff', fontSize:15 }}>{current.icon}</span>
          <span style={{ fontSize:14, fontWeight:600, color:'#e6edf3' }}>{current.label}</span>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#3fb950', display:'inline-block' }}/>
            <span style={{ fontSize:11, color:'#8b949e', fontFamily:'monospace' }}>ML engine active</span>
          </div>
        </div>
        <div style={S.content}>{children}</div>
      </main>
    </div>
  )
}

export default Layout
