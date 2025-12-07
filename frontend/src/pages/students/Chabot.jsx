import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Bot, Menu } from "lucide-react";
import MessageBubble from "@/components/ChatbotComponents/MessageBubble";
import ChatInput from "@/components/ChatbotComponents/ChatInput";
import TypingIndicator from "@/components/ChatbotComponents/TypingIndicator";
import ChatSidebar from "@/components/ChatbotComponents/ChatSidebar";
import MobileChatSidebar from "@/components/ChatbotComponents/MobileChatSidebar";
import SEO from "@/components/SEO";

export default function Chatbot() {
  const { user } = useSelector((store) => store.auth);
  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");
  
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatsOpen, setIsChatsOpen] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingIntervalRef = useRef(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId) || chats[0] || { messages: [] };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [activeChat?.messages]);

  // Load chats from backend on mount
  useEffect(() => {
    loadChatsFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadChatsFromBackend = async () => {
    try {
      setIsLoadingChats(true);
      const res = await axios.get(`${apiURL}/chatbot/sessions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.data.success && res.data.sessions && res.data.sessions.length > 0) {
        const loadedChats = res.data.sessions.map((session) => ({
          id: session.id,
          sessionId: session.id,
          title: session.title,
          messages: [],
          lastActivity: new Date(session.updated_at),
          messageCount: session.message_count,
        }));
        
        setChats(loadedChats);
        setActiveChatId(loadedChats[0].id);
        
        if (loadedChats[0].id) {
          await loadChatMessages(loadedChats[0].id);
        }
      } else {
        // No chats exist - just show empty state
        setChats([]);
        setActiveChatId(null);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
      setActiveChatId(null);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const loadChatMessages = async (sessionId) => {
    try {
      const res = await axios.get(`${apiURL}/chatbot/sessions/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.data.success && res.data.messages) {
        const messages = res.data.messages.map((msg, index) => ({
          id: index + 1,
          text: msg.content,
          sender: msg.role === 'user' ? 'user' : 'bot',
          timestamp: new Date(msg.timestamp),
        }));

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === sessionId ? { ...chat, messages } : chat
          )
        );
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const typeMessage = (fullText, messageId, targetChatId) => {
    setIsTyping(true);
    setTypingText("");
    let currentIndex = 0;

    // Clear any existing typing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    typingIntervalRef.current = setInterval(() => {
      if (currentIndex < fullText.length) {
        // Type 10 characters at once for super fast speed
        const charsToAdd = fullText.slice(currentIndex, currentIndex + 10);
        setTypingText((prev) => prev + charsToAdd);
        currentIndex += 10;
      } else {
        clearInterval(typingIntervalRef.current);
        setIsTyping(false);
        setTypingText("");
        
        // Add the complete message to chat using the targetChatId
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === targetChatId
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    {
                      id: messageId,
                      text: fullText,
                      sender: "bot",
                      timestamp: new Date(),
                    },
                  ],
                }
              : chat
          )
        );
      }
    }, 5); // Super fast: 5ms interval + 10 chars per tick
  };

  const handleSendMessage = async (text = null) => {
    const messageText = text || inputValue.trim();
    if (!messageText && !text) return;

    setInputValue("");
    setIsLoading(true);

    let currentSessionId = activeChatId;
    let currentChats = [...chats];

    // If no chats exist, we'll let the backend create one
    if (chats.length === 0 || !activeChatId) {
      // Create a temporary chat in UI
      const tempChat = {
        id: 'temp',
        sessionId: null,
        title: messageText.substring(0, 30) + (messageText.length > 30 ? "..." : ""),
        messages: [{
          id: 1,
          text: messageText,
          sender: "user",
          timestamp: new Date(),
        }],
        lastActivity: new Date(),
      };
      setChats([tempChat]);
      setActiveChatId('temp');
      currentSessionId = null;
      currentChats = [tempChat];
    } else {
      // Add user message to existing chat
      const userMessage = {
        id: (activeChat?.messages?.length || 0) + 1,
        text: messageText,
        sender: "user",
        timestamp: new Date(),
      };

      const updatedChats = chats.map((chat) =>
        chat.id === activeChatId
          ? {
            ...chat,
            messages: [...(chat.messages || []), userMessage],
            lastActivity: new Date(),
            title: (chat.messages?.length || 0) === 0 ? messageText.substring(0, 30) + (messageText.length > 30 ? "..." : "") : chat.title,
          }
          : chat
      );
      setChats(updatedChats);
      currentChats = updatedChats;
    }

    try {
      const res = await axios.post(
        `${apiURL}/chatbot/chat`,
        {
          message: messageText,
          session_id: activeChat?.sessionId || null
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          withCredentials: true,
          validateStatus: () => true
        }
      );

      setIsLoading(false);

      if (res.data.success) {
        const newSessionId = res.data.session_id;
        
        // If this was a new chat (temp), replace it with real chat
        if (activeChatId === 'temp' || !activeChatId) {
          // Keep the user message that's already in the temp chat
          const tempChat = currentChats.find(c => c.id === 'temp');
          const existingMessages = tempChat?.messages || [{
            id: 1,
            text: messageText,
            sender: "user",
            timestamp: new Date(),
          }];
          
          const realChat = {
            id: newSessionId,
            sessionId: newSessionId,
            title: messageText.substring(0, 30) + (messageText.length > 30 ? "..." : ""),
            messages: existingMessages,
            lastActivity: new Date(),
          };
          setChats([realChat]);
          setActiveChatId(newSessionId);
          
          // Start typing effect with the real chat - pass the new session ID
          const messageId = existingMessages.length + 1;
          typeMessage(res.data.response, messageId, newSessionId);
        } else {
          // Update existing chat with session ID
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === activeChatId
                ? {
                    ...chat,
                    sessionId: newSessionId || chat.sessionId,
                    lastActivity: new Date(),
                  }
                : chat
            )
          );

          const messageId = (activeChat?.messages?.length || 0) + 2;
          // Start typing effect - pass the current active chat ID
          typeMessage(res.data.response, messageId, activeChatId);
        }
      } else {
        const errorResponse = {
          id: (activeChat?.messages?.length || 0) + 2,
          text: `Sorry, I encountered an error: ${res.data.message || 'Please try again.'}`,
          sender: "bot",
          timestamp: new Date(),
        };

        // Use functional update to safely add error message
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === activeChatId
              ? {
                ...chat,
                messages: [...(chat.messages || []), errorResponse],
                lastActivity: new Date(),
              }
              : chat
          )
        );
        toast.error(res.data.message || "Failed to send message");
      }
    } catch (error) {
      console.error('Chat error:', error);
      setIsLoading(false);
      
      const errorResponse = {
        id: (activeChat?.messages?.length || 0) + 2,
        text: 'Sorry, I am having trouble connecting. Please check if the chatbot service is running.',
        sender: "bot",
        timestamp: new Date(),
      };

      // Use currentChats instead of updatedChats to handle all cases
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChatId
            ? {
              ...chat,
              messages: [...(chat.messages || []), errorResponse],
              lastActivity: new Date(),
            }
            : chat
        )
      );
      toast.error(error.response?.data?.message || "Unable to send message");
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await axios.post(
        `${apiURL}/chatbot/sessions/new`,
        { title: "New Chat" },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
          validateStatus: () => true,
        }
      );

      if (res.data.success) {
        const newChat = {
          id: res.data.session_id,
          sessionId: res.data.session_id,
          title: "New Chat",
          messages: [
            {
              id: 1,
              text: `👋 Hello ${user?.username?.split(" ")[0] || "there"}! I'm your FYP Buddy AI assistant. How can I help you today?`,
              sender: "bot",
              timestamp: new Date(),
            },
          ],
          lastActivity: new Date(),
        };
        setChats([newChat, ...chats]);
        setActiveChatId(newChat.id);
        setIsChatsOpen(false);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast.error("Failed to create new chat");
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    
    try {
      const res = await axios.delete(`${apiURL}/chatbot/sessions/${chatId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.data.success) {
        const updatedChats = chats.filter((chat) => chat.id !== chatId);
        setChats(updatedChats);
        
        // If this was the active chat or no chats left, clear active chat
        if (chatId === activeChatId || updatedChats.length === 0) {
          setActiveChatId(null);
        } else {
          // Switch to first remaining chat
          setActiveChatId(updatedChats[0]?.id);
          await loadChatMessages(updatedChats[0]?.id);
        }
        
        toast.success("Chat deleted");
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error("Failed to delete chat");
    }
  };

  const handleChatSelect = async (chatId) => {
    // Stop any ongoing typing animation when switching chats
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      setIsTyping(false);
      setTypingText("");
    }
    
    setActiveChatId(chatId);
    setIsChatsOpen(false);
    
    const chat = chats.find((c) => c.id === chatId);
    if (chat && (!chat.messages || chat.messages.length === 0)) {
      await loadChatMessages(chatId);
    }
  };

  const handleRenameChat = async (chatId, newTitle) => {
    try {
      const res = await axios.post(
        `${apiURL}/chatbot/sessions/rename`,
        { session_id: chatId, title: newTitle },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
          validateStatus: () => true,
        }
      );

      if (res.data.success) {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId ? { ...chat, title: newTitle } : chat
          )
        );
        toast.success("Chat renamed");
      } else {
        toast.error(res.data.message || "Failed to rename chat");
      }
    } catch (error) {
      console.error('Error renaming chat:', error);
      toast.error("Failed to rename chat");
    }
  };

  const handleClearChat = async () => {
    try {
      // Delete current chat and create a new one
      await handleDeleteChat(activeChatId, { stopPropagation: () => {} });
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error("Failed to clear chat");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Cleanup typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  if (isLoadingChats) {
    return (
      <div className="min-h-screen mt-15">
        <div className="flex flex-col md:flex-row gap-5 p-5">
          <Sidebar portalType="student" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading chats...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <SEO 
      title="AI Chatbot | FYP Buddy - Get Instant Help"
      description="Chat with our AI assistant for instant help with your FYP. Get answers to questions, guidance on research, and support throughout your project journey."
      keywords="AI chatbot, FYP assistant, project help, research guidance, academic support"
    />
    <div className="min-h-screen mt-15">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        <Sidebar portalType="student" />

        <div className="flex flex-col xl:flex-row flex-1 gap-5">
          <main className="flex-1 flex flex-col gap-5">
            <Card className="w-full max-w-5xl mx-auto text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsChatsOpen(!isChatsOpen)}
                  className="xl:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                  aria-label="Toggle chats"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                <div className="flex-1 flex items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                  </div>
                  <div className="text-left">
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                      <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        FYP Buddy AI
                      </span>
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your intelligent FYP assistant
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="w-full max-w-5xl mx-auto flex-1 flex flex-col bg-white dark:bg-gray-800 shadow-md rounded-2xl overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
                {!activeChatId && chats.length === 0 ? (
                  <div className="flex flex-col h-full items-center justify-center text-center px-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 flex items-center justify-center mb-6 text-4xl">
                      🎓
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      Welcome to FYP Buddy AI
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                      Your intelligent assistant for Final Year Projects. Ask me anything about project ideas, technologies, or guidance!
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Type a message below to start your first conversation
                    </p>
                  </div>
                ) : (
                  <>
                    {activeChat?.messages?.map((message) => (
                      <MessageBubble key={message.id} message={message} user={user} />
                    ))}

                    {isLoading && <TypingIndicator />}

                    {isTyping && (
                      <MessageBubble
                        message={{
                          id: "typing",
                          text: typingText,
                          sender: "bot",
                          timestamp: new Date(),
                        }}
                        user={user}
                      />
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <ChatInput
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onSend={() => handleSendMessage()}
                onKeyPress={handleKeyPress}
                isLoading={isLoading || isTyping}
                inputRef={inputRef}
              />
            </Card>
          </main>

          <ChatSidebar
            chats={chats}
            activeChatId={activeChatId}
            onNewChat={handleNewChat}
            onSelectChat={handleChatSelect}
            onDeleteChat={handleDeleteChat}
            onRenameChat={handleRenameChat}
          />
        </div>
      </div>

      <MobileChatSidebar
        isOpen={isChatsOpen}
        onClose={() => setIsChatsOpen(false)}
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleChatSelect}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
      />
    </div>
    </>
  );
}
