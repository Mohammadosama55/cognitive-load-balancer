"""Utility functions for Flask microservice"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

def format_response(success: bool, data: Any = None, message: str = None, error: str = None, status_code: int = 200):
    """Format standardized API response"""
    response = {
        'success': success,
        'timestamp': datetime.utcnow().isoformat(),
        'status_code': status_code
    }
    
    if data is not None:
        response['data'] = data
    
    if message:
        response['message'] = message
    
    if error:
        response['error'] = error
    
    return response

def calculate_average(values: List[float]) -> float:
    """Calculate average of numeric values"""
    if not values:
        return 0.0
    return sum(values) / len(values)

def normalize_score(value: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    """Normalize a value between min and max"""
    if max_val == min_val:
        return 0.5
    return (value - min_val) / (max_val - min_val)

def clip_value(value: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    """Clip value between min and max"""
    return max(min_val, min(max_val, value))
