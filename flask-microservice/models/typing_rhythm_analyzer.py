"""Typing rhythm and keystroke dynamics analyzer"""

import logging
import numpy as np
from typing import List, Dict, Any
from utils.helpers import calculate_average, normalize_score, clip_value

logger = logging.getLogger(__name__)

class TypingRhythmAnalyzer:
    """Analyzes typing rhythm and keystroke dynamics"""
    
    def __init__(self):
        self.normal_inter_keystroke_interval = 0.08  # seconds
        self.normal_key_hold_duration = 0.15  # seconds
    
    def analyze(self, keystrokes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze typing rhythm patterns
        
        Args:
            keystrokes: List of keystroke events with timestamp and duration
            
        Returns:
            Dict with typing analysis metrics
        """
        if len(keystrokes) < 2:
            return {
                'keystroke_count': len(keystrokes),
                'analysis_status': 'insufficient_data'
            }
        
        # Calculate inter-keystroke intervals
        intervals = []
        hold_times = []
        
        for keystroke in keystrokes:
            if 'duration' in keystroke:
                hold_times.append(keystroke['duration'])
        
        for i in range(1, len(keystrokes)):
            prev_time = keystrokes[i-1].get('timestamp', 0)
            curr_time = keystrokes[i].get('timestamp', 0)
            interval = curr_time - prev_time
            if interval > 0:
                intervals.append(interval)
        
        # Calculate metrics
        avg_interval = calculate_average(intervals)
        var_interval = np.var(intervals) if intervals else 0
        avg_hold = calculate_average(hold_times)
        
        # Assess typing patterns
        typing_consistency = self._assess_consistency(var_interval)
        typing_speed = self._assess_speed(avg_interval)
        stress_indicators = self._detect_stress(keystrokes)
        
        return {
            'keystroke_count': len(keystrokes),
            'avg_inter_keystroke_interval': round(avg_interval, 4),
            'keystroke_interval_variance': round(var_interval, 4),
            'avg_key_hold_duration': round(avg_hold, 4),
            'typing_consistency_score': round(typing_consistency, 3),
            'typing_speed_score': round(typing_speed, 3),
            'stress_level': stress_indicators['level'],
            'stress_indicators': stress_indicators['indicators'],
            'overall_typing_health': self._calculate_typing_health(
                typing_consistency, typing_speed, stress_indicators
            )
        }
    
    def _assess_consistency(self, variance: float) -> float:
        """
        Assess typing consistency based on interval variance
        
        Returns:
            Score 0-1 (1 = very consistent)
        """
        # Low variance = consistent, high variance = inconsistent = sign of cognitive load
        if variance < 0.001:
            return 0.9
        elif variance < 0.01:
            return normalize_score(variance, 0.001, 0.01)
        else:
            return clip_value(0.1 - variance * 0.1)
    
    def _assess_speed(self, avg_interval: float) -> float:
        """
        Assess typing speed
        
        Returns:
            Score 0-1 (1 = very fast, good typing speed)
        """
        if avg_interval < 0.05:
            return 0.95
        elif avg_interval < 0.15:
            return normalize_score(avg_interval, 0.05, 0.15)
        else:
            return 0.1  # Very slow, likely thinking/struggling
    
    def _detect_stress(self, keystrokes: List[Dict]) -> Dict[str, Any]:
        """Detect signs of stress and cognitive overload in typing"""
        indicators = []
        stress_score = 0
        
        # Check for rapid key presses (stress-induced speed increase)
        fast_keystrokes = sum(1 for k in keystrokes if k.get('duration', 0) < 0.05)
        if fast_keystrokes > len(keystrokes) * 0.3:
            indicators.append('rapid_keystrokes')
            stress_score += 0.2
        
        # Check for erratic patterns
        durations = [k.get('duration', 0) for k in keystrokes if 'duration' in k]
        if durations and np.std(durations) > 0.15:
            indicators.append('erratic_rhythm')
            stress_score += 0.3
        
        # High number of corrections
        if self._count_corrections(keystrokes) > len(keystrokes) * 0.1:
            indicators.append('frequent_corrections')
            stress_score += 0.25
        
        level = 'low' if stress_score < 0.3 else 'medium' if stress_score < 0.6 else 'high'
        
        return {
            'score': clip_value(stress_score),
            'level': level,
            'indicators': indicators
        }
    
    def _count_corrections(self, keystrokes: List[Dict]) -> int:
        """Count number of corrections (backspaces, deletes)"""
        correction_keys = {'Backspace', 'Delete'}
        return sum(1 for k in keystrokes if k.get('key') in correction_keys)
    
    def _calculate_typing_health(self, consistency: float, speed: float, stress: Dict) -> str:
        """Calculate overall typing health"""
        health_score = (consistency + speed + (1 - stress['score'])) / 3.0
        
        if health_score > 0.75:
            return 'excellent'
        elif health_score > 0.6:
            return 'good'
        elif health_score > 0.4:
            return 'fair'
        else:
            return 'poor'
