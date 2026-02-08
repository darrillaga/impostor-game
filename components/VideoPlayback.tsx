"use client";

import { useState, useEffect, useRef } from "react";
import { Player } from "@/types/game";

interface PlayerVideo {
  playerId: string;
  playerName: string;
  videoUrl: string;
}

interface VideoPlaybackProps {
  playerVideos: PlayerVideo[];
  currentPlayerId: string;
}

export default function VideoPlayback({
  playerVideos,
  currentPlayerId,
}: VideoPlaybackProps) {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const handlePlayVideo = (playerId: string) => {
    // Pause all other videos
    Object.keys(videoRefs.current).forEach(key => {
      if (key !== playerId && videoRefs.current[key]) {
        videoRefs.current[key]!.pause();
      }
    });

    // Play the selected video
    if (videoRefs.current[playerId]) {
      videoRefs.current[playerId]!.play();
      setPlayingVideo(playerId);
    }
  };

  const handlePauseVideo = (playerId: string) => {
    if (videoRefs.current[playerId]) {
      videoRefs.current[playerId]!.pause();
      setPlayingVideo(null);
    }
  };

  if (playerVideos.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No video recordings available for this round.</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
        Word Reveal Recordings
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {playerVideos.map((playerVideo) => (
          <div
            key={playerVideo.playerId}
            className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${
              playerVideo.playerId === currentPlayerId
                ? "border-purple-500"
                : "border-gray-200"
            }`}
          >
            <div className="relative">
              <video
                ref={(el) => {
                  videoRefs.current[playerVideo.playerId] = el;
                }}
                src={playerVideo.videoUrl}
                className="w-full aspect-video object-cover"
                controls={false}
                playsInline
              />

              {playingVideo !== playerVideo.playerId && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer hover:bg-opacity-40 transition"
                  onClick={() => handlePlayVideo(playerVideo.playerId)}
                >
                  <div className="bg-white bg-opacity-90 rounded-full p-4 hover:scale-110 transition">
                    <svg
                      className="w-8 h-8 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}

              {playingVideo === playerVideo.playerId && (
                <div
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-2 cursor-pointer hover:bg-opacity-70 transition"
                  onClick={() => handlePauseVideo(playerVideo.playerId)}
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50">
              <p className="font-semibold text-gray-800 text-center">
                {playerVideo.playerName}
                {playerVideo.playerId === currentPlayerId && (
                  <span className="text-xs text-purple-600 ml-2">(You)</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
