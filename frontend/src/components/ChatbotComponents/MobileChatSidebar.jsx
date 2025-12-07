import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import ChatListItem from "./ChatListItem";

export default function MobileChatSidebar({
  isOpen,
  onClose,
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 xl:hidden"
        onClick={onClose}
      ></div>

      {/* Mobile Chats Sidebar */}
      <aside className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-80 bg-white dark:bg-gray-800 shadow-2xl xl:hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Chat{" "}
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              History
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            aria-label="Close chats"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Button
            onClick={onNewChat}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            {chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                onSelect={() => {
                  onSelectChat(chat.id);
                  onClose();
                }}
                onDelete={(e) => onDeleteChat(chat.id, e)}
                onRename={onRenameChat}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            {chats.length}{" "}
            {chats.length === 1 ? "conversation" : "conversations"}
          </p>
        </div>
      </aside>
    </>
  );
}
