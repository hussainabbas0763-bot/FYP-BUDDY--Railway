# 🎓 FYP Buddy AI - Integration Ready

An intelligent AI chatbot for NUML university students to help with Final Year Projects (FYP). Ready to integrate into your actual project.

---

## ✨ Core Features

- 🎯 **500 Project Ideas** across CS, IT, SE, ML, ME departments
- 💻 **69 Technologies** with detailed explanations
- 🤖 **AI-Powered** using Google Gemini
- 🗨️ **Multi-Chat Support** - Unlimited conversation threads
- 💾 **MongoDB Storage** - Cloud-based persistence
- ⚡ **Fast Switching** - Instant chat switching (~150ms)
- 🔌 **Easy Integration** - Works with any backend framework

---

## 📦 What's Included

### Backend (Python)
```
backend/
├── chatbot_api.py              # Main API wrapper
├── chatbot.py                  # Core chatbot logic
├── chatbot_multi_mongodb.py    # Multi-chat with MongoDB
├── chat_manager_mongodb.py     # Session management
├── chat_manager_simple.py      # File-based fallback
├── mongodb_config.py           # MongoDB configuration
├── config.py                   # API key loader
└── train_bot.py                # Training module
```

### Knowledge Base
```
data/
├── trainingdata.json           # 500 FYP project ideas
├── description.json            # 69 technology descriptions
└── intents.json                # Intent patterns
```

### Utilities
```
scripts/
├── setup_api_key.py            # Setup Gemini API key
├── setup_mongodb_atlas.py      # Setup MongoDB
└── test_mongodb_connection.py  # Test DB connection
```

---

## 🚀 Quick Integration

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file in project root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name
```

Get your free Gemini API key: https://aistudio.google.com/app/apikey

### 3. Integrate with Your Backend

**Node.js/Express:**
```javascript
const { spawn } = require('child_process');
const path = require('path');

// Start persistent Python process
const pythonProcess = spawn('python', [
    path.join(__dirname, 'backend', 'chatbot_api.py')
]);

// Handle responses
pythonProcess.stdout.on('data', (data) => {
    const response = JSON.parse(data.toString());
    // Process response
});

// Send request
function sendToPython(request) {
    pythonProcess.stdin.write(JSON.stringify(request) + '\n');
}

// API endpoint
app.post('/api/chat', (req, res) => {
    sendToPython({
        action: 'chat',
        message: req.body.message,
        session_id: req.body.session_id
    });
});
```

**Python/Flask:**
```python
from backend.chatbot_multi_mongodb import MultiChatBotMongoDB
import os

# Initialize bot
api_key = os.getenv('GEMINI_API_KEY')
bot = MultiChatBotMongoDB(api_key=api_key)
bot.load_model()

# API endpoint
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    response = bot.handle_question(data['message'])
    return jsonify({'response': response})
```

---

## 🎯 API Reference

### Available Actions

**Chat:**
```json
{
    "action": "chat",
    "message": "Show me ML projects",
    "session_id": "optional_session_id"
}
```

**Create Session:**
```json
{
    "action": "new_session",
    "title": "My Chat"
}
```

**List Sessions:**
```json
{
    "action": "list_sessions"
}
```

**Switch Session:**
```json
{
    "action": "switch_session",
    "session_id": "session_id_here"
}
```

**Delete Session:**
```json
{
    "action": "delete_session",
    "session_id": "session_id_here"
}
```

**Rename Session:**
```json
{
    "action": "rename_session",
    "session_id": "session_id_here",
    "title": "New Title"
}
```

**Get Messages:**
```json
{
    "action": "get_messages",
    "session_id": "session_id_here"
}
```

---

## 🛠️ Tech Stack

- **AI**: Google Gemini (google-generativeai)
- **Database**: MongoDB Atlas (pymongo)
- **NLP**: NLTK, scikit-learn
- **Backend**: Python 3.8+
- **Storage**: MongoDB (with file-based fallback)

---

## 📁 Project Structure

```
fyp-buddy-ai/
├── backend/                    # Python chatbot backend
│   ├── chatbot_api.py          # Main API wrapper
│   ├── chatbot.py              # Core logic
│   ├── chatbot_multi_mongodb.py # Multi-chat
│   ├── chat_manager_mongodb.py  # Session manager
│   ├── chat_manager_simple.py   # File fallback
│   ├── mongodb_config.py        # DB config
│   ├── config.py                # Config loader
│   └── train_bot.py             # Training
├── data/                        # Knowledge base
│   ├── trainingdata.json        # 500 projects
│   ├── description.json         # 69 technologies
│   └── intents.json             # Intents
├── scripts/                     # Utilities
│   ├── setup_api_key.py         # API setup
│   ├── setup_mongodb_atlas.py   # MongoDB setup
│   └── test_mongodb_connection.py # Test DB
├── .env                         # Environment vars
├── requirements.txt             # Python deps
├── README.md                    # This file
└── INTEGRATION_READY.md         # Integration guide
```

---

## 🗄️ MongoDB Configuration

### Option 1: Use MongoDB Atlas (Recommended)

1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Add to `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=fyp_buddy
```

### Option 2: Use Local MongoDB

```
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=fyp_buddy
```

### Option 3: File-Based (No MongoDB)

The chatbot automatically falls back to file-based storage if MongoDB is unavailable.

---

## 📊 Performance

- **Chat Switching**: ~150ms (instant!)
- **Message Loading**: ~50ms
- **AI Response**: ~1-2s
- **Projects Database**: 500
- **Technologies**: 69

---

## 🔧 Configuration

### Custom MongoDB Settings

Edit `backend/mongodb_config.py`:
```python
def get_mongodb_config():
    return {
        'uri': 'your_mongodb_uri',
        'db_name': 'your_database_name',
        'collection': 'chat_sessions'
    }
