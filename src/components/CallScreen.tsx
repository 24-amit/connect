import React, { useEffect, useRef, useState } from "react";

const CallScreen = ({ number, isOnline, onEndCall }) => {
    const [seconds, setSeconds] = useState(0);
    const intervalRef = useRef(null);
    const [muted, setMuted] = useState(false);
    const [speaker, setSpeaker] = useState(false);

    useEffect(() => {
        intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(intervalRef.current);
    }, []);

    const formatTime = (s) => {
        const min = String(Math.floor(s / 60)).padStart(2, "0");
        const sec = String(s % 60).padStart(2, "0");
        return `${min}:${sec}`;
    };

    if (!number) return null;

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-50">
            <h1 className="text-2xl font-bold text-blue-800 mb-4">
                Calling {number}...
            </h1>
            <div className="flex items-center mb-2 space-x-3">
                <span className={isOnline ? "text-green-600" : "text-red-600"}>
                    {isOnline ? "🟢 Online" : "🔴 Offline"}
                </span>
                <span className="font-mono text-lg bg-blue-200 rounded-lg px-3 py-1 text-blue-900">
                    {formatTime(seconds)}
                </span>
            </div>

            <div className="flex gap-4 mt-4">
                <button
                    onClick={onEndCall}
                    className="w-14 h-14 rounded-full bg-red-500 text-white text-2xl shadow-lg hover:bg-red-600"
                    title="End Call"
                >
                    ❌
                </button>
                <button
                    onClick={() => setMuted((m) => !m)}
                    className={`w-14 h-14 rounded-full ${muted ? "bg-yellow-600" : "bg-yellow-400"} text-black text-2xl shadow-lg hover:bg-yellow-500`}
                    title="Mute/Unmute"
                >
                    {muted ? "🔈" : "🔇"}
                </button>
                <button
                    onClick={() => setSpeaker((s) => !s)}
                    className={`w-14 h-14 rounded-full ${speaker ? "bg-green-600" : "bg-green-500"} text-white text-2xl shadow-lg hover:bg-green-600`}
                    title="Toggle Speaker"
                >
                    🔊
                </button>
            </div>
        </div>
    );
};

export default CallScreen;