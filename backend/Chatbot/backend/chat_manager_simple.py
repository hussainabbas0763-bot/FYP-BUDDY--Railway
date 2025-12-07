"""
Simple file-based chat session manager (fallback when MongoDB unavailable)
"""
import json
import os
from datetime import datetime
import uuid

class ChatSession:
    def __init__(self, session_id, title="New Chat"):
        self.session_id = session_id
        self.title = title
        self.messages = []
        self.created_at = datetime.now().isoformat()
        self.updated_at = datetime.now().isoformat()
        self.is_first_message = True
    
    def add_message(self, role, content):
        self.messages.append({
            'role': role,
            'content': content,
            'timestamp': datetime.now().isoformat()
        })
        self.updated_at = datetime.now().isoformat()
    
    def get_conversation_history(self):
        history = []
        for msg in self.messages:
            if msg['role'] == 'user':
                history.append(f"Student: {msg['content']}")
            else:
                history.append(f"Assistant: {msg['content']}")
        return history
    
    def to_dict(self):
        return {
            'session_id': self.session_id,
            'title': self.title,
            'messages': self.messages,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @staticmethod
    def from_dict(data):
        session = ChatSession(data['session_id'], data['title'])
        session.messages = data.get('messages', [])
        session.created_at = data.get('created_at', datetime.now().isoformat())
        session.updated_at = data.get('updated_at', datetime.now().isoformat())
        session.is_first_message = len(session.messages) == 0
        return session

class SimpleChatManager:
    def __init__(self, storage_file='chat_sessions.json'):
        self.storage_file = storage_file
        self.sessions = {}
        self.current_session_id = None
        self.load_sessions()
        
        # Create default session if none exist
        if not self.sessions:
            self.create_session("Default Chat")
    
    def load_sessions(self):
        """Load sessions from file"""
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for session_data in data.get('sessions', []):
                        session = ChatSession.from_dict(session_data)
                        self.sessions[session.session_id] = session
                    self.current_session_id = data.get('current_session_id')
            except Exception as e:
                print(f"Error loading sessions: {e}")
    
    def save_sessions(self):
        """Save sessions to file"""
        try:
            data = {
                'sessions': [s.to_dict() for s in self.sessions.values()],
                'current_session_id': self.current_session_id
            }
            with open(self.storage_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving sessions: {e}")
    
    def create_session(self, title="New Chat"):
        """Create a new chat session"""
        session_id = str(uuid.uuid4())
        session = ChatSession(session_id, title)
        self.sessions[session_id] = session
        self.current_session_id = session_id
        self.save_sessions()
        return session_id
    
    def get_current_session(self):
        """Get the current active session"""
        if self.current_session_id and self.current_session_id in self.sessions:
            return self.sessions[self.current_session_id]
        
        # Create default if none exists
        if not self.sessions:
            self.create_session("Default Chat")
        
        # Return first session
        self.current_session_id = list(self.sessions.keys())[0]
        return self.sessions[self.current_session_id]
    
    def switch_session(self, session_id):
        """Switch to a different session"""
        if session_id in self.sessions:
            self.current_session_id = session_id
            self.save_sessions()
            return True
        return False
    
    def list_sessions(self):
        """List all sessions"""
        sessions_list = []
        for session_id, session in self.sessions.items():
            sessions_list.append({
                'id': session_id,
                'title': session.title,
                'message_count': len(session.messages),
                'created_at': session.created_at,
                'updated_at': session.updated_at,
                'is_current': session_id == self.current_session_id
            })
        
        # Sort by updated_at (most recent first)
        sessions_list.sort(key=lambda x: x['updated_at'], reverse=True)
        return sessions_list
    
    def delete_session(self, session_id):
        """Delete a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            
            # If deleted current session, switch to another
            if session_id == self.current_session_id:
                if self.sessions:
                    self.current_session_id = list(self.sessions.keys())[0]
                else:
                    self.create_session("Default Chat")
            
            self.save_sessions()
            return True
        return False
    
    def rename_session(self, session_id, new_title):
        """Rename a session"""
        if session_id in self.sessions:
            self.sessions[session_id].title = new_title
            self.sessions[session_id].updated_at = datetime.now().isoformat()
            self.save_sessions()
            return True
        return False
    
    def save_session(self, session_id):
        """Save a specific session"""
        self.save_sessions()
    
    def clear_current_session(self):
        """Clear messages in current session"""
        session = self.get_current_session()
        session.messages = []
        session.is_first_message = True
        session.updated_at = datetime.now().isoformat()
        self.save_sessions()
    
    def get_stats(self):
        """Get statistics"""
        total_messages = sum(len(s.messages) for s in self.sessions.values())
        return {
            'total_sessions': len(self.sessions),
            'total_messages': total_messages,
            'sessions_in_memory': len(self.sessions)
        }
    
    def close(self):
        """Close and save"""
        self.save_sessions()
