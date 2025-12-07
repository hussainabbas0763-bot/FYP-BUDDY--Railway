import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import userImg from "@/assets/user.jpg";

export default function MessageBubble({ message, user }) {
  const isUser = message.sender === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Bot Avatar */}
      {!isUser && (
        <Avatar className="w-9 h-9 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white text-lg">
            🎓
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[75%]`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? "bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.text}
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Paragraphs
                  p: ({ children }) => (
                    <p className="mb-3 last:mb-0 leading-7 text-gray-900 dark:text-gray-100">
                      {children}
                    </p>
                  ),
                  // Bold text
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900 dark:text-gray-100">
                      {children}
                    </strong>
                  ),
                  // Italic text
                  em: ({ children }) => (
                    <em className="italic text-gray-900 dark:text-gray-100">
                      {children}
                    </em>
                  ),
                  // Unordered lists
                  ul: ({ children }) => (
                    <ul className="my-3 ml-4 space-y-1.5 list-disc marker:text-gray-500 dark:marker:text-gray-400">
                      {children}
                    </ul>
                  ),
                  // Ordered lists
                  ol: ({ children }) => (
                    <ol className="my-3 ml-4 space-y-1.5 list-decimal marker:text-gray-500 dark:marker:text-gray-400">
                      {children}
                    </ol>
                  ),
                  // List items
                  li: ({ children }) => (
                    <li className="leading-7 text-gray-900 dark:text-gray-100 pl-1">
                      {children}
                    </li>
                  ),
                  // Headings
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-gray-900 dark:text-gray-100">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0 text-gray-900 dark:text-gray-100">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-gray-900 dark:text-gray-100">
                      {children}
                    </h3>
                  ),
                  // Code blocks
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-sm font-mono text-purple-600 dark:text-purple-400">
                        {children}
                      </code>
                    ) : (
                      <code className="block p-3 rounded-lg bg-gray-100 dark:bg-gray-900 text-sm font-mono overflow-x-auto text-gray-900 dark:text-gray-100">
                        {children}
                      </code>
                    ),
                  // Pre (code block wrapper)
                  pre: ({ children }) => (
                    <pre className="my-3 rounded-lg overflow-hidden">
                      {children}
                    </pre>
                  ),
                  // Blockquotes
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-3 italic text-gray-700 dark:text-gray-300">
                      {children}
                    </blockquote>
                  ),
                  // Links
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      {children}
                    </a>
                  ),
                  // Horizontal rule
                  hr: () => (
                    <hr className="my-4 border-gray-300 dark:border-gray-600" />
                  ),
                  // Tables
                  table: ({ children }) => (
                    <div className="my-3 overflow-x-auto">
                      <table className="min-w-full border border-gray-300 dark:border-gray-600">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-gray-300 dark:divide-gray-600">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr>{children}</tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                      {children}
                    </td>
                  ),
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 px-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* User Avatar */}
      {isUser && (
        <Avatar className="w-9 h-9 flex-shrink-0">
          <AvatarImage src={user?.profilePic || userImg} />
          <AvatarFallback className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white">
            {user?.username?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
