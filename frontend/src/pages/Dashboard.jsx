import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../services/api'
import CognitiveLoadCard from '../components/CognitiveLoadCard'
import TaskRecommendations from '../components/TaskRecommendations'

function Dashboard() {
  const user = useSelector(state => state.auth.user)
  const [cognitiveLoad, setCognitiveLoad] = useState(null)
  const [loading, setLoading] = useState(true)
  const [forecast, setForecast] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Mock telemetry data
        const mockMetrics = {
          typing_speed: 45,
          pause_duration: 1.5,
          eye_fixation: 0.8,
          keystroke_variance: 0.12,
          window_switches: 2,
          typing_rhythm_score: 0.85
        }

        const response = await api.post('/cognitive-load/predict', {
          metrics: mockMetrics
        })

        setCognitiveLoad(response.data)

        // Get forecast
        const forecastResponse = await api.post('/cognitive-load/forecast', {
          historicalData: [0.4, 0.5, 0.6, 0.55, 0.65],
          hoursAhead: 8
        })

        setForecast(forecastResponse.data.forecast || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}
        </h1>
        <p className="mt-2 text-gray-600">
          Monitor your cognitive load and optimize your workflow
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cognitiveLoad && (
          <CognitiveLoadCard
            load={cognitiveLoad.cognitive_load}
            level={cognitiveLoad.load_level}
            factors={cognitiveLoad.factors}
          />
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Forecast
          </h3>
          <div className="space-y-2">
            {forecast.slice(0, 4).map((hour, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {idx + new Date().getHours()}:00
                </span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${hour * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {(hour * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TaskRecommendations />
    </div>
  )
}

export default Dashboard
