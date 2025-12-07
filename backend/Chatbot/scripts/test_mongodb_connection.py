"""
Test MongoDB Atlas connection
Run this to verify your MongoDB setup
"""
from mongodb_config import test_connection, get_mongodb_config

if __name__ == "__main__":
    print("\n🧪 Testing MongoDB Atlas Connection...\n")
    
    config = get_mongodb_config()
    
    # Show config (hide password)
    uri_display = config['uri'].replace(config['uri'].split('@')[0].split('://')[1], '***:***')
    print(f"Connection URI: {uri_display}")
    print(f"Database: {config['db_name']}")
    print()
    
    # Test connection
    if test_connection():
        print("\n✅ All good! You can now run:")
        print("   python chatbot_multi_mongodb.py")
    else:
        print("\n❌ Connection failed. Please check:")
        print("   1. Username and password in mongodb_config.py")
        print("   2. Network access in MongoDB Atlas dashboard")
        print("   3. IP whitelist (add 0.0.0.0/0 for all IPs)")
        print("   4. Internet connection")
