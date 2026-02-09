from python.main import app

# Vercel requires this for the serverless function
import os
import sys

# Add the parent directory to sys.path so we can import from python/
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
