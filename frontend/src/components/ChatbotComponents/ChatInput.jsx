import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

export default function ChatInput({
  value,
  onChange,
  onSend,
  onKeyPress,
  isLoading,
  inputRef,
}) {
  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={onChange}
            onKeyPress={onKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-400 transition-all duration-200"
          />
        </div>
        <Button
          onClick={onSend}
          disabled={!value.trim() || isLoading}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
        FYP Buddy AI can make mistakes. Check important information.
      </p>
    </div>
  );
}
