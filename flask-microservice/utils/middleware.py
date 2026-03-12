from functools import wraps
from flask import request, jsonify
import logging

logger = logging.getLogger(__name__)

def validate_request(required_fields=None):
    """Decorator to validate request JSON"""
    if required_fields is None:
        required_fields = []
    
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Check if request has JSON
            if not request.is_json:
                return jsonify({'error': 'Content-Type must be application/json'}), 400
            
            data = request.get_json()
            
            # Check required fields
            for field in required_fields:
                if field not in data or data[field] is None:
                    return jsonify({'error': f'Missing required field: {field}'}), 400
            
            return f(*args, **kwargs)
        return wrapper
    return decorator

def log_request():
    """Middleware to log request information"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            logger.info(f"{request.method} {request.path} from {request.remote_addr}")
            return f(*args, **kwargs)
        return wrapper
    return decorator

def handle_errors(f):
    """Decorator to centralized error handling"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            logger.warning(f"Validation error: {str(e)}")
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500
    return wrapper
