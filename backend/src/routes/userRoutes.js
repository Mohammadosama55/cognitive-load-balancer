const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../config/logger');

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      profile: user.profile,
      cognitiveProfile: user.cognitiveProfile
    });
  } catch (error) {
    logger.error(`Error fetching profile: ${error.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  const { name, bio, avatar, timezone } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (bio) user.profile.bio = bio;
    if (avatar) user.profile.avatar = avatar;
    if (timezone) user.profile.timezone = timezone;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    logger.error(`Error updating profile: ${error.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update preferences
router.put('/preferences', authenticate, async (req, res) => {
  const { enableWebcam, enableTelemetry, dataRetentionDays } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (enableWebcam !== undefined) user.profile.preferences.enableWebcam = enableWebcam;
    if (enableTelemetry !== undefined) user.profile.preferences.enableTelemetry = enableTelemetry;
    if (dataRetentionDays) user.profile.preferences.dataRetentionDays = dataRetentionDays;

    await user.save();

    res.json({
      message: 'Preferences updated',
      preferences: user.profile.preferences
    });
  } catch (error) {
    logger.error(`Error updating preferences: ${error.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update cognitive profile
router.put('/cognitive-profile', authenticate, async (req, res) => {
  const { baselineLoad, fatigueThreshold, preferredTasks, focusDuration } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (baselineLoad !== undefined) user.cognitiveProfile.baselineLoad = baselineLoad;
    if (fatigueThreshold !== undefined) user.cognitiveProfile.fatigueThreshold = fatigueThreshold;
    if (preferredTasks) user.cognitiveProfile.preferredTasks = preferredTasks;
    if (focusDuration) user.cognitiveProfile.focusDuration = focusDuration;

    await user.save();

    res.json({
      message: 'Cognitive profile updated',
      cognitiveProfile: user.cognitiveProfile
    });
  } catch (error) {
    logger.error(`Error updating cognitive profile: ${error.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
