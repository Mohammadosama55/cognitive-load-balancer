# Cognitive Load Balancer

An AI-powered cognitive load monitoring system for developers that tracks IDE telemetry, eye-gaze patterns, and predicts cognitive load in real-time.

## Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS + Redux Toolkit (port 5000)
- **Backend**: Node.js/Express + Socket.IO (port 3001)
- **Database**: MongoDB 7.0 (port 27017, local Nix install)
- **Flask Microservice**: Python Flask for ML/CV processing (port 5001, not active in dev)

## Project Structure

```
/
├── frontend/          # React/Vite SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── store/     # Redux store
│   └── vite.config.js
├── backend/           # Node.js/Express API
│   └── src/
│       ├── config/    # Logger, constants
│       ├── middleware/ # Auth middleware
│       ├── models/    # Mongoose models
│       ├── routes/    # API routes
│       └── server.js
├── flask-microservice/ # Python ML service
│   ├── app/
│   ├── models/
│   └── routes/
├── ml-models/         # ML model files
├── data/db/           # MongoDB data directory
└── docker-compose.yml # Docker config (not used in Replit)
```

## Workflows

- **Start application**: `cd frontend && npm run dev` (port 5000, webview)
- **Backend API**: MongoDB + Node.js backend (port 3001, console)

## Configuration

- Frontend proxies `/api` calls to `http://localhost:3001`
- Backend connects to MongoDB at `mongodb://localhost:27017/cognitive-load`
- JWT secret configured via `JWT_SECRET` environment variable
- MongoDB data stored in `/home/runner/workspace/data/db`
- Backend logs stored in `backend/logs/`

## Key Features

- Real-time cognitive load monitoring via Socket.IO
- IDE telemetry collection (typing speed, pause duration, window switches)
- Eye-gaze analysis integration
- Task scheduling based on cognitive load
- Context preservation checkpoints
- Authentication with JWT

## Environment Variables

See `.env.example` for all required variables. Copy to `.env` and update values.

## Development Notes

- MongoDB is installed via Nix (`mongodb` package)
- The backend starts MongoDB with `--fork` before launching Node.js
- Flask microservice requires heavy ML dependencies (TensorFlow, MediaPipe, OpenCV) - not active by default
