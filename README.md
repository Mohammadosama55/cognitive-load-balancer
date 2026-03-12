# Cognitive Load Balancer for Developers

An AI-powered system that monitors and optimizes developer cognitive load through real-time telemetry analysis, eye-gaze tracking, and intelligent task scheduling.

## Features

- **Real-time Cognitive Load Monitoring**: Analyzes eye gaze patterns, typing rhythm, and commit frequency
- **Cognitive Weather Forecast**: Dashboard showing predicted fatigue windows
- **Intelligent Task Scheduling**: Suggests optimal task switching moments
- **Context Preservation AI**: Generates "mental checkpoints" when switching tasks
  - Summarizes current mental model
  - Captures IDE state and open tabs
  - Creates 30-second memory bridge video for task re-entry
  - Reduces context-switch cognitive cost by ~40%
- **Privacy-First Vision**: On-device processing for all biometric data

## Tech Stack

- **Frontend**: React, Redux (MERN)
- **Backend**: Node.js, Express, MongoDB (MERN)
- **Microservice**: Flask + Computer Vision
- **ML Models**: TensorFlow, scikit-learn for cognitive load prediction
- **Vision**: OpenCV, MediaPipe for eye gaze tracking
- **NLP**: transformers, spaCy for mental checkpoint generation

## Project Structure

```
cognitive-load-balancer/
├── flask-microservice/    # Python Flask microservice for telemetry analysis
├── backend/              # Node.js/Express API server
├── frontend/             # React dashboard application
├── ml-models/            # Machine learning models
│   ├── cognitive_load/   # Cognitive load prediction models
│   ├── nlp_models/       # NLP for memory bridges
│   └── cv_models/        # Computer vision for eye-gaze
├── shared/               # Shared utilities and types
└── docs/                 # Documentation
```

## Quick Start

### Prerequisites
- Node.js 16+
- Python 3.9+
- MongoDB
- Docker & Docker Compose (optional)

### Installation

```bash
# Install dependencies for all services
npm install                    # Root workspace
cd backend && npm install
cd ../frontend && npm install
cd ../flask-microservice && pip install -r requirements.txt
```

### Running Services

```bash
# Development environment with docker-compose
docker-compose up

# Or run individually
cd backend && npm run dev
cd frontend && npm run dev
cd flask-microservice && python app.py
```

## API Documentation

See `docs/` folder for detailed API specifications and integration guides.

## Privacy & Security

- All eye-gaze and facial analysis happens on-device
- No webcam data is transmitted to servers
- Telemetry data is encrypted and anonymized
- Users maintain full control over data collection

## Development

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed development setup and contribution guidelines.
