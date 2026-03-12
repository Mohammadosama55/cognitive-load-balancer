function CognitiveLoadCard({ load, level, factors }) {
  const getLevelColor = (level) => {
    const colors = {
      'very_low': 'bg-green-100 text-green-800',
      'low': 'bg-blue-100 text-blue-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'very_high': 'bg-red-100 text-red-800'
    }
    return colors[level] || 'bg-gray-100 text-gray-800'
  }

  const getLevelLabel = (level) => {
    return level.replace('_', ' ').toUpperCase()
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Current Cognitive Load
      </h3>

      <div className="mb-6">
        <div className="flex items-end justify-between mb-2">
          <span className="text-gray-600">Load Level</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(level)}`}>
            {getLevelLabel(level)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              level === 'very_low' ? 'bg-green-500' :
              level === 'low' ? 'bg-blue-500' :
              level === 'medium' ? 'bg-yellow-500' :
              level === 'high' ? 'bg-orange-500' :
              'bg-red-500'
            }`}
            style={{ width: `${load * 100}%` }}
          />
        </div>
      </div>

      <div className="text-3xl font-bold text-gray-900 mb-4">
        {(load * 100).toFixed(0)}%
      </div>

      {factors && factors.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Contributing Factors</p>
          <div className="space-y-1">
            {factors.map((factor, idx) => (
              <p key={idx} className="text-sm text-gray-600">
                • {factor}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full font-medium">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
          Live Flask ML prediction
        </span>
        <span className="text-xs text-gray-400">· real browser session signals</span>
      </div>
    </div>
  )
}

export default CognitiveLoadCard
