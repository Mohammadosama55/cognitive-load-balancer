import os
from datetime import timedelta

class Config:
    """Base configuration"""
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = FLASK_ENV == 'development'
    
    # API Configuration
    API_TITLE = 'Cognitive Load Microservice'
    API_VERSION = 'v1'
    
    # Security
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    
    # External services
    BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')
    
    # Computer Vision Settings
    CV_MODEL_PATH = os.getenv('CV_MODEL_PATH', './models/trained_models')
    EYE_GAZE_THRESHOLD = 0.7
    TYPING_RHYTHM_THRESHOLD = 0.6
    
    # ML Model paths
    COGNITIVE_LOAD_MODEL = os.getenv('COGNITIVE_LOAD_MODEL', './models/cognitive_load_model.pkl')
    
    # Timeouts
    REQUEST_TIMEOUT = 30
    PROCESSING_TIMEOUT = 60
    
    # Feature flags
    ENABLE_WEBCAM_PROCESSING = os.getenv('ENABLE_WEBCAM_PROCESSING', 'true').lower() == 'true'
    ENABLE_TELEMETRY_PROCESSING = os.getenv('ENABLE_TELEMETRY_PROCESSING', 'true').lower() == 'true'
