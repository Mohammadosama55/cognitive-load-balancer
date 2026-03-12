"""Cognitive load prediction routes"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

from utils.middleware import validate_request, handle_errors, log_request
from utils.helpers import format_response
from models.cognitive_load_predictor import CognitiveLoadPredictor

logger = logging.getLogger(__name__)
cognitive_bp = Blueprint('cognitive', __name__)

predictor = CognitiveLoadPredictor()

@cognitive_bp.route('/predict-load', methods=['POST'])
@handle_errors
@log_request()
@validate_request(required_fields=['user_id', 'metrics'])
def predict_load():
    """
    Predict cognitive load from multiple metrics
    
    Request JSON:
    {
        "user_id": "user123",
        "metrics": {
            "typing_speed": 45,
            "pause_duration": 2.5,
            "eye_fixation": 0.8,
            "keystroke_variance": 0.15,
            "window_switches": 3,
            "typing_rhythm_score": 0.7
        }
    }
    """
    data = request.get_json()
    
    user_id = data.get('user_id')
    metrics = data.get('metrics')
    
    # Predict cognitive load
    prediction = predictor.predict(metrics)
    
    response = format_response(
        success=True,
        data={
            'user_id': user_id,
            'cognitive_load': prediction['load_score'],
            'load_level': prediction['load_level'],
            'confidence': prediction['confidence'],
            'factors': prediction['contributing_factors'],
            'timestamp': datetime.utcnow().isoformat()
        },
        message='Cognitive load predicted successfully'
    )
    
    return jsonify(response), 200

@cognitive_bp.route('/task-switch-recommendation', methods=['POST'])
@handle_errors
@log_request()
@validate_request(required_fields=['user_id', 'current_load'])
def recommend_task_switch():
    """
    Recommend optimal task switching moment
    
    Request JSON:
    {
        "user_id": "user123",
        "current_load": 0.85,
        "available_tasks": ["code_review", "documentation", "testing"]
    }
    """
    data = request.get_json()
    
    user_id = data.get('user_id')
    current_load = data.get('current_load')
    available_tasks = data.get('available_tasks', [])
    
    recommendation = predictor.get_task_recommendation(current_load, available_tasks)
    
    response = format_response(
        success=True,
        data={
            'user_id': user_id,
            'should_switch': recommendation['should_switch'],
            'recommended_task': recommendation.get('recommended_task'),
            'reason': recommendation['reason'],
            'optimal_switch_time': recommendation.get('recommended_time'),
            'timestamp': datetime.utcnow().isoformat()
        }
    )
    
    return jsonify(response), 200

@cognitive_bp.route('/forecast-cognitive-weather', methods=['POST'])
@handle_errors
@log_request()
@validate_request(required_fields=['user_id', 'historical_data'])
def forecast_weather():
    """
    Generate cognitive weather forecast for upcoming hours
    
    Request JSON:
    {
        "user_id": "user123",
        "historical_data": [list of past cognitive load scores],
        "hours_ahead": 8
    }
    """
    data = request.get_json()
    
    user_id = data.get('user_id')
    historical_data = data.get('historical_data', [])
    hours_ahead = data.get('hours_ahead', 8)
    
    forecast = predictor.forecast_cognitive_weather(historical_data, hours_ahead)
    
    response = format_response(
        success=True,
        data={
            'user_id': user_id,
            'forecast': forecast,
            'current_weather': forecast[0] if forecast else None,
            'fatigue_windows': [i for i, hour in enumerate(forecast) if hour > 0.7],
            'timestamp': datetime.utcnow().isoformat()
        }
    )
    
    return jsonify(response), 200
