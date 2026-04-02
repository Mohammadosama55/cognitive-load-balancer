# Installing the VS Code Extension

## Quick Install (recommended)

Run this from the `vscode-extension/` folder:

```bash
npm install
npm run package
code --install-extension cognitive-load-balancer-1.0.0.vsix
```

Then reload VS Code. The extension activates automatically.

## First-Time Setup

1. A prompt appears asking you to **Sign In**.
2. Click **Sign In** and enter your Cognitive Load Balancer credentials.
   - If you don't have an account yet, choose **Create Account**.
3. The status bar at the bottom-right of VS Code will show your live load score.

## Configuring the Server URL

If your backend is hosted (not localhost), go to:

**VS Code → Settings → Extensions → Cognitive Load Balancer**

Set:
- `cognitiveLB.serverUrl` → your backend URL (e.g. `https://your-app.replit.app`)
- `cognitiveLB.dashboardUrl` → your dashboard URL

## What You'll See

The status bar shows your real-time cognitive load:

| Status bar | Meaning |
|---|---|
| `● 32% Low` | You're in flow — great time for deep work |
| `⚠ 58% Moderate` | Decent focus — stay on your current task |
| `✖ 81% High` | Overloaded — switch to something lighter |

## Commands (Ctrl+Shift+P)

| Command | Description |
|---|---|
| `Cognitive Load: Sign In` | Connect to your account |
| `Cognitive Load: Toggle Tracking` | Pause or resume tracking |
| `Cognitive Load: Show Current Status` | See detailed load breakdown |
| `Cognitive Load: Open Dashboard` | Open the web dashboard |
| `Cognitive Load: Sign Out` | Disconnect |

## What Gets Tracked

The extension only tracks **behavioral patterns**, never your code content:

- Typing speed (keystrokes per minute)
- Pause patterns between typing bursts
- Keystroke rhythm variance
- File/tab switching frequency
- Window focus changes

No code, filenames, or text is ever sent to the server.
