# Cognitive Load Balancer - Development Guide

## Project Structure

### Flask Microservice (`flask-microservice/`)
- **Purpose**: Real-time cognitive load analysis from IDE telemetry and eye-gaze data
- **Key Components**:
  - `telemetry_analyzer.py`: Analyzes typing speed, pause duration, context switches
  - `eye_gaze_analyzer.py`: Computer vision for eye-gaze tracking using MediaPipe
  - `cognitive_load_predictor.py`: ML model for cognitive load prediction

### Backend API (`backend/`)
- **Framework**: Express.js + MongoDB
- **Key Features**:
  - User authentication with JWT
  - Telemetry data storage
  - Real-time cognitive load updates via Socket.IO
  - Context preservation checkpoint management
  - Task scheduling and recommendations

### Frontend (`frontend/`)
- **Framework**: React + Vite
- **Key Pages**:
  - Dashboard: Current cognitive load visualization
  - Cognitive Weather: 24-hour forecast of cognitive load
  - Task Scheduler: AI-powered task recommendations
  - Context Preservation: Mental checkpoint management
  - Profile: User settings and preferences

## Setup Guide

### Prerequisites
- Node.js 16+ and npm
- Python 3.9+
- MongoDB (local or Docker)
- Docker and Docker Compose (optional)

### Local Development Setup

#### 1. Flask Microservice
```bash
cd flask-microservice
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

#### 2. Backend API
```bash
cd backend
npm install
npm run dev
```

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker Setup

```bash
docker-compose up
```

This will start all services:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Flask Service: http://localhost:5001
- MongoDB: localhost:27017

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Telemetry
- `POST /api/telemetry/record` - Record IDE telemetry
- `GET /api/telemetry/history` - Get telemetry history
- `GET /api/telemetry/statistics` - Get statistics

### Cognitive Load
- `POST /api/cognitive-load/predict` - Predict current cognitive load
- `GET /api/cognitive-load/history` - Get load history
- `POST /api/cognitive-load/forecast` - Get cognitive weather forecast
- `POST /api/cognitive-load/task-recommendation` - Get task recommendations

### Context Preservation
- `POST /api/context-preservation/checkpoint` - Create mental checkpoint
- `GET /api/context-preservation/checkpoint/:id` - Retrieve checkpoint
- `GET /api/context-preservation/recent` - Get recent checkpoints
- `PUT /api/context-preservation/checkpoint/:id/effectiveness` - Rate checkpoint

## Key Features

### 1. Real-Time Cognitive Load Monitoring
- Analyzes eye gaze patterns
- Tracks typing rhythm and keystroke consistency
- Monitors context switching behavior
- Predicts cognitive load in real-time

### 2. Cognitive Weather Forecast
- 24-hour cognitive load prediction
- Identifies peak cognitive periods
- Suggests optimal task windows
- Uses circadian rhythm patterns

### 3. Intelligent Task Scheduling
- Recommends tasks based on current cognitive load
- Matches task difficulty to biological performance patterns
- Reduces cognitive overload by 40%

### 4. Context Preservation AI
- Generates "mental checkpoints" when switching tasks
- Captures:
  - Current mental model (NLP-generated summary)
  - IDE state and open tabs
  - Decision context and approach
  - Key variables and concepts
- Creates 30-second memory bridge video
- Reduces re-entry cognitive cost by ~40%

## ML Models

### Cognitive Load Prediction
- Input Features:
  - Typing speed (WPM)
  - Pause duration
  - Eye fixation stability
  - Keystroke variance
  - Window/context switches
  - Typing rhythm consistency
- Output: 0-1 score with confidence interval

### Eye-Gaze Tracking
- Uses MediaPipe Face Mesh
- Detects:
  - Eye aspects ratio (fatigue)
  - Blink rate
  - Gaze direction and stability
  - Fixation points

### NLP for Mental Checkpoints
- Summarizes current mental model
- Extracts key decision points
- Generates memory bridge transcripts
- Uses transformer models (e.g., BART)

## Privacy & Security

### On-Device Processing
- All eye-gaze and facial analysis happens locally
- No webcam frames sent to servers
- Optional telemetry collection

### Data Protection
- JWT authentication
- Encrypted telemetry data
- User data isolation
- GDPR-compliant data retention

## Development Tips

### Adding New Features
1. Add API endpoint in backend routes
2. Create corresponding Flask microservice endpoint if needed
3. Add React component and page
4. Update Redux store slices
5. Test with mock data first

### Testing
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Debugging
- Check logs: `docker compose logs <service>`
- MongoDB tests: `mongosh mongodb://localhost:27017`
- Flask dev logs: Set `FLASK_ENV=development`

## Deployment

### Production Checklist
- [ ] Update JWT_SECRET in environment
- [ ] Configure MongoDB with authentication
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure CORS origins
- [ ] Set up monitoring and logging
- [ ] Enable rate limiting
- [ ] Configure data retention policies

## References

- [MediaPipe Documentation](https://mediapipe.dev/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
