# Cognitive Load Balancer for Developers

An AI-powered monitoring and optimization system designed to manage developer fatigue and cognitive load. Uses real-time telemetry (IDE interactions, typing patterns) and computer vision (eye-gaze tracking via MediaPipe) to predict cognitive states and suggest optimal task-switching moments.

## Architecture

Multi-service monorepo:

- **`frontend/`** - React 18 + Vite dashboard (port 5000)
- **`backend/`** - Node.js/Express API (port 3001)
- **`flask-microservice/`** - Python Flask ML service (port 5001)
- **`ml-models/`** - Core ML logic, checkpoints, and generators

## Tech Stack

- **Frontend**: React 18, Redux Toolkit, Tailwind CSS, Chart.js, Socket.IO client, Vite
- **Backend**: Node.js/Express, Mongoose, Socket.IO, Winston logging, JWT auth
- **ML Service**: Python Flask, OpenCV, MediaPipe, Scikit-learn/TensorFlow
- **Database**: MongoDB (optional - app starts in offline mode if unavailable)

## Development Setup

### Workflows
- **Start application** - Frontend dev server (`cd frontend && npm run dev`) on port 5000
- **Backend API** - Node.js backend (`cd backend && node src/server.js`) on port 3001

### Environment Variables (backend/.env)
- `NODE_ENV=development`
- `PORT=3001`
- `MONGO_URI=mongodb://localhost:27017/cognitive-load`
- `JWT_SECRET=dev-secret-key-cognitive-load-balancer`
- `FLASK_SERVICE_URL=http://localhost:5001`
- `FRONTEND_URL=http://localhost:5000`

### Key Notes
- MongoDB is optional - backend starts in offline mode if MongoDB is unavailable
- Frontend proxies `/api` requests to backend at port 3001
- Backend binds to `0.0.0.0` (required for Replit networking)
- Frontend configured with `allowedHosts: true` and `host: '0.0.0.0'` for Replit proxy

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET/POST /api/users` - User management
- `POST /api/telemetry` - Telemetry data ingestion
- `GET /api/cognitive-load` - Cognitive load data
- `GET /api/context-preservation` - Mental checkpoint data
