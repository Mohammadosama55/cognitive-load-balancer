import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const TASK_TYPES = [
  { value: 'coding', label: 'Coding', emoji: '💻', difficulty: 'high' },
  { value: 'review', label: 'Code Review', emoji: '🔍', difficulty: 'medium' },
  { value: 'debugging', label: 'Debugging', emoji: '🐛', difficulty: 'high' },
  { value: 'testing', label: 'Testing', emoji: '✅', difficulty: 'medium' },
  { value: 'documentation', label: 'Documentation', emoji: '📝', difficulty: 'low' },
  { value: 'planning', label: 'Planning', emoji: '🗂️', difficulty: 'medium' },
  { value: 'meeting', label: 'Meeting', emoji: '🤝', difficulty: 'low' },
]

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
  critical: 'bg-red-200 text-red-900',
}

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  postponed: 'bg-yellow-100 text-yellow-700',
}

function timeLabel(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function smartSlots() {
  const now = new Date()
  const slots = []
  const offsets = [
    { label: 'Today 9 AM – Low load window', hoursFromNow: Math.max(1, 9 - now.getHours()), note: 'Peak focus, low cognitive load' },
    { label: 'Today 2 PM – Post-lunch slot', hoursFromNow: Math.max(2, 14 - now.getHours()), note: 'Good for light or creative tasks' },
    { label: 'Tomorrow 9 AM – Fresh start', hoursFromNow: Math.max(3, 24 + 9 - now.getHours()), note: 'High energy period' },
  ]
  for (const o of offsets) {
    const d = new Date(now)
    d.setHours(d.getHours() + o.hoursFromNow, 0, 0, 0)
    slots.push({ ...o, iso: d.toISOString(), display: d.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' }) })
  }
  return slots
}

const SMART_SLOTS = smartSlots()

export default function TaskScheduler() {
  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [form, setForm] = useState({
    title: '',
    taskType: 'coding',
    scheduledFor: SMART_SLOTS[0].iso,
    priority: 'medium',
    estimatedDuration: 60,
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoadingTasks(true)
      const res = await api.get('/cognitive-load/scheduled-tasks')
      setTasks(res.data.tasks || [])
    } catch (e) {
      console.error('Failed to fetch tasks', e)
    } finally {
      setLoadingTasks(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleSchedule = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await api.post('/cognitive-load/schedule-task', form)
      setSuccessMsg(`"${form.title}" scheduled successfully!`)
      setForm(f => ({ ...f, title: '', description: '' }))
      await fetchTasks()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to schedule task')
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (taskId, status) => {
    setUpdatingId(taskId)
    try {
      const res = await api.patch(`/cognitive-load/scheduled-tasks/${taskId}`, { status })
      setTasks(prev => prev.map(t => t._id === taskId ? res.data.task : t))
    } catch (e) {
      console.error('Failed to update task', e)
    } finally {
      setUpdatingId(null)
    }
  }

  const typeInfo = TASK_TYPES.find(t => t.value === form.taskType) || TASK_TYPES[0]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Task Scheduler</h1>
        <p className="mt-2 text-gray-600">
          Schedule tasks around your cognitive load forecast
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Time Slots */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Smart Recommendations</h3>
          <p className="text-sm text-gray-500 mb-4">Optimal windows based on your cognitive load pattern</p>
          <div className="space-y-3">
            {SMART_SLOTS.map((slot, idx) => (
              <button
                key={idx}
                onClick={() => setForm(f => ({ ...f, scheduledFor: slot.iso }))}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition text-left ${
                  form.scheduledFor === slot.iso
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900">{slot.display}</p>
                  <p className="text-sm text-gray-500">{slot.note}</p>
                </div>
                {form.scheduledFor === slot.iso && (
                  <span className="text-blue-600 font-bold text-lg">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule a Task</h3>

          {successMsg && (
            <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm font-medium">
              ✓ {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSchedule} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Review PR #42"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
              <select
                value={form.taskType}
                onChange={e => setForm(f => ({ ...f, taskType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {TASK_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  value={form.estimatedDuration}
                  onChange={e => setForm(f => ({ ...f, estimatedDuration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time</label>
              <input
                type="datetime-local"
                value={form.scheduledFor.slice(0, 16)}
                onChange={e => setForm(f => ({ ...f, scheduledFor: new Date(e.target.value).toISOString() }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                rows={2}
                placeholder="Any context or notes..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 text-sm"
            >
              {submitting ? 'Scheduling...' : `Schedule ${typeInfo.emoji} ${typeInfo.label}`}
            </button>
          </form>
        </div>
      </div>

      {/* Scheduled Tasks List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Scheduled Tasks</h3>
          <button onClick={fetchTasks} className="text-sm text-blue-600 hover:underline">Refresh</button>
        </div>

        {loadingTasks ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">📅</p>
            <p>No tasks scheduled yet. Use the form above to add one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => {
              const typeEmoji = TASK_TYPES.find(t => t.value === task.taskType)?.emoji || '📋'
              return (
                <div key={task._id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl shrink-0">{typeEmoji}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 truncate">{task.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority] || ''}`}>
                          {task.priority}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status] || ''}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {timeLabel(task.scheduledFor)} · {task.estimatedDuration}min
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0 ml-4">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(task._id, 'in_progress')}
                        disabled={updatingId === task._id}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {updatingId === task._id ? '...' : 'Start'}
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => updateStatus(task._id, 'completed')}
                        disabled={updatingId === task._id}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        {updatingId === task._id ? '...' : 'Complete'}
                      </button>
                    )}
                    {task.status === 'completed' && (
                      <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg">✓ Done</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
