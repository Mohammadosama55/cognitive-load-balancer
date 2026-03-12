import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/slices/authSlice'

function Layout({ children }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(state => state.auth.user)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-8">Cognitive Load</h1>
        
        <nav className="space-y-2">
          <a href="/" className="block px-4 py-2 rounded hover:bg-gray-800 transition">
            Dashboard
          </a>
          <a href="/cognitive-weather" className="block px-4 py-2 rounded hover:bg-gray-800 transition">
            Cognitive Weather
          </a>
          <a href="/task-scheduler" className="block px-4 py-2 rounded hover:bg-gray-800 transition">
            Task Scheduler
          </a>
          <a href="/context-preservation" className="block px-4 py-2 rounded hover:bg-gray-800 transition">
            Context Preservation
          </a>
          <a href="/profile" className="block px-4 py-2 rounded hover:bg-gray-800 transition">
            Profile
          </a>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-4">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white shadow">
          <div className="px-8 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Layout
