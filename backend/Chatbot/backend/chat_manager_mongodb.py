"""
MongoDB-based Multi-Chat Session Manager for FYP Buddy AI
Replaces JSON file storage with MongoDB for better scalability
"""
from datetime import datetime
from pymongo import MongoClient, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import time

class ChatSession:
    """Represents a single chat session"""
    def __init__(self, session_id, title="New Chat", user_id=None):
        self.session_id = session_id
        self.title = title
        self.user_id = user_id
        self.messages = []
        self.created_at = datetime.now().isoformat()
        self.updated_at = self.created_at
        self.is_first_message = True
    
    def add_message(self, role, content):
        """Add a message to the session"""
        self.messages.append({
            'role': role,
            'content': content,
            'timestamp': datetime.now().isoformat()
        })
        self.updated_at = datetime.now().isoformat()
        
        # Auto-generate title from first user message
        if role == 'user' and len(self.messages) <= 2 and self.title == "New Chat":
            self.title = content[:50] + ("..." if len(content) > 50 else "")
    
    def get_conversation_history(self):
        """Get formatted conversation history"""
        history = []
        for msg in self.messages:
            if msg['role'] == 'user':
                history.append(f"Student: {msg['content']}")
            else:
                history.append(f"Assistant: {msg['content']}")
        return history
    
    def to_dict(self):
        """Convert session to dictionary for MongoDB"""
        return {
            'session_id': self.session_id,
            'title': self.title,
            'user_id': self.user_id,
            'messages': self.messages,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'is_first_message': self.is_first_message
        }
    
    @staticmethod
    def from_dict(data):
        """Create session from dictionary"""
        session = ChatSession(data['session_id'], data['title'], data.get('user_id'))
        session.messages = data['messages']
        session.created_at = data['created_at']
        session.updated_at = data['updated_at']
        session.is_first_message = data.get('is_first_message', False)
        return session


