const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const CognitiveLoad = require('../models/CognitiveLoad');
const Task = require('../models/Task');
const config = require('../config/constants');
const logger = require('../config/logger');

// Get current cognitive load prediction
router.post('/predict', authenticate, async (req, res) => {
  const { metrics } = req.body;

  try {
    // Call Flask service for prediction
    const prediction = await axios.post(`${config.flaskServiceUrl}/api/cognitive/predict-load`, {
      user_id: req.user.id,
      metrics
    });

    const data = prediction.data.data;

    // Save to database
    const cognitiveLoad = new CognitiveLoad({
      user: req.user.id,
      loadScore: data.cognitive_load,
      loadLevel: data.load_level,
      factors: data.factors,
      confidence: data.confidence,
      recommendation: {
        action: data.recommendation
      }
    });

    await cognitiveLoad.save();

    // Emit Socket.IO update
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

    // If should switch, create scheduled task
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
    logger.error(`Recommendation error: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
});

module.exports = router;
