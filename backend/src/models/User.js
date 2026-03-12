const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
    select: false,
    minlength: 8
  },
  profile: {
    avatar: String,
    bio: String,
    timezone: { type: String, default: 'UTC' },
    preferences: {
      enableWebcam: { type: Boolean, default: false },
      enableTelemetry: { type: Boolean, default: true },
      dataRetentionDays: { type: Number, default: 30 }
    }
  },
  cognitiveProfile: {
    baselineLoad: { type: Number, default: 0.5 },
    fatigueThreshold: { type: Number, default: 0.75 },
    preferredTasks: [String],
    focusDuration: { type: Number, default: 90 } // minutes
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
