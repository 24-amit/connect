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

type HomeProps = {
    mobileNumber: string;
    logout: () => void;
    startCall: (dialNumber: string, isOnline: boolean) => void;
};

const Home: React.FC<HomeProps> = ({ mobileNumber, logout, startCall }) => {
    const [dialNumber, setDialNumber] = useState("");
    const [remoteUserOnline, setRemoteUserOnline] = useState(false);

    const peerRef = useRef<any>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const navigate = useNavigate();

    // Mark online presence for current user
    useEffect(() => {
        const current = auth.currentUser;
        if (!current?.phoneNumber) return;
        const userRef = ref(db, `users/${current.phoneNumber}`);
        set(userRef, { online: true });
        onDisconnect(userRef).set({ online: false });
        return () => {
            set(userRef, { online: false });
        };
    }, []);

    // Microphone
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => setLocalStream(stream))
            .catch((err) => console.error("Microphone access denied", err));
    }, []);

    // Callee: listen for offers and answer
    useEffect(() => {
        if (!localStream) return;
        const myId = `+91${mobileNumber}`;
        const callsRef = ref(db, "calls");

        const unsub = onValue(callsRef, (snap) => {
            const calls = snap.val();
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
                                { urls: "turn:relay1.expressturn.com:3478", username: "efgh", credential: "abcd1234" },
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

                    peer.on("error", (err) => console.error("Peer error (callee):", err));

                    // Optional: you may call startCall here to show a CallScreen UI
                    // startCall(callData.from.replace('+91',''), true);
                    startCall(dialNumber, true);
                }
            }
        });

        return () => unsub();
    }, [localStream, mobileNumber]);

    // Presence of remote user (callee)
    const subscribeRemotePresence = (num: string) => {
        const userRef = ref(db, `users/+91${num}`);
        return onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            setRemoteUserOnline(Boolean(data?.online));
        });
    };

    const handleKeyPress = (digit: string) => {
        if (dialNumber.length >= 10) return;
        const updated = dialNumber + digit;
        setDialNumber(updated);
        if (updated.length === 10) {
            subscribeRemotePresence(updated);
        }
    };

    // Caller: create offer and wait for answer, then show CallScreen via App
    const placeCall = async () => {
        if (!dialNumber) {
            alert("Enter a number to call");
            return;
        }

        const calleeId = `+91${dialNumber}`;
        const snapshot = await get(ref(db, `users/${calleeId}`));
        if (!snapshot.val()?.online) {
            alert("❌ User is offline");
            return;
        }

        // Signal to App to show CallScreen UI
        startCall(dialNumber, true);

        const callId = `${mobileNumber}_to_${dialNumber}`;
        const callRef = ref(db, `calls/${callId}`);

        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: localStream!,
            config: {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "turn:relay1.expressturn.com:3478", username: "efgh", credential: "abcd1234" },
                ],
            },
        });
        peerRef.current = peer;

        peer.on("signal", (offer) => {
            set(callRef, { from: `+91${mobileNumber}`, to: calleeId, offer });
        });

        const answerRef = ref(db, `calls/${callId}/answer`);
        onValue(answerRef, (snap) => {
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

        peer.on("error", (err) => console.error("Peer error (caller):", err));

        navigate("/call", { state: { number: dialNumber } });
    };

    const clearOne = () => setDialNumber((prev) => prev.slice(0, -1));

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50">
            <div className="w-[420px] flex flex-col flex-1 mx-auto">
                <div className="flex-1 overflow-y-auto p-4 text-center">
                    <h1 className="text-2xl font-bold text-blue-900 mb-3">Dial Number</h1>
                    <div className="mb-3 text-lg font-semibold">{dialNumber || "Enter Number"}</div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {keys.map((key) => (
                            <motion.button
                                key={key.num}
                                onClick={() => handleKeyPress(key.num)}
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
                            onClick={() => setDialNumber("")}
                            className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
                        >
                            Clear
                        </button>
                        <button
                            onClick={placeCall}
                            className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-600"
                        >
                            📞
                        </button>
                        <button
                            onClick={clearOne}
                            className="flex-1 py-2 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-500"
                        >
                            ⌫ Back
                        </button>
                    </div>
                </div>
            </div>
            <audio ref={remoteAudioRef} autoPlay />
        </div>
    );
};

export default Home;