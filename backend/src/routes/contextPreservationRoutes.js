const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ContextPreservation = require('../models/ContextPreservation');
const logger = require('../config/logger');

// Create context preservation checkpoint
router.post('/checkpoint', authenticate, async (req, res) => {
  const {
    fromTask,
    toTask,
    mentalModelSummary,
    filesPreviouslyOpen,
    currentMethod,
    focusPoint,
    problem,
    approach,
    nextSteps,
    activeVariables,
    memoryBridgeUrl
  } = req.body;

  try {
    const checkpoint = new ContextPreservation({
      user: req.user.id,
      fromTask,
      toTask,
      checkpoint: {
        mentalModelSummary,
        filesPreviouslyOpen,
        currentMethod,
        focusPoint,
        problem,
        approach,
        nextSteps,
        activeVariables
      },
      memoryBridge: {
        videoUrl: memoryBridgeUrl,
        highlights: []
      },
      createdAt: new Date()
    });

    await checkpoint.save();

    // Emit Socket.IO event
    if (req.app.io) {
      req.app.io.emit('context-saved', {
        userId: req.user.id,
        checkpointId: checkpoint._id,
        fromTask: fromTask.name,
        toTask: toTask.name
      });
    }

    res.status(201).json({
      message: 'Context checkpoint created',
      checkpoint: {
        id: checkpoint._id,
        fromTask: checkpoint.fromTask,
        toTask: checkpoint.toTask,
        createdAt: checkpoint.createdAt
      }
    });
  } catch (error) {
    logger.error(`Checkpoint creation error: ${error.message}`);
    res.status(500).json({ error: 'Failed to create checkpoint' });
  }
});

// Retrieve context checkpoint
router.get('/checkpoint/:id', authenticate, async (req, res) => {
  try {
    const checkpoint = await ContextPreservation.findById(req.params.id);

    if (!checkpoint) {
      return res.status(404).json({ error: 'Checkpoint not found' });
    }

    if (checkpoint.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      checkpoint,
      message: 'Remember to focus on: ' + checkpoint.checkpoint.focusPoint
    });
  } catch (error) {
    logger.error(`Error retrieving checkpoint: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve checkpoint' });
  }
});

// Get recent checkpoints
router.get('/recent', authenticate, async (req, res) => {
  const { limit = 10 } = req.query;

  try {
    const checkpoints = await ContextPreservation.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      data: checkpoints,
      count: checkpoints.length
    });
  } catch (error) {
    logger.error(`Error fetching checkpoints: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch checkpoints' });
  }
});

// Rate checkpoint effectiveness
router.put('/checkpoint/:id/effectiveness', authenticate, async (req, res) => {
  const { effectiveness, cognitiveRecoveryTime } = req.body;

  try {
    const checkpoint = await ContextPreservation.findById(req.params.id);

    if (!checkpoint) {
      return res.status(404).json({ error: 'Checkpoint not found' });
    }

    if (checkpoint.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    checkpoint.effectivenessScore = effectiveness;
    checkpoint.cognitiveReCoveryTime = cognitiveRecoveryTime;

    await checkpoint.save();

    res.json({
      message: 'Effectiveness recorded',
      checkpoint: {
        id: checkpoint._id,
        effectiveness: checkpoint.effectivenessScore
      }
    });
  } catch (error) {
    logger.error(`Error updating effectiveness: ${error.message}`);
    res.status(500).json({ error: 'Failed to update effectiveness' });
  }
});

module.exports = router;
