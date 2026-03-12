import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/slices/authSlice'

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/cognitive-weather', label: 'Cognitive Weather' },
  { path: '/task-scheduler', label: 'Task Scheduler' },
  { path: '/context-preservation', label: 'Context Preservation' },
  { path: '/profile', label: 'Profile' },
]

function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const user = useSelector(state => state.auth.user)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const currentPage = navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col p-6">
        <h1 className="text-2xl font-bold mb-8">Cognitive Load</h1>

        <nav className="space-y-2 flex-1">
          {navItems.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`block px-4 py-2 rounded transition ${
                location.pathname === path
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-800 text-gray-200'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-gray-700">
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
            <h2 className="text-lg font-semibold text-gray-900">{currentPage}</h2>
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
