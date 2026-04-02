const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const CognitiveLoad = require('../models/CognitiveLoad');
const Task = require('../models/Task');
const config = require('../config/constants');
const logger = require('../config/logger');
const { predict: mlPredict } = require('../predictor');

// Map any load_level string to valid MongoDB enum values
const LEVEL_MAP = { very_low:'very_low', low:'low', medium:'medium', moderate:'medium', high:'high', very_high:'very_high' };
function sanitiseLevel(level) { return LEVEL_MAP[level] || 'medium'; }

// Convert factors (object or array) to [String] for DB storage
function factorsToStrings(factors) {
  if (!factors) return [];
  if (Array.isArray(factors)) return factors.map(String);
  if (typeof factors === 'object') {
    return Object.entries(factors).map(([k, v]) => `${k}:${typeof v === 'number' ? v.toFixed(2) : v}`);
  }
  return [String(factors)];
}

// Fallback: use trained ML model for local predictions
function computeLoadLocally(metrics = {}) {
  const data = mlPredict(metrics);
  return {
    cognitive_load: data.cognitive_load,
    load_level:     data.load_level,
    confidence:     data.confidence,
    factors:        data.factors,
    recommendation: data.recommendation
  };
}

// Fallback: task recommendation based on load level
function recommendTaskLocally(currentLoad = 0.5, availableTasks = []) {
  const loadLevel = currentLoad < 0.33 ? 'low' : currentLoad < 0.66 ? 'moderate' : 'high';
  const should_switch = currentLoad >= 0.66;

  const tasksByLoad = {
    high: ['documentation', 'code_review', 'meeting'],
    moderate: ['feature_development', 'bug_fix', 'testing'],
    low: ['architecture', 'refactoring', 'deep_work']
  };

  const candidates = tasksByLoad[loadLevel];
  const recommended_task = availableTasks.find(t => candidates.includes(t)) || candidates[0];

  const reasons = {
    high: 'Your cognitive load is high. Switch to a lighter task to recover.',
    moderate: 'Your cognitive load is moderate. You can handle focused tasks.',
    low: 'Your cognitive load is low. Great time for deep, complex work.'
  };

  return {
    should_switch,
    recommended_task,
    reason: reasons[loadLevel],
    confidence: 0.7,
    load_level: loadLevel,
    current_load: currentLoad
  };
}

// Fallback: simple 8-hour forecast
function generateForecastLocally(historicalData = []) {
  const now = new Date();
  const forecast = [];
  const baseLoad = historicalData.length > 0
    ? historicalData.reduce((sum, d) => sum + (d.load || 0.5), 0) / historicalData.length
    : 0.45;

  for (let i = 1; i <= 8; i++) {
    const hour = (now.getHours() + i) % 24;
    const circadian = 0.5 + 0.2 * Math.sin((hour - 14) * Math.PI / 12);
    const load = Math.min(1, Math.max(0, baseLoad * 0.7 + circadian * 0.3 + (Math.random() * 0.1 - 0.05)));
    forecast.push({
      timestamp: new Date(now.getTime() + i * 3600000).toISOString(),
      predicted_load: Math.round(load * 100) / 100,
      hour
    });
  }

  return { forecast, generated_at: now.toISOString() };
}

// Get current cognitive load prediction
router.post('/predict', authenticate, async (req, res) => {
  const { metrics } = req.body;

  try {
    const prediction = await axios.post(`${config.flaskServiceUrl}/api/cognitive/predict-load`, {
      user_id: req.user.id,
      metrics
    });

    const data = prediction.data.data;

    const cognitiveLoad = new CognitiveLoad({
      user: req.user.id,
      loadScore: data.cognitive_load,
      loadLevel: sanitiseLevel(data.load_level),
      factors: factorsToStrings(data.factors),
      confidence: data.confidence,
      recommendation: { action: data.recommendation }
    });

    await cognitiveLoad.save();

    if (req.app.io) {
      req.app.io.emit('cognitive-load-update', {
        userId: req.user.id,
        loadScore: data.cognitive_load,
        loadLevel: data.load_level,
        timestamp: new Date()
      });
    }

    res.json(data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || (error.response && error.response.status >= 500)) {
      logger.warn('Flask service unavailable, using local prediction fallback');
      const data = computeLoadLocally(metrics);

      try {
        const cognitiveLoad = new CognitiveLoad({
          user: req.user.id,
          loadScore: data.cognitive_load,
          loadLevel: sanitiseLevel(data.load_level),
          factors: factorsToStrings(data.factors),
          confidence: data.confidence,
          recommendation: { action: data.recommendation }
        });
        await cognitiveLoad.save();

        if (req.app.io) {
          req.app.io.emit('cognitive-load-update', {
            userId: req.user.id,
            loadScore: data.cognitive_load,
            loadLevel: data.load_level,
            timestamp: new Date()
          });
        }
      } catch (dbErr) {
        logger.error(`DB save error: ${dbErr.message}`);
      }

      return res.json(data);
    }

    logger.error(`Prediction error: ${error.message}`);
    res.status(500).json({ error: 'Failed to predict cognitive load' });
  }
});

