import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Home from "./Home";

// Utility to format seconds → mm:ss
const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

type Props = {
    number: string;
    onEndCall: () => void;
};

const CallScreen: React.FC<Props> = ({ onEndCall }) => {
    const { state } = useLocation() as { state?: { number?: string } };
    const navigate = useNavigate();

    const number = state?.number ?? "";

    // Core state
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [pickedUp, setPickedUp] = useState(false);
    const [seconds, setSeconds] = useState(0);

    // Start timer only when picked up
    useEffect(() => {
        if (!pickedUp) return;
        const id = setInterval(() => setSeconds((v) => v + 1), 1000);
        return () => clearInterval(id);
    }, [pickedUp]);

    // Simulate pickup after 1.2s for demo; replace with real event hook
    useEffect(() => {
        const t = setTimeout(() => setPickedUp(true), 1200);
        return () => clearTimeout(t);
    }, []);

    const handleEnd = () => {
        navigate("./home");
    };

    return (
        <div className="min-h-screen w-full flex flex-col justify-between"
            style={{ backgroundColor: "#f7f7f7" }}>
            {/* Top bar with status + timer */}
            <div className="pt-10 sm:pt-12 px-6 text-center">
                <div className="text-sm text-gray-500">
                    {pickedUp ? "On call" : "Calling..."}
                </div>
                <div className="mt-1 font-mono text-lg text-gray-800">
                    {pickedUp ? formatTime(seconds) : "00:00"}
                </div>
            </div>

            {/* Middle: avatar placeholder + number */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
                {/* Circular placeholder (like avatar) */}
                <div
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-2xl"
                    aria-label="Avatar"
                >
                    📞
                </div>
                <div className="mt-4 text-2xl sm:text-3xl font-semibold text-gray-900 tracking-wide text-center">
                    {'+'+91+number || "Unknown"}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                    {pickedUp ? "Connected" : "Ringing..."}
                </div>
            </div>

            {/* Bottom controls (WhatsApp-like arrangement) */}
            <div className="px-10 sm:px-16 pb-10 sm:pb-12">
                <div className="grid grid-cols-3 gap-6 items-center">
                    {/* Mute */}
                    <button
                        onClick={() => setIsMuted((m) => !m)}
                        className="h-14 sm:h-20 sm:w-20 rounded-full bg-white shadow border border-gray-200 text-3xl"
                        title={isMuted ? "Unmute" : "Mute"}
                        aria-label="Mute"
                    >
                        {isMuted ? "🔈" : "🔇"}
                    </button>

                    {/* End (center, red) */}
                    <button
                        onClick={handleEnd}
                        className="h-16 sm:h-20 sm:w-20 rounded-full bg-red-500 text-white text-3xl shadow"
                        title="End Call"
                        aria-label="End Call"
                    >
                        ❌
                    </button>

                    {/* Speaker */}
                    <button
                        onClick={() => setIsSpeaker((s) => !s)}
                        className="h-14 sm:h-20 sm:w-20 rounded-full bg-white shadow border border-gray-200 text-3xl"
                        title={isSpeaker ? "Speaker On" : "Speaker Off"}
                        aria-label="Speaker"
                    >
                        🔊
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CallScreen;