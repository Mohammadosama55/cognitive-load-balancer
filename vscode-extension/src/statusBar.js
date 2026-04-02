/**
 * Status bar item manager for the Cognitive Load Balancer extension.
 */

const ICONS = {
  low: '$(circle-filled)',
  moderate: '$(warning)',
  high: '$(error)',
  idle: '$(pulse)',
  offline: '$(cloud-upload)',
  tracking_off: '$(debug-pause)'
};

const COLORS = {
  low: '#4ade80',
  moderate: '#facc15',
  high: '#f87171',
  idle: undefined,
  offline: undefined,
  tracking_off: undefined
};

class StatusBarManager {
  constructor(vscode) {
    this.vscode = vscode;
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.item.command = 'cognitiveLB.showStatus';
    this.item.tooltip = 'Cognitive Load Balancer — click for details';
    this.currentLoad = null;
    this.currentLevel = null;
    this.show();
  }

  show() {
    this.item.show();
  }

  setIdle() {
    this.item.text = `${ICONS.idle} CogLoad`;
    this.item.color = undefined;
    this.item.backgroundColor = undefined;
  }

  setOffline(reason = 'Not connected') {
    this.item.text = `${ICONS.offline} CogLoad: Sign In`;
    this.item.color = undefined;
    this.item.tooltip = `Cognitive Load Balancer — ${reason}`;
  }

  setTrackingOff() {
    this.item.text = `${ICONS.tracking_off} CogLoad: Paused`;
    this.item.color = undefined;
  }

  setLoad(loadScore, loadLevel) {
    this.currentLoad = loadScore;
    this.currentLevel = loadLevel;

    const pct = Math.round(loadScore * 100);
    const icon = ICONS[loadLevel] || ICONS.idle;
    const label = loadLevel.charAt(0).toUpperCase() + loadLevel.slice(1);

    this.item.text = `${icon} ${pct}% ${label}`;
    this.item.color = COLORS[loadLevel];
    this.item.tooltip = `Cognitive Load: ${pct}% (${label})\nClick for details and recommendations`;
  }

  dispose() {
    this.item.dispose();
  }
}

module.exports = { StatusBarManager };
