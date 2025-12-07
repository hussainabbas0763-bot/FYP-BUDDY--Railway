import React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, Phone, Video, MessageCircle } from "lucide-react";

const ChatHeader = ({
    activeChat,
    isChatsOpen,
    setIsChatsOpen,
    onlineUsers,
    startAudioCall,
    startVideoCall,
    getChatAvatar,
    getChatTitle,
    getChatIcon,
}) => {
    return (
        <Card className="mb-5 p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl border-none">
            <div className="flex items-center justify-between">
                {/* Mobile Chats Toggle */}
                <button
                    onClick={() => setIsChatsOpen(!isChatsOpen)}
                    className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 mr-3"
                    aria-label="Toggle chats"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Left: Avatar + Title */}
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                        {activeChat?.avatar ? (
                            <Avatar className="w-14 h-14 border-2 border-purple-500/20 dark:border-gray-600">
                                {getChatAvatar(activeChat)}
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                                    {activeChat.name?.[0]?.toUpperCase() || "C"}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                {activeChat ? getChatIcon(activeChat) : <MessageCircle className="w-7 h-7 text-white" />}
                            </div>
                        )}
                        {activeChat?.type === "individual" && activeChat?.participant ? (
                            <div
                                className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${onlineUsers.has(activeChat.participant.id) ? "bg-green-500" : "bg-gray-400"
                                    }`}
                            ></div>
                        ) : (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        )}
                    </div>

                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {activeChat ? getChatTitle(activeChat) : "Chat"}
                            </span>
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            {activeChat?.type === "public" ? (
                                <>
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    All students
                                </>
                            ) : activeChat?.type === "group" ? (
                                <>
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {activeChat.participants?.filter((p) => onlineUsers.has(p.id)).length || 0} online
                                </>
                            ) : activeChat?.participant ? (
                                <>
                                    <span
                                        className={`w-2 h-2 rounded-full ${onlineUsers.has(activeChat.participant.id) ? "bg-green-500" : "bg-gray-400"
                                            }`}
                                    ></span>
                                    {onlineUsers.has(activeChat.participant.id) ? "Online" : "Offline"}
                                </>
                            ) : (
                                <>
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    Online
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Right: Call Buttons */}
                {activeChat?.type !== "public" && (
                    <div className="flex items-center gap-3">
                        {/* Voice Call */}
                        <button
                            onClick={startAudioCall}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm"
                            aria-label="Voice Call"
                        >
                            <Phone className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>

                        {/* Video Call */}
                        <button
                            onClick={startVideoCall}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm"
                            aria-label="Video Call"
                        >
                            <Video className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ChatHeader;
