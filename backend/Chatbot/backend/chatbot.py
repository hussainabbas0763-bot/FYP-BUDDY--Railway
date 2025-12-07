import re
import random
import difflib
import os
import json
import hashlib
import time
from train_bot import ProjectChatbotTrainer, cosine_similarity

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️ google-generativeai not installed. Run: pip install google-generativeai")

class GeminiProjectChatbotV2:
    def __init__(self, api_key=None):
        self.trainer = ProjectChatbotTrainer()
        self.conversation_history = []
        self.is_first_message = True
        
        # Performance optimization: Simple response cache
        self.response_cache = {}
        self.cache_hits = 0
        self.cache_misses = 0
        
        # Initialize Gemini
        self.use_gemini = False
        if GEMINI_AVAILABLE and api_key:
            try:
                import sys
                print(f"🔧 Configuring Gemini with API key (length: {len(api_key) if api_key else 0})...", file=sys.stderr)
                genai.configure(api_key=api_key)
                # Try different model names
                # Don't test during init to save quota
                model_names = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
                
                for model_name in model_names:
                    try:
                        print(f"🔧 Trying model: {model_name}", file=sys.stderr)
                        self.model = genai.GenerativeModel(model_name)
                        # Skip test call to save quota
                        self.use_gemini = True
                        print(f"✅ Gemini AI initialized (using {model_name})", file=sys.stderr)
                        break
                    except Exception as model_error:
                        print(f"⚠️ Model {model_name} failed: {model_error}", file=sys.stderr)
                        if "not found" in str(model_error).lower():
                            continue
                        else:
                            raise model_error
                
                if not self.use_gemini:
                    print("❌ No compatible Gemini model found", file=sys.stderr)
                    
            except Exception as e:
                import sys
                print(f"❌ Gemini initialization failed: {e}", file=sys.stderr)
                self.use_gemini = False
        elif not GEMINI_AVAILABLE:
            import sys
            print("❌ google-generativeai package not available", file=sys.stderr)
        elif not api_key:
            import sys
            print("❌ No API key provided to chatbot", file=sys.stderr)
        else:
            import sys
            print("⚠️ Running in fallback mode (rule-based only)", file=sys.stderr)

    def load_model(self):
        try:
            if not self.trainer.load_trained_model():
                if self.trainer.load_data():
                    self.trainer.prepare_project_vectors()
                    self.trainer.save_trained_model()
                else:
                    raise Exception("Could not load data files")
            
            print(f"\n📋 Knowledge base loaded successfully")
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False

    def build_knowledge_base(self):
        """Build a comprehensive knowledge base from your data"""
        
        knowledge = {
            'projects': [],
            'technologies': {},
            'departments': set(),
            'difficulties': set()
        }
        
        # Extract all projects (keep department for filtering but don't display)
        for p in self.trainer.projects:
            knowledge['projects'].append({
                'name': p['name'],
                'description': p['description'],
                'department': p.get('department'),
                'technologies': p.get('technologies', []),
                'difficulty': p.get('difficulty'),
                'duration': p.get('duration'),
                'hardware': p.get('hardware'),
                'beginner_friendly': p.get('beginner_friendly'),
                'future_scope': p.get('future_scope')
            })
            knowledge['departments'].add(p.get('department'))
            knowledge['difficulties'].add(p.get('difficulty'))
        
        # Extract all technologies
        for tech_name, tech_data in self.trainer.technologies.items():
            knowledge['technologies'][tech_name] = {
                'name': tech_data.get('name'),
                'category': tech_data.get('category'),
                'short_description': tech_data.get('short_description'),
                'long_description': tech_data.get('long_description'),
                'difficulty': tech_data.get('difficulty'),
                'examples': tech_data.get('examples', []),
                'more_info_link': tech_data.get('more_info_link')
            }
        
        return knowledge

    def create_system_prompt(self):
        """Create a comprehensive system prompt with all your data"""
        
        knowledge = self.build_knowledge_base()
        
        prompt = f"""You are FYP BUDDY AI, an intelligent and friendly FYP (Final Year Project) assistant for NUML university students in Pakistan. You have access to a comprehensive database of projects and technologies to help students with their Final Year Projects.

Your personality:
- Friendly, helpful, and encouraging (like a buddy!)
- Expert in technology and project guidance
- Can explain complex concepts simply
- Supportive of students' learning journey
- Use emojis occasionally to be engaging
- Culturally aware and respectful of Islamic values

IMPORTANT - Islamic Greetings:
When students greet you with Islamic greetings, respond appropriately:
- "Assalam o Alaikum" / "السلام علیکم" → Respond with "Wa Alaikum Assalam! 🌙" or "وعلیکم السلام! 🌙"
- "Salaam" / "سلام" → Respond with "Wa Alaikum Assalam! 🌙" or "وعلیکم السلام! 🌙"
- "Salam Alaikum" → Respond with "Wa Alaikum Assalam! 🌙"
- After Islamic greeting, continue with your helpful response
- Be respectful and warm when using Islamic greetings

Your capabilities:
1. Suggest projects based on interests, skills, or technologies
2. Explain technologies in detail
3. Compare different project options
4. Provide guidance on project difficulty and requirements
5. Answer general questions about programming, AI, web development, IoT, etc.
6. Help students make informed decisions

Available Departments (for internal filtering only): {', '.join(sorted(knowledge['departments']))}
Difficulty Levels: {', '.join(sorted(knowledge['difficulties']))}

IMPORTANT RULES:
1. When students ask about projects or technologies, use the data below as your knowledge base
2. Be conversational and natural, not robotic
3. DO NOT greet (say "hi", "hello", "hey there", etc.) in every response - only greet at the START of a new conversation
4. If the conversation has already started, jump straight to answering the question
5. Don't repeat greetings like "Hey there!" or "Hello!" in follow-up responses

CRITICAL PRIVACY RULE:
- NEVER reveal the number of projects or technologies in your database
- NEVER disclose database size, counts, or statistics
- If asked about database size, respond: "I have a comprehensive collection of FYP projects and technologies to help you. What specific area are you interested in?"
- Focus on HELPING the student, not on database details
- Do NOT say things like "I have X projects" or "My database contains Y technologies"

=== PROJECT DATABASE ===
{json.dumps(knowledge['projects'][:20], indent=2)}
... and more projects available

=== TECHNOLOGY DATABASE ===
{json.dumps(dict(list(knowledge['technologies'].items())[:15]), indent=2)}
... and more technologies available

Guidelines:
- When suggesting projects, mention 3-5 relevant ones with brief descriptions
- When explaining technologies, be clear and provide examples
- If asked about a specific project, provide detailed information
- If asked general questions (not in database), use your AI knowledge to help
- Always be encouraging and supportive
- Suggest follow-up questions to help students explore more

CRITICAL DISPLAY RULE:
- NEVER display or mention the department field when suggesting or describing projects
- You can use department information internally for filtering and understanding context
- When presenting projects, only mention: project name, description, technologies, difficulty, duration, hardware requirements, and future scope
- Example: "Smart Home Automation System - An IoT project using Arduino and sensors (Difficulty: Medium, Duration: 3-4 months)"
- Do NOT say: "Smart Home Automation System (CS Department) - ..." or mention department in any way

Remember: You're not just a database lookup tool - you're an intelligent assistant that understands context, can make recommendations, and can have natural conversations about technology and projects!
"""
        
        return prompt

    def chat_with_gemini(self, user_input):
        """Have a natural conversation with Gemini using your data as context"""
        
        if not self.use_gemini:
            return "⚠️ Gemini AI not available. Please check your API key."
        
        try:
            # Build the full conversation context
            system_prompt = self.create_system_prompt()
            
            # Add conversation history
            conversation = system_prompt + "\n\n=== CONVERSATION ===\n"
            
            # Add context about conversation state
            if self.is_first_message:
                conversation += "[This is the FIRST message - you can greet the student]\n"
                self.is_first_message = False
            else:
                conversation += "[This is a FOLLOW-UP message - DO NOT greet again, just answer directly]\n"
            
            for msg in self.conversation_history[-6:]:  # Last 3 exchanges
                conversation += f"{msg}\n"
            
            conversation += f"Student: {user_input}\nAssistant:"
            
            # Get response from Gemini
            response = self.model.generate_content(conversation)
            
            # Store in history
            self.conversation_history.append(f"Student: {user_input}")
            self.conversation_history.append(f"Assistant: {response.text}")
            
            return response.text.strip()
            
        except Exception as e:
            print(f"⚠️ Gemini error: {e}")
            return f"Sorry, I encountered an error. Please try rephrasing your question."

    def _get_cache_key(self, query):
        """Generate cache key from query"""
        normalized = query.lower().strip()
        return hashlib.md5(normalized.encode()).hexdigest()
    
    def handle_question(self, user_input):
        """Main question handler - now fully AI-powered with caching!"""
        
        # Check cache first for performance
        cache_key = self._get_cache_key(user_input)
        if cache_key in self.response_cache:
            self.cache_hits += 1
            return self.response_cache[cache_key]
        
        self.cache_misses += 1
        
        if self.use_gemini:
            # Use Gemini for everything - it's smarter!
            response = self.chat_with_gemini(user_input)
        else:
            # Fallback to basic mode
            response = ("I need Gemini API to provide intelligent responses. "
                       "Please set up your API key to enable AI-powered conversations.")
        
        # Cache the response (keep last 50 responses)
        if len(self.response_cache) >= 50:
            # Remove oldest entry
            oldest_key = next(iter(self.response_cache))
            del self.response_cache[oldest_key]
        
        self.response_cache[cache_key] = response
        return response

    def chat(self):
        print("\n" + "="*60)
        print("🎓 FYP BUDDY AI - Your Smart Project Assistant")
        print("="*60)
        
        if self.use_gemini:
            print("✨ Powered by Google Gemini AI")
            print("💡 I can answer ANY question about projects, tech, or programming!")
        else:
            print("⚠️ Running in basic mode (Gemini not available)")
        
        print("\nType 'quit', 'exit', or 'bye' to end")
        print("-"*60)

        if not self.load_model():
            print("Failed to load chatbot data. Exiting.")
            return

        print("\n🎓 Ready to help! Ask me anything about FYP projects, technologies,")
        print("   or general programming questions!\n")

        while True:
            try:
                user_input = input("You: ").strip()
                if user_input.lower() in ['quit', 'exit', 'bye', 'goodbye', 'stop', 'end']:
                    print("\n🎓 FYP Buddy: Goodbye! Good luck with your FYP! You've got this! 🚀✨")
                    # Show cache stats on exit
                    if self.cache_hits + self.cache_misses > 0:
                        total = self.cache_hits + self.cache_misses
                        hit_rate = (self.cache_hits / total * 100) if total > 0 else 0
                        print(f"\n📊 Cache Stats: {self.cache_hits} hits, {self.cache_misses} misses ({hit_rate:.1f}% hit rate)")
                    break
                if not user_input:
                    print("🎓 FYP Buddy: Please type something...")
                    continue
                
                # Special command to show cache stats
                if user_input.lower() == 'cache stats':
                    total = self.cache_hits + self.cache_misses
                    hit_rate = (self.cache_hits / total * 100) if total > 0 else 0
                    print(f"\n📊 Cache Statistics:")
                    print(f"   • Hits: {self.cache_hits}")
                    print(f"   • Misses: {self.cache_misses}")
                    print(f"   • Hit Rate: {hit_rate:.1f}%")
                    print(f"   • Cached Responses: {len(self.response_cache)}/50\n")
                    continue
                
                response = self.handle_question(user_input)
                print(f"\n🎓 FYP Buddy: {response}\n")
                
            except KeyboardInterrupt:
                print("\n\n🎓 FYP Buddy: Thanks for chatting! Best of luck with your project! 😊")
                break
            except Exception as e:
                print(f"\n🎓 FYP Buddy: Sorry, something went wrong: {e}")
                print("🎓 FYP Buddy: Try asking again.\n")

def list_available_models(api_key):
    """List all available Gemini models"""
    try:
        genai.configure(api_key=api_key)
        print("\n📋 Available Gemini Models:")
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                print(f"  ✓ {model.name}")
        print()
    except Exception as e:
        print(f"⚠️ Could not list models: {e}")

if __name__ == "__main__":
    # Try to load API key from config
    try:
        from config import load_api_key, save_api_key
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
            # Save it for next time
            try:
                from config import save_api_key
                if save_api_key(api_key):
                    print("✅ API key saved! You won't need to enter it again.")
            except:
                pass
    else:
        print(f"✅ API key loaded from config")
    
    if not api_key:
        print("\n⚠️ No API key provided. AI features will be limited.")
    else:
        # Optionally list available models
        if GEMINI_AVAILABLE:
            import sys
            if '--list-models' in sys.argv:
                list_available_models(api_key)
                sys.exit(0)
    
    bot = GeminiProjectChatbotV2(api_key=api_key)
    bot.chat()