class ChatManagerMongoDB:
    """Manages multiple chat sessions using MongoDB"""
    
    def __init__(self, connection_string='mongodb://localhost:27017/', db_name='fyp_buddy', user_id=None):
        """
        Initialize MongoDB connection
        
        Args:
            connection_string: MongoDB connection string
            db_name: Database name to use
            user_id: User ID for session isolation
        """
        self.connection_string = connection_string
        self.db_name = db_name
        self.user_id = user_id
        self.sessions = {}
        self.current_session_id = None
        
        # Connect to MongoDB
        try:
            self.client = MongoClient(
                connection_string,
                serverSelectionTimeoutMS=5000  # 5 second timeout
            )
            # Test connection
            self.client.server_info()
            self.db = self.client[db_name]
            self.collection = self.db['chat_sessions']
            
            # Create indexes for better performance
            self.collection.create_index('session_id', unique=True)
            self.collection.create_index([('updated_at', DESCENDING)])
            self.collection.create_index('user_id')
            
            print(f"✅ Connected to MongoDB: {db_name}")
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            print(f"⚠️ MongoDB connection failed: {e}")
            print("💡 Make sure MongoDB is running: mongod")
            raise
        
        # Load sessions from MongoDB
        self.load_sessions()
    
    def create_session(self, title="New Chat"):
        """Create a new chat session"""
        # Generate unique session ID
        session_id = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        
        # Ensure uniqueness
        while self.collection.find_one({'session_id': session_id}):
            time.sleep(0.001)
            session_id = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        
        session = ChatSession(session_id, title, self.user_id)
        self.sessions[session_id] = session
        self.current_session_id = session_id
        self.save_session(session_id)
        return session_id
    
    def get_current_session(self):
        """Get the current active session"""
        if not self.current_session_id or self.current_session_id not in self.sessions:
            # Return None if no session exists instead of auto-creating
            return None
        return self.sessions[self.current_session_id]
    
    def switch_session(self, session_id):
        """Switch to a different session"""
        if session_id in self.sessions:
            self.current_session_id = session_id
            return True
        
        # Try loading from MongoDB if not in memory
        session_data = self.collection.find_one({'session_id': session_id})
        if session_data:
            session = ChatSession.from_dict(session_data)
            self.sessions[session_id] = session
            self.current_session_id = session_id
            return True
        
        return False
    
    def delete_session(self, session_id):
        """Delete a chat session"""
        if session_id in self.sessions:
            # Delete from MongoDB
            self.collection.delete_one({'session_id': session_id})
            
            # Remove from memory
            del self.sessions[session_id]
            
            # Switch to another session if current was deleted
            if self.current_session_id == session_id:
                if self.sessions:
                    self.current_session_id = list(self.sessions.keys())[-1]
                else:
                    self.current_session_id = None
            return True
        return False
    
    def list_sessions(self):
        """List all sessions sorted by update time"""
        # Get all sessions from MongoDB for this user only
        query = {'user_id': self.user_id} if self.user_id else {}
        all_sessions = list(self.collection.find(query).sort('updated_at', DESCENDING))
        
        sessions_list = []
        for session_data in all_sessions:
            sessions_list.append({
                'id': session_data['session_id'],
                'title': session_data['title'],
                'message_count': len(session_data['messages']),
                'updated_at': session_data['updated_at'],
                'is_current': session_data['session_id'] == self.current_session_id
            })
        
        return sessions_list
    
    def save_session(self, session_id):
        """Save a session to MongoDB"""
        if session_id in self.sessions:
            session = self.sessions[session_id]
            # Use upsert to insert or update
            self.collection.update_one(
                {'session_id': session_id},
                {'$set': session.to_dict()},
                upsert=True
            )
    
    def load_sessions(self):
        """Load recent sessions from MongoDB into memory"""
        # Load only the 10 most recent sessions for this user to save memory
        query = {'user_id': self.user_id} if self.user_id else {}
        recent_sessions = self.collection.find(query).sort('updated_at', DESCENDING).limit(10)
        
        for session_data in recent_sessions:
            session = ChatSession.from_dict(session_data)
            self.sessions[session.session_id] = session
        
        # Set current session to most recently updated
        if self.sessions:
            sorted_sessions = sorted(
                self.sessions.items(),
                key=lambda x: x[1].updated_at,
                reverse=True
            )
            self.current_session_id = sorted_sessions[0][0]
    
    def rename_session(self, session_id, new_title):
        """Rename a chat session"""
        if session_id in self.sessions:
            self.sessions[session_id].title = new_title
            self.save_session(session_id)
            return True
        
        # Try updating in MongoDB directly
        result = self.collection.update_one(
            {'session_id': session_id},
            {'$set': {'title': new_title}}
        )
        return result.modified_count > 0
    
    def clear_current_session(self):
        """Clear messages in current session"""
        session = self.get_current_session()
        session.messages = []
        session.is_first_message = True
        self.save_session(session.session_id)
    
    def get_stats(self):
        """Get statistics about chat sessions"""
        total_sessions = self.collection.count_documents({})
        total_messages = sum(
            len(session.get('messages', [])) 
            for session in self.collection.find()
        )
        
        return {
            'total_sessions': total_sessions,
            'total_messages': total_messages,
            'sessions_in_memory': len(self.sessions)
        }
    
    def search_sessions(self, query):
        """Search sessions by title or content"""
        results = self.collection.find({
            '$or': [
                {'title': {'$regex': query, '$options': 'i'}},
                {'messages.content': {'$regex': query, '$options': 'i'}}
            ]
        }).sort('updated_at', DESCENDING)
        
        return [
            {
                'id': session['session_id'],
                'title': session['title'],
                'message_count': len(session['messages']),
                'updated_at': session['updated_at']
            }
            for session in results
        ]
    
    def close(self):
        """Close MongoDB connection"""
        if hasattr(self, 'client'):
            self.client.close()
            print("✅ MongoDB connection closed")
