import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ChatListItem from "./ChatListItem";

export default function ChatSidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
}) {
  return (
    <aside className="hidden xl:flex flex-col w-80 bg-white dark:bg-gray-800 p-6 shadow-md rounded-2xl sticky top-20 h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] flex-shrink-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Chat{" "}
          <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            History
          </span>
        </h3>
        <Button
          onClick={onNewChat}
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scroll">
        {chats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isActive={chat.id === activeChatId}
            onSelect={() => onSelectChat(chat.id)}
            onDelete={(e) => onDeleteChat(chat.id, e)}
            onRename={onRenameChat}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          {chats.length} {chats.length === 1 ? "conversation" : "conversations"}
        </p>
      </div>
    </aside>
  );
}
