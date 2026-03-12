"""Telemetry routes for IDE telemetry analysis"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

from utils.middleware import validate_request, handle_errors, log_request
from utils.helpers import format_response
from models.telemetry_analyzer import TelemetryAnalyzer

logger = logging.getLogger(__name__)
telemetry_bp = Blueprint('telemetry', __name__)
telemetry_analyzer = TelemetryAnalyzer()

@telemetry_bp.route('/analyze', methods=['POST'])
@handle_errors
@log_request()
@validate_request(required_fields=['user_id', 'telemetry_data'])
def analyze_telemetry():
    """
    Analyze IDE telemetry data
    
    Request JSON:
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
    """
    data = request.get_json()
    
    user_id = data.get('user_id')
    telemetry = data.get('telemetry_data')
    
    # Analyze telemetry
    analysis = telemetry_analyzer.analyze(telemetry)
    
    response = format_response(
        success=True,
        data={
            'user_id': user_id,
            'analysis': analysis,
            'timestamp': datetime.utcnow().isoformat()
        },
        message='Telemetry analyzed successfully'
    )
    
    return jsonify(response), 200

@telemetry_bp.route('/batch-analyze', methods=['POST'])
@handle_errors
@log_request()
@validate_request(required_fields=['user_id', 'telemetry_batch'])
def batch_analyze():
    """Analyze batch of telemetry data"""
    data = request.get_json()
    
    user_id = data.get('user_id')
    batch = data.get('telemetry_batch', [])
    
    results = []
    for telemetry in batch:
        analysis = telemetry_analyzer.analyze(telemetry)
        results.append(analysis)
    
    response = format_response(
        success=True,
        data={
            'user_id': user_id,
            'batch_size': len(batch),
            'analyses': results,
            'aggregate_metrics': telemetry_analyzer.aggregate(results)
        },
        message=f'Analyzed {len(batch)} telemetry records'
    )
    
    return jsonify(response), 200

@telemetry_bp.route('/commit-analysis', methods=['POST'])
@handle_errors
@log_request()
@validate_request(required_fields=['user_id', 'commits'])
def analyze_commits():
    """Analyze commit frequency and patterns"""
    data = request.get_json()
    
    user_id = data.get('user_id')
    commits = data.get('commits', [])
    
    analysis = telemetry_analyzer.analyze_commit_patterns(commits)
    
    response = format_response(
        success=True,
        data={
            'user_id': user_id,
            'commit_analysis': analysis,
            'timestamp': datetime.utcnow().isoformat()
        }
    )
    
    return jsonify(response), 200
