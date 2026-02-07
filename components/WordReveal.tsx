"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { getSocket } from "@/lib/socket";

interface WordRevealProps {
  roomId: string;
  category: string;
  word: string | null;
  impostorClue: string | null;
  isImpostor: boolean;
}

export default function WordReveal({
  roomId,
  category,
  word,
  impostorClue,
  isImpostor,
}: WordRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-200, 0], [1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y < -100) {
      setRevealed(true);
      getSocket().emit("wordRevealed", { roomId });
    }
  };

  if (revealed) {
    return (
      <div className="bg-white rounded-3xl shadow-2xl p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="mb-6">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Category
          </span>
          <h3 className="text-2xl font-bold text-gray-700 mt-2">{category}</h3>
        </div>

        {isImpostor ? (
          <div className="space-y-4">
            <div className="bg-red-100 border-2 border-red-500 rounded-2xl p-6">
              <span className="text-3xl font-bold text-red-600">
                YOU ARE THE IMPOSTOR
              </span>
            </div>
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Clue:</p>
              <p className="text-lg font-medium text-gray-800">{impostorClue}</p>
            </div>
          </div>
        ) : (
          <div className="bg-green-100 border-2 border-green-500 rounded-2xl p-8">
            <span className="text-sm font-medium text-gray-600 uppercase">
              Your Word
            </span>
            <h2 className="text-5xl font-bold text-green-600 mt-2">{word}</h2>
          </div>
        )}

        <p className="mt-8 text-gray-500">
          Waiting for other players to reveal...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 text-center min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity }}
      >
        <div className="text-gray-400">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
          <p className="text-xl font-medium">Swipe up to reveal</p>
        </div>
      </motion.div>

      <motion.div
        drag="y"
        dragConstraints={{ top: -300, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="cursor-grab active:cursor-grabbing touch-none z-10"
      >
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-12 shadow-2xl min-w-[300px]">
          <div className="bg-white bg-opacity-20 rounded-2xl p-8 backdrop-blur-sm">
            <span className="text-white text-sm font-medium uppercase tracking-wide">
              Swipe Up
            </span>
            <div className="mt-4">
              <svg
                className="w-12 h-12 mx-auto text-white animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>

      <p className="mt-8 text-gray-500 text-sm z-10">
        Drag the card upward to see your role
      </p>
    </div>
  );
}
