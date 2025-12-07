"""
MongoDB Configuration for FYP Buddy AI
Cloud MongoDB Atlas connection
"""
import os

# Default database name
MONGODB_DATABASE = "FYP_BUDDY"

def get_mongodb_config():
    """Get MongoDB configuration"""
    # Get from environment variables
    uri = os.getenv('MONGO_URI') or os.getenv('MONGODB_URI')
    db_name = os.getenv('MONGODB_DB', MONGODB_DATABASE)
    
    if not uri:
        raise ValueError(
            "MongoDB URI not found! Please set MONGO_URI or MONGODB_URI environment variable."
        )
    
    return {
        'uri': uri,
        'db_name': db_name
    }

def test_connection():
    """Test MongoDB connection"""
    try:
        from pymongo import MongoClient
        
        config = get_mongodb_config()
        client = MongoClient(config['uri'], serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.server_info()
        
        print("✅ MongoDB Atlas connection successful!")
        print(f"   Database: {config['db_name']}")
        print(f"   URI: {config['uri'][:50]}...")
        
        # List databases
        dbs = client.list_database_names()
        print(f"   Available databases: {', '.join(dbs)}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("\n💡 Troubleshooting:")
        print("   1. Check your username and password")
        print("   2. Verify network access in MongoDB Atlas")
        print("   3. Make sure your IP is whitelisted")
        return False

if __name__ == "__main__":
    print("="*60)
    print("🗄️ MongoDB Atlas Connection Test")
    print("="*60)
    print()
    test_connection()
