function TaskScheduler() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Task Scheduler</h1>
        <p className="mt-2 text-gray-600">
          Intelligently schedule tasks based on your cognitive load
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Smart Recommendations</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium">Code Review</p>
              <p className="text-sm text-gray-600">Recommended for 10:00 AM - Low cognitive load</p>
            </div>
            <button className="btn btn-primary">Schedule</button>
          </div>

          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div>
              <p className="font-medium">Documentation</p>
              <p className="text-sm text-gray-600">Recommended for 3:00 PM - Relaxing task</p>
            </div>
            <button className="btn btn-primary">Schedule</button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium">Complex Refactoring</p>
              <p className="text-sm text-gray-600">Recommended for 9:00 AM - High energy period</p>
            </div>
            <button className="btn btn-primary">Schedule</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskScheduler
