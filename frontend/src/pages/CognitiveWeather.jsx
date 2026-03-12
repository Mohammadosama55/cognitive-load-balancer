function CognitiveWeather() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cognitive Weather</h1>
        <p className="mt-2 text-gray-600">
          Forecast of your cognitive load for the next 24 hours
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">24-Hour Forecast</h3>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            Chart will be rendered here
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Insights</h3>
          <div className="space-y-4">
            <div className=" border-l-4 border-yellow-500 p-4">
              <p className="font-medium">Peak Hours: 2-4 PM</p>
              <p className="text-sm text-gray-600">
                Plan complex tasks for morning hours
              </p>
            </div>
            <div className="border-l-4 border-green-500 p-4">
              <p className="font-medium">Low Load Expected: 6-8 AM</p>
              <p className="text-sm text-gray-600">
                Good time for routine tasks
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CognitiveWeather
