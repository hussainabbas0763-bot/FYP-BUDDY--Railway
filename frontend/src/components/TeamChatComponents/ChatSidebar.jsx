import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Loader2, X } from "lucide-react";

const ChatSidebar = ({
    chats,
    activeChatId,
    roomsLoading,
    chatMessages,
    unreadCounts,
    onlineUsers,
    handleChatSelect,
    getChatAvatar,
    getChatTitle,
    getChatIcon,
    isChatsOpen,
    setIsChatsOpen,
    isMobile,
}) => {
    const renderChatList = () => (
        <div className="space-y-1">
            {roomsLoading ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                </div>
            ) : chats.length ? (
                chats.map((chat) => (
                    <div
                        key={chat.id}
                        onClick={() => handleChatSelect(chat.id)}
                        className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${chat.id === activeChatId
                                ? "bg-purple-50 dark:bg-gray-700 border-2 border-purple-500 dark:border-gray-600"
                                : "bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent"
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${chat.id === activeChatId
                                        ? "bg-gradient-to-br from-purple-500 to-purple-700 dark:bg-gray-600"
                                        : "bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700"
                                    }`}
                            >
                                {chat.avatar || chat.participant?.profilePic ? (
                                    <Avatar className="w-full h-full">
                                        {getChatAvatar(chat)}
                                        <AvatarFallback className="bg-transparent text-white">
                                            {chat.name?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : (
                                    getChatIcon(chat)
                                )}
                            </div>
                            <div className="flex-1 min-w-0 relative">
                                <div className="flex items-center justify-between gap-2">
                                    <p
                                        className={`text-sm font-medium truncate ${chat.id === activeChatId
                                                ? "text-purple-900 dark:text-gray-100"
                                                : "text-gray-900 dark:text-gray-100"
                                            }`}
                                    >
                                        {getChatTitle(chat)}
                                    </p>
                                    {unreadCounts[chat.id] > 0 && (
                                        <span className="flex-shrink-0 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                            {unreadCounts[chat.id] > 99 ? "99+" : unreadCounts[chat.id]}
                                        </span>
                                    )}
                                </div>
                                <p
                                    className={`text-xs mt-1 truncate ${chat.id === activeChatId
                                            ? "text-purple-700 dark:text-gray-300"
                                            : "text-gray-500 dark:text-gray-400"
                                        }`}
                                >
                                    {chatMessages[chat.id]?.length > 0
                                        ? `${chatMessages[chat.id][chatMessages[chat.id].length - 1]?.text?.substring(0, 30) || ""
                                        }...`
                                        : "No messages yet"}
                                </p>
                                {chat.type === "individual" && chat.participant && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                        {onlineUsers.has(chat.participant.id) ? (
                                            <span className="flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                Online
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                                Offline
                                            </span>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">
                    No chats available yet.
                </p>
            )}
        </div>
    );

    if (isMobile) {
        return (
            <>
                {isChatsOpen && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                            onClick={() => setIsChatsOpen(false)}
                        ></div>
                        <aside className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-80 bg-white dark:bg-gray-800 shadow-2xl lg:hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chats</h2>
                                <button
                                    onClick={() => setIsChatsOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                                    aria-label="Close chats"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 bg-white dark:bg-gray-800">
                                {renderChatList()}
                            </div>
                        </aside>
                    </>
                )}
            </>
        );
    }

    return (
        <aside className="hidden lg:flex flex-col w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-none overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Chats
                    </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {chats.length} {chats.length === 1 ? "chat" : "chats"}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-2 bg-white dark:bg-gray-800">
                {renderChatList()}
            </div>
        </aside>
    );
};

export default ChatSidebar;