// Get cognitive load history
router.get('/history', authenticate, async (req, res) => {
  const { hours = 24 } = req.query;

  try {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - parseInt(hours));

    const history = await CognitiveLoad.find({
      user: req.user.id,
      timestamp: { $gte: startTime }
    }).sort({ timestamp: -1 });

    res.json({
      data: history,
      period: { hours: parseInt(hours) }
    });
  } catch (error) {
    logger.error(`Error fetching history: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get cognitive weather forecast
router.post('/forecast', authenticate, async (req, res) => {
  const { historicalData = [], hoursAhead = 8 } = req.body;

  try {
    const forecast = await axios.post(`${config.flaskServiceUrl}/api/cognitive/forecast-cognitive-weather`, {
      user_id: req.user.id,
      historical_data: historicalData,
      hours_ahead: hoursAhead
    });

    res.json(forecast.data.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || (error.response && error.response.status >= 500)) {
      logger.warn('Flask service unavailable, using local forecast fallback');
      return res.json(generateForecastLocally(historicalData));
    }

    logger.error(`Forecast error: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

// Get task recommendations
router.post('/task-recommendation', authenticate, async (req, res) => {
  const { currentLoad, availableTasks } = req.body;

  try {
    const recommendation = await axios.post(
      `${config.flaskServiceUrl}/api/cognitive/task-switch-recommendation`,
      {
        user_id: req.user.id,
        current_load: currentLoad,
        available_tasks: availableTasks
      }
    );

    const data = recommendation.data.data;

    if (data.should_switch && data.recommended_task) {
      const task = new Task({
        user: req.user.id,
        title: `Suggested: ${data.recommended_task}`,
        taskType: data.recommended_task,
        status: 'pending',
        priority: 'high',
        description: data.reason
      });

      await task.save();
    }

    res.json(data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || (error.response && error.response.status >= 500)) {
      logger.warn('Flask service unavailable, using local recommendation fallback');
      const data = recommendTaskLocally(currentLoad, availableTasks);

      try {
        if (data.should_switch && data.recommended_task) {
          const task = new Task({
            user: req.user.id,
            title: `Suggested: ${data.recommended_task}`,
            taskType: data.recommended_task,
            status: 'pending',
            priority: 'high',
            description: data.reason
          });
          await task.save();
        }
      } catch (dbErr) {
        logger.error(`DB save error: ${dbErr.message}`);
      }

      return res.json(data);
    }

    logger.error(`Recommendation error: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
});

// Schedule a task
router.post('/schedule-task', authenticate, async (req, res) => {
  const { title, taskType, scheduledFor, priority, estimatedDuration, description } = req.body;

  if (!title || !taskType || !scheduledFor) {
    return res.status(400).json({ error: 'title, taskType, and scheduledFor are required' });
  }

  try {
    const task = new Task({
      user: req.user.id,
      title,
      taskType,
      scheduledFor: new Date(scheduledFor),
      priority: priority || 'medium',
      estimatedDuration: estimatedDuration || 60,
      description: description || '',
      status: 'pending'
    });

    await task.save();
    res.status(201).json({ message: 'Task scheduled', task });
  } catch (error) {
    logger.error(`Schedule task error: ${error.message}`);
    res.status(500).json({ error: 'Failed to schedule task' });
  }
});

// Get scheduled tasks for user
router.get('/scheduled-tasks', authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id })
      .sort({ scheduledFor: 1 })
      .limit(20);
    res.json({ tasks });
  } catch (error) {
    logger.error(`Fetch tasks error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Mark a task as started or completed
router.patch('/scheduled-tasks/:id', authenticate, async (req, res) => {
  const { status } = req.body;
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status, ...(status === 'in_progress' ? { startedAt: new Date() } : {}),
               ...(status === 'completed' ? { completedAt: new Date() } : {}) },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (error) {
    logger.error(`Update task error: ${error.message}`);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

module.exports = router;
