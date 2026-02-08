"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { useTranslations } from "next-intl";
import VideoRecorder from "./VideoRecorder";

interface WordRevealProps {
  roomId: string;
  category: string;
  word: string | null;
  impostorClue: string | null;
  isImpostor: boolean;
  gameMode: "clue-random" | "category-nofirst";
}

export default function WordReveal({
  roomId,
  category,
  word,
  impostorClue,
  isImpostor,
  gameMode,
}: WordRevealProps) {
  const t = useTranslations('wordReveal');
  const tCategories = useTranslations('categories');
  const [revealed, setRevealed] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-200, 0], [1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y < -100) {
      setRevealed(true);
      getSocket().emit("wordRevealed", { roomId });
    }
  };

  const handleStartRecording = () => {
    setShowRecorder(true);
  };

  const handleRecordingComplete = async (blob: Blob) => {
    try {
      // Convert blob to base64 for transmission
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        getSocket().emit("uploadRecording", {
          roomId,
          videoData: base64data,
        });
        setRecordingComplete(true);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error uploading recording:", error);
    }
  };

  const handleSkipRecording = () => {
    getSocket().emit("playerReady", { roomId });
  };

  const handleReady = () => {
    getSocket().emit("playerReady", { roomId });
  };

  if (revealed) {
    // Show video recorder
    if (showRecorder && !recordingComplete) {
      return (
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            Record yourself saying the word
          </h3>
          <VideoRecorder
            onRecordingComplete={handleRecordingComplete}
            maxDuration={15}
            autoStart={false}
          />
        </div>
      );
    }

    // Show completion message after recording
    if (recordingComplete) {
      return (
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-green-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-2xl font-bold text-gray-800">Recording Uploaded!</h3>
            <p className="text-gray-600 mt-2">Waiting for other players...</p>
          </div>
          <button
            onClick={handleReady}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
          >
            {t('ready')}
          </button>
        </div>
      );
    }

    // Show word/role and recording option
    return (
      <div className="bg-white rounded-3xl shadow-2xl p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="mb-6">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {t('category')}
          </span>
          <h3 className="text-2xl font-bold text-gray-700 mt-2">{tCategories(category)}</h3>
        </div>

        {isImpostor ? (
          <div className="space-y-4">
            <div className="bg-red-100 border-2 border-red-500 rounded-2xl p-6">
              <span className="text-3xl font-bold text-red-600">
                {t('impostor')}
              </span>
            </div>
            {gameMode === "clue-random" && impostorClue && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">{t('clue')}</p>
                <p className="text-xl font-semibold text-yellow-700">{impostorClue}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-green-100 border-2 border-green-500 rounded-2xl p-8">
            <span className="text-sm font-medium text-gray-600 uppercase">
              {t('yourWord')}
            </span>
            <h2 className="text-5xl font-bold text-green-600 mt-2">{word}</h2>
          </div>
        )}

        <div className="mt-8 space-y-3 w-full max-w-md">
          <button
            onClick={handleStartRecording}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold py-3 px-8 rounded-lg hover:from-red-700 hover:to-pink-700 transition transform hover:scale-105"
          >
            Record Word (Optional)
          </button>
          <button
            onClick={handleSkipRecording}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
          >
            Skip Recording & Ready
          </button>
        </div>
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
          <p className="text-xl font-medium">{t('swipeUp')}</p>
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
              {t('swipeButton')}
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
        {t('dragInstruction')}
      </p>
    </div>
  );
}
