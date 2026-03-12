const mongoose = require('mongoose');

const contextPreservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Context identification
  fromTask: {
    name: String,
    type: String,
    startTime: Date
  },
  toTask: {
    name: String,
    type: String
  },
  
  // Mental checkpoint data
  checkpoint: {
    // NLP-generated summary of mental model
    mentalModelSummary: String,
    
    // Code context
    filesPreviouslyOpen: [String],
    currentMethod: String,
    focusPoint: String,
    
    // Decision context
    problem: String,
    approach: String,
    nextSteps: [String],
    
    // Key variables/concepts
    activeVariables: [String],
    conceptMap: Object
  },
  
  // Memory bridge data
  memoryBridge: {
    videoUrl: String,
    videoLength: Number, // seconds
    transcript: String,
    highlights: [String]
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  taskSwitchTime: Number, // milliseconds to re-entry
  cognitiveReCoveryTime: Number, // estimated time to restore context
  effectivenessScore: Number // user rating of how helpful the checkpoint was
}, { timestamps: true });

contextPreservationSchema.index({ user: 1, createdAt: -1 });
contextPreservationSchema.index({ user: 1, fromTask: 1 });

module.exports = mongoose.model('ContextPreservation', contextPreservationSchema);
