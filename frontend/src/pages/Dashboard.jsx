import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../services/api'
import CognitiveLoadCard from '../components/CognitiveLoadCard'
import TaskRecommendations from '../components/TaskRecommendations'
import { useBrowserTelemetry } from '../hooks/useBrowserTelemetry'

function Dashboard() {
  const user = useSelector(state => state.auth.user)
  const [cognitiveLoad, setCognitiveLoad] = useState(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [measuring, setMeasuring] = useState(true)
  const [forecast, setForecast] = useState([])

  const browserMetrics = useBrowserTelemetry()

  useEffect(() => {
    if (!browserMetrics) return

    const fetchData = async () => {
      try {
        setMeasuring(false)
        setPageLoading(true)

        const metricsPayload = {
          typing_speed: browserMetrics.typing_speed,
          pause_duration: browserMetrics.pause_duration,
          eye_fixation: browserMetrics.eye_fixation,
          keystroke_variance: browserMetrics.keystroke_variance,
          window_switches: browserMetrics.window_switches,
          typing_rhythm_score: browserMetrics.typing_rhythm_score,
        }
        console.log('[CognitiveLB] Session telemetry →', metricsPayload, browserMetrics._debug)

        const response = await api.post('/cognitive-load/predict', {
          metrics: metricsPayload
        })

        setCognitiveLoad(response.data)

        const historicalBase = [
          browserMetrics.eye_fixation,
          1 - browserMetrics.keystroke_variance,
          browserMetrics.typing_rhythm_score,
          Math.min(1, browserMetrics.typing_speed / 80),
          Math.max(0, 1 - browserMetrics.pause_duration / 10),
        ]

        const forecastResponse = await api.post('/cognitive-load/forecast', {
          historicalData: historicalBase,
          hoursAhead: 8
        })

        setForecast(forecastResponse.data.forecast || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setPageLoading(false)
      }
    }

    fetchData()
  }, [browserMetrics])

  if (measuring) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-lg font-semibold text-gray-700">Measuring your cognitive state...</p>
        <p className="text-sm text-gray-400">Analysing your session activity — takes about 4 seconds</p>
      </div>
    )
  }

  if (pageLoading) {
    return <div className="text-center py-8 text-gray-500">Running ML prediction...</div>
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

      <TaskRecommendations currentLoad={cognitiveLoad?.cognitive_load} />
    </div>
  )
}

export default Dashboard
