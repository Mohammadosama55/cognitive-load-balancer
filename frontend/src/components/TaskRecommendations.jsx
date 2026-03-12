import { useEffect, useState } from 'react'
import api from '../services/api'

function TaskRecommendations() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        // Mock recommendations
        setRecommendations([
          {
            id: 1,
            title: 'Code Review',
            difficulty: 'medium',
            reason: 'Good match for your current cognitive load'
          },
          {
            id: 2,
            title: 'Documentation',
            difficulty: 'easy',
            reason: 'Light task for fatigue recovery'
          },
          {
            id: 3,
            title: 'Testing',
            difficulty: 'medium',
            reason: 'Optimal difficulty for focus state'
          }
        ])
      } catch (error) {
        console.error('Error fetching recommendations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recommended Tasks
      </h3>

      {loading ? (
        <p className="text-gray-500">Loading recommendations...</p>
      ) : (
        <div className="space-y-3">
          {recommendations.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div>
                <p className="font-medium text-gray-900">{task.title}</p>
                <p className="text-sm text-gray-600">{task.reason}</p>
              </div>
              <button className="btn btn-primary">
                Choose
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TaskRecommendations
