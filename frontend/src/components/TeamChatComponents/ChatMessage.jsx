import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Crown, MoreVertical, Trash2, Eye, Download, FileText, Phone, Video } from "lucide-react";
import userImg from "@/assets/user.jpg";

const ChatMessage = ({
    message,
    isCurrentUser,
    showAvatar,
    user,
    deleteMenuOpen,
    setDeleteMenuOpen,
    contextMenu,
    setContextMenu,
    handleDeleteMessage,
    handleImageDownload,
    handleFilePreview,
    handleImageContextMenu,
    formatTime,
}) => {
    const sender = message.sender || {};
    const isSupervisor = sender.role === "supervisor";

    return (
        <div
            className={`flex gap-3 ${isCurrentUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
        >
            {!isCurrentUser && (
                showAvatar ? (
                    <Avatar className="w-9 h-9 border-2 border-purple-500/20 dark:border-gray-600 flex-shrink-0">
                        <AvatarImage src={sender.profilePic || userImg} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                            {sender.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                ) : (
                    <div className="w-9 flex-shrink-0" />
                )
            )}

            <div className={`flex flex-col gap-1 max-w-[75%] md:max-w-[65%] ${isCurrentUser ? "items-end" : "items-start"}`}>
                {!isCurrentUser && showAvatar && (
                    <div className="flex items-center gap-2 px-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {sender.username || "Unknown"}
                        </span>
                        {isSupervisor && <Crown className="w-3 h-3 text-yellow-500 dark:text-yellow-400" />}
                    </div>
                )}

                <div
                    className={`rounded-2xl px-5 py-3 shadow-md relative group ${isCurrentUser
                            ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-sm"
                            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-600"
                        }`}
                >
                    {isCurrentUser && !message.isDeleted && (
                        <DropdownMenu open={deleteMenuOpen[message.id]} onOpenChange={(open) => setDeleteMenuOpen((prev) => ({ ...prev, [message.id]: open }))}>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-800 dark:bg-gray-700 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-600"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="w-3 h-3" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    onClick={() => handleDeleteMessage(message.id, false)}
                                    className="text-red-600 dark:text-red-400"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete for me
                                </DropdownMenuItem>
                                {isCurrentUser && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => handleDeleteMessage(message.id, true)}
                                            className="text-red-600 dark:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete for everyone
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    {!isCurrentUser && !message.isDeleted && (
                        <DropdownMenu open={deleteMenuOpen[message.id]} onOpenChange={(open) => setDeleteMenuOpen((prev) => ({ ...prev, [message.id]: open }))}>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-800 dark:bg-gray-700 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-600"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="w-3 h-3" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    onClick={() => handleDeleteMessage(message.id, false)}
                                    className="text-red-600 dark:text-red-400"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete for me
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    {message.isDeleted ? (
                        <div className="text-sm italic opacity-70">
                            This message was deleted
                        </div>
                    ) : (
                        <>
                            {message.messageType === "image" && message.attachments?.length > 0 && (
                                <div className="mb-2 rounded-lg overflow-hidden relative">
                                    <img
                                        src={message.attachments[0].url}
                                        alt={message.attachments[0].fileName || "Image"}
                                        className="max-w-full max-h-64 object-contain rounded-lg cursor-pointer"
                                        onContextMenu={(e) => handleImageContextMenu(e, message.id, message.attachments[0].url)}
                                        onClick={(e) => {
                                            if (e.ctrlKey || e.metaKey) {
                                                handleImageDownload(message.attachments[0].url, message.attachments[0].fileName);
                                            }
                                        }}
                                    />
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <button
                                            className="px-2 py-1 text-xs rounded-md bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700"
                                            onClick={() => handleFilePreview(message.attachments[0].url)}
                                        >
                                            <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> Preview</span>
                                        </button>
                                        <button
                                            className="px-2 py-1 text-xs rounded-md bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700"
                                            onClick={() => handleImageDownload(message.attachments[0].url, message.attachments[0].fileName)}
                                        >
                                            <span className="inline-flex items-center gap-1"><Download className="w-3 h-3" /> Download</span>
                                        </button>
                                    </div>
                                    {contextMenu.open && contextMenu.messageId === message.id && (
                                        <div
                                            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[150px]"
                                            style={{ left: contextMenu.x, top: contextMenu.y }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => {
                                                    handleImageDownload(contextMenu.imageUrl, message.attachments[0]?.fileName);
                                                    setContextMenu({ open: false, x: 0, y: 0, messageId: null, imageUrl: null });
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </button>
                                            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                                            <button
                                                onClick={() => {
                                                    handleDeleteMessage(message.id, false);
                                                    setContextMenu({ open: false, x: 0, y: 0, messageId: null, imageUrl: null });
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete for me
                                            </button>
                                            {isCurrentUser && (
                                                <button
                                                    onClick={() => {
                                                        handleDeleteMessage(message.id, true);
                                                        setContextMenu({ open: false, x: 0, y: 0, messageId: null, imageUrl: null });
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete for everyone
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            {message.messageType === "document" && message.attachments?.length > 0 && (
                                <div className="mb-2 p-3 bg-black/10 dark:bg-white/10 rounded-lg flex items-center gap-3">
                                    <FileText className="w-6 h-6 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {message.attachments[0].fileName || "Document"}
                                        </p>
                                        <p className="text-xs opacity-70">
                                            {(message.attachments[0].fileSize / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                    <a
                                        href={message.attachments[0].url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs underline"
                                    >
                                        Download
                                    </a>
                                    <a
                                        href={message.attachments[0].url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs underline ml-2"
                                    >
                                        Preview
                                    </a>
                                </div>
                            )}
                            {message.messageType === "contact" && message.contactData && (
                                <div className="mb-2 p-3 bg-black/10 dark:bg-white/10 rounded-lg flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={message.contactData.profilePic || userImg} />
                                        <AvatarFallback>
                                            {message.contactData.username?.[0]?.toUpperCase() || "C"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">
                                            {message.contactData.username || "Contact"}
                                        </p>
                                        {message.contactData.phone && (
                                            <p className="text-xs opacity-70">{message.contactData.phone}</p>
                                        )}
                                        {message.contactData.email && (
                                            <p className="text-xs opacity-70">{message.contactData.email}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {(message.messageType === "video_call" || message.messageType === "audio_call") && (
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${
                                        message.meta?.callStatus === "missed" || message.meta?.callStatus === "declined"
                                            ? "bg-red-100 dark:bg-red-900/30"
                                            : message.messageType === "video_call"
                                            ? isCurrentUser 
                                                ? "bg-white/20" 
                                                : "bg-purple-100 dark:bg-purple-900/30"
                                            : isCurrentUser 
                                            ? "bg-white/20" 
                                            : "bg-green-100 dark:bg-green-900/30"
                                    }`}>
                                        {message.messageType === "video_call" ? (
                                            <Video className={`w-5 h-5 ${
                                                message.meta?.callStatus === "missed" || message.meta?.callStatus === "declined"
                                                    ? "text-red-600 dark:text-red-400"
                                                    : isCurrentUser 
                                                    ? "text-white" 
                                                    : "text-purple-600 dark:text-purple-400"
                                            }`} />
                                        ) : (
                                            <Phone className={`w-5 h-5 ${
                                                message.meta?.callStatus === "missed" || message.meta?.callStatus === "declined"
                                                    ? "text-red-600 dark:text-red-400"
                                                    : isCurrentUser 
                                                    ? "text-white" 
                                                    : "text-green-600 dark:text-green-400"
                                            }`} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {message.meta?.callStatus === "missed" && !isCurrentUser && "Missed "}
                                            {message.meta?.callStatus === "declined" && !isCurrentUser && "Declined "}
                                            {message.messageType === "video_call" ? "Video call" : "Audio call"}
                                        </p>
                                        {message.meta?.callDuration > 0 ? (
                                            <p className="text-xs opacity-70">
                                                {(() => {
                                                    const seconds = message.meta.callDuration;
                                                    const hrs = Math.floor(seconds / 3600);
                                                    const mins = Math.floor((seconds % 3600) / 60);
                                                    const secs = seconds % 60;
                                                    if (hrs > 0) {
                                                        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                                                    }
                                                    return `${mins}:${secs.toString().padStart(2, '0')}`;
                                                })()}
                                            </p>
                                        ) : (
                                            <p className="text-xs opacity-70">
                                                {message.meta?.callStatus === "missed" ? "No answer" : message.meta?.callStatus === "declined" ? "Declined" : "Not connected"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {message.text && message.messageType !== "video_call" && message.messageType !== "audio_call" && (
                                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                    {message.text}
                                </div>
                            )}
                        </>
                    )}
                    <div className={`flex items-center gap-2 mt-2 ${isCurrentUser ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>
                        <span className="text-xs">{formatTime(message.timestamp)}</span>
                        {isCurrentUser && (
                            <span className="text-xs flex items-center ml-1">
                                {(() => {
                                    // For individual chats, show read/unread status
                                    if (message.activeChat?.type === "individual" && message.activeChat?.participant) {
                                        const recipientId = message.activeChat.participant.id;
                                        const isRead = message.readBy?.includes(recipientId);
                                        const isDelivered = message.deliveredTo?.includes(recipientId);
                                        
                                        return (
                                            <span className="flex items-center" title={isRead ? "Read" : isDelivered ? "Delivered" : "Sent"}>
                                                {isRead ? (
                                                    // Double checkmark (blue) - Read
                                                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                                                        <path d="M13.854 5.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 12.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                                                    </svg>
                                                ) : isDelivered ? (
                                                    // Double checkmark (gray) - Delivered but not read
                                                    <svg className="w-4 h-4 text-white/70 dark:text-gray-400" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                                                        <path d="M13.854 5.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 12.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                                                    </svg>
                                                ) : (
                                                    // Single checkmark (gray) - Sent but not delivered (offline)
                                                    <svg className="w-4 h-4 text-white/70 dark:text-gray-400" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                                                    </svg>
                                                )}
                                            </span>
                                        );
                                    }
                                    // For public chats, always show single tick (sent status only)
                                    if (message.activeChat?.type === "public") {
                                        return (
                                            <span className="flex items-center" title="Sent">
                                                <svg className="w-4 h-4 text-white/70 dark:text-gray-400" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                                                </svg>
                                            </span>
                                        );
                                    }
                                    
                                    // For group chats, show checkmarks based on read status
                                    if (message.activeChat?.type === "group") {
                                        const totalParticipants = message.activeChat?.participants?.length || 0;
                                        const readCount = message.readBy?.length || 0;
                                        const deliveredCount = message.deliveredTo?.length || 0;
                                        
                                        // For group chats, check if ALL participants (excluding sender) have read/delivered
                                        const allRead = readCount >= totalParticipants - 1; // Exclude sender
                                        const allDelivered = deliveredCount >= totalParticipants - 1; // Exclude sender
                                        
                                        return (
                                            <span className="flex items-center" title={allRead ? `Read by all (${readCount})` : allDelivered ? `Delivered to all (${deliveredCount})` : "Sent"}>
                                                {allRead ? (
                                                    // Double checkmark (blue) - Read by all
                                                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                                                        <path d="M13.854 5.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 12.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                                                    </svg>
                                                ) : allDelivered ? (
                                                    // Double checkmark (gray) - Delivered to all
                                                    <svg className="w-4 h-4 text-white/70 dark:text-gray-400" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                                                        <path d="M13.854 5.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 12.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                                                    </svg>
                                                ) : (
                                                    // Single checkmark (gray) - Sent but not delivered to all
                                                    <svg className="w-4 h-4 text-white/70 dark:text-gray-400" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                                                    </svg>
                                                )}
                                            </span>
                                        );
                                    }
                                    return null;
                                })()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {isCurrentUser && (
                showAvatar ? (
                    <Avatar className="w-9 h-9 border-2 border-purple-500/20 dark:border-gray-600 flex-shrink-0">
                        <AvatarImage src={user?.profilePic || userImg} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                            {user?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                ) : (
                    <div className="w-9 flex-shrink-0" />
                )
            )}
        </div>
    );
};

export default ChatMessage;
