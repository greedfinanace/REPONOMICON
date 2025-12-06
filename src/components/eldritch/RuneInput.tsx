"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/src/lib/utils";

// Ghost with cursor tracking eyes and blink animation
function Ghost({ className, inputRef, isTyping }: { className?: string; inputRef?: React.RefObject<HTMLInputElement | null>; isTyping?: boolean }) {
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [lookingAtInput, setLookingAtInput] = useState(false);
  const ghostRef = useRef<SVGSVGElement>(null);

  // When typing/pasting, ghost looks at the input (to the right)
  useEffect(() => {
    if (isTyping) {
      setLookingAtInput(true);
      // Look to the right where the text is being typed
      setEyeOffset({ x: 2, y: 0.5 });
    } else {
      setLookingAtInput(false);
    }
  }, [isTyping]);

  // Cursor tracking (only when not typing)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (lookingAtInput || !ghostRef.current) return;
      
      const rect = ghostRef.current.getBoundingClientRect();
      const ghostCenterX = rect.left + rect.width / 2;
      const ghostCenterY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - ghostCenterX;
      const deltaY = e.clientY - ghostCenterY;
      const maxOffset = 2;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const normalizedX = distance > 0 ? (deltaX / distance) * Math.min(maxOffset, distance / 50) : 0;
      const normalizedY = distance > 0 ? (deltaY / distance) * Math.min(maxOffset, distance / 50) : 0;
      
      setEyeOffset({ x: normalizedX, y: normalizedY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [lookingAtInput]);

  // Random blink animation
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.7) blink();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <svg 
      ref={ghostRef}
      className={className} 
      viewBox="0 0 100 100" 
      fill="currentColor"
    >
      {/* Ghost body */}
      <path d="M50 10 C25 10 15 35 15 55 C15 70 15 85 20 90 C25 95 30 85 35 90 C40 95 45 85 50 90 C55 85 60 95 65 90 C70 85 75 95 80 90 C85 85 85 70 85 55 C85 35 75 10 50 10 Z" />
      
      {/* Left eye socket */}
      <ellipse cx="38" cy="45" rx="8" ry={isBlinking ? 1 : 10} fill="#0a0a0f" />
      {/* Left pupil - tracks cursor */}
      {!isBlinking && (
        <ellipse 
          cx={38 + eyeOffset.x} 
          cy={45 + eyeOffset.y} 
          rx="4" 
          ry="5" 
          fill="#8b5cf6" 
        />
      )}
      
      {/* Right eye socket */}
      <ellipse cx="62" cy="45" rx="8" ry={isBlinking ? 1 : 10} fill="#0a0a0f" />
      {/* Right pupil - tracks cursor */}
      {!isBlinking && (
        <ellipse 
          cx={62 + eyeOffset.x} 
          cy={45 + eyeOffset.y} 
          rx="4" 
          ry="5" 
          fill="#8b5cf6" 
        />
      )}
    </svg>
  );
}

// Sparkles icon component
function Sparkles({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

interface RuneInputProps {
  onSummon: (url: string) => void;
  disabled?: boolean;
}

export default function RuneInput({ onSummon, disabled }: RuneInputProps) {
  const [url, setUrl] = useState("");
  const [active, setActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (trimmedUrl && !isSubmitting && !disabled) {
      setIsSubmitting(true);
      onSummon(trimmedUrl);
      setUrl(""); // Clear input after submit
      // Reset submitting state after a short delay
      setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  // Handle typing detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setIsTyping(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop "typing" state after 1 second of no input
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      {/* Main container with purple glow on hover */}
      <div
        className={cn(
          "glow-on-hover relative flex items-center gap-3 p-3 rounded-xl",
          "bg-void-900/80 backdrop-blur-sm",
          "transition-all duration-300"
        )}
      >
        {/* Ghost with tracking eyes - looks at input when typing */}
        <Ghost 
          inputRef={inputRef}
          isTyping={isTyping || active}
          className={cn(
            "w-10 h-10 text-white flex-shrink-0 transition-transform duration-200",
            (isTyping || active) && "scale-110"
          )} 
        />

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={handleInputChange}
          onFocus={() => setActive(true)}
          onBlur={() => { setActive(false); setIsTyping(false); }}
          onPaste={() => setIsTyping(true)}
          placeholder="https://github.com/user/repo..."
          className={cn(
            "flex-1 bg-transparent",
            "text-xl font-mono text-white",
            "placeholder-void-500",
            "focus:outline-none"
          )}
        />

        {/* Summon button with rainbow glow */}
        <button
          type="submit"
          disabled={!url.trim() || isSubmitting || disabled}
          className={cn(
            "glow-on-hover px-5 py-2 rounded-lg",
            "bg-void-800 text-white font-semibold text-sm",
            "transition-all duration-200",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "flex items-center gap-2"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isSubmitting ? "SUMMONING..." : "SUMMON"}</span>
        </button>
      </div>

      {/* Rune decorations */}
      <div className="mt-3 text-center">
        <span className="text-xs text-void-700 font-mono tracking-widest">
          ⍙⊏⏃⏁ ⟟⌇ ⎅⟒⏃⎅ ⋔⏃⊬ ⋏⟒⎐⟒⍀ ⎅⟟⟒
        </span>
      </div>
    </form>
  );
}
