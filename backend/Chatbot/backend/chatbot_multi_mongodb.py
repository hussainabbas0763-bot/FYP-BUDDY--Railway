"""
Multi-Chat enabled FYP Buddy AI Chatbot with MongoDB
Supports multiple conversation threads with MongoDB storage
"""
import os
import sys
from chatbot import GeminiProjectChatbotV2
from chat_manager_mongodb import ChatManagerMongoDB

class MultiChatBotMongoDB(GeminiProjectChatbotV2):
    """Extended chatbot with MongoDB-based multi-chat support"""
    
    def __init__(self, api_key=None, mongodb_uri='mongodb://localhost:27017/', db_name='fyp_buddy', user_id=None):
        super().__init__(api_key)
        
        try:
            self.chat_manager = ChatManagerMongoDB(mongodb_uri, db_name, user_id)
            self.mongodb_enabled = True
        except Exception as e:
            print(f"❌ Failed to initialize MongoDB: {e}")
            print("💡 Falling back to file-based storage...")
            try:
                from chat_manager_simple import SimpleChatManager
                self.chat_manager = SimpleChatManager()
                self.mongodb_enabled = False
            except Exception as e2:
                print(f"❌ Failed to initialize file-based storage: {e2}")
                # Create minimal fallback
                from chat_manager_simple import SimpleChatManager
                self.chat_manager = SimpleChatManager()
                self.mongodb_enabled = False
        
        # Override conversation history to use session-based history
        self._override_conversation_history()
    
    def _override_conversation_history(self):
        """Override conversation history to use current session"""
        session = self.chat_manager.get_current_session()
        if session:
            self.conversation_history = session.get_conversation_history()
            self.is_first_message = session.is_first_message
        else:
            # No session exists yet - use empty history
            self.conversation_history = []
            self.is_first_message = True
    
    def chat_with_gemini(self, user_input):
        """Override to use session-based history"""
        session = self.chat_manager.get_current_session()
        
        # If no session exists, return error message
        if not session:
            return "Please create a chat session first by sending a message."
        
        if not self.use_gemini:
            return "Gemini AI not available. Please check your API key."
        
        try:
            system_prompt = self.create_system_prompt()
            conversation = system_prompt + "\n\n=== CONVERSATION ===\n"
            
            if session.is_first_message:
                conversation += "[This is the FIRST message - you can greet the student]\n"
                session.is_first_message = False
            else:
                conversation += "[This is a FOLLOW-UP message - DO NOT greet again, just answer directly]\n"
            
            # Use last 6 messages from session
            for msg in session.get_conversation_history()[-6:]:
                conversation += f"{msg}\n"
            
            conversation += f"Student: {user_input}\nAssistant:"
            
            response = self.model.generate_content(conversation)
            
            # Save to session
            session.add_message('user', user_input)
            session.add_message('assistant', response.text)
            self.chat_manager.save_session(session.session_id)
            
            return response.text.strip()
            
        except Exception as e:
            print(f"Gemini error: {e}", file=sys.stderr)
            return f"Sorry, I encountered an error. Please try rephrasing your question."
    
    def handle_chat_command(self, command):
        """Handle multi-chat commands"""
        parts = command.split(maxsplit=1)
        cmd = parts[0].lower()
        
        if cmd == '/new':
            title = parts[1] if len(parts) > 1 else "New Chat"
            session_id = self.chat_manager.create_session(title)
            self._override_conversation_history()
            return f"✨ Created new chat: {title}"
        
        elif cmd == '/list':
            sessions = self.chat_manager.list_sessions()
            if not sessions:
                return "No chat sessions found."
            
            result = "\n📋 Your Chat Sessions:\n" + "="*50 + "\n"
            for i, session in enumerate(sessions, 1):
                current = "→ " if session['is_current'] else "  "
                result += f"{current}{i}. {session['title']}\n"
                result += f"   ID: {session['id']}\n"
                result += f"   Messages: {session['message_count']}\n"
                result += f"   Updated: {session['updated_at'][:19]}\n\n"
            return result
        
        elif cmd == '/switch':
            if len(parts) < 2:
                return "Usage: /switch <number or session_id>"
            
            sessions = self.chat_manager.list_sessions()
            try:
                num = int(parts[1])
                if 1 <= num <= len(sessions):
                    session_id = sessions[num - 1]['id']
                    if self.chat_manager.switch_session(session_id):
                        self._override_conversation_history()
                        return f"✅ Switched to: {sessions[num - 1]['title']}"
            except ValueError:
                if self.chat_manager.switch_session(parts[1]):
                    self._override_conversation_history()
                    session = self.chat_manager.get_current_session()
                    return f"✅ Switched to: {session.title}"
            
            return "❌ Chat not found"
        
        elif cmd == '/delete':
            if len(parts) < 2:
                return "Usage: /delete <number or session_id>"
            
            sessions = self.chat_manager.list_sessions()
            try:
                num = int(parts[1])
                if 1 <= num <= len(sessions):
                    session_id = sessions[num - 1]['id']
                    title = sessions[num - 1]['title']
                    if self.chat_manager.delete_session(session_id):
                        self._override_conversation_history()
                        return f"🗑️ Deleted: {title}"
            except ValueError:
                if self.chat_manager.delete_session(parts[1]):
                    self._override_conversation_history()
                    return f"🗑️ Chat deleted"
            
            return "❌ Chat not found"
        
        elif cmd == '/rename':
            if len(parts) < 2:
                return "Usage: /rename <new title>"
            
            session = self.chat_manager.get_current_session()
            if session and self.chat_manager.rename_session(session.session_id, parts[1]):
                return f"✏️ Renamed to: {parts[1]}"
            return "❌ Failed to rename or no active session"
        
        elif cmd == '/clear':
            self.chat_manager.clear_current_session()
            self._override_conversation_history()
            return "🧹 Current chat cleared"
        
        elif cmd == '/search':
            if len(parts) < 2:
                return "Usage: /search <query>"
            
            if not self.mongodb_enabled:
                return "❌ Search requires MongoDB"
            
            results = self.chat_manager.search_sessions(parts[1])
            if not results:
                return f"No chats found matching '{parts[1]}'"
            
            result = f"\n🔍 Search Results for '{parts[1]}':\n" + "="*50 + "\n"
            for i, session in enumerate(results, 1):
                result += f"{i}. {session['title']}\n"
                result += f"   Messages: {session['message_count']}\n"
                result += f"   Updated: {session['updated_at'][:19]}\n\n"
            return result
        
        elif cmd == '/stats':
            if not self.mongodb_enabled:
                return "❌ Stats require MongoDB"
            
            stats = self.chat_manager.get_stats()
            return f"""
📊 Database Statistics:
   • Total Chats: {stats['total_sessions']}
   • Total Messages: {stats['total_messages']}
   • Chats in Memory: {stats['sessions_in_memory']}
   • Storage: MongoDB
"""
        
        elif cmd == '/help':
            help_text = """
📚 Multi-Chat Commands:
  /new [title]       - Create a new chat session
  /list              - List all chat sessions
  /switch <num|id>   - Switch to a different chat
  /delete <num|id>   - Delete a chat session
  /rename <title>    - Rename current chat
  /clear             - Clear current chat messages
  /help              - Show this help message
"""
            if self.mongodb_enabled:
                help_text += """
  /search <query>    - Search chats by title/content
  /stats             - Show database statistics
"""
            help_text += """
💡 Tips:
  - Each chat maintains its own conversation history
  - Chats are automatically saved to MongoDB
  - Use numbers from /list to quickly switch chats
"""
            return help_text
        
        return "❌ Unknown command. Type /help for available commands."
    
    def chat(self):
        """Main chat loop with multi-chat support"""
        print("\n" + "="*60)
        print("🎓 FYP BUDDY AI - Multi-Chat Edition (MongoDB)")
        print("="*60)
        
        if self.use_gemini:
            print("✨ Powered by Google Gemini AI")
            print("💬 Multi-chat support enabled!")
        else:
            print("⚠️ Running in basic mode (Gemini not available)")
        
        if self.mongodb_enabled:
            print("🗄️ Storage: MongoDB")
        else:
            print("📁 Storage: File-based (MongoDB unavailable)")
        
        print("\nType '/help' for chat commands")
        print("Type 'quit', 'exit', or 'bye' to end")
        print("-"*60)

        if not self.load_model():
            print("Failed to load chatbot data. Exiting.")
            return

        session = self.chat_manager.get_current_session()
        if session:
            print(f"\n💬 Current Chat: {session.title}")
        else:
            print(f"\n💬 No active chat session")
        
        if self.mongodb_enabled:
            stats = self.chat_manager.get_stats()
            print(f"📊 Total Chats: {stats['total_sessions']}")
        
        print("\n🎓 Ready to help! Ask me anything or use /help for commands.\n")

        try:
            while True:
                try:
                    user_input = input("You: ").strip()
                    
                    if user_input.lower() in ['quit', 'exit', 'bye', 'goodbye', 'stop', 'end']:
                        print("\n🎓 FYP Buddy: Goodbye! Good luck with your FYP! 🚀✨")
                        if self.cache_hits + self.cache_misses > 0:
                            total = self.cache_hits + self.cache_misses
                            hit_rate = (self.cache_hits / total * 100) if total > 0 else 0
                            print(f"📊 Cache Stats: {self.cache_hits} hits, {self.cache_misses} misses ({hit_rate:.1f}% hit rate)")
                        break
                    
                    if not user_input:
                        print("🎓 FYP Buddy: Please type something...")
                        continue
                    
                    # Handle chat commands
                    if user_input.startswith('/'):
                        response = self.handle_chat_command(user_input)
                        print(f"\n{response}\n")
                        continue
                    
                    # Regular chat
                    response = self.handle_question(user_input)
                    print(f"\n🎓 FYP Buddy: {response}\n")
                    
                except KeyboardInterrupt:
                    print("\n\n🎓 FYP Buddy: Thanks for chatting! Best of luck! 😊")
                    break
                except Exception as e:
                    print(f"\n🎓 FYP Buddy: Sorry, something went wrong: {e}")
                    print("🎓 FYP Buddy: Try asking again.\n")
        finally:
            # Close MongoDB connection
            if self.mongodb_enabled:
                self.chat_manager.close()


