const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema({
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
  
  // IDE/Editor telemetry
  typingSpeed: {
    type: Number,
    description: 'Keystrokes per minute'
  },
  pauseDuration: {
    type: Number,
    description: 'Duration of pauses in seconds'
  },
  keystrokeVariance: {
    type: Number,
    description: 'Variance in keystroke timing'
  },
  mouseMovementSpeed: Number,
  windowSwitches: {
    type: Number,
    description: 'Number of context switches'
  },
  
  // Commit data
  commitFrequency: Number,
  filesChanged: Number,
  
  // Eye-gaze data (optional, privacy-preserving)
  eyeGaze: {
    fixationDuration: Number,
    blinkRate: Number,
    gazeStability: Number,
    attentionScore: Number
  },
  
  // Derived metrics
  cognitiveLoadScore: {
    type: Number,
    min: 0,
    max: 1
  },
  loadLevel: {
    type: String,
    enum: ['very_low', 'low', 'medium', 'high', 'very_high']
  },
  
  // Session info
  sessionId: String,
  ideName: String,
  projectName: String
}, { timestamps: true });

// Index for efficient querying
telemetrySchema.index({ user: 1, timestamp: -1 });
telemetrySchema.index({ user: 1, loadLevel: 1 });

module.exports = mongoose.model('Telemetry', telemetrySchema);
