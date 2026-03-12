# API Documentation

## Authentication

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "passwordConfirm": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

## Telemetry

### Record IDE Telemetry
```http
POST /api/telemetry/record
Authorization: Bearer <token>
Content-Type: application/json

{
  "typingSpeed": 45,
  "pauseDuration": 1.5,
  "keystrokeVariance": 0.12,
  "mouseMovementSpeed": 100,
  "windowSwitches": 2,
  "sessionId": "session_123",
  "ideName": "VS Code",
  "projectName": "My Project"
}
```

### Get Telemetry History
```http
GET /api/telemetry/history?limit=100&skip=0
Authorization: Bearer <token>
```

### Get Statistics
```http
GET /api/telemetry/statistics?period=day
Authorization: Bearer <token>
```

## Cognitive Load

### Predict Cognitive Load
```http
POST /api/cognitive-load/predict
Authorization: Bearer <token>
Content-Type: application/json

{
  "metrics": {
    "typing_speed": 45,
    "pause_duration": 1.5,
    "eye_fixation": 0.8,
    "keystroke_variance": 0.12,
    "window_switches": 2,
    "typing_rhythm_score": 0.85
  }
}
```

**Response:**
```json
{
  "cognitive_load": 0.45,
  "load_level": "medium",
  "confidence": 0.92,
  "factors": ["Extended pauses", "Task switching"],
  "recommendation": "maintain_current_pace"
}
```

### Get Cognitive Weather Forecast
```http
POST /api/cognitive-load/forecast
Authorization: Bearer <token>
Content-Type: application/json

{
  "historicalData": [0.4, 0.5, 0.6, 0.55, 0.65],
  "hoursAhead": 8
}
```

## Context Preservation

### Create Checkpoint
```http
POST /api/context-preservation/checkpoint
Authorization: Bearer <token>
Content-Type: application/json

{
  "fromTask": {
    "name": "Feature Development",
    "type": "coding",
    "startTime": "2024-01-15T10:00:00Z"
  },
  "toTask": {
    "name": "Code Review",
    "type": "review"
  },
  "mentalModelSummary": "Implementing user authentication system...",
  "filesPreviouslyOpen": [
    "src/auth/controller.js",
    "src/models/User.js"
  ],
  "currentMethod": "validateToken()",
  "focusPoint": "JWT token expiration logic",
  "problem": "Token refresh not working correctly",
  "approach": "Implement refresh token pattern",
  "nextSteps": [
    "Add refresh token to database",
    "Create refresh endpoint",
    "Test with multiple clients"
  ],
  "activeVariables": ["token", "expiry", "refreshId"],
  "memoryBridgeUrl": "https://..."
}
```

### Retrieve Checkpoint
```http
GET /api/context-preservation/checkpoint/:id
Authorization: Bearer <token>
```

### Rate Effectiveness
```http
PUT /api/context-preservation/checkpoint/:id/effectiveness
Authorization: Bearer <token>
Content-Type: application/json

{
  "effectiveness": 8,
  "cognitiveRecoveryTime": 45000
}
```

## Flask Microservice Endpoints

### Analyze Telemetry
```http
POST /api/telemetry/analyze
Content-Type: application/json

{
  "user_id": "user123",
  "telemetry_data": {
    "typing_speed": 45,
    "pause_duration": 2.5,
    "keystroke_variance": 0.15,
    "mouse_movement_speed": 100,
    "window_switches": 3
  }
}
```

### Analyze Eye-Gaze
```http
POST /api/cv/analyze-eye-gaze
Content-Type: multipart/form-data

user_id: user123
frame: <image_file>
```

### Predict Cognitive Load
```http
POST /api/cognitive/predict-load
Content-Type: application/json

{
  "user_id": "user123",
  "metrics": {
    "typing_speed": 45,
    "pause_duration": 1.5,
    "eye_fixation": 0.8,
    "keystroke_variance": 0.12,
    "window_switches": 2
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required field: metrics"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error"
}
```
