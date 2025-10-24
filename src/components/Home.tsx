import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../config/firebase.config";
import { ref, set, onValue, onDisconnect, remove, get } from "firebase/database";
import { auth } from "../config/firebase.config";
import Peer from "simple-peer";
import { useNavigate } from "react-router-dom";

const keys = [
    { num: "1", letters: "" }, { num: "2", letters: "ABC" }, { num: "3", letters: "DEF" },
    { num: "4", letters: "GHI" }, { num: "5", letters: "JKL" }, { num: "6", letters: "MNO" },
    { num: "7", letters: "PQRS" }, { num: "8", letters: "TUV" }, { num: "9", letters: "WXYZ" },
    { num: "*", letters: "" }, { num: "0", letters: "+" }, { num: "#", letters: "" },
];

const Home = ({ mobileNumber, logout }: { mobileNumber: string; logout: () => void }) => {
    const [number, setNumber] = useState("");
    const [remoteUserOnline, setRemoteUserOnline] = useState(false);
    const [callActive, setCallActive] = useState(false);
    const [callTimer, setCallTimer] = useState(0);
    const [muted, setMuted] = useState(false);

    const peerRef = useRef<any>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const current = auth.currentUser;
        if (!current?.phoneNumber) return;
        const myId = current.phoneNumber;
        const userRef = ref(db, `users/${myId}`);
        set(userRef, { online: true });
        onDisconnect(userRef).set({ online: false });
        return () => {
            set(userRef, { online: false });
        };
    }, []);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => setLocalStream(stream))
            .catch(err => console.error("Mic access denied", err));
    }, []);

    useEffect(() => {
        if (!localStream) return;
        const myId = `+91${mobileNumber}`;
        const callsRef = ref(db, "calls");

        const unsub = onValue(callsRef, snapshot => {
            const calls = snapshot.val();
            if (!calls) return;
            for (const [key, data] of Object.entries(calls)) {
                const callData: any = data;
                if (callData.to === myId && callData.offer && !callData.answer) {
                    const accept = window.confirm(`Incoming call from ${callData.from}. Accept?`);
                    if (!accept) {
                        remove(ref(db, `calls/${key}`));
                        continue;
                    }
                    const peer = new Peer({
                        initiator: false,
                        trickle: false,
                        stream: localStream,
                        config: {
                            iceServers: [
                                { urls: "stun:stun.l.google.com:19302" },
                                { urls: "turn:relay1.expressturn.com:3478", username: "efgh", credential: "abcd1234" }
                            ],
                        },
                    });
                    peerRef.current = peer;
                    peer.signal(callData.offer);

                    peer.on("signal", (answer) => {
                        set(ref(db, `calls/${key}/answer`), answer);
                    });

                    peer.on("stream", (remoteStream) => {
                        if (remoteAudioRef.current) {
                            remoteAudioRef.current.srcObject = remoteStream;
                            remoteAudioRef.current.play().catch(() => { });
                        }
                    });

                    peer.on("error", err => console.error("Peer error (callee):", err));
                    setCallActive(true);
                    setCallTimer(0);
                    timerInterval.current = setInterval(() => setCallTimer(t => t + 1), 1000);
                }
            }
        });

        return () => {
            unsub();
        };
    }, [localStream]);

    const checkRemoteUser = (num: string) => {
        const userRef = ref(db, `users/+91${num}`);
        return onValue(userRef, snapshot => {
            const data = snapshot.val();
            setRemoteUserOnline(Boolean(data?.online));
        });
    };

    const handlePress = (digit: string) => {
        if (number.length >= 10) return;
        const updated = number + digit;
        setNumber(updated);
        if (updated.length === 10) {
            checkRemoteUser(updated);
        }
    };

    const initiateCall = async () => {
        if (!number) return alert("Enter number to call");
        const calleeId = `+91${number}`;
        const snapshot = await get(ref(db, `users/${calleeId}`));
        if (!snapshot.val()?.online) {
            alert("❌ User offline");
            return;
        }

        setCallActive(true);
        setCallTimer(0);
        timerInterval.current = setInterval(() => setCallTimer(t => t + 1), 1000);

        const callId = `${mobileNumber}_to_${number}`;
        const callRef = ref(db, `calls/${callId}`);

        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: localStream!,
            config: {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "turn:relay1.expressturn.com:3478", username: "efgh", credential: "abcd1234" }
                ]
            }
        });
        peerRef.current = peer;

        peer.on("signal", (offer) => {
            set(callRef, { from: `+91${mobileNumber}`, to: calleeId, offer });
        });

        const answerRef = ref(db, `calls/${callId}/answer`);
        onValue(answerRef, snap => {
            const data = snap.val();
            if (data?.sdp) {
                peer.signal(data);
            }
        });

        peer.on("stream", (remoteStream) => {
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = remoteStream;
                remoteAudioRef.current.play().catch(() => { });
            }
        });

        peer.on("error", err => console.error("Caller Peer error:", err));
    };

    const endCall = () => {
        setCallActive(false);
        clearInterval(timerInterval.current!);
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
    };

    const backspace = () => setNumber(prev => prev.slice(0, -1));

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50">
            {!callActive ? (
                <div className="w-[420px] flex flex-col flex-1 mx-auto">
                    <div className="flex-1 overflow-y-auto p-4 text-center">
                        <h1 className="text-2xl font-bold text-blue-900 mb-3">Dial Number</h1>
                        <div className="mb-3 text-lg font-semibold">{number || "Enter Number"}</div>
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
                            <button
                                onClick={() => setNumber("")}
                                className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
                            >
                                Clear
                            </button>
                            <button
                                onClick={initiateCall}
                                className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-600"
                            >
                                📞
                            </button>
                            <button
                                onClick={backspace}
                                className="flex-1 py-2 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-500"
                            >
                                ⌫ Back
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-screen">
                    <h2 className="text-2xl font-bold text-blue-800">In Call with {number}</h2>
                    <p className="text-xl font-mono mt-2">
                        {String(Math.floor(callTimer / 60)).padStart(2, "0")}:
                        {String(callTimer % 60).padStart(2, "0")}
                    </p>
                    <div className="flex gap-4 mt-6">
                        <button onClick={endCall} className="bg-red-500 w-16 h-16 rounded-full text-white text-2xl shadow-lg">
                            ❌
                        </button>
                        <button onClick={() => setMuted(m => !m)} className="bg-yellow-400 w-16 h-16 rounded-full text-2xl shadow-lg">
                            {muted ? "🔈" : "🔇"}
                        </button>
                    </div>
                </div>
            )}
            <audio ref={remoteAudioRef} autoPlay />
        </div>
    );
};

export default Home;