"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { nanoid } from "nanoid";
import { getSocket } from "@/lib/socket";
import { useTranslations } from "next-intl";

export default function Home() {
  const router = useRouter();
  const t = useTranslations('home');
  const [roomPassword, setRoomPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const createNewRoom = () => {
    if (!roomPassword.trim()) {
      alert(t('roomPasswordPlaceholder'));
      return;
    }

    setLoading(true);
    const roomId = nanoid(8);
    const socket = getSocket();

    socket.emit("createRoom", { roomId, roomPassword });

    socket.once("roomCreated", () => {
      router.push(`/room/${roomId}?password=${encodeURIComponent(roomPassword)}`);
    });

    socket.once("error", (data: { message: string }) => {
      alert(data.message);
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t('roomPassword')}
            </label>
            <input
              id="password"
              type="text"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
              placeholder={t('roomPasswordPlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              onKeyPress={(e) => e.key === "Enter" && createNewRoom()}
            />
          </div>

          <button
            onClick={createNewRoom}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? t('creating') : t('createRoom')}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            {t('shareInfo')}
          </p>
        </div>
      </div>
    </div>
  );
}
