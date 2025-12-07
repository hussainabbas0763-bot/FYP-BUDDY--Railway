"""
Quick Test Script - Verify FYP Buddy is Ready for Integration
Run this before integrating into your actual project
"""

import os
import sys
import json

def test_environment():
    """Test 1: Check environment setup"""
    print("\n" + "="*60)
    print("TEST 1: Environment Setup")
    print("="*60)
    
    # Check Python version
    print(f"✓ Python version: {sys.version.split()[0]}")
    
    # Check .env file
    if os.path.exists('.env'):
        print("✓ .env file exists")
        
        # Check for API key
        with open('.env', 'r') as f:
            content = f.read()
            if 'GEMINI_API_KEY' in content and 'your_' not in content:
                print("✓ GEMINI_API_KEY configured")
            else:
                print("✗ GEMINI_API_KEY not configured properly")
                print("  → Edit .env and add your Gemini API key")
                return False
    else:
        print("✗ .env file not found")
        print("  → Copy .env.example to .env and configure it")
        return False
    
    return True

def test_dependencies():
    """Test 2: Check Python dependencies"""
    print("\n" + "="*60)
    print("TEST 2: Python Dependencies")
    print("="*60)
    
    required = [
        'google.generativeai',
        'pymongo',
        'nltk',
        'sklearn'
    ]
    
    all_installed = True
    for package in required:
        try:
            __import__(package)
            print(f"✓ {package}")
        except ImportError:
            print(f"✗ {package} not installed")
            all_installed = False
    
    if not all_installed:
        print("\n→ Run: pip install -r requirements.txt")
        return False
    
    return True

def test_backend_files():
    """Test 3: Check backend files exist"""
    print("\n" + "="*60)
    print("TEST 3: Backend Files")
    print("="*60)
    
    required_files = [
        'backend/chatbot_api.py',
        'backend/chatbot.py',
        'backend/chatbot_multi_mongodb.py',
        'backend/chat_manager_mongodb.py',
        'backend/config.py',
        'data/trainingdata.json',
        'data/description.json',
        'data/intents.json'
    ]
    
    all_exist = True
    for file in required_files:
        if os.path.exists(file):
            print(f"✓ {file}")
        else:
            print(f"✗ {file} missing")
            all_exist = False
    
    return all_exist

def test_chatbot():
    """Test 4: Test chatbot initialization"""
    print("\n" + "="*60)
    print("TEST 4: Chatbot Initialization")
    print("="*60)
    
    try:
        # Add backend to path
        sys.path.insert(0, 'backend')
        
        # Load API key
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            with open('.env', 'r') as f:
                for line in f:
                    if line.startswith('GEMINI_API_KEY='):
                        api_key = line.split('=', 1)[1].strip()
                        break
        
        if not api_key:
            print("✗ Could not load API key")
            return False
        
        print("✓ API key loaded")
        
        # Try to import chatbot
        from chatbot_multi_mongodb import MultiChatBotMongoDB
        print("✓ Chatbot module imported")
        
        # Try to initialize (without loading model to save time)
        bot = MultiChatBotMongoDB(api_key=api_key)
        print("✓ Chatbot instance created")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_data_files():
    """Test 5: Check data files are valid JSON"""
    print("\n" + "="*60)
    print("TEST 5: Data Files Validation")
    print("="*60)
    
    data_files = [
        'data/trainingdata.json',
        'data/description.json',
        'data/intents.json'
    ]
    
    all_valid = True
    for file in data_files:
        try:
            with open(file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"✓ {file} ({len(data)} items)")
        except Exception as e:
            print(f"✗ {file} - {e}")
            all_valid = False
    
    return all_valid

def test_integration_files():
    """Test 6: Check integration files exist"""
    print("\n" + "="*60)
    print("TEST 6: Integration Files")
    print("="*60)
    
    integration_files = [
        'README.md',
        'INTEGRATION_READY.md',
        'INTEGRATION_CHECKLIST.md',
        'example_integration.js',
        'example_integration.py',
        '.env.example',
        'START_HERE.md'
    ]
    
    all_exist = True
    for file in integration_files:
        if os.path.exists(file):
            print(f"✓ {file}")
        else:
            print(f"✗ {file} missing")
            all_exist = False
    
    return all_exist

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 FYP BUDDY - INTEGRATION READINESS TEST")
    print("="*60)
    
    tests = [
        ("Environment Setup", test_environment),
        ("Python Dependencies", test_dependencies),
        ("Backend Files", test_backend_files),
        ("Data Files", test_data_files),
        ("Integration Files", test_integration_files),
        ("Chatbot Initialization", test_chatbot)
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ Test failed with error: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    print("\n" + "="*60)
    print(f"Results: {passed}/{total} tests passed")
    print("="*60)
    
    if passed == total:
        print("\n🎉 SUCCESS! Your FYP Buddy is ready for integration!")
        print("\nNext steps:")
        print("1. Read START_HERE.md")
        print("2. Choose your integration method")
        print("3. Copy example code to your project")
        print("4. Start building!")
    else:
        print("\n⚠️  Some tests failed. Please fix the issues above.")
        print("\nCommon fixes:")
        print("- Run: pip install -r requirements.txt")
        print("- Copy .env.example to .env and configure it")
        print("- Ensure all backend files are present")
    
    print("\n")

if __name__ == '__main__':
    main()
