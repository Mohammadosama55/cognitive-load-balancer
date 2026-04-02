import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import api from '../services/api'
import { updateUser } from '../store/slices/authSlice'

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

function Profile() {
  const user = useSelector(state => state.auth.user)
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({ name: user?.name || '', bio:'', timezone:'UTC' })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => setFormData(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.put('/users/profile', formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 style={{ fontSize:20, fontWeight:700, color:'#e6edf3', margin:'0 0 4px' }}>Profile</h1>
        <p style={{ fontSize:13, color:'#8b949e', margin:0 }}>Manage your account and preferences</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, alignItems:'start' }}>
        <Card>
          <div style={{ fontSize:11, fontFamily:'monospace', color:'#8b949e', marginBottom:18 }}>
            <span style={{ color:'#3fb950' }}>$ </span>profile --edit
          </div>

          {saved && (
            <div style={{
              marginBottom:16, padding:'8px 12px', borderRadius:6, fontSize:12,
              background:'rgba(63,185,80,0.1)', border:'1px solid rgba(63,185,80,0.3)', color:'#3fb950',
            }}>
              ✓ Profile saved
            </div>
          )}
          {error && (
            <div style={{
              marginBottom:16, padding:'8px 12px', borderRadius:6, fontSize:12,
              background:'rgba(248,81,73,0.1)', border:'1px solid rgba(248,81,73,0.3)', color:'#f85149',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="display name">
              <input type="text" name="name" value={formData.name} onChange={handleChange}/>
            </Field>
            <Field label="bio">
              <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3}
                placeholder="Backend engineer · loves Rust · hates meetings"
                style={{ resize:'none' }}/>
            </Field>
            <Field label="timezone">
              <select name="timezone" value={formData.timezone} onChange={handleChange}>
                <option value="UTC">UTC</option>
                <option value="EST">EST (UTC-5)</option>
                <option value="CST">CST (UTC-6)</option>
                <option value="MST">MST (UTC-7)</option>
                <option value="PST">PST (UTC-8)</option>
                <option value="CET">CET (UTC+1)</option>
                <option value="IST">IST (UTC+5:30)</option>
                <option value="JST">JST (UTC+9)</option>
              </select>
            </Field>
            <button type="submit" disabled={loading} style={{
              padding:'9px 16px', borderRadius:6, fontSize:13, fontWeight:600,
              background: loading ? '#21262d' : '#238636',
              border:'1px solid rgba(63,185,80,0.3)',
              color: loading ? '#8b949e' : '#e6edf3',
              cursor: loading ? 'not-allowed' : 'pointer', transition:'all 0.15s',
            }}>
              {loading ? 'Saving...' : 'Save Profile →'}
            </button>
          </form>
        </Card>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Card>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, paddingBottom:16, borderBottom:'1px solid #30363d' }}>
              <div style={{
                width:64, height:64, borderRadius:'50%',
                background:'linear-gradient(135deg,#58a6ff,#3fb950)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:24, fontWeight:700, color:'#0d1117',
              }}>{initials}</div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:600, color:'#e6edf3' }}>{user?.name}</div>
                <div style={{ fontSize:12, color:'#8b949e', marginTop:3 }}>{user?.email}</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, paddingTop:14 }}>
              {[
                { label:'email',       value: user?.email },
                { label:'timezone',    value: formData.timezone },
                { label:'member since', value: '2024' },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                  <span style={{ fontSize:11, color:'#8b949e', fontFamily:'monospace' }}>{r.label}</span>
                  <span style={{ fontSize:12, color:'#e6edf3', maxWidth:140, textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ fontSize:12, fontWeight:600, color:'#8b949e', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>
              VS Code Extension
            </div>
            <div style={{ fontSize:12, color:'#8b949e', lineHeight:1.6, marginBottom:12 }}>
              Install the extension to track typing speed, keystroke variance, and file switches directly from your editor.
            </div>
            <div style={{
              background:'#0d1117', borderRadius:6, padding:'8px 12px',
              fontFamily:'monospace', fontSize:11, color:'#3fb950',
              border:'1px solid #30363d',
            }}>
              vsce package<br/>
              <span style={{ color:'#8b949e' }}># from vscode-extension/</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Profile
