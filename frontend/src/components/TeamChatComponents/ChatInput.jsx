import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Plus, Image, FileText, UserPlus, Send, Loader2 } from "lucide-react";

const ChatInput = ({
    inputValue,
    setInputValue,
    canSendMessage,
    uploading,
    activeChat,
    imageInputRef,
    fileInputRef,
    inputRef,
    isAttachmentMenuOpen,
    setIsAttachmentMenuOpen,
    handleImageSelect,
    handleDocumentSelect,
    handleContactShare,
    handleSendMessage,
    handleKeyPress,
    connectionError,
    socketRef,
}) => {
    return (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
            />
            <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                onChange={handleDocumentSelect}
                className="hidden"
            />
            <div className="flex gap-3 items-end">
                <Popover open={isAttachmentMenuOpen} onOpenChange={setIsAttachmentMenuOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            disabled={!canSendMessage || uploading}
                            className="px-4 py-6 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Plus className="w-5 h-5" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start" side="top">
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    imageInputRef.current?.click();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                            >
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Image className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Photos</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Share images</p>
                                </div>
                            </button>
                            <button
                                onClick={() => {
                                    fileInputRef.current?.click();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                            >
                                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Documents</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Share files</p>
                                </div>
                            </button>
                            <button
                                onClick={handleContactShare}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                            >
                                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Contact</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Share your contact</p>
                                </div>
                            </button>
                        </div>
                    </PopoverContent>
                </Popover>
                <div className="flex-1 relative">
                    <Input
                        ref={inputRef}
                        value={inputValue}
                        disabled={!canSendMessage || uploading}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => {
                            if (!canSendMessage || uploading) return;
                            handleKeyPress(e);
                        }}
                        placeholder={
                            activeChat
                                ? "Type your message... (Press Enter to send)"
                                : "Select a chat to start messaging"
                        }
                        className="w-full pr-12 py-6 rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-gray-500 transition-all duration-200"
                    />
                </div>
                <Button
                    onClick={() => handleSendMessage()}
                    disabled={(!inputValue.trim() && !uploading) || !canSendMessage || uploading}
                    className="px-6 py-6 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-500 hover:via-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    <Send className="w-5 h-5" />
                </Button>
            </div>
            {connectionError && (
                <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 rounded-lg">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        {connectionError}
                    </p>
                    {socketRef.current && !socketRef.current.connected && (
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            Reconnecting...
                        </p>
                    )}
                </div>
            )}
            {socketRef.current && socketRef.current.connected && !connectionError && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    ✓ Connected
                </p>
            )}
        </div>
    );
};

export default ChatInput;
