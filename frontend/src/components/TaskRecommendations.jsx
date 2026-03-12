import { useEffect, useState } from 'react'
import api from '../services/api'

const TASK_OPTIONS = [
  { type: 'coding', label: 'Coding', load: 0.3, emoji: '💻' },
  { type: 'review', label: 'Code Review', load: 0.55, emoji: '🔍' },
  { type: 'documentation', label: 'Documentation', load: 0.8, emoji: '📝' },
  { type: 'debugging', label: 'Debugging', load: 0.65, emoji: '🐛' },
  { type: 'testing', label: 'Testing', load: 0.5, emoji: '✅' },
  { type: 'planning', label: 'Planning', load: 0.7, emoji: '🗂️' },
]

const DIFFICULTY_COLOR = {
  coding: 'bg-blue-50 border-blue-200',
  review: 'bg-purple-50 border-purple-200',
  documentation: 'bg-green-50 border-green-200',
  debugging: 'bg-orange-50 border-orange-200',
  testing: 'bg-yellow-50 border-yellow-200',
  planning: 'bg-gray-50 border-gray-200',
}

function TaskRecommendations({ currentLoad }) {
  const [recommendation, setRecommendation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chosen, setChosen] = useState(null)
  const [choosing, setChoosing] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        setLoading(true)
        setError('')
        const load = currentLoad ?? 0.5
        const res = await api.post('/cognitive-load/task-recommendation', {
          currentLoad: load,
          availableTasks: TASK_OPTIONS.map(t => t.type)
        })
        setRecommendation(res.data)
      } catch (err) {
        setError('Could not load recommendations')
      } finally {
        setLoading(false)
      }
    }
    fetchRecommendation()
  }, [currentLoad])

  const handleChoose = async (taskType) => {
    setChoosing(taskType)
    try {
      await api.post('/telemetry/record', {
        typingSpeed: 0,
        pauseDuration: 0,
        keystrokeVariance: 0,
        windowSwitches: 1,
        sessionId: `task-switch-${Date.now()}`,
        projectName: taskType
      })
      setChosen(taskType)
      setSuccessMsg(`Started: ${TASK_OPTIONS.find(t => t.type === taskType)?.label}`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setChosen(taskType)
      setSuccessMsg(`Switched to: ${TASK_OPTIONS.find(t => t.type === taskType)?.label}`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } finally {
      setChoosing(null)
    }
  }

  const buildTaskList = () => {
    if (!recommendation) return TASK_OPTIONS.slice(0, 3)
    const recommended = recommendation.recommended_task
    const rest = TASK_OPTIONS.filter(t => t.type !== recommended).slice(0, 2)
    const top = TASK_OPTIONS.find(t => t.type === recommended)
    return top ? [top, ...rest] : TASK_OPTIONS.slice(0, 3)
  }

  const taskList = buildTaskList()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Recommended Tasks
      </h3>
      {recommendation && (
        <p className="text-sm text-gray-500 mb-4">{recommendation.reason}</p>
      )}

      {successMsg && (
        <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm font-medium">
          ✓ {successMsg}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : (
        <div className="space-y-3">
          {taskList.map((task, idx) => {
            const isRecommended = task.type === recommendation?.recommended_task
            const isChosen = chosen === task.type
            const isChoosing = choosing === task.type

            return (
              <div
                key={task.type}
                className={`flex items-center justify-between p-4 rounded-lg border transition ${
                  isChosen
                    ? 'bg-green-50 border-green-300'
                    : DIFFICULTY_COLOR[task.type] || 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{task.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{task.label}</p>
                      {isRecommended && idx === 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Best match
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {isRecommended && idx === 0
                        ? recommendation?.reason || 'Top recommendation for your current state'
                        : idx === 1
                        ? 'Alternative option'
                        : 'Light fallback task'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleChoose(task.type)}
                  disabled={isChoosing || !!chosen}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    isChosen
                      ? 'bg-green-500 text-white cursor-default'
                      : chosen
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                  }`}
                >
                  {isChoosing ? '...' : isChosen ? '✓ Chosen' : 'Choose'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {chosen && (
        <button
          onClick={() => { setChosen(null); setSuccessMsg('') }}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Pick a different task
        </button>
      )}
    </div>
  )
}

export default TaskRecommendations