```

### Custom Knowledge Base

Edit files in `data/` folder:
- `trainingdata.json` - Add/modify project ideas
- `description.json` - Add/modify technology descriptions
- `intents.json` - Add/modify intent patterns

---

## 🧪 Testing

### Test MongoDB Connection
```bash
python scripts/test_mongodb_connection.py
```

### Test Chatbot Directly
```bash
python backend/chatbot_api.py
```

Then send JSON via stdin:
```json
{"action": "chat", "message": "Hello"}
```

---

## 🎨 Frontend Integration Examples

### React Component

```jsx
import { useState } from 'react';

function ChatBot() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    
    const sendMessage = async () => {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: input })
        });
        
        const data = await response.json();
        setMessages([...messages, 
            { role: 'user', content: input },
            { role: 'assistant', content: data.response }
        ]);
        setInput('');
    };
    
    return (
        <div className="chatbot">
            <div className="messages">
                {messages.map((msg, i) => (
                    <div key={i} className={msg.role}>
                        {msg.content}
                    </div>
                ))}
            </div>
            <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
}
```

### Vue Component

```vue
<template>
  <div class="chatbot">
    <div class="messages">
      <div v-for="(msg, i) in messages" :key="i" :class="msg.role">
        {{ msg.content }}
      </div>
    </div>
    <input v-model="input" @keypress.enter="sendMessage" />
    <button @click="sendMessage">Send</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      messages: [],
      input: ''
    }
  },
  methods: {
    async sendMessage() {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: this.input })
      });
      
      const data = await response.json();
      this.messages.push(
        { role: 'user', content: this.input },
        { role: 'assistant', content: data.response }
      );
      this.input = '';
    }
  }
}
</script>
```

---

## 💡 Integration Tips

1. **Keep Python process alive** for fast responses (use persistent process)
2. **Use session IDs** to maintain conversation context across requests
3. **MongoDB is optional** - automatically falls back to file-based storage
4. **Customize knowledge base** by editing files in `data/` folder
5. **Error handling** - Always check `success` field in API responses
6. **Rate limiting** - Consider implementing rate limits for Gemini API calls

---

## 🎓 For NUML Students

This chatbot is specifically designed for NUML university students with:

- 500 curated project ideas across all departments
- 69 detailed technology explanations
- Islamic greetings support
- Beginner-friendly recommendations
- Department-specific suggestions

---

## 📚 Documentation

- **Integration Guide**: `INTEGRATION_READY.md` - Complete integration instructions
- **API Reference**: See API Reference section above
- **Configuration**: See Configuration section above

---

## 🤝 Support

For issues or questions:
1. Check `INTEGRATION_READY.md` for detailed integration steps
2. Review `backend/chatbot_api.py` for API implementation
3. Check `data/` files to understand knowledge base structure

---

## 📝 License

MIT License - Feel free to use in your projects

---

**Made with ❤️ for NUML Students**

*Your intelligent FYP assistant, ready to integrate!* 🎓✨
