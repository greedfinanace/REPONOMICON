"use client";

import { useState } from "react";
import { cn } from "@/src/lib/utils";
import ReactMarkdown from "react-markdown";

export interface Message {
  id: string;
  role: "user" | "reponomicon";
  content: string;
  citations?: string[];
  repoUrl?: string;
}

interface ChatGrimoireProps {
  messages: Message[];
  repoUrl?: string;
}

function DownloadButton({ repoUrl }: { repoUrl: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Extract owner/repo from URL
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) return;
      
      const [, owner, repo] = match;
      const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`;
      
      // Open in new tab to download
      window.open(zipUrl, "_blank");
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg",
        "bg-rune-neon/10 border border-rune-neon/30",
        "text-rune-neon text-sm font-mono",
        "hover:bg-rune-neon/20 hover:border-rune-neon/50",
        "transition-all duration-200",
        "disabled:opacity-50"
      )}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {downloading ? "Downloading..." : "Download Source Code"}
    </button>
  );
}

function MessageBubble({ message, isLast, repoUrl }: { message: Message; isLast: boolean; repoUrl?: string }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "flex justify-end" : "w-full"
      )}
    >
      {isUser ? (
        // User message - bubble style
        <div className="max-w-[80%] rounded-xl px-4 py-3 bg-void-800 text-gray-300">
          <p className="text-sm font-mono leading-relaxed">{message.content}</p>
        </div>
      ) : (
        // AI message - full width, no scroll
        <div className="w-full">
          {/* Main content */}
          <div className="bg-void-900/30 border border-void-800 rounded-xl p-6">
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-rune-neon text-lg font-bold mt-6 mb-3 first:mt-0">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-rune-toxic text-base font-semibold mt-4 mb-2">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-300 leading-relaxed mb-3">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="text-gray-300 space-y-1 mb-4 ml-4">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="text-gray-300 space-y-1 mb-4 ml-4 list-decimal">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-300">{children}</li>
                  ),
                  code: ({ className, children }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                      return (
                        <pre className="bg-void-950 border border-void-700 rounded-lg p-4 overflow-x-auto my-4">
                          <code className="text-rune-neon text-sm font-mono">{children}</code>
                        </pre>
                      );
                    }
                    return (
                      <code className="bg-void-800 text-rune-toxic px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => <>{children}</>,
                  hr: () => <hr className="border-void-700 my-6" />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Citations */}
            {message.citations && message.citations.length > 0 && (
              <div className="mt-6 pt-4 border-t border-void-700/50">
                <p className="text-void-500 text-xs mb-2 font-mono">Files analyzed:</p>
                <div className="flex flex-wrap gap-2">
                  {message.citations.map((citation, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded text-xs font-mono bg-void-800 text-void-400 border border-void-700"
                    >
                      {citation}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Download button for last message */}
            {isLast && repoUrl && (
              <div className="mt-6 pt-4 border-t border-void-700/50 flex gap-3">
                <DownloadButton repoUrl={repoUrl} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatGrimoire({ messages, repoUrl }: ChatGrimoireProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <MessageBubble 
          key={message.id} 
          message={message} 
          isLast={index === messages.length - 1 && message.role === "reponomicon"}
          repoUrl={repoUrl}
        />
      ))}
    </div>
  );
}
