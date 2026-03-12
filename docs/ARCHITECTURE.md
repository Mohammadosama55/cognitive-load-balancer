# Architecture Overview

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (Port 3000)                   │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │   Dashboard      │ │ Cognitive Weather│ │  Context Preser. │ │
│  │   Task Scheduler │ │  Profile Setting │ │  Task Management │ │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│                           Redux Store                            │
│                         Socket.IO Client                         │
└────────────────┬──────────────────────────────────────────────────┘
                 │
                 │ HTTP REST API + WebSocket
                 │
┌────────────────┴──────────────────────────────────────────────────┐
│          Express.js Backend (Port 5000)                          │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │  Auth Routes     │ │ Telemetry Routes │ │Cognitive Load    │ │
│  │  User Routes     │ │Context Preservation Routes             │ │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│                                                                   │
│  Authentication & Authorization  |  Data Validation              │
│  Request Logging                  |  Error Handling              │
│                           Socket.IO Server                       │
└────────────────┬──────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼────────┐  ┌─────▼──────────────────┐
│   MongoDB      │  │  Flask Microservice    │
│  (Port 27017)  │  │     (Port 5001)        │
│                │  │  ┌──────────────────┐  │
│  Collections:  │  │  │ Telemetry        │  │
│  - Users       │  │  │ Analyzer         │  │
│  - Telemetry   │  │  ├──────────────────┤  │
│  - CogLoad     │  │  │ Eye Gaze         │  │
│  - ContextPrep │  │  │ Analyzer         │  │
│  - Tasks       │  │  ├──────────────────┤  │
│                │  │  │ Cognitive Load   │  │
│                │  │  │ Predictor        │  │
│                │  │  └──────────────────┘  │
└────────────────┘  └─────────────────────────┘

IDE/Editor Integration:
- IDE plugin collects telemetry
- Sends to Flask service
- Flask analyzes and routes to backend
- Backend stores and feeds to ML model
- Real-time updates via WebSocket
```

## Data Flow

### 1. Telemetry Collection
```
IDE Plugin → Collect Metrics → Flask Service → Telemetry Analyzer → Backend → MongoDB
```

### 2. Cognitive Load Prediction
```
User Request → Flask ML Model → Prediction → Backend → Store → Frontend Display
```

### 3. Context Preservation
```
Task Switch → Capture Mental Model → NLP Processing → Generate Checkpoint → Store
Task Resume → Retrieve Checkpoint → Display Memory Bridge → Aid Re-entry
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  profile: {
    avatar: String,
    timezone: String,
    preferences: {
      enableWebcam: Boolean,
      enableTelemetry: Boolean,
      dataRetentionDays: Number
    }
  },
  cognitiveProfile: {
    baselineLoad: Number,
    fatigueThreshold: Number,
    preferredTasks: [String],
    focusDuration: Number
  }
}
```

### Telemetry Collection
```javascript
{
  user: ObjectId,
  timestamp: Date,
  typingSpeed: Number,
  pauseDuration: Number,
  keystrokeVariance: Number,
  windowSwitches: Number,
  cognitiveLoadScore: Number,
  loadLevel: String
}
```

### Cognitive Load Collection
```javascript
{
  user: ObjectId,
  timestamp: Date,
  loadScore: Number,
  loadLevel: String,
  factors: [String],
  componentScores: {
    typing: Number,
    pause: Number,
    switching: Number
  },
  recommendation: {
    action: String,
    reason: String
  }
}
```

### Context Preservation Collection
```javascript
{
  user: ObjectId,
  fromTask: Object,
  toTask: Object,
  checkpoint: {
    mentalModelSummary: String,
    filesPreviouslyOpen: [String],
    nextSteps: [String],
    activeVariables: [String]
  },
  memoryBridge: {
    videoUrl: String,
    transcript: String
  },
  effectivenessScore: Number
}
```

## Technology Stack

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Redux**: State management
- **Axios**: HTTP client
- **Socket.IO Client**: Real-time updates
- **Tailwind CSS**: Styling
- **Chart.js**: Data visualization

### Backend
- **Express.js**: REST API framework
- **Node.js**: JavaScript runtime
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication
- **Socket.IO**: WebSocket communication
- **Bcrypt**: Password hashing

### ML/Data Science
- **Flask**: Python web framework
- **TensorFlow/Keras**: Deep learning
- **scikit-learn**: ML algorithms
- **MediaPipe**: Computer vision
- **OpenCV**: Image processing
- **pandas/numpy**: Data analysis
- **spaCy/transformers**: NLP

## Deployment Architecture

### Development
- All services run locally
- MongoDB on localhost
- Hot reload enabled for frontend and backend

### Production (Docker Compose)
```yaml
Services:
  - MongoDB (data persistence)
  - Backend (Express API)
  - Flask (ML inference)
  - Frontend (React app)
  - nginx (reverse proxy) [optional]
```

### Cloud Deployment (Recommended)
- Frontend: AWS S3 + CloudFront / Vercel
- Backend: AWS ECS / Heroku
- Flask Service: AWS Lambda / ECS
- MongoDB: AWS DocumentDB / Atlas
- Real-time: AWS AppSync / native WebSocket

## Security Measures

1. **Authentication**: JWT tokens with expiration
2. **Authorization**: Role-based access control
3. **Data Encryption**: HTTPS/TLS in transit
4. **Data Privacy**: On-device processing for sensitive data
5. **Rate Limiting**: Prevent abuse
6. **Input Validation**: Sanitize all inputs
7. **Error Handling**: No sensitive info in errors
