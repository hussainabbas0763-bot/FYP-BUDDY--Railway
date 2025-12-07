import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// PERSISTENT PYTHON PROCESS
// ============================================

let pythonProcess = null;
let pythonReady = false;
let messageQueue = [];

function startPythonProcess() {
    console.log('🐍 Starting FYP Buddy chatbot...');
    
    const scriptPath = path.join(__dirname, '..', 'Chatbot', 'backend', 'chatbot_api.py');
    const chatbotEnvPath = path.join(__dirname, '..', 'Chatbot', '.env');
    
    // Load environment variables from Chatbot/.env
    const envVars = { ...process.env };
    try {
        if (fs.existsSync(chatbotEnvPath)) {
            const envContent = fs.readFileSync(chatbotEnvPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const [key, ...valueParts] = trimmed.split('=');
                    if (key && valueParts.length > 0) {
                        envVars[key.trim()] = valueParts.join('=').trim();
                    }
                }
            });
            console.log('✅ Loaded environment variables from Chatbot/.env');
        }
    } catch (error) {
        console.error('⚠️ Could not load Chatbot/.env:', error.message);
    }
    
    pythonProcess = spawn('python', [scriptPath], {
        env: envVars,
        cwd: path.join(__dirname, '..', 'Chatbot')
    });
    
    let buffer = '';
    
    pythonProcess.stdout.on('data', (data) => {
        buffer += data.toString();
        
        const lines = buffer.split('\n');
        buffer = lines.pop();
        
        lines.forEach(line => {
            if (line.trim()) {
                try {
                    const response = JSON.parse(line);
                    
                    if (response.status === 'ready') {
                        pythonReady = true;
                        console.log('✅ FYP Buddy chatbot ready!');
                        return;
                    }
                    
                    if (messageQueue.length > 0) {
                        const { resolve } = messageQueue.shift();
                        resolve(response);
                    }
                } catch (e) {
                    console.error('Parse error:', e);
                }
            }
        });
    });
    
    pythonProcess.stderr.on('data', (data) => {
        console.error('Python error:', data.toString());
    });
    
    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        pythonReady = false;
        pythonProcess = null;
        
        setTimeout(() => {
            console.log('🔄 Restarting Python process...');
            startPythonProcess();
        }, 2000);
    });
}

function sendToPython(request) {
    return new Promise((resolve, reject) => {
        if (!pythonProcess || !pythonReady) {
            reject(new Error('Chatbot not ready'));
            return;
        }
        
        messageQueue.push({ resolve, reject });
        pythonProcess.stdin.write(JSON.stringify(request) + '\n');
        
        setTimeout(() => {
            const index = messageQueue.findIndex(item => item.resolve === resolve);
            if (index !== -1) {
                messageQueue.splice(index, 1);
                reject(new Error('Request timeout'));
            }
        }, 30000);
    });
}

// Start Python process when module loads
startPythonProcess();

// Cleanup on process exit
process.on('SIGINT', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
});

process.on('SIGTERM', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
});

// ============================================
// CONTROLLERS
// ============================================

export const sendChatMessage = async (req, res) => {
    try {
        const { message, session_id } = req.body;
        const user_id = req.user.id; // Get user ID from authenticated request
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }
        
        if (!pythonReady) {
            return res.status(503).json({
                success: false,
                message: 'Chatbot is initializing, please wait...'
            });
        }
        
        const response = await sendToPython({
            action: 'chat',
            message: message,
            session_id: session_id,
            user_id: user_id
        });
        
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to process chat message'
        });
    }
};

export const createNewSession = async (req, res) => {
    try {
        const { title } = req.body;
        const user_id = req.user.id;
        
        const response = await sendToPython({
            action: 'new_session',
            title: title || 'New Chat',
            user_id: user_id
        });
        
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to create new session'
        });
    }
};

export const listSessions = async (req, res) => {
    try {
        const user_id = req.user.id;
        const response = await sendToPython({ 
            action: 'list_sessions',
            user_id: user_id
        });
        
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to list sessions'
        });
    }
};

export const switchSession = async (req, res) => {
    try {
        const { session_id } = req.body;
        const user_id = req.user.id;
        
        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: 'session_id is required'
            });
        }
        
        const response = await sendToPython({
            action: 'switch_session',
            session_id: session_id,
            user_id: user_id
        });
        
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to switch session'
        });
    }
};

export const getSessionMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        
        const response = await sendToPython({
            action: 'get_messages',
            session_id: id,
            user_id: user_id
        });
        
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to get session messages'
        });
    }
};

export const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        
        const response = await sendToPython({
            action: 'delete_session',
            session_id: id,
            user_id: user_id
        });
        
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to delete session'
        });
    }
};

export const renameSession = async (req, res) => {
    try {
        const { session_id, title } = req.body;
        const user_id = req.user.id;
        
        if (!session_id || !title) {
            return res.status(400).json({
                success: false,
                message: 'session_id and title are required'
            });
        }
        
        const response = await sendToPython({
            action: 'rename_session',
            session_id: session_id,
            title: title,
            user_id: user_id
        });
        
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to rename session'
        });
    }
};

export const getChatbotHealth = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'FYP Buddy Chatbot API',
            chatbot_ready: pythonReady,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to check health'
        });
    }
};
