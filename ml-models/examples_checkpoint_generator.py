"""
Example: Using the Mental Checkpoint Generator
Demonstrates integration with backend context preservation route
"""

from ml_models.nlp_models.checkpoint_generator import get_generator

def create_memory_checkpoint_example():
    """Example of creating a mental checkpoint"""
    
    generator = get_generator()
    
    # Example context from a developer's task
    context = {
        'task_name': 'Implement multi-threaded task queue',
        'problem_statement': '''
            Need to refactor the synchronous job processor to handle 
            concurrent requests. Current bottleneck at I/O operations.
        ''',
        'approach': '''
            Use ThreadPoolExecutor with queue-based architecture.
            Implement priority queue for job ordering.
            Add monitoring for thread pool health.
        ''',
        'key_concepts': [
            'ThreadPoolExecutor',
            'Queue.PriorityQueue',
            'Thread-safe dictionary',
            'Graceful shutdown'
        ],
        'decision_points': [
            {
                'decision': 'Choose ThreadPoolExecutor over multiprocessing',
                'reason': 'Lightweight, lower overhead, same threads can share memory',
                'alternatives': ['asyncio', 'multiprocessing', 'gevent']
            },
            {
                'decision': 'Implement priority queue for job ordering',
                'reason': 'Allows critical jobs to execute first',
                'alternatives': ['FIFO queue', 'multiple queues per priority']
            }
        ],
        'files_previously_open': [
            'src/workers/job_processor.py',
            'src/utils/queue.py',
            'tests/test_concurrent.py'
        ]
    }
    
    # Generate checkpoint
    checkpoint = generator.generate_checkpoint(context)
    
    print("=" * 60)
    print("MENTAL CHECKPOINT GENERATED")
    print("=" * 60)
    print(f"\nTask: {checkpoint['metadata']['task']}")
    print(f"Confidence: {checkpoint['metadata']['confidence']}")
    print(f"\nMental Model Summary:")
    print("-" * 40)
    print(checkpoint['mental_model_summary'])
    
    print(f"\n\nKey Decisions Made:")
    print("-" * 40)
    for i, decision in enumerate(checkpoint['key_decisions'], 1):
        print(f"{i}. {decision['decision']}")
        if decision.get('reason'):
            print(f"   Reason: {decision['reason']}")
    
    print(f"\n\nMemory Bridge (30-second re-entry guide):")
    print("-" * 40)
    print(checkpoint['memory_bridge']['transcript'])
    
    print(f"\nKey Points to Remember:")
    for point in checkpoint['memory_bridge']['key_points']:
        print(f"  • {point}")
    
    print(f"\nFiles to Review:")
    for file in checkpoint['memory_bridge']['suggested_files_to_review']:
        print(f"  • {file}")
    
    return checkpoint


def evaluate_checkpoint_effectiveness_example():
    """Example of evaluating how effective the memory bridge was"""
    
    generator = get_generator()
    
    # Feedback from developer after returning to task
    feedback = {
        'reentry_time': 42,  # seconds to regain context
        'clarity_rating': 4,  # 1-5 scale
        'completeness_rating': 4  # 1-5 scale
    }
    
    effectiveness = generator.evaluate_bridge_effectiveness(feedback)
    
    print("\n" + "=" * 60)
    print("MEMORY BRIDGE EFFECTIVENESS")
    print("=" * 60)
    print(f"Re-entry time: {feedback['reentry_time']}s")
    print(f"Clarity rating: {feedback['clarity_rating']}/5")
    print(f"Completeness rating: {feedback['completeness_rating']}/5")
    print(f"\nEffectiveness Score: {effectiveness} (0-1 scale)")
    
    if effectiveness > 0.8:
        print("✅ Excellent - This checkpoint was very helpful!")
    elif effectiveness > 0.6:
        print("✓ Good - Checkpoint helped re-entry")
    else:
        print("⚠ Fair - Consider adding more details to future checkpoints")
    
    return effectiveness


def batch_checkpoint_creation():
    """Example of creating multiple checkpoints for a work session"""
    
    generator = get_generator()
    
    # Multiple tasks during a work session
    tasks = [
        {
            'task_name': 'API authentication refactor',
            'problem_statement': 'Current JWT implementation has vulnerabilities',
            'approach': 'Implement refresh token rotation and rate limiting',
            'key_concepts': ['JWT', 'refresh tokens', 'token rotation'],
            'decision_points': [
                {'decision': 'Use refresh tokens instead of long-lived JWTs'}
            ]
        },
        {
            'task_name': 'Database optimization',
            'problem_statement': 'Slow queries on user profile lookups',
            'approach': 'Add indexes and implement query caching',
            'key_concepts': ['database indexes', 'redis caching', 'query plans'],
            'decision_points': [
                {'decision': 'Index on (user_id, created_at) composite key'}
            ]
        },
        {
            'task_name': 'Frontend performance tuning',
            'problem_statement': 'React components re-rendering excessively',
            'approach': 'Use React.memo and useMemo for optimization',
            'key_concepts': ['React.memo', 'useMemo', 'reselect'],
            'decision_points': [
                {'decision': 'Use reselect for Redux selector memoization'}
            ]
        }
    ]
    
    print("\n" + "=" * 60)
    print("BATCH CHECKPOINT GENERATION")
    print("=" * 60)
    
    checkpoints = []
    for task in tasks:
        checkpoint = generator.generate_checkpoint(task)
        checkpoints.append(checkpoint)
        print(f"\n✓ Created checkpoint: {task['task_name']}")
    
    print(f"\nTotal checkpoints created: {len(checkpoints)}")
    return checkpoints


if __name__ == '__main__':
    # Run examples
    print("\n📝 MENTAL CHECKPOINT GENERATOR - EXAMPLES\n")
    
    # Example 1: Create a checkpoint
    checkpoint = create_memory_checkpoint_example()
    
    # Example 2: Evaluate effectiveness
    effectiveness = evaluate_checkpoint_effectiveness_example()
    
    # Example 3: Batch creation
    checkpoints = batch_checkpoint_creation()
    
    print("\n" + "=" * 60)
    print("All examples completed successfully!")
    print("=" * 60)
