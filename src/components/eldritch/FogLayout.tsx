"use client";

import { ReactNode, useEffect, useState } from "react";

interface FogLayoutProps {
  children: ReactNode;
  isLoading?: boolean;
}

export default function FogLayout({ children, isLoading = false }: FogLayoutProps) {
  const [abyssY, setAbyssY] = useState(0);
  const [abyssOpacity, setAbyssOpacity] = useState(0.1);

  // Abyss particle breathing animation
  useEffect(() => {
    let frame: number;
    let time = 0;
    
    const animate = () => {
      time += 0.01;
      setAbyssY(Math.sin(time) * 20);
      setAbyssOpacity(0.05 + Math.sin(time * 0.5) * 0.05);
      frame = requestAnimationFrame(animate);
    };
    
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative min-h-screen bg-void-950 text-gray-200 overflow-hidden">
      {/* Fog Layer - CSS gradient based (no image dependency) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <div 
          className="w-[200%] h-[200%] animate-fog-flow"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(167, 139, 250, 0.1) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 60%)
            `,
          }}
        />
      </div>

      {/* Abyss Particle - breathing glow */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          transform: `translate(-50%, calc(-50% + ${abyssY}px))`,
          opacity: abyssOpacity,
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* Secondary abyss glow */}
      <div
        className="fixed left-1/4 top-1/3 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          transform: `translateY(${-abyssY * 0.5}px)`,
          opacity: abyssOpacity * 0.7,
          background: "radial-gradient(circle, rgba(167, 139, 250, 0.2) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Loading pulse overlay */}
      {isLoading && (
        <div 
          className="fixed inset-0 pointer-events-none animate-pulse"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)",
          }}
        />
      )}

      {/* Vignette */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 15, 0.9) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
