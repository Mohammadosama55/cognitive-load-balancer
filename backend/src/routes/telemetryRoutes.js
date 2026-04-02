const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const Telemetry = require('../models/Telemetry');
const CognitiveLoad = require('../models/CognitiveLoad');
const config = require('../config/constants');
const logger = require('../config/logger');

// Local fallback: compute load score from telemetry metrics
function computeLoadFromTelemetry({ typingSpeed = 40, pauseDuration = 2, keystrokeVariance = 0.3, mouseMovementSpeed = 50, windowSwitches = 0 } = {}) {
  const speedScore = Math.max(0, Math.min(1, (80 - typingSpeed) / 80));
  const pauseScore = Math.min(1, pauseDuration / 10);
  const varianceScore = Math.min(1, keystrokeVariance);
  const switchScore = Math.min(1, windowSwitches / 5);
  const aggregate_load_score = Math.round((speedScore * 0.25 + pauseScore * 0.3 + varianceScore * 0.25 + switchScore * 0.2) * 100) / 100;
  const load_level = aggregate_load_score < 0.33 ? 'low' : aggregate_load_score < 0.66 ? 'moderate' : 'high';
  return { aggregate_load_score, load_level };
}

// Record telemetry data
router.post('/record', authenticate, async (req, res) => {
  const { typingSpeed, pauseDuration, keystrokeVariance, mouseMovementSpeed, windowSwitches, sessionId, ideName, projectName } = req.body;

  let analysis;

  try {
    const flaskResponse = await axios.post(`${config.flaskServiceUrl}/api/telemetry/analyze`, {
      user_id: req.user.id,
      telemetry_data: {
        typing_speed: typingSpeed,
        pause_duration: pauseDuration,
        keystroke_variance: keystrokeVariance,
        mouse_movement_speed: mouseMovementSpeed,
        window_switches: windowSwitches
      }
    });
    analysis = flaskResponse.data.data.analysis;
  } catch (flaskError) {
    logger.warn('Flask service unavailable, using local telemetry analysis');
    analysis = computeLoadFromTelemetry({ typingSpeed, pauseDuration, keystrokeVariance, mouseMovementSpeed, windowSwitches });
  }

  try {
    const telemetry = new Telemetry({
      user: req.user.id,
      typingSpeed,
      pauseDuration,
      keystrokeVariance,
      mouseMovementSpeed,
      windowSwitches,
      cognitiveLoadScore: analysis.aggregate_load_score,
      loadLevel: analysis.load_level,
      sessionId,
      ideName,
      projectName
    });

    await telemetry.save();

    res.status(201).json({
      message: 'Telemetry recorded',
      telemetry: {
        id: telemetry._id,
        cognitiveLoadScore: telemetry.cognitiveLoadScore,
        loadLevel: telemetry.loadLevel
      }
    });
  } catch (error) {
    logger.error(`Telemetry recording error: ${error.message}`);
    res.status(500).json({ error: 'Failed to record telemetry' });
  }
});

// Get telemetry history
router.get('/history', authenticate, async (req, res) => {
  const { limit = 100, skip = 0 } = req.query;

  try {
    const telemetry = await Telemetry.find({ user: req.user.id })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Telemetry.countDocuments({ user: req.user.id });

    res.json({
      data: telemetry,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    logger.error(`Error fetching telemetry: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

// Get telemetry statistics
router.get('/statistics', authenticate, async (req, res) => {
  const { period = 'day' } = req.query;

  try {
    let daysBack = 1;
    if (period === 'week') daysBack = 7;
    if (period === 'month') daysBack = 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const stats = await Telemetry.aggregate([
      {
        $match: {
          user: req.user.id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgLoadScore: { $avg: '$cognitiveLoadScore' },
          maxLoadScore: { $max: '$cognitiveLoadScore' },
          minLoadScore: { $min: '$cognitiveLoadScore' },
          avgTypingSpeed: { $avg: '$typingSpeed' },
          avgPauseDuration: { $avg: '$pauseDuration' },
          totalSessions: { $sum: 1 }
        }
      }
    ]);

    const statsByLevel = await Telemetry.aggregate([
      {
        $match: {
          user: req.user.id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$loadLevel',
          count: { $sum: 1 },
          percentage: { $avg: 1 }
        }
      }
    ]);

    res.json({
      period,
      statistics: stats[0] || {},
      byLoadLevel: statsByLevel
    });
  } catch (error) {
    logger.error(`Error fetching statistics: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Submit eye-gaze frame for analysis
router.post('/eye-gaze', authenticate, async (req, res) => {
  // This would handle file uploads
  // For now, just accept the request
  res.json({
    message: 'Eye-gaze analysis queued',
    sessionId: req.body.sessionId
  });
});

module.exports = router;
