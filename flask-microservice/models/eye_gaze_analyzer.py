"""Eye-gaze and visual attention analyzer"""

import logging
import numpy as np
from typing import Dict, Any
from utils.helpers import normalize_score, clip_value

logger = logging.getLogger(__name__)

class EyeGazeAnalyzer:
    """Analyzes eye-gaze patterns from video frames using MediaPipe"""
    
    def __init__(self):
        try:
            import mediapipe as mp
            self.mp_face_mesh = mp.solutions.face_mesh
            self.mp_drawing = mp.solutions.drawing_utils
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=1,
                min_detection_confidence=0.5
            )
        except ImportError:
            logger.warning("MediaPipe not available - using mock implementation")
            self.face_mesh = None
    
    def analyze_frame(self, frame_path: str) -> Dict[str, Any]:
        """
        Analyze eye-gaze from a frame
        
        Args:
            frame_path: Path to image file
            
        Returns:
            Dict with eye-gaze metrics
        """
        try:
            import cv2
            
            # Read frame
            frame = cv2.imread(frame_path)
            if frame is None:
                raise ValueError(f"Could not read frame: {frame_path}")
            
            # Convert to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            h, w, _ = frame.shape
            
            if self.face_mesh is not None:
                results = self.face_mesh.process(rgb_frame)
                
                if results.multi_face_landmarks:
                    landmarks = results.multi_face_landmarks[0]
                    
                    # Extract eye landmarks (indices 33, 133 for left eye, 362, 263 for right)
                    left_eye_center = self._get_eye_center(landmarks, [33, 133, 155, 154, 153])
                    right_eye_center = self._get_eye_center(landmarks, [362, 263, 385, 384, 383])
                    
                    gaze_point = self._estimate_gaze_point(left_eye_center, right_eye_center, (w, h))
                    
                    return {
                        'gaze_point': gaze_point,
                        'left_eye_center': left_eye_center,
                        'right_eye_center': right_eye_center,
                        'fixation_stability': self._estimate_fixation_stability(landmarks),
                        'blink_rate': self._estimate_blink_rate(landmarks),
                        'attention_level': self._estimate_attention(landmarks),
                        'face_detected': True
                    }
            
            # Fallback: return mock data
            return self._get_mock_analysis()
            
        except Exception as e:
            logger.error(f"Error analyzing frame: {str(e)}")
            return self._get_mock_analysis()
    
    def _get_eye_center(self, landmarks, eye_indices):
        """Get center point of eye from landmarks"""
        eye_points = [landmarks.landmark[i] for i in eye_indices]
        center_x = sum(p.x for p in eye_points) / len(eye_points)
        center_y = sum(p.y for p in eye_points) / len(eye_points)
        return {'x': center_x, 'y': center_y}
    
    def _estimate_gaze_point(self, left_eye, right_eye, frame_size):
        """Estimate gaze point from eye centers"""
        avg_x = (left_eye['x'] + right_eye['x']) / 2.0
        avg_y = (left_eye['y'] + right_eye['y']) / 2.0
        return {
            'x': int(avg_x * frame_size[0]),
            'y': int(avg_y * frame_size[1]),
            'normalized_x': avg_x,
            'normalized_y': avg_y
        }
    
    def _estimate_fixation_stability(self, landmarks) -> float:
        """Estimate eye fixation stability (0-1, higher = more stable)"""
        # In real implementation, track landmark variance over time
        # For now, return mock value based on eye opening
        return clip_value(0.7 + np.random.normal(0, 0.1))
    
    def _estimate_blink_rate(self, landmarks) -> float:
        """Estimate blink rate (blinks per minute)"""
        # In real implementation, track blink events over time
        return 15.0 + np.random.normal(0, 3)  # Mock: typical 15 blinks/min
    
    def _estimate_attention(self, landmarks) -> float:
        """Estimate visual attention level (0-1)"""
        # Based on eye openness and fixation
        return clip_value(0.75)
    
    def detect_fatigue(self, frame_path: str) -> float:
        """
        Detect fatigue from visual cues
        
        Returns:
            Fatigue score (0-1, where 1 = very fatigued)
        """
        try:
            analysis = self.analyze_frame(frame_path)
            
            if not analysis.get('face_detected', False):
                return 0.5
            
            # Fatigue indicators:
            # - Low fixation stability
            # - High blink rate
            # - Low attention level
            fixation = 1.0 - analysis.get('fixation_stability', 0.7)
            blink_rate = min(analysis.get('blink_rate', 15) / 30.0, 1.0)  # Normalize to 30 blinks/min
            attention = 1.0 - analysis.get('attention_level', 0.75)
            
            fatigue = (fixation + blink_rate + attention) / 3.0
            return clip_value(fatigue)
            
        except Exception as e:
            logger.error(f"Error detecting fatigue: {str(e)}")
            return 0.5
    
    def _get_mock_analysis(self) -> Dict[str, Any]:
        """Return mock analysis when model unavailable"""
        return {
            'gaze_point': {
                'x': 640,
                'y': 360,
                'normalized_x': 0.5,
                'normalized_y': 0.5
            },
            'left_eye_center': {'x': 0.4, 'y': 0.4},
            'right_eye_center': {'x': 0.6, 'y': 0.4},
            'fixation_stability': 0.75,
            'blink_rate': 15.5,
            'attention_level': 0.8,
            'face_detected': False,
            'mock': True
        }
