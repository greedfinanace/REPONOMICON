"use client";

import { motion, AnimatePresence } from "framer-motion";

interface GhostLoaderProps {
  isVisible: boolean;
}

export default function GhostLoader({ isVisible }: GhostLoaderProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Ghost animation with transparent background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-64 h-64 object-contain"
          >
            <source src="/ghost-loading.webm" type="video/webm" />
          </video>

          {/* Text below */}
          <motion.p
            className="text-rune-neon font-mono text-sm tracking-widest mt-4"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            SUMMONING...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
