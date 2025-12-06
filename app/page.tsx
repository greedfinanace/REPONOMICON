"use client";

import { useState, useEffect } from "react";
import FogLayout from "@/src/components/eldritch/FogLayout";
import RuneInput from "@/src/components/eldritch/RuneInput";
import ChatGrimoire, { Message } from "@/src/components/eldritch/ChatGrimoire";
import GhostLoader from "@/src/components/eldritch/GhostLoader";

// Session type for history
interface Session {
  id: string;
  repoUrl: string;
  repoName: string;
  messages: Message[];
  createdAt: number;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentRepoUrl, setCurrentRepoUrl] = useState<string>("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareRepos, setCompareRepos] = useState<string[]>([]);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("reponomicon_sessions");
    if (saved) {
      setSessions(JSON.parse(saved));
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("reponomicon_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  // Extract repo name from URL
  const getRepoName = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    return match ? `${match[1]}/${match[2]}` : url;
  };

  // Generate share link
  const generateShareLink = () => {
    const data = {
      repo: currentRepoUrl,
      messages: messages.map(m => ({ role: m.role, content: m.content.slice(0, 500) }))
    };
    const encoded = btoa(JSON.stringify(data));
    const shareUrl = `${window.location.origin}?share=${encoded}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Share link copied to clipboard!");
  };

  // Export as PDF
  const exportPDF = async () => {
    const content = messages.map(m => 
      `${m.role === "user" ? "Query" : "Analysis"}:\n${m.content}\n\n`
    ).join("---\n\n");
    
    const blob = new Blob([
      `REPONOMICON RESEARCH REPORT\n`,
      `Repository: ${currentRepoUrl}\n`,
      `Generated: ${new Date().toLocaleString()}\n`,
      `${"=".repeat(50)}\n\n`,
      content
    ], { type: "text/plain" });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reponomicon-${getRepoName(currentRepoUrl).replace("/", "-")}.txt`;
    a.click();
  };

  // Load a session from history
  const loadSession = (session: Session) => {
    setMessages(session.messages);
    setCurrentRepoUrl(session.repoUrl);
    setCurrentSessionId(session.id);
    setShowHistory(false);
  };

  // Clear current session
  const newSession = () => {
    setMessages([]);
    setCurrentRepoUrl("");
    setCurrentSessionId("");
  };

  // Delete a session
  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  // Clear all history
  const clearHistory = () => {
    setSessions([]);
    localStorage.removeItem("reponomicon_sessions");
  };

  // Handle special analysis (security scan or improvement suggestions)
  const handleSpecialAnalysis = async (type: "security" | "improve") => {
    if (!currentRepoUrl || loading) return;

    const queryMap = {
      security: "🛡️ Security Scan",
      improve: "💡 Improvement Suggestions",
    };

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: queryMap[type],
    };

    const loadingMessage: Message = {
      id: "loading",
      role: "reponomicon",
      content: type === "security" ? "Scanning for malicious code..." : "Analyzing for improvements...",
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setLoading(true);

    try {
      const response = await fetch("/api/reponomicon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: currentRepoUrl,
          query: type === "improve" 
            ? "What are the main areas where this code could be improved? Focus on: code quality, performance, security best practices, and maintainability. Give specific actionable suggestions."
            : undefined,
          checkMalicious: type === "security",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();

      const botMessage: Message = {
        id: data.id || crypto.randomUUID(),
        role: "reponomicon",
        content: data.content || "Analysis complete.",
        citations: data.citations || [],
      };

      setMessages(prev => [...prev.filter(m => m.id !== "loading"), userMessage, botMessage]);
    } catch (error: any) {
      console.error("Analysis error:", error);
      setMessages(prev =>
        prev.filter(m => m.id !== "loading").concat({
          id: crypto.randomUUID(),
          role: "reponomicon",
          content: `⚠️ Analysis failed: ${error.message || "Unknown error"}`,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSummon = async (url: string) => {
    // Handle compare mode
    if (compareMode && compareRepos.length < 2) {
      setCompareRepos(prev => [...prev, url]);
      if (compareRepos.length === 0) {
        const userMsg: Message = {
          id: crypto.randomUUID(),
          role: "user",
          content: `Compare repo 1: ${url}\nNow enter the second repo URL...`,
        };
        setMessages(prev => [...prev, userMsg]);
        return;
      }
    }

    setCurrentRepoUrl(url);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: compareMode ? `Compare: ${compareRepos[0]} vs ${url}` : url,
    };

    const loadingMessage: Message = {
      id: "loading",
      role: "reponomicon",
      content: compareMode ? "Analyzing both repositories..." : "Analyzing repository...",
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setLoading(true);

    try {
      let response;
      
      if (compareMode && compareRepos.length === 1) {
        // Compare two repos
        response = await fetch("/api/reponomicon/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repo1: compareRepos[0],
            repo2: url,
          }),
        });
        setCompareMode(false);
        setCompareRepos([]);
      } else {
        // Single repo analysis
        response = await fetch("/api/reponomicon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();

      const botMessage: Message = {
        id: data.id || crypto.randomUUID(),
        role: "reponomicon",
        content: data.content || "Analysis complete.",
        citations: data.citations || [],
      };

      const newMessages = [...messages.filter(m => m.id !== "loading"), userMessage, botMessage];
      setMessages(newMessages);

      // Save to session
      const sessionId = currentSessionId || crypto.randomUUID();
      const session: Session = {
        id: sessionId,
        repoUrl: url,
        repoName: getRepoName(url),
        messages: newMessages,
        createdAt: Date.now(),
      };
      
      setSessions(prev => {
        const existing = prev.findIndex(s => s.id === sessionId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = session;
          return updated;
        }
        return [session, ...prev].slice(0, 20); // Keep last 20 sessions
      });
      setCurrentSessionId(sessionId);

    } catch (error: any) {
      console.error("Analysis error:", error);
      setMessages(prev =>
        prev.filter(m => m.id !== "loading").concat({
          id: crypto.randomUUID(),
          role: "reponomicon",
          content: `⚠️ Analysis failed: ${error.message || "Unknown error"}. Please check the URL and try again.`,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <FogLayout isLoading={loading}>
      <GhostLoader isVisible={loading} />

      {/* Bottom Right Action Bar */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-2 z-50">
        {hasMessages && (
          <>
            <button
              onClick={() => handleSpecialAnalysis("security")}
              disabled={loading || !currentRepoUrl}
              className="px-3 py-2 bg-void-800 border border-void-700 rounded-lg text-void-400 hover:text-red-400 hover:border-red-400/50 transition-all text-sm font-mono disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🛡️ Security
            </button>
            <button
              onClick={() => handleSpecialAnalysis("improve")}
              disabled={loading || !currentRepoUrl}
              className="px-3 py-2 bg-void-800 border border-void-700 rounded-lg text-void-400 hover:text-yellow-400 hover:border-yellow-400/50 transition-all text-sm font-mono disabled:opacity-40 disabled:cursor-not-allowed"
            >
              💡 Improve
            </button>
            <button
              onClick={exportPDF}
              className="px-3 py-2 bg-void-800 border border-void-700 rounded-lg text-void-400 hover:text-rune-toxic hover:border-rune-toxic/50 transition-all text-sm font-mono"
            >
              📄 Export
            </button>
            <button
              onClick={generateShareLink}
              className="px-3 py-2 bg-void-800 border border-void-700 rounded-lg text-void-400 hover:text-rune-neon hover:border-rune-neon/50 transition-all text-sm font-mono"
            >
              🔗 Share
            </button>
            <button
              onClick={newSession}
              className="px-3 py-2 bg-void-800 border border-void-700 rounded-lg text-void-400 hover:text-white hover:border-white/50 transition-all text-sm font-mono"
            >
              ✨ New
            </button>
          </>
        )}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-3 py-2 bg-void-800 border border-void-700 rounded-lg text-void-400 hover:text-rune-neon hover:border-rune-neon/50 transition-all text-sm font-mono"
        >
          📜 History ({sessions.length})
        </button>
        <button
          onClick={() => { setCompareMode(!compareMode); setCompareRepos([]); }}
          className={`px-3 py-2 border rounded-lg text-sm font-mono transition-all ${
            compareMode 
              ? "bg-rune-neon/20 border-rune-neon text-rune-neon" 
              : "bg-void-800 border-void-700 text-void-400 hover:text-rune-toxic hover:border-rune-toxic/50"
          }`}
        >
          ⚔️ Compare
        </button>
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed left-0 top-0 h-full w-80 bg-void-950 border-r border-void-800 z-40 overflow-y-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-rune-neon font-mono text-lg">Research History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-void-500 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            {sessions.length === 0 ? (
              <p className="text-void-500 text-sm">No history yet</p>
            ) : (
              <>
                <button
                  onClick={clearHistory}
                  className="w-full mb-3 px-3 py-2 bg-red-900/30 border border-red-800/50 rounded-lg text-red-400 hover:bg-red-900/50 hover:border-red-600 transition-all text-sm font-mono"
                >
                  🗑️ Clear All History
                </button>
                <div className="space-y-2">
                  {sessions.map(session => (
                    <div
                      key={session.id}
                      className="p-3 bg-void-900 border border-void-800 rounded-lg hover:border-rune-neon/30 transition-all cursor-pointer group"
                      onClick={() => loadSession(session)}
                    >
                      <p className="text-gray-300 text-sm font-mono truncate">{session.repoName}</p>
                      <p className="text-void-500 text-xs mt-1">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                        className="text-void-600 hover:text-red-500 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content - Changes layout based on whether there are messages */}
      {!hasMessages ? (
        // Initial centered layout
        <div className="min-h-screen flex flex-col justify-center items-center gap-8">
          <h1 
            className="text-8xl tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-200 to-purple-500"
            style={{ fontFamily: 'Ghostbum, sans-serif' }}
          >
            REPONOMICON
          </h1>

          <p className="text-rune-neon font-mono text-lg tracking-wide">
            {compareMode 
              ? `Compare Mode: ${compareRepos.length}/2 repos selected`
              : "Raise Dead Code. Question the Source."
            }
          </p>

          <RuneInput onSummon={handleSummon} />
        </div>
      ) : (
        // Chat layout with input at bottom
        <div className="flex flex-col min-h-screen">
          {/* Header - smaller when chatting */}
          <div className="pt-16 pb-4 text-center">
            <h1 
              className="text-4xl tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-200 to-purple-500"
              style={{ fontFamily: 'Ghostbum, sans-serif' }}
            >
              REPONOMICON
            </h1>
            {currentRepoUrl && (
              <p className="text-void-500 font-mono text-sm mt-1">
                {getRepoName(currentRepoUrl)}
              </p>
            )}
          </div>

          {/* Chat messages - scrollable area */}
          <div className="flex-1 overflow-y-auto px-4 pb-32">
            <div className="max-w-4xl mx-auto">
              <ChatGrimoire messages={messages} repoUrl={currentRepoUrl} />
            </div>
          </div>

          {/* Input fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-void-950 via-void-950 to-transparent pt-8 pb-6 px-4">
            <div className="max-w-2xl mx-auto">
              <RuneInput onSummon={handleSummon} />
              {compareMode && (
                <p className="text-rune-neon font-mono text-xs text-center mt-2">
                  Compare Mode: {compareRepos.length}/2 repos selected
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </FogLayout>
  );
}
