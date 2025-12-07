import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <Avatar className="w-9 h-9 flex-shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white text-lg">
          🎓
        </AvatarFallback>
      </Avatar>
      <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Thinking...
          </span>
        </div>
      </div>
    </div>
  );
}
