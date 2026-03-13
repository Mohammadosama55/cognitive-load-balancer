"""Cognitive load prediction model"""

import logging
import numpy as np
from typing import List, Dict, Any, Optional
from utils.helpers import calculate_average, clip_value

logger = logging.getLogger(__name__)

class CognitiveLoadPredictor:
    """
    Predicts cognitive load from multiple metrics using ML
    Implements attention residue research principles for task switching
    """
    
    def __init__(self):
        # Task difficulty levels (for recommendation system)
        self.task_difficulty = {
            'code_review': 0.6,
            'documentation': 0.2,
            'testing': 0.5,
            'debugging': 0.85,
            'refactoring': 0.75,
            'meetings': 0.3,
            'planning': 0.4
        }
        
        # Attention residue costs (how much cognitive load remains after task switch)
        self.attention_residue_cost = 0.4
    
    def predict(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict cognitive load from metrics
        
        Args:
            metrics: Dict with typing_speed, eye_fixation, etc.
            
        Returns:
            Dict with load prediction and confidence
        """
        # Normalize metrics to 0-1 scale
        normalized = self._normalize_metrics(metrics)
        
        # Weight different factors
        weights = {
            'typing_speed': 0.2,
            'pause_duration': 0.15,
            'eye_fixation': 0.25,
            'keystroke_variance': 0.15,
            'window_switches': 0.15,
            'typing_rhythm_score': 0.1
        }
        
        load_score = 0.0
        for metric, weight in weights.items():
            if metric in normalized:
                load_score += normalized[metric] * weight
        
        load_score = clip_value(load_score)
        
        # Calculate confidence based on data completeness
        available_metrics = sum(1 for m in weights.keys() if m in metrics)
        confidence = available_metrics / len(weights)
        
        # Identify contributing factors
        factors = self._identify_factors(normalized, load_score)
        
        return {
            'load_score': round(load_score, 3),
            'load_level': self._classify_load(load_score),
            'confidence': round(confidence, 3),
            'contributing_factors': factors,
            'recommendation': self._get_load_recommendation(load_score)
        }
    
    def _normalize_metrics(self, metrics: Dict) -> Dict[str, float]:
        """Normalize raw metrics to 0-1 scale (where 1 = high cognitive load)"""
        normalized = {}

        # Typing speed: smooth continuous curve
        # 0 wpm (idle) → 0.75, 40 wpm (normal) → 0.45, 80+ wpm (fast) → 0.1
        if 'typing_speed' in metrics:
            speed = float(metrics['typing_speed'])
            normalized['typing_speed'] = clip_value(max(0.1, 0.85 - (speed / 95.0)))

        # Pause duration: longer pauses = higher load (continuous)
        if 'pause_duration' in metrics:
            pause = float(metrics['pause_duration'])
            normalized['pause_duration'] = clip_value(pause / 8.0)

        # Eye fixation: lower fixation = higher load (continuous, inverted)
        if 'eye_fixation' in metrics:
            normalized['eye_fixation'] = clip_value(1.0 - float(metrics['eye_fixation']))

        # Keystroke variance: higher variance = higher load (continuous)
        if 'keystroke_variance' in metrics:
            variance = float(metrics['keystroke_variance'])
            normalized['keystroke_variance'] = clip_value(variance / 0.5)

        # Window switches: continuous scale, not bucketed
        if 'window_switches' in metrics:
            switches = float(metrics['window_switches'])
            normalized['window_switches'] = clip_value(switches / 8.0)

        # Typing rhythm: lower regularity = higher load (inverted)
        if 'typing_rhythm_score' in metrics:
            normalized['typing_rhythm_score'] = clip_value(1.0 - float(metrics['typing_rhythm_score']))

        return normalized
    
    def _classify_load(self, score: float) -> str:
        """Classify load level"""
        if score < 0.25:
            return 'very_low'
        elif score < 0.4:
            return 'low'
        elif score < 0.6:
            return 'medium'
        elif score < 0.8:
            return 'high'
        else:
            return 'very_high'
    
    def _identify_factors(self, normalized: Dict, overall_score: float) -> List[str]:
        """Identify main contributing factors to cognitive load"""
        factors = []
        threshold = overall_score * 1.2  # Factors above average contribution
        
        for metric, value in normalized.items():
            if value > 0.6:
                factors.append(self._factor_name(metric))
        
        return factors[:3]  # Top 3 factors
    
    def _factor_name(self, metric: str) -> str:
        """Convert metric name to human-readable factor"""
        names = {
            'typing_speed': 'Slow typing',
            'pause_duration': 'Extended pauses',
            'eye_fixation': 'Reduced focus',
            'keystroke_variance': 'Inconsistent typing',
            'window_switches': 'Task switching',
            'typing_rhythm_score': 'Irregular rhythm'
        }
        return names.get(metric, metric)
    
    def _get_load_recommendation(self, load_score: float) -> str:
        """Get recommendation based on load level"""
        if load_score < 0.4:
            return 'take_on_complex_tasks'
        elif load_score < 0.6:
            return 'maintain_current_pace'
        elif load_score < 0.8:
            return 'switch_to_lighter_tasks'
        else:
            return 'take_break'
    
    def get_task_recommendation(self, current_load: float, available_tasks: List[str]) -> Dict[str, Any]:
        """
        Recommend task switch based on current load
        
        Using attention residue research: better to switch when load is high
        """
        # Optimal load threshold for task switching
        optimal_threshold = 0.65
        
        if current_load < optimal_threshold:
            return {
                'should_switch': False,
                'reason': 'Current cognitive load is manageable. Continue current task.',
                'recommended_time': None
            }
        
        # Select lowest difficulty task from available
        recommended_task = min(
            available_tasks,
            key=lambda t: self.task_difficulty.get(t, 0.5),
            default=None
        )
        
        return {
            'should_switch': True,
            'recommended_task': recommended_task,
            'reason': f'High cognitive load ({current_load:.2f}). Switch to lighter task to reduce burden.',
            'recommended_time': 'now',
            'context_switch_cost': round(self.attention_residue_cost, 2)
        }
    
    def forecast_cognitive_weather(self, historical_data: List[float], hours_ahead: int = 8) -> List[float]:
        """
        Forecast cognitive load for coming hours
        
        Uses simple ARIMA-like approach with circadian rhythm consideration
        """
        if not historical_data:
            return [0.5] * hours_ahead
        
        # Simple trend and seasonal forecast
        forecast = []
        recent_avg = calculate_average(historical_data[-5:]) if len(historical_data) >= 5 else calculate_average(historical_data)
        
        for hour in range(hours_ahead):
            # Circadian rhythm component (dip in early morning, peak early afternoon)
            current_hour = (len(historical_data) + hour) % 24
            circadian_factor = self._get_circadian_factor(current_hour)
            
            # Trend component
            trend = 0.05 if len(historical_data) > 20 else 0  # Slight increase over day
            
            # Forecast for this hour
            predicted = recent_avg + trend + (circadian_factor * 0.1)
            predicted = clip_value(predicted)
            
            forecast.append(round(predicted, 3))
        
        return forecast
    
    def _get_circadian_factor(self, hour: int) -> float:
        """
        Get circadian rhythm factor for given hour (24-hour format)
        
        Returns:
            Factor to multiply with load prediction (-1 to 1)
        """
        # Low in morning (6), peak around 2-4 PM (14-16)
        if 6 <= hour < 12:
            return -0.5 + (hour - 6) / 12
        elif 12 <= hour < 16:
            return 0.5
        elif 16 <= hour < 22:
            return 0.5 - (hour - 16) / 10
        else:
            return -0.8  # Very low late night/early morning
