import React, { useState } from "react";
import { MessageSquare, Trash2, Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ChatListItem({ chat, isActive, onSelect, onDelete, onRename }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);

  const handleRenameClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(chat.title);
  };

  const handleSaveRename = async (e) => {
    e.stopPropagation();
    if (editTitle.trim() && editTitle !== chat.title) {
      await onRename(chat.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditTitle(chat.title);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSaveRename(e);
    } else if (e.key === "Escape") {
      handleCancelRename(e);
    }
  };

  return (
    <div
      onClick={isEditing ? undefined : onSelect}
      className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
        isActive
          ? "bg-purple-50 dark:bg-gray-700 border-2 border-purple-500 dark:border-purple-600"
          : "bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent"
      }`}
    >
      <div className="flex items-start gap-3">
        <MessageSquare
          className={`w-4 h-4 mt-1 flex-shrink-0 ${
            isActive
              ? "text-purple-600 dark:text-purple-400"
              : "text-gray-400 dark:text-gray-500"
          }`}
        />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                className="h-7 text-sm px-2"
                autoFocus
              />
              <button
                onClick={handleSaveRename}
                className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600"
                title="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCancelRename}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p
              className={`text-sm font-medium truncate ${
                isActive
                  ? "text-purple-900 dark:text-gray-100"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {chat.title}
            </p>
          )}
          {!isEditing && (
            <p
              className={`text-xs mt-1 ${
                isActive
                  ? "text-purple-600 dark:text-gray-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {chat.lastActivity.toLocaleDateString([], {
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
        </div>
        {!isEditing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleRenameClick}
              className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-500"
              title="Rename chat"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500"
              title="Delete chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
