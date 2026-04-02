/**
 * Cognitive Load Balancer — VS Code Extension
 *
 * Tracks typing rhythm, file switches, and window focus to compute
 * your real-time cognitive load score. Shows it in the status bar
 * and gives you recommendations when it's time to switch tasks.
 */

const vscode = require('vscode');
const { TelemetryCollector } = require('./telemetry');
const { ApiClient } = require('./api');
const { StatusBarManager } = require('./statusBar');

const SESSION_ID = `vscode-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

let statusBar = null;
let collector = null;
let api = null;
let trackingInterval = null;
let isTracking = false;
let lastPrediction = null;

const AVAILABLE_TASKS = [
  'documentation', 'code_review', 'bug_fix', 'feature_development',
  'testing', 'refactoring', 'meeting', 'architecture', 'deep_work'
];

function getConfig() {
  const cfg = vscode.workspace.getConfiguration('cognitiveLB');
  return {
    serverUrl: cfg.get('serverUrl', 'http://localhost:3001'),
    dashboardUrl: cfg.get('dashboardUrl', 'http://localhost:5000'),
    telemetryInterval: cfg.get('telemetryInterval', 30),
    showNotifications: cfg.get('showNotifications', true),
    autoTrack: cfg.get('autoTrack', true)
  };
}

function getProjectName() {
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.length > 0 ? folders[0].name : 'unknown';
}

async function sendTelemetryAndUpdate() {
  if (!api || !api.token) return;

  const config = getConfig();
  const metrics = collector.flush(config.telemetryInterval);

  try {
    await api.sendTelemetry(metrics, SESSION_ID, getProjectName());
    const prediction = await api.predict(metrics);
    lastPrediction = prediction;

    statusBar.setLoad(prediction.cognitive_load, prediction.load_level);

    if (prediction.load_level === 'high' && config.showNotifications) {
      const recommendation = await api.getRecommendation(
        prediction.cognitive_load, AVAILABLE_TASKS
      );
      if (recommendation.should_switch) {
        showHighLoadNotification(prediction, recommendation);
      }
    }
  } catch (err) {
    if (err.message && err.message.includes('timed out')) {
      statusBar.setOffline('Server not reachable');
    }
  }
}

function showHighLoadNotification(prediction, recommendation) {
  const pct = Math.round(prediction.cognitive_load * 100);
  const msg = `🧠 High cognitive load (${pct}%): ${recommendation.reason}`;
  const action = recommendation.recommended_task
    ? `Switch to ${recommendation.recommended_task.replace(/_/g, ' ')}`
    : 'Take a break';

  vscode.window.showWarningMessage(msg, action, 'Dismiss').then(choice => {
    if (choice === action) {
      vscode.window.showInformationMessage(
        `Good call. Take a few minutes for ${recommendation.recommended_task.replace(/_/g, ' ')} — your focus will thank you.`
      );
    }
  });
}

function startTracking(context) {
  if (isTracking) return;

  const config = getConfig();
  isTracking = true;
  collector.reset();

  trackingInterval = setInterval(sendTelemetryAndUpdate, config.telemetryInterval * 1000);

  const keystrokeDisposable = vscode.workspace.onDidChangeTextDocument(() => {
    collector.recordKeystroke();
  });

  const fileSwitchDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor && editor.document) {
      collector.recordFileSwitch(editor.document.fileName);
    }
  });

  const windowFocusDisposable = vscode.window.onDidChangeWindowState(state => {
    if (!state.focused) {
      collector.recordWindowFocusLost();
    }
  });

  context.subscriptions.push(keystrokeDisposable, fileSwitchDisposable, windowFocusDisposable);

  statusBar.setIdle();
  vscode.window.setStatusBarMessage('$(pulse) Cognitive Load Balancer: tracking started', 3000);
}

function stopTracking() {
  if (!isTracking) return;
  isTracking = false;
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  statusBar.setTrackingOff();
}

async function promptLogin(context) {
  const config = getConfig();

  const action = await vscode.window.showQuickPick(['Sign In', 'Create Account'], {
    placeHolder: 'Sign in or create a new account'
  });
  if (!action) return;

  const email = await vscode.window.showInputBox({
    prompt: 'Email address',
    placeHolder: 'you@example.com',
    validateInput: v => (v && v.includes('@') ? null : 'Enter a valid email')
  });
  if (!email) return;

  const password = await vscode.window.showInputBox({
    prompt: 'Password',
    password: true,
    validateInput: v => (v && v.length >= 6 ? null : 'Password must be at least 6 characters')
  });
  if (!password) return;

  api = new ApiClient(config.serverUrl);

  try {
    let result;
    if (action === 'Create Account') {
      const name = await vscode.window.showInputBox({
        prompt: 'Your name',
        placeHolder: 'Jane Developer'
      });
      if (!name) return;
      result = await api.register(name, email, password);
    } else {
      result = await api.login(email, password);
    }

    await context.globalState.update('cognitiveLB.token', result.token);
    await context.globalState.update('cognitiveLB.email', email);
    await context.globalState.update('cognitiveLB.serverUrl', config.serverUrl);

    vscode.window.showInformationMessage(
      `✅ Signed in as ${result.user.name}. Cognitive load tracking is now active.`
    );

    startTracking(context);
  } catch (err) {
    vscode.window.showErrorMessage(`Sign in failed: ${err.message}`);
  }
}

async function showStatusPanel() {
  if (!lastPrediction) {
    vscode.window.showInformationMessage(
      'No cognitive load data yet — keep coding, the first reading arrives in ~30 seconds.'
    );
    return;
  }

  const p = lastPrediction;
  const pct = Math.round(p.cognitive_load * 100);
  const emoji = { low: '🟢', moderate: '🟡', high: '🔴' }[p.load_level] || '⚪';
  const rec = p.recommendation
    ? `\n\nRecommendation: ${p.recommendation.replace(/_/g, ' ')}`
    : '';

  const factors = p.factors
    ? Object.entries(p.factors)
        .map(([k, v]) => `  • ${k.replace(/_/g, ' ')}: ${Math.round(v * 100)}%`)
        .join('\n')
    : '';

  const message = `${emoji} Cognitive Load: ${pct}% (${p.load_level})${rec}`;
  const detail = factors ? `\nContributing factors:\n${factors}` : '';

  const choices = ['Open Dashboard', 'Dismiss'];
  const choice = await vscode.window.showInformationMessage(message + detail, ...choices);
  if (choice === 'Open Dashboard') {
    const config = getConfig();
    vscode.env.openExternal(vscode.Uri.parse(config.dashboardUrl));
  }
}

function activate(context) {
  statusBar = new StatusBarManager(vscode);
  collector = new TelemetryCollector();
  context.subscriptions.push({ dispose: () => statusBar.dispose() });

  const config = getConfig();
  const savedToken = context.globalState.get('cognitiveLB.token');
  const savedServerUrl = context.globalState.get('cognitiveLB.serverUrl', config.serverUrl);

  if (savedToken) {
    api = new ApiClient(savedServerUrl);
    api.setToken(savedToken);

    api.healthCheck()
      .then(() => {
        if (config.autoTrack) {
          startTracking(context);
        }
      })
      .catch(() => {
        statusBar.setOffline('Server unreachable — check cognitiveLB.serverUrl in settings');
      });
  } else {
    statusBar.setOffline('Not signed in');
    vscode.window.showInformationMessage(
      '🧠 Cognitive Load Balancer installed! Sign in to start tracking.',
      'Sign In'
    ).then(choice => {
      if (choice === 'Sign In') {
        vscode.commands.executeCommand('cognitiveLB.login');
      }
    });
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('cognitiveLB.login', () => promptLogin(context)),

    vscode.commands.registerCommand('cognitiveLB.logout', async () => {
      stopTracking();
      await context.globalState.update('cognitiveLB.token', undefined);
      api = null;
      statusBar.setOffline('Signed out');
      vscode.window.showInformationMessage('Signed out of Cognitive Load Balancer.');
    }),

    vscode.commands.registerCommand('cognitiveLB.toggleTracking', () => {
      if (!api || !api.token) {
        vscode.window.showWarningMessage('Sign in first to enable tracking.', 'Sign In')
          .then(c => { if (c) vscode.commands.executeCommand('cognitiveLB.login'); });
        return;
      }
      if (isTracking) {
        stopTracking();
        vscode.window.showInformationMessage('Cognitive load tracking paused.');
      } else {
        startTracking(context);
        vscode.window.showInformationMessage('Cognitive load tracking resumed.');
      }
    }),

    vscode.commands.registerCommand('cognitiveLB.showDashboard', () => {
      const cfg = getConfig();
      vscode.env.openExternal(vscode.Uri.parse(cfg.dashboardUrl));
    }),

    vscode.commands.registerCommand('cognitiveLB.showStatus', () => {
      showStatusPanel();
    })
  );
}

function deactivate() {
  stopTracking();
}

module.exports = { activate, deactivate };
