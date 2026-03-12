# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Option 1: Using Docker (Recommended)

```bash
# 1. Navigate to project root
cd cognitive-load-balancer

# 2. Start all services
docker-compose up

# 3. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Flask Service: http://localhost:5001
```

### Option 2: Manual Setup

#### Prerequisites
- Node.js 16+
- Python 3.9+
- MongoDB (installed or via `brew install mongodb-community`)

#### Step 1: Flask Microservice
```bash
cd flask-microservice

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Flask
python app.py
# Server runs on http://localhost:5001
```

#### Step 2: Backend API
```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev
# Server runs on http://localhost:5000
```

#### Step 3: Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# App opens at http://localhost:3000
```

## 📝 First Time Setup

### 1. Database
Make sure MongoDB is running:
```bash
# If using Docker
docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=admin123 mongo

# Or if MongoDB is installed locally
mongod
```

### 2. Environment Variables
Copy `.env.example` to `.env` and update if needed:
```bash
cp .env.example .env
```

### 3. Create an Account
Visit http://localhost:3000 and register a new account

## 🧪 Testing the System

### 1. Simulate IDE Telemetry
```bash
curl -X POST http://localhost:5000/api/telemetry/record \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "typingSpeed": 45,
    "pauseDuration": 1.5,
    "keystrokeVariance": 0.12,
    "mouseMovementSpeed": 100,
    "windowSwitches": 2,
    "sessionId": "session_1",
    "ideName": "VS Code",
    "projectName": "Test Project"
  }'
```

### 2. Get Cognitive Load Prediction
```bash
curl -X POST http://localhost:5000/api/cognitive-load/predict \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": {
      "typing_speed": 45,
      "pause_duration": 1.5,
      "eye_fixation": 0.8,
      "keystroke_variance": 0.12,
      "window_switches": 2,
      "typing_rhythm_score": 0.85
    }
  }'
```

### 3. Get Cognitive Weather Forecast
```bash
curl -X POST http://localhost:5000/api/cognitive-load/forecast \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "historicalData": [0.4, 0.5, 0.6, 0.55, 0.65],
    "hoursAhead": 8
  }'
```

## 📊 Key Features Demo

### 1. Dashboard
- Real-time cognitive load visualization
- Current load percentage and contributing factors
- 24-hour forecast preview
- Task recommendations

### 2. Cognitive Weather Forecast
- Hourly cognitive load predictions
- Peak load identification
- Low-load windows for routine tasks
- Pattern insights

### 3. Task Scheduler
- Smart task recommendations based on current load
- Task difficulty matching
- Optimal time suggestions
- One-click scheduling

### 4. Context Preservation
- Automatic mental checkpoint creation
- Memory bridge generation
- Seamless task re-entry
- Previous context recovery

### 5. Profile & Settings
- User preferences
- Privacy controls
- Data retention settings
- Cognitive profile customization

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running
```bash
# Start MongoDB
mongod
# or with Docker
docker run -d -p 27017:27017 mongo
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Kill the process using the port
```bash
# Find process
lsof -i :5000

# Kill it
kill -9 <PID>
```

### Token Expired
**Solution**: Log out and log back in to get a new token

### Flask Service Not Connecting
**Solution**: Verify FLASK_SERVICE_URL in backend .env matches Flask service location

## 📚 Documentation

- [API Documentation](./docs/API.md) - Complete API reference
- [Architecture Guide](./docs/ARCHITECTURE.md) - System design
- [Development Guide](./docs/DEVELOPMENT.md) - Detailed setup and feature development

## 🤝 Contributing

Contributions welcome! Please:
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📄 License

MIT License - feel free to use this project

## 💡 Next Steps

- [ ] Integrate with your IDE (VSCode, JetBrains, etc.)
- [ ] Train custom ML models on your coding patterns
- [ ] Set up production deployment
- [ ] Configure data retention policies
- [ ] Customize cognitive profiles

## 📞 Support

Having issues? Check:
1. [Troubleshooting Section](#-troubleshooting)
2. [API Documentation](./docs/API.md)
3. [Architecture Guide](./docs/ARCHITECTURE.md)

---

**Happy coding with optimal cognitive load! 🧠💪**
