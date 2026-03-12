#!/usr/bin/env python
"""
Cognitive Load Balancer - Flask Microservice
Analyzes IDE telemetry, eye-gaze patterns, and predicts cognitive load
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app
from app import create_app

if __name__ == '__main__':
    app = create_app()
    
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5001))
    debug = os.getenv('FLASK_ENV', 'production') == 'development'
    
    print(f"""
    ╔════════════════════════════════════════════════════════════════╗
    ║   Cognitive Load Balancer - Flask Microservice                 ║
    ║───────────────────────────────────────────────────────────────║
    ║   Running on http://{host}:{port}                             ║
    ║   Environment: {'Development' if debug else 'Production'}                      ║
    ║   Debug: {debug}                                                 ║
    ╚════════════════════════════════════════════════════════════════╝
    """)
    
    app.run(host=host, port=port, debug=debug)
