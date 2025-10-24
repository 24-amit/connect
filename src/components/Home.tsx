import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../config/firebase.config";
import { ref, set, onValue, onDisconnect, remove, get } from "firebase/database";
import { auth } from "../config/firebase.config";
import Peer from "simple-peer";

const keys = [
    { num: "1", letters: "" }, { num: "2", letters: "ABC" }, { num: "3", letters: "DEF" },
    { num: "4", letters: "GHI" }, { num: "5", letters: "JKL" }, { num: "6", letters: "MNO" },
    { num: "7", letters: "PQRS" }, { num: "8", letters: "TUV" }, { num: "9", letters: "WXYZ" },
    { num: "*", letters: "" }, { num: "0", letters: "+" }, { num: "#", letters: "" },
];

const Home = ({
    mobileNumber,
    logout,
}: {
    mobileNumber: string;
    logout: () => void;
}) => {
    const [number, setNumber] = useState("");
    const [history, setHistory] = useState<string[]>([]);
    const [remoteUserOnline, setRemoteUserOnline] = useState(false);

    const [inCall, setInCall] = useState(false);
    const [callState, setCallState] = useState<'checking' | 'online' | 'offline' | 'ended'>('checking');
    const [callTimer, setCallTimer] = useState(0);
    const [muted, setMuted] = useState(false);

    const peerRef = useRef<any>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const callTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);


    useEffect(() => {
        let mounted = true;
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                if (!mounted) return;
                setLocalStream(stream);
            })
            .catch(err => console.error("Microphone access denied", err));
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (!mobileNumber) return;
        const myId = `+91${mobileNumber}`;
        const userRef = ref(db, `users/${myId}`);
        set(userRef, { online: true });
        onDisconnect(userRef).set({ online: false });
    }, [mobileNumber]);

    useEffect(() => {
        const current = auth.currentUser;
        if (!current || !current.phoneNumber) return;
        const userRef = ref(db, `users/${current.phoneNumber}`);
        set(userRef, { online: true });
        onDisconnect(userRef).set({ online: false });
        return () => {
            void set(userRef, { online: false });
        };
    }, []);

    // Callee logic as before omitted for brevity

    const checkRemoteUser = (num: string) => {
        const userRef = ref(db, `users/+91${num}`);
        return onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            setRemoteUserOnline(Boolean(data?.online));
        });
    };

    const handlePress = (digit: string) => {
        if (number.length >= 10) return; // prevent more digits
        const updated = number + digit;
        setNumber(updated);
        if (updated.length === 10) {
            checkRemoteUser(updated);
        }
    };

    const handleCall = async () => {
        if (!number) return alert("Enter a number to call");
        setInCall(true);
        setCallState('checking');
        setCallTimer(0);
        const calleeId = `+91${number}`;
        const snapshot = await get(ref(db, `users/${calleeId}`));
        if (snapshot.val()?.online) {
            setCallState('online');
            timerInterval.current = setInterval(() => setCallTimer(t => t + 1), 1000);
        } else {
            setCallState('offline');
            callTimeout.current = setTimeout(() => {
                setCallState('ended');
                setInCall(false);
                setNumber('');
                clearInterval(timerInterval.current);
            }, 4000);
        }
    };

    const handleEndCall = () => {
        setInCall(false);
        setNumber('');
        setCallTimer(0);
        setMuted(false);
        clearInterval(timerInterval.current);
        clearTimeout(callTimeout.current);
    };

    const backspace = () => setNumber((prev) => prev.slice(0, -1));

    if (inCall) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50">
                <h2 className="text-2xl text-blue-800 font-bold mb-2">
                    Calling {number}...
                </h2>
                {callState === 'checking' && <p className="mb-4 text-lg">Checking if user is online...</p>}
                {callState === 'online' && (
                    <>
                        <p className="mb-2 text-green-600">🟢 User is Online — Ringing</p>
                        <p className="text-xl font-mono">
                            {String(Math.floor(callTimer / 60)).padStart(2, "0")}:
                            {String(callTimer % 60).padStart(2, "0")}
                        </p>
                        <div className="flex gap-4 mt-8">
                            <button onClick={handleEndCall} className="bg-red-500 w-16 h-16 rounded-full text-white text-2xl shadow-lg">❌</button>
                            <button onClick={() => setMuted(m => !m)} className="bg-yellow-400 w-16 h-16 rounded-full text-2xl shadow-lg">
                                {muted ? "🔈" : "🔇"}
                            </button>
                        </div>
                    </>
                )}
                {callState === 'offline' && (
                    <>
                        <p className="mb-2 text-red-600">🔴 User is Offline</p>
                        <p className="text-gray-500">Disconnecting in a moment...</p>
                    </>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50">
            <div className="w-[420px] flex flex-col flex-1 mx-auto">
                {/* Recents */}
                <div className="flex-1 overflow-y-auto p-4">
                    <h1 className="text-2xl font-bold text-blue-900 mb-3 text-center">
                        Recent Calls
                    </h1>
                    {history.length === 0 ? (
                        <p className="text-gray-400 text-center text-sm py-4">No recent calls</p>
                    ) : (
                        history.map((num, i) => (
                            <div
                                key={i}
                                onClick={() => setNumber(num)}
                                className="flex justify-between items-center py-2 px-3 bg-blue-50 hover:bg-blue-100 rounded-xl"
                            >
                                <span>{num}</span>
                                <span>📞</span>
                            </div>
                        ))
                    )}
                </div>
                {/* Dial Pad */}
                <div className="bg-white p-4 shadow-inner border-t border-blue-200 rounded-t-3xl">
                    <div className="text-center text-lg font-semibold mb-3">
                        {number || "Enter Number"}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {keys.map((key) => (
                            <motion.button
                                key={key.num}
                                onClick={() => handlePress(key.num)}
                                whileTap={{ scale: 0.9 }}
                                className="w-14 h-14 bg-white border border-blue-200 hover:bg-blue-100 text-lg font-bold rounded-full shadow flex flex-col items-center justify-center"
                            >
                                <span>{key.num}</span>
                                <span className="text-[10px] text-gray-500">{key.letters}</span>
                            </motion.button>
                        ))}
                    </div>
                    <div className="flex justify-between gap-2">
                        <motion.button
                            onClick={() => setNumber("")}
                            className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
                        >
                            Clear
                        </motion.button>
                        <button
                            onClick={handleCall}
                            className="call-button w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-600"
                        >
                            📞
                        </button>
                        <motion.button
                            onClick={backspace}
                            className="flex-1 py-2 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-500"
                        >
                            ⌫ Back
                        </motion.button>
                    </div>
                </div>
            </div>
            <audio ref={remoteAudioRef} autoPlay />
        </div>
    );
};

export default Home;