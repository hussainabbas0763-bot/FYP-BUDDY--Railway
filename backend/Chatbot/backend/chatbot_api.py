"""
Persistent Multi-Chat API wrapper for FYP Buddy Chatbot with MongoDB
Keeps bot instance alive for fast switching
"""
import sys
import json
import os
import io

# Global bot instances per user (stays alive)
bot_instances = {}

def initialize_bot(user_id=None, force_reinit=False):
    """Initialize the chatbot once per user and keep it alive"""
    global bot_instances
    
    if user_id and user_id in bot_instances and not force_reinit:
        return True
    
    # Suppress stdout during initialization but keep stderr for errors
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    sys.stdout = io.StringIO()
    # Keep stderr so we can see errors
    
    try:
        # Get script directory and project root
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        os.chdir(project_root)
        
        # Add backend to path
        sys.path.insert(0, script_dir)
        
        # Load API key
        api_key = os.getenv('GEMINI_API_KEY')
        
        # Debug: Check if API key is in environment
        if api_key:
            print(f"✅ API key loaded from environment (length: {len(api_key)})", file=sys.stderr)
        else:
            print("⚠️ API key not in environment, trying .env file", file=sys.stderr)
        
        if not api_key:
            try:
                env_path = os.path.join(project_root, '.env')
                with open(env_path, 'r') as f:
                    for line in f:
                        if line.startswith('GEMINI_API_KEY='):
                            api_key = line.split('=', 1)[1].strip()
                            print(f"✅ API key loaded from .env file", file=sys.stderr)
                            break
            except Exception as e:
                print(f"⚠️ Could not read .env file: {e}", file=sys.stderr)
        
        if not api_key:
            try:
                from config import load_api_key
                api_key = load_api_key()
                if api_key:
                    print(f"✅ API key loaded from config.py", file=sys.stderr)
            except Exception as e:
                print(f"⚠️ Could not load from config.py: {e}", file=sys.stderr)
        
        if not api_key:
            sys.stdout = old_stdout
            print("❌ No API key found in any source!", file=sys.stderr)
            return False
        
        # Load MongoDB config
        try:
            from mongodb_config import get_mongodb_config
            config = get_mongodb_config()
            mongodb_uri = config['uri']
            db_name = config['db_name']
        except:
            mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
            db_name = os.getenv('MONGODB_DB', 'fyp_buddy')
        
        # Import multi-chat bot
        sys.path.insert(0, script_dir)
        from chatbot_multi_mongodb import MultiChatBotMongoDB
        
        print(f"🔧 Creating bot instance with API key...", file=sys.stderr)
        
        # Debug: Check Python environment
        import sys as sys_module
        print(f"🔧 Python executable: {sys_module.executable}", file=sys.stderr)
        print(f"🔧 Python version: {sys_module.version}", file=sys.stderr)
        
        # Try to import google.generativeai
        try:
            import google.generativeai as test_genai
            print(f"✅ google-generativeai is available!", file=sys.stderr)
        except ImportError as e:
            print(f"❌ Cannot import google-generativeai: {e}", file=sys.stderr)
            print(f"🔧 sys.path: {sys_module.path[:3]}", file=sys.stderr)
        
        # Create bot instance for this user
        bot = MultiChatBotMongoDB(api_key=api_key, mongodb_uri=mongodb_uri, db_name=db_name, user_id=user_id)
        
        print(f"🔧 Bot instance created, use_gemini={bot.use_gemini}", file=sys.stderr)
        
        # Load model
        if not bot.load_model():
            sys.stdout = old_stdout
            print("❌ Failed to load model", file=sys.stderr)
            return False
        
        if user_id:
            bot_instances[user_id] = bot
        
        sys.stdout = old_stdout
        return True
        
    except Exception as e:
        sys.stdout = old_stdout
        print(f"Initialization error: {e}", file=sys.stderr)
        return False

def handle_request(request_data):
    """Handle multi-chat requests with persistent bot per user"""
    global bot_instances
    
    user_id = request_data.get('user_id')
    
    if not user_id or user_id not in bot_instances:
        if not initialize_bot(user_id):
            return {
                'success': False,
                'error': 'Failed to initialize chatbot'
            }
    
    bot = bot_instances.get(user_id)
    if not bot:
        return {
            'success': False,
            'error': 'Bot instance not found'
        }
    
    try:
        action = request_data.get('action', 'chat')
        
        if action == 'chat':
            message = request_data.get('message', '')
            session_id = request_data.get('session_id')
            
            # If no session_id provided and no current session, create one
            if not session_id:
                current_session = bot.chat_manager.get_current_session()
                if not current_session:
                    # Create a new session with the message as title
                    title = message[:30] + ('...' if len(message) > 30 else '')
                    session_id = bot.chat_manager.create_session(title)
                    bot._override_conversation_history()
            else:
                bot.chat_manager.switch_session(session_id)
            
            response = bot.handle_question(message)
            current_session = bot.chat_manager.get_current_session()
            
            return {
                'success': True,
                'response': response,
                'session_id': current_session.session_id
            }
        
        elif action == 'new_session':
            title = request_data.get('title', 'New Chat')
            session_id = bot.chat_manager.create_session(title)
            bot._override_conversation_history()
            
            return {
                'success': True,
                'session_id': session_id,
                'message': f'Created new session: {title}'
            }
        
        elif action == 'list_sessions':
            sessions = bot.chat_manager.list_sessions()
            
            return {
                'success': True,
                'sessions': sessions
            }
        
        elif action == 'switch_session':
            session_id = request_data.get('session_id')
            success = bot.chat_manager.switch_session(session_id)
            
            if success:
                bot._override_conversation_history()
            
            return {
                'success': success,
                'session_id': session_id if success else None
            }
        
        elif action == 'delete_session':
            session_id = request_data.get('session_id')
            success = bot.chat_manager.delete_session(session_id)
            
            return {
                'success': success,
                'message': 'Session deleted' if success else 'Failed to delete'
            }
        
        elif action == 'rename_session':
            session_id = request_data.get('session_id')
            title = request_data.get('title')
            success = bot.chat_manager.rename_session(session_id, title)
            
            return {
                'success': success,
                'message': f'Renamed to: {title}' if success else 'Failed to rename'
            }
        
        elif action == 'get_messages':
            session_id = request_data.get('session_id')
            
            # Switch to the session temporarily to get messages
            current_id = bot.chat_manager.current_session_id
            bot.chat_manager.switch_session(session_id)
            session = bot.chat_manager.get_current_session()
            messages = session.messages if hasattr(session, 'messages') else []
            
            # Switch back
            if current_id:
                bot.chat_manager.switch_session(current_id)
            
            return {
                'success': True,
                'messages': messages
            }
        
        elif action == 'ping':
            return {'success': True, 'status': 'alive'}
        
        else:
            return {
                'success': False,
                'error': f'Unknown action: {action}'
            }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def main():
    """Main loop - keeps Python process alive"""
    try:
        # Set UTF-8 encoding
        if sys.platform == 'win32':
            sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        
        # Initialize bot once
        if not initialize_bot():
            error = {'success': False, 'error': 'Failed to initialize'}
            print(json.dumps(error, ensure_ascii=False))
            sys.stdout.flush()
            return
        
        # Send ready signal
        print(json.dumps({'status': 'ready'}, ensure_ascii=False))
        sys.stdout.flush()
        
        # Process messages in a loop
        while True:
            try:
                line = sys.stdin.readline()
                if not line:
                    break
                
                request = json.loads(line.strip())
                response = handle_request(request)
                
                print(json.dumps(response, ensure_ascii=False))
                sys.stdout.flush()
                
            except json.JSONDecodeError as e:
                error = {'success': False, 'error': f'Invalid JSON: {str(e)}'}
                print(json.dumps(error, ensure_ascii=False))
                sys.stdout.flush()
            except Exception as e:
                error = {'success': False, 'error': str(e)}
                print(json.dumps(error, ensure_ascii=False))
                sys.stdout.flush()
    
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}, ensure_ascii=False))
        sys.stdout.flush()

if __name__ == '__main__':
    main()
