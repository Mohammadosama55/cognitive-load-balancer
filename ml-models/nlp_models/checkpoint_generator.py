"""
NLP module for generating mental checkpoints and memory bridges
Uses transformers for summarization and context generation
"""

import logging
from typing import Dict, List, Any, Optional
import json

logger = logging.getLogger(__name__)

try:
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    logger.warning("Transformers not available - using mock implementation")
    TRANSFORMERS_AVAILABLE = False

class MentalCheckpointGenerator:
    """
    Generates mental checkpoints using NLP
    Summarizes current mental model and creates memory bridges
    """
    
    def __init__(self):
        if TRANSFORMERS_AVAILABLE:
            try:
                self.summarizer = pipeline(
                    "summarization",
                    model="facebook/bart-large-cnn",
                    device=-1  # CPU
                )
            except Exception as e:
                logger.warning(f"Failed to load summarizer: {e}")
                self.summarizer = None
        else:
            self.summarizer = None
    
    def generate_checkpoint(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a mental checkpoint from task context
        
        Args:
            context: Dict containing:
            - task_name: Current task
            - code_context: Relevant code snippets
            - problem_statement: What you're solving
            - approach: Your solution approach
            - key_concepts: Important variables/logic
            - decision_points: Key decisions made
        
        Returns:
            Checkpoint with summary and memory bridge data
        """
        try:
            # Generate mental model summary
            mental_summary = self._generate_mental_summary(context)
            
            # Extract key decision points
            decisions = self._extract_decisions(context)
            
            # Generate memory bridge script
            memory_bridge = self._generate_memory_bridge(
                context.get('task_name'),
                mental_summary,
                decisions
            )
            
            return {
                'mental_model_summary': mental_summary,
                'key_decisions': decisions,
                'memory_bridge': memory_bridge,
                'metadata': {
                    'generated_at': str(self._get_timestamp()),
                    'task': context.get('task_name'),
                    'confidence': 0.85
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating checkpoint: {e}")
            return {
                'error': str(e),
                'mental_model_summary': context.get('problem_statement', ''),
                'key_decisions': []
            }
    
    def _generate_mental_summary(self, context: Dict) -> str:
        """Generate summary of mental model"""
        problem = context.get('problem_statement', '')
        approach = context.get('approach', '')
        concepts = context.get('key_concepts', [])
        
        # Build summary text
        text = f"""
        Task: {context.get('task_name')}
        
        Problem: {problem}
        
        Approach: {approach}
        
        Key Concepts: {', '.join(concepts) if concepts else 'None identified'}
        """
        
        if self.summarizer:
            try:
                # Summarize with transformers
                summary = self.summarizer(text, max_length=100, min_length=30)
                return summary[0]['summary_text']
            except Exception as e:
                logger.warning(f"Summarization failed: {e}")
        
        # Fallback: return constructed summary
        return f"""
        You were working on: {context.get('task_name')}
        
        Problem: {problem[:200]}...
        
        Your approach: {approach[:200]}...
        
        Key things to remember: {', '.join(concepts[:3])}
        """.strip()
    
    def _extract_decisions(self, context: Dict) -> List[Dict[str, str]]:
        """Extract key decision points"""
        decisions = []
        
        decision_points = context.get('decision_points', [])
        for point in decision_points:
            if isinstance(point, dict):
                decisions.append({
                    'decision': point.get('decision', ''),
                    'reason': point.get('reason', ''),
                    'alternatives': point.get('alternatives', [])
                })
            elif isinstance(point, str):
                decisions.append({
                    'decision': str(point),
                    'reason': 'Important decision point'
                })
        
        # Also extract from problem statement
        approach = context.get('approach', '')
        if approach:
            decisions.append({
                'decision': 'Architecture/approach',
                'reason': approach[:150]
            })
        
        return decisions[:5]  # Top 5 decisions
    
    def _generate_memory_bridge(self, task_name: str, summary: str, decisions: List) -> Dict[str, Any]:
        """Generate memory bridge for task re-entry"""
        
        bridge_script = f"""
        Welcome back to {task_name}.
        
        You were focused on:
        {summary}
        
        Key decisions you made:
        """
        
        for i, decision in enumerate(decisions[:3], 1):
            bridge_script += f"\n{i}. {decision.get('decision')}"
            if decision.get('reason'):
                bridge_script += f" - {decision['reason'][:100]}"
        
        bridge_script += """
        
        Next steps:
        - Review the code context below
        - Check your last commits
        - Focus on the areas mentioned above
        
        You've got this! Let's continue building.
        """
        
        return {
            'transcript': bridge_script,
            'duration_seconds': 30,
            'key_points': [d.get('decision') for d in decisions[:3]],
            'suggested_files_to_review': self._suggest_files(summary),
            'estimated_reentry_time_seconds': 45
        }
    
    def _suggest_files_to_review(self, context: Dict) -> List[str]:
        """Suggest files to review for context re-entry"""
        files = context.get('files_previously_open', [])
        return files[:3] if files else []
    
    def _suggest_files(self, summary: str) -> List[str]:
        """Suggest files based on summary"""
        # Extract file patterns from summary
        import re
        pattern = r'\b[\w\-]+\.(py|js|ts|jsx|tsx|java|cpp|go)\b'
        matches = re.findall(pattern, summary)
        return list(set(matches))[:3]
    
    def _get_timestamp(self):
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat()
    
    def evaluate_bridge_effectiveness(self, feedback: Dict[str, Any]) -> float:
        """
        Evaluate how effective the memory bridge was
        
        Args:
            feedback: Dict with:
            - reentry_time: time to regain context (seconds)
            - clarity_rating: 1-5 scale
            - completeness_rating: 1-5 scale
        
        Returns:
            Effectiveness score 0-1
        """
        # Time score (lower is better, ideal ~45 seconds)
        time_score = 1.0 - (abs(feedback.get('reentry_time', 45) - 45) / 120)
        time_score = max(0, min(1, time_score))
        
        # Quality score (average of ratings)
        clarity = feedback.get('clarity_rating', 3) / 5.0
        completeness = feedback.get('completeness_rating', 3) / 5.0
        quality_score = (clarity + completeness) / 2.0
        
        # Combined score
        effectiveness = (time_score + quality_score) / 2.0
        
        return round(effectiveness, 3)


# Singleton instance
_generator = None

def get_generator() -> MentalCheckpointGenerator:
    """Get or create singleton generator"""
    global _generator
    if _generator is None:
        _generator = MentalCheckpointGenerator()
    return _generator
