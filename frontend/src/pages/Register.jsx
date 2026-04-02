import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import api from '../services/api'
import { setAuth } from '../store/slices/authSlice'

function Register() {
  const [formData, setFormData] = useState({ name:'', email:'', password:'', passwordConfirm:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleChange = e => setFormData(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/register', formData)
      dispatch(setAuth({ user: res.data.user, token: res.data.token }))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#0d1117', display:'flex',
      alignItems:'center', justifyContent:'center', padding:24,
    }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            width:56, height:56, borderRadius:14, margin:'0 auto 16px',
            background:'linear-gradient(135deg,#58a6ff 0%,#3fb950 100%)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:28,
          }}>🧠</div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#e6edf3', margin:'0 0 6px' }}>CognitiveLB</h1>
          <p style={{ fontSize:13, color:'#8b949e', margin:0 }}>Create your developer account</p>
        </div>

        <div style={{
          background:'#161b22', border:'1px solid #30363d', borderRadius:10, padding:24,
        }}>
          <div style={{ fontSize:11, fontFamily:'monospace', color:'#8b949e', marginBottom:20 }}>
            <span style={{ color:'#3fb950' }}>$ </span>register --role developer
          </div>

          {error && (
            <div style={{
              background:'rgba(248,81,73,0.1)', border:'1px solid rgba(248,81,73,0.4)',
              borderRadius:6, padding:'10px 14px', marginBottom:16,
              fontSize:13, color:'#f85149',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { name:'name', label:'name', type:'text', placeholder:'Jane Smith' },
              { name:'email', label:'email', type:'email', placeholder:'dev@company.com' },
              { name:'password', label:'password', type:'password', placeholder:'min 6 chars' },
              { name:'passwordConfirm', label:'confirm password', type:'password', placeholder:'repeat password' },
            ].map(f => (
              <div key={f.name}>
                <label style={{ fontSize:12, color:'#8b949e', display:'block', marginBottom:6, fontFamily:'monospace' }}>
                  {f.label}
                </label>
                <input
                  type={f.type} name={f.name} placeholder={f.placeholder}
                  value={formData[f.name]} onChange={handleChange} required
                />
              </div>
            ))}

            <button type="submit" disabled={loading} style={{
              marginTop:8, padding:'10px 16px', borderRadius:6,
              background: loading ? '#21262d' : '#238636',
              border:'1px solid rgba(63,185,80,0.3)',
              color: loading ? '#8b949e' : '#e6edf3',
              fontSize:14, fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer',
              transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}>
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>

          <p style={{ marginTop:20, textAlign:'center', fontSize:13, color:'#8b949e' }}>
            Have an account?{' '}
            <Link to="/login" style={{ color:'#58a6ff', textDecoration:'none', fontWeight:500 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
