"use client";

import { useState, useRef, useEffect } from "react";

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxDuration?: number; // in seconds
  autoStart?: boolean;
}

export default function VideoRecorder({
  onRecordingComplete,
  maxDuration = 30,
  autoStart = false,
}: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [error, setError] = useState("");
  const [hasPermission, setHasPermission] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Request camera and microphone permissions
    requestPermissions();

    return () => {
      // Cleanup: stop all tracks when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (autoStart && hasPermission && countdown === 0 && !isRecording) {
      startRecording();
    }
  }, [autoStart, hasPermission, countdown, isRecording]);

  useEffect(() => {
    if (countdown > 0 && countdown <= 3) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (isRecording && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isRecording && timeLeft === 0) {
      stopRecording();
    }
  }, [isRecording, timeLeft]);

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: true
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setHasPermission(true);
    } catch (err: any) {
      console.error("Error accessing media devices:", err);
      setError("Unable to access camera/microphone. Please grant permissions.");
      setHasPermission(false);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) {
      setError("No media stream available");
      return;
    }

    chunksRef.current = [];

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      onRecordingComplete(blob);
      chunksRef.current = [];
    };

    mediaRecorder.start(1000); // Collect data every second
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setTimeLeft(maxDuration);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!hasPermission && !error && (
        <div className="text-gray-600 text-center">
          <p>Requesting camera and microphone permissions...</p>
        </div>
      )}

      {hasPermission && (
        <>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full max-w-md rounded-2xl"
            />

            {countdown > 0 && countdown <= 3 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-8xl font-bold animate-pulse">
                  {countdown}
                </div>
              </div>
            )}

            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-white font-bold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                  Recording... {timeLeft}s
                </span>
              </div>
            )}
          </div>

          {!isRecording && countdown === 0 && (
            <button
              onClick={startRecording}
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold py-3 px-8 rounded-lg hover:from-red-700 hover:to-pink-700 transition transform hover:scale-105"
            >
              Start Recording
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold py-3 px-8 rounded-lg hover:from-gray-700 hover:to-gray-800 transition transform hover:scale-105"
            >
              Stop Recording
            </button>
          )}
        </>
      )}
    </div>
  );
}
