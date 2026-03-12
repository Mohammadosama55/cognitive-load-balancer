import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CognitiveWeather from './pages/CognitiveWeather'
import TaskScheduler from './pages/TaskScheduler'
import ContextPreservation from './pages/ContextPreservation'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import { useSelector } from 'react-redux'

function App() {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated)

  return (
    <>
      {isAuthenticated ? (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cognitive-weather" element={<CognitiveWeather />} />
            <Route path="/task-scheduler" element={<TaskScheduler />} />
            <Route path="/context-preservation" element={<ContextPreservation />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Layout>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Login />} />
        </Routes>
      )}
    </>
  )
}

export default App
