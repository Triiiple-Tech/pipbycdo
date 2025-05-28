import sys
import os
from dotenv import load_dotenv

load_dotenv() # Load .env file from the root directory

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))