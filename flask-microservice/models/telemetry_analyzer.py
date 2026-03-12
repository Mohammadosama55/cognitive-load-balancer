"""Telemetry data analyzer"""

import logging
from typing import Dict, List, Any
from utils.helpers import calculate_average, normalize_score, clip_value

logger = logging.getLogger(__name__)

class TelemetryAnalyzer:
    """Analyzes IDE telemetry data to infer cognitive load patterns"""
    
    def __init__(self):
        self.typing_speed_threshold = 40  # WPM
        self.pause_threshold = 3.0  # seconds
        self.keystroke_variance_threshold = 0.2
    
    def analyze(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze single telemetry data point
        
        Args:
            telemetry: Dict with keys like typing_speed, pause_duration, etc.
        
        Returns:
            Dict with analysis results
        """
        typing_speed = telemetry.get('typing_speed', 0)
        pause_duration = telemetry.get('pause_duration', 0)
        keystroke_variance = telemetry.get('keystroke_variance', 0)
        mouse_speed = telemetry.get('mouse_movement_speed', 0)
        window_switches = telemetry.get('window_switches', 0)
        
        # Calculate individual scores (0-1 range, where 1 = high load)
        typing_load = self._assess_typing_load(typing_speed, keystroke_variance)
        pause_load = self._assess_pause_load(pause_duration)
        switching_load = self._assess_switching_load(window_switches)
        
        # Aggregate
        aggregate_load = (typing_load + pause_load + switching_load) / 3.0
        
        return {
            'typing_load_score': round(typing_load, 3),
            'pause_load_score': round(pause_load, 3),
            'switching_load_score': round(switching_load, 3),
            'aggregate_load_score': round(aggregate_load, 3),
            'load_level': self._classify_load(aggregate_load),
            'typing_speed': typing_speed,
            'keystroke_stability': 1.0 - keystroke_variance
        }
    
    def _assess_typing_load(self, typing_speed: float, variance: float) -> float:
        """Lower typing speed = higher cognitive load"""
        if typing_speed < 20:
            speed_score = 0.9
        elif typing_speed < self.typing_speed_threshold:
            speed_score = normalize_score(typing_speed, 20, self.typing_speed_threshold)
        else:
            speed_score = 0.3
        
        # High variance = hesitation = high load
        variance_score = normalize_score(variance, 0, self.keystroke_variance_threshold)
        
        return clip_value((speed_score + variance_score) / 2.0)
    
    def _assess_pause_load(self, pause_duration: float) -> float:
        """Longer pauses = higher cognitive load"""
        if pause_duration < 1.0:
            return 0.2
        elif pause_duration < self.pause_threshold:
            return normalize_score(pause_duration, 1.0, self.pause_threshold)
        else:
            return 0.8
    
    def _assess_switching_load(self, switches: int) -> float:
        """More switches = higher context switch load"""
        if switches == 0:
            return 0.1
        elif switches < 3:
            return 0.3
        elif switches < 6:
            return 0.6
        else:
            return 0.9
    
    def _classify_load(self, score: float) -> str:
        """Classify load level"""
        if score < 0.33:
            return 'low'
        elif score < 0.66:
            return 'medium'
        else:
            return 'high'
    
    def analyze_commit_patterns(self, commits: List[Dict]) -> Dict[str, Any]:
        """Analyze commit frequency and patterns"""
        if not commits:
            return {'pattern': 'no_data', 'frequency': 0}
        
        # Calculate time between commits
        intervals = []
        for i in range(1, len(commits)):
            interval = commits[i]['timestamp'] - commits[i-1]['timestamp']
            intervals.append(interval)
        
        avg_interval = calculate_average(intervals)
        
        return {
            'commit_count': len(commits),
            'avg_interval_minutes': round(avg_interval / 60, 2),
            'pattern': 'regular' if avg_interval > 300 else 'frequent',
            'likely_focus_level': 'high' if 300 < avg_interval < 900 else 'medium'
        }
    
    def aggregate(self, analyses: List[Dict]) -> Dict[str, Any]:
        """Aggregate multiple analyses"""
        if not analyses:
            return {}
        
        typing_scores = [a.get('typing_load_score', 0) for a in analyses]
        pause_scores = [a.get('pause_load_score', 0) for a in analyses]
        switching_scores = [a.get('switching_load_score', 0) for a in analyses]
        
        return {
            'avg_typing_load': round(calculate_average(typing_scores), 3),
            'avg_pause_load': round(calculate_average(pause_scores), 3),
            'avg_switching_load': round(calculate_average(switching_scores), 3),
            'max_load': round(max([a.get('aggregate_load_score', 0) for a in analyses]), 3),
            'min_load': round(min([a.get('aggregate_load_score', 1) for a in analyses]), 3),
            'sample_count': len(analyses)
        }
