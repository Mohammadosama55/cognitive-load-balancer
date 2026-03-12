"""Computer Vision routes for eye-gaze and visual analysis"""

from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
import logging
import os

from utils.middleware import validate_request, handle_errors, log_request
from utils.helpers import format_response
from models.eye_gaze_analyzer import EyeGazeAnalyzer
from models.typing_rhythm_analyzer import TypingRhythmAnalyzer

logger = logging.getLogger(__name__)
cv_bp = Blueprint('cv', __name__)

eye_gaze_analyzer = EyeGazeAnalyzer()
typing_analyzer = TypingRhythmAnalyzer()

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'bmp'}
UPLOAD_FOLDER = '/tmp/cognitive-load/uploads'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@cv_bp.route('/analyze-eye-gaze', methods=['POST'])
@handle_errors
@log_request()
def analyze_eye_gaze():
    """
    Analyze eye-gaze from frame data
    
    Request: multipart/form-data with 'frame' file
    """
    if 'frame' not in request.files:
        return jsonify({'error': 'No frame provided'}), 400
    
    frame = request.files['frame']
    user_id = request.form.get('user_id', 'unknown')
    
    if frame.filename == '':
        return jsonify({'error': 'No selected frame'}), 400
    
    if not allowed_file(frame.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    try:
        # Save temporarily
        filename = secure_filename(frame.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        frame.save(filepath)
        
        # Analyze
        analysis = eye_gaze_analyzer.analyze_frame(filepath)
        
        # Clean up
        os.remove(filepath)
        
        response = format_response(
            success=True,
            data={
                'user_id': user_id,
                'eye_gaze_analysis': analysis,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Eye gaze analysis error: {str(e)}")
        return jsonify({'error': 'Analysis failed'}), 500

@cv_bp.route('/analyze-typing-rhythm', methods=['POST'])
@handle_errors
@log_request()
@validate_request(required_fields=['user_id', 'keystroke_data'])
def analyze_typing_rhythm():
    """
    Analyze typing rhythm patterns
    
    Request JSON:
    {
        "user_id": "user123",
        "keystroke_data": [
            {"timestamp": 1234567890, "key": "a", "duration": 0.05},
            ...
        ]
    }
    """
    data = request.get_json()
    
    user_id = data.get('user_id')
    keystrokes = data.get('keystroke_data', [])
    
    analysis = typing_analyzer.analyze(keystrokes)
    
    response = format_response(
        success=True,
        data={
            'user_id': user_id,
            'typing_analysis': analysis,
            'timestamp': datetime.utcnow().isoformat()
        }
    )
    
    return jsonify(response), 200

@cv_bp.route('/fatigue-detection', methods=['POST'])
@handle_errors
@log_request()
def detect_fatigue():
    """Detect fatigue from multiple visual cues"""
    if 'frame' not in request.files:
        return jsonify({'error': 'No frame provided'}), 400
    
    frame = request.files['frame']
    user_id = request.form.get('user_id', 'unknown')
    
    try:
        filename = secure_filename(frame.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        frame.save(filepath)
        
        # Multi-modal fatigue detection
        fatigue_score = eye_gaze_analyzer.detect_fatigue(filepath)
        
        os.remove(filepath)
        
        response = format_response(
            success=True,
            data={
                'user_id': user_id,
                'fatigue_score': fatigue_score,
                'fatigue_level': 'high' if fatigue_score > 0.7 else 'medium' if fatigue_score > 0.4 else 'low',
                'timestamp': datetime.utcnow().isoformat()
            }
        )
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Fatigue detection error: {str(e)}")
        return jsonify({'error': 'Detection failed'}), 500
