/**
 * API client — talks to the Cognitive Load Balancer backend.
 */

const https = require('https');
const http = require('http');
const url = require('url');

class ApiClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl.replace(/\/$/, '');
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  _request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const fullUrl = `${this.serverUrl}${path}`;
      const parsed = url.parse(fullUrl);
      const isHttps = parsed.protocol === 'https:';
      const lib = isHttps ? https : http;

      const bodyStr = body ? JSON.stringify(body) : null;

      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
        },
        timeout: 10000
      };

      const req = lib.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json);
            } else {
              reject(new Error(json.error || `HTTP ${res.statusCode}`));
            }
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });

      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  }

  async login(email, password) {
    const result = await this._request('POST', '/api/auth/login', { email, password });
    this.token = result.token;
    return result;
  }

  async register(name, email, password) {
    const result = await this._request('POST', '/api/auth/register', {
      name, email, password, passwordConfirm: password
    });
    this.token = result.token;
    return result;
  }

  async sendTelemetry(metrics, sessionId, projectName) {
    return this._request('POST', '/api/telemetry/record', {
      typingSpeed: metrics.typing_speed,
      pauseDuration: metrics.pause_duration,
      keystrokeVariance: metrics.keystroke_variance,
      mouseMovementSpeed: metrics.mouse_movement_speed,
      windowSwitches: metrics.window_switches,
      sessionId,
      ideName: 'vscode',
      projectName
    });
  }

  async predict(metrics) {
    return this._request('POST', '/api/cognitive-load/predict', { metrics });
  }

  async getRecommendation(currentLoad, availableTasks) {
    return this._request('POST', '/api/cognitive-load/task-recommendation', {
      currentLoad,
      availableTasks
    });
  }

  async healthCheck() {
    return this._request('GET', '/api/health');
  }
}

module.exports = { ApiClient };