if __name__ == "__main__":
    # Load API key
    try:
        from config import load_api_key
        api_key = load_api_key()
    except ImportError:
        api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        print("\n" + "="*60)
        print("🔑 Gemini API Key Setup")
        print("="*60)
        print("\nGet your free API key from: https://aistudio.google.com/app/apikey")
        api_key = input("\nEnter your Gemini API key (or press Enter to skip): ").strip()
        
        if api_key:
            try:
                from config import save_api_key
                if save_api_key(api_key):
                    print("✅ API key saved!")
            except:
                pass
    else:
        print(f"✅ API key loaded from config")
    
    # MongoDB configuration
    try:
        from mongodb_config import get_mongodb_config
        config = get_mongodb_config()
        mongodb_uri = config['uri']
        db_name = config['db_name']
        print(f"\n🗄️ MongoDB Configuration loaded from mongodb_config.py")
    except ImportError:
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        db_name = os.getenv('MONGODB_DB', 'fyp_buddy')
        print(f"\n🗄️ MongoDB Configuration from environment")
    
    print(f"   Database: {db_name}")
    
    # Check if using cloud or local
    if 'mongodb+srv' in mongodb_uri or 'mongodb.net' in mongodb_uri:
        print(f"   ☁️ Using MongoDB Atlas (Cloud)")
    else:
        print(f"   💻 Using Local MongoDB")
        print(f"   💡 Make sure MongoDB is running: mongod")
    print()
    
    bot = MultiChatBotMongoDB(api_key=api_key, mongodb_uri=mongodb_uri, db_name=db_name)
    bot.chat()
