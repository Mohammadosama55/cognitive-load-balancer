const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  title: {
    type: String,
    required: true
  },
  description: String,
  
  taskType: {
    type: String,
    enum: ['coding', 'debugging', 'review', 'testing', 'documentation', 'planning', 'meeting'],
    required: true
  },
  
  difficulty: {
    type: Number,
    min: 1,
    max: 10,
    description: 'Task difficulty rating'
  },
  
  estimatedDuration: Number, // minutes
  actualDuration: Number, // minutes
  
  // Scheduling
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'postponed'],
    default: 'pending'
  },
  scheduledFor: Date,
  startedAt: Date,
  completedAt: Date,
  
  // Cognitive load during task
  associatedCognitiveLoad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CognitiveLoad'
  },
  measuredLoad: Number,
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Tags
  tags: [String],
  project: String,
  
  // Performance metrics
  interruptions: Number,
  focusQuality: Number, // 0-1 rating
  completion: Number // percentage
}, { timestamps: true });

taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, scheduledFor: 1 });

module.exports = mongoose.model('Task', taskSchema);
