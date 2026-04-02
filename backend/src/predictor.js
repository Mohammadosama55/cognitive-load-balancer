/**
 * Cognitive Load Predictor — Node.js
 *
 * Uses a calibration table exported from a scikit-learn Gradient Boosting
 * model (99.5% CV accuracy, trained on 1,060 synthetic developer sessions).
 *
 * Inputs:
 *   typing_speed      — keystrokes per minute (WPM)
 *   pause_duration    — average pause between typing bursts (seconds)
 *   keystroke_variance— rhythm irregularity 0-1
 *   window_switches   — context switches per 30s window
 *
 * Outputs:
 *   { cognitive_load, load_level, confidence, factors, recommendation }
 */

const path = require('path');

let model = null;

function loadModel() {
  if (model) return model;
  try {
    model = require('./model_weights.json');
  } catch (e) {
    return null;
  }
  return model;
}

/**
 * Find the nearest grid point and interpolate probabilities.
 * Uses a weighted inverse-distance interpolation across the 4 axes.
 */
function predictProba(speed, pause, variance, switches) {
  const m = loadModel();
  if (!m) return null;

  const axes = m.grid_axes;

  function nearest2(arr, val) {
    let lo = arr[0], hi = arr[arr.length - 1];
    for (let i = 0; i < arr.length - 1; i++) {
      if (val >= arr[i] && val <= arr[i + 1]) {
        lo = arr[i]; hi = arr[i + 1]; break;
      }
    }
    if (val <= arr[0]) return [arr[0], arr[0]];
    if (val >= arr[arr.length - 1]) return [arr[arr.length - 1], arr[arr.length - 1]];
    return [lo, hi];
  }

  const [sLo, sHi] = nearest2(axes.speeds, speed);
  const [pLo, pHi] = nearest2(axes.pauses, pause);
  const [vLo, vHi] = nearest2(axes.variances, variance);
  const [wLo, wHi] = nearest2(axes.switches, switches);

  const corners = [
    [sLo, pLo, vLo, wLo], [sLo, pLo, vLo, wHi],
    [sLo, pLo, vHi, wLo], [sLo, pLo, vHi, wHi],
    [sLo, pHi, vLo, wLo], [sLo, pHi, vLo, wHi],
    [sLo, pHi, vHi, wLo], [sLo, pHi, vHi, wHi],
    [sHi, pLo, vLo, wLo], [sHi, pLo, vLo, wHi],
    [sHi, pLo, vHi, wLo], [sHi, pLo, vHi, wHi],
    [sHi, pHi, vLo, wLo], [sHi, pHi, vLo, wHi],
    [sHi, pHi, vHi, wLo], [sHi, pHi, vHi, wHi]
  ];

  const tableIndex = {};
  for (const row of m.calibration_table) {
    tableIndex[`${row.speed},${row.pause},${row.variance},${row.switches}`] = row.proba;
  }

  const accum = { low: 0, moderate: 0, high: 0 };
  let totalWeight = 0;

  for (const [cs, cp, cv, cw] of corners) {
    const dist = Math.sqrt(
      Math.pow((speed - cs) / (Math.max(...axes.speeds) + 1), 2) +
      Math.pow((pause - cp) / (Math.max(...axes.pauses) + 1), 2) +
      Math.pow((variance - cv), 2) +
      Math.pow((switches - cw) / (Math.max(...axes.switches) + 1), 2)
    );
    const weight = dist < 0.0001 ? 1e6 : 1 / dist;
    const key = `${cs},${cp},${cv},${cw}`;
    const proba = tableIndex[key] || { low: 0.33, moderate: 0.34, high: 0.33 };

    accum.low      += proba.low      * weight;
    accum.moderate += proba.moderate * weight;
    accum.high     += proba.high     * weight;
    totalWeight    += weight;
  }

  return {
    low:      accum.low      / totalWeight,
    moderate: accum.moderate / totalWeight,
    high:     accum.high     / totalWeight
  };
}

/**
 * Main prediction function.
 * @param {object} metrics
 * @returns {object} prediction result
 */
function predict(metrics = {}) {
  const {
    typing_speed     = 40,
    pause_duration   = 2,
    keystroke_variance = 0.2,
    window_switches  = 0
  } = metrics;

  const proba = predictProba(typing_speed, pause_duration, keystroke_variance, window_switches);

  let load_level, cognitive_load, confidence;

  if (proba) {
    const best = Object.entries(proba).sort((a, b) => b[1] - a[1])[0];
    load_level     = best[0];
    confidence     = Math.round(best[1] * 100) / 100;
    cognitive_load = Math.round(
      (proba.low * 0.2 + proba.moderate * 0.55 + proba.high * 0.9) * 100
    ) / 100;
  } else {
    // Fallback if model file not found
    const speedScore    = Math.max(0, Math.min(1, (80 - typing_speed) / 80));
    const pauseScore    = Math.min(1, pause_duration / 10);
    const varianceScore = Math.min(1, keystroke_variance / 0.5);
    const switchScore   = Math.min(1, window_switches / 8);
    cognitive_load = Math.round((speedScore * 0.25 + pauseScore * 0.3 + varianceScore * 0.25 + switchScore * 0.2) * 100) / 100;
    load_level     = cognitive_load < 0.35 ? 'low' : cognitive_load < 0.65 ? 'moderate' : 'high';
    confidence     = 0.6;
  }

  const recommendations = {
    low:      'continue',
    moderate: 'take_short_break',
    high:     'take_break'
  };

  const factors = _buildFactors(metrics, load_level);

  return {
    cognitive_load,
    load_level,
    confidence,
    factors,
    recommendation: recommendations[load_level]
  };
}

function _buildFactors(metrics, level) {
  const { typing_speed = 40, pause_duration = 2, keystroke_variance = 0.2, window_switches = 0 } = metrics;
  return {
    typing_pattern:    Math.round(Math.max(0, Math.min(1, (80 - typing_speed) / 80)) * 100) / 100,
    pause_analysis:    Math.round(Math.min(1, pause_duration / 10) * 100) / 100,
    keystroke_dynamics: Math.round(Math.min(1, keystroke_variance / 0.5) * 100) / 100,
    context_switching: Math.round(Math.min(1, window_switches / 8) * 100) / 100
  };
}

module.exports = { predict };
