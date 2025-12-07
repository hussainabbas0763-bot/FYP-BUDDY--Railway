"""
Configuration loader for chatbot
Loads API key from multiple sources
"""
import os

def load_api_key():
    """
    Load API key from multiple sources in order of priority:
    1. Environment variable
    2. .env file
    3. config.txt file
    """
    
    # Try environment variable first
    api_key = os.getenv('GEMINI_API_KEY')
    if api_key:
        return api_key
    
    # Try .env file
    try:
        with open('.env', 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('GEMINI_API_KEY='):
                    api_key = line.split('=', 1)[1].strip()
                    if api_key:
                        return api_key
    except FileNotFoundError:
        pass
    
    # Try config.txt file
    try:
        with open('config.txt', 'r') as f:
            api_key = f.read().strip()
            if api_key:
                return api_key
    except FileNotFoundError:
        pass
    
    return None

def save_api_key(api_key):
    """Save API key to .env file"""
    try:
        with open('.env', 'w') as f:
            f.write(f'GEMINI_API_KEY={api_key}\n')
        return True
    except Exception as e:
        print(f"Error saving API key: {e}")
        return False

if __name__ == "__main__":
    # Test the config loader
    key = load_api_key()
    if key:
        print(f"✅ API Key loaded: {key[:20]}...")
    else:
        print("❌ No API key found")
