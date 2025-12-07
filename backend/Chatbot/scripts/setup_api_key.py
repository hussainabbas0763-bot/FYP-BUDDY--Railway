"""
One-time setup script for Gemini API key
"""
from config import save_api_key, load_api_key

def setup():
    print("\n" + "="*60)
    print("🔑 Gemini API Key Setup")
    print("="*60)
    
    # Check if already configured
    existing_key = load_api_key()
    if existing_key:
        print(f"\n✅ API key already configured: {existing_key[:20]}...")
        choice = input("\nDo you want to update it? (yes/no): ").strip().lower()
        if choice not in ['yes', 'y']:
            print("\n✅ Keeping existing API key.")
            return
    
    print("\n📝 Get your FREE API key from:")
    print("   https://aistudio.google.com/app/apikey")
    print("\n1. Sign in with your Google account")
    print("2. Click 'Create API Key'")
    print("3. Copy the key")
    print()
    
    api_key = input("Enter your Gemini API key: ").strip()
    
    if not api_key:
        print("\n❌ No API key provided. Setup cancelled.")
        return
    
    # Save the key
    if save_api_key(api_key):
        print("\n" + "="*60)
        print("✅ SUCCESS! API key saved!")
        print("="*60)
        print("\nYou can now run:")
        print("  python chatbot_gemini_v2.py")
        print("\nThe API key will be loaded automatically!")
        print("You won't need to enter it again. 🎉")
    else:
        print("\n❌ Failed to save API key.")
        print("You can manually create a .env file with:")
        print(f"GEMINI_API_KEY={api_key}")

if __name__ == "__main__":
    setup()
