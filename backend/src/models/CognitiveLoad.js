const mongoose = require('mongoose');

const cognitiveLoadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Load metrics
  loadScore: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  loadLevel: {
    type: String,
    enum: ['very_low', 'low', 'medium', 'high', 'very_high'],
    required: true
  },
  
  // Contributing factors
  factors: [String],
  
  // Component scores
  componentScores: {
    typing: Number,
    pause: Number,
    switching: Number,
    eyeGaze: Number
  },
  
  // Confidence in prediction
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  
  // Session context
  sessionId: String,
  taskType: String,
  
  // Recommendations
  recommendation: {
    action: String,
    reason: String,
    suggestedTask: String
  }
}, { timestamps: true });

cognitiveLoadSchema.index({ user: 1, timestamp: -1 });
cognitiveLoadSchema.index({ user: 1, loadLevel: 1 });

module.exports = mongoose.model('CognitiveLoad', cognitiveLoadSchema);
