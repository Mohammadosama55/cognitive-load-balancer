import { useState } from 'react'

function ContextPreservation() {
  const [checkpoints, setCheckpoints] = useState([])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Context Preservation</h1>
        <p className="mt-2 text-gray-600">
          Mental checkpoints for seamless task switching
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Your Checkpoints</h3>
          {checkpoints.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No checkpoints yet. They'll be created when you switch tasks.
            </p>
          ) : (
            <div className="space-y-4">
              {checkpoints.map((checkpoint) => (
                <div key={checkpoint.id} className="border rounded-lg p-4">
                  <h4 className="font-medium">{checkpoint.fromTask}</h4>
                  <p className="text-sm text-gray-600">{checkpoint.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">How It Works</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">📝 Capture</p>
              <p className="text-gray-600">When you switch tasks, a mental checkpoint is created</p>
            </div>
            <div>
              <p className="font-medium">🧠 Remember</p>
              <p className="text-gray-600">Your mental model and decision context are preserved</p>
            </div>
            <div>
              <p className="font-medium">📸 Bridge</p>
              <p className="text-gray-600">A 30-sec video helps you re-enter the task</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContextPreservation
