"""
Setup MongoDB Atlas Configuration
Interactive setup for your cloud MongoDB
"""

def setup_mongodb_atlas():
    print("="*60)
    print("🗄️ MongoDB Atlas Setup")
    print("="*60)
    print()
    print("You have a MongoDB Atlas cluster!")
    print("Cluster: chatbot.x73lnw8.mongodb.net")
    print()
    
    # Get username
    print("What is your MongoDB username?")
    print("(This is the database user you created in MongoDB Atlas)")
    username = input("Username: ").strip()
    
    if not username:
        print("❌ Username is required!")
        return False
    
    # Password is already known
    password = "WqtquERw3IHI6n6M"
    
    # Database name
    print("\nWhat database name do you want to use?")
    db_name = input("Database name (default: fyp_buddy): ").strip()
    if not db_name:
        db_name = "fyp_buddy"
    
    # Build connection string
    cluster = "chatbot.x73lnw8.mongodb.net"
    uri = f"mongodb+srv://{username}:{password}@{cluster}/"
    
    # Create config file
    config_content = f'''"""
MongoDB Configuration for FYP Buddy AI
Cloud MongoDB Atlas connection
"""
import os

# MongoDB Atlas Configuration
MONGODB_USERNAME = "{username}"
MONGODB_PASSWORD = "{password}"
MONGODB_CLUSTER = "{cluster}"
MONGODB_DATABASE = "{db_name}"

# Build connection string
MONGODB_URI = f"mongodb+srv://{{MONGODB_USERNAME}}:{{MONGODB_PASSWORD}}@{{MONGODB_CLUSTER}}/"

def get_mongodb_config():
    """Get MongoDB configuration"""
    # Check environment variables first
    uri = os.getenv('MONGODB_URI')
    db_name = os.getenv('MONGODB_DB', MONGODB_DATABASE)
    
    # Use config values if env vars not set
    if not uri:
        uri = MONGODB_URI
    
    return {{
        'uri': uri,
        'db_name': db_name
    }}

def test_connection():
    """Test MongoDB connection"""
    try:
        from pymongo import MongoClient
        
        config = get_mongodb_config()
        client = MongoClient(config['uri'], serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.server_info()
        
        print("✅ MongoDB Atlas connection successful!")
        print(f"   Database: {{config['db_name']}}")
        print(f"   Cluster: {{MONGODB_CLUSTER}}")
        
        # List databases
        dbs = client.list_database_names()
        print(f"   Available databases: {{', '.join(dbs)}}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {{e}}")
        print("\\n💡 Troubleshooting:")
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
'''
    
    # Save config
    with open('mongodb_config.py', 'w') as f:
        f.write(config_content)
    
    print("\n✅ Configuration saved to mongodb_config.py")
    print()
    
    # Test connection
    print("🧪 Testing connection...")
    print()
    
    try:
        from pymongo import MongoClient
        
        client = MongoClient(uri, serverSelectionTimeoutMS=10000)
        client.server_info()
        
        print("✅ Connection successful!")
        print()
        print(f"   Username: {username}")
        print(f"   Cluster: {cluster}")
        print(f"   Database: {db_name}")
        print()
        
        # List databases
        dbs = client.list_database_names()
        print(f"   Available databases: {', '.join(dbs)}")
        
        client.close()
        
        print()
        print("="*60)
        print("✨ Setup Complete!")
        print("="*60)
        print()
        print("You can now run:")
        print("   python chatbot_multi_mongodb.py")
        print()
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print()
        print("💡 Common issues:")
        print("   1. Wrong username - check MongoDB Atlas dashboard")
        print("   2. Network access - whitelist your IP in Atlas")
        print("      Go to: Network Access → Add IP Address → 0.0.0.0/0")
        print("   3. Database user - make sure user exists in Database Access")
        print()
        return False

if __name__ == "__main__":
    setup_mongodb_atlas()
