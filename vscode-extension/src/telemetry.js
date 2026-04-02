/**
 * Telemetry collector — tracks typing rhythm, pauses, file switches,
 * and window focus changes inside VS Code.
 */

class TelemetryCollector {
  constructor() {
    this.reset();
  }

  reset() {
    this.keystrokes = [];
    this.fileSwitches = 0;
    this.windowFocusLost = 0;
    this.lastKeystrokeTime = null;
    this.pauseDurations = [];
    this.currentFile = null;
    this.sessionStart = Date.now();
  }

  recordKeystroke() {
    const now = Date.now();

    if (this.lastKeystrokeTime !== null) {
      const gap = (now - this.lastKeystrokeTime) / 1000;
      if (gap > 1.5) {
        this.pauseDurations.push(gap);
      }
    }

    this.keystrokes.push(now);
    this.lastKeystrokeTime = now;
  }

  recordFileSwitch(filename) {
    if (filename !== this.currentFile) {
      if (this.currentFile !== null) {
        this.fileSwitches++;
      }
      this.currentFile = filename;
    }
  }

  recordWindowFocusLost() {
    this.windowFocusLost++;
  }

  /**
   * Compute metrics over the last N seconds and reset counters.
   * @param {number} windowSeconds
   */
  flush(windowSeconds = 30) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    const recentKeys = this.keystrokes.filter(t => t >= windowStart);
    const typingSpeed = recentKeys.length > 0
      ? (recentKeys.length / windowSeconds) * 60
      : 0;

    const avgPause = this.pauseDurations.length > 0
      ? this.pauseDurations.reduce((a, b) => a + b, 0) / this.pauseDurations.length
      : 0;

    const keystrokeVariance = this._variance(recentKeys);

    const metrics = {
      typing_speed: Math.round(typingSpeed * 10) / 10,
      pause_duration: Math.round(avgPause * 100) / 100,
      keystroke_variance: Math.round(keystrokeVariance * 1000) / 1000,
      mouse_movement_speed: 0,
      window_switches: this.fileSwitches + this.windowFocusLost
    };

    this.reset();
    return metrics;
  }

  _variance(timestamps) {
    if (timestamps.length < 2) return 0;
    const gaps = [];
    for (let i = 1; i < timestamps.length; i++) {
      gaps.push(timestamps[i] - timestamps[i - 1]);
    }
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance = gaps.reduce((sum, g) => sum + Math.pow(g - mean, 2), 0) / gaps.length;
    return Math.sqrt(variance) / 1000;
  }
}

module.exports = { TelemetryCollector };
