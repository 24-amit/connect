import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../config/firebase.config";
import { ref, set, onValue, onDisconnect, push, remove, get } from "firebase/database";
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
    startCall,
}: {
    mobileNumber: string;
    logout: () => void;
    startCall: (number: string, online: boolean) => void;
}) => {
    const [number, setNumber] = useState("");
    const [history, setHistory] = useState<string[]>([]);
    const [remoteUserOnline, setRemoteUserOnline] = useState(false);
    const [calling, setCalling] = useState(false);
    const [callAccepted, setCallAccepted] = useState(false);

    // WebRTC refs
    const peerRef = useRef<any>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        let mounted = true;
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                if (!mounted) return;
                setLocalStream(stream);
            })
            .catch((err) => console.error("Microphone access denied", err));
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
            set(userRef, { online: false });
        };
    }, []);

    // --- Callee: listen for incoming calls (offers) and answer them ---
    useEffect(() => {
        if (!localStream) return;
        if (!auth.currentUser || !auth.currentUser.phoneNumber) return;
        const myId = auth.currentUser.phoneNumber;
        const callsRef = ref(db, "calls");
        const unsub = onValue(callsRef, async (snapshot) => {
            const calls = snapshot.val();
            if (!calls) return;
            for (const [callId, data] of Object.entries(calls)) {
                const callData: any = (data as any);
                if (callData?.to === myId && callData?.offer && !callData?.answer) {
                    const accept = window.confirm(`Incoming call from ${callData.from}. Accept?`);
                    if (!accept) {
                        remove(ref(db, `calls/${callId}`));
                        continue;
                    }
                    const peer = new Peer({ initiator: false, trickle: false, stream: localStream });
                    peerRef.current = peer;
                    peer.signal(callData.offer);
                    peer.on("signal", (answerSignal: any) => {
                        set(ref(db, `calls/${callId}/answer`), answerSignal);
                    });
                    peer.on("stream", (remoteStream: MediaStream) => {
                        if (remoteAudioRef.current) {
                            remoteAudioRef.current.srcObject = remoteStream;
                            remoteAudioRef.current.play().catch(() => { });
                        } else {
                            const audioEl = document.createElement("audio");
                            audioEl.srcObject = remoteStream;
                            audioEl.autoplay = true;
                            document.body.appendChild(audioEl);
                        }
                        setCallAccepted(true);
                    });
                    peer.on("error", (err: any) => console.error("Peer error (callee):", err));
                }
            }
        });
        return () => unsub();
    }, [localStream]);

    const checkRemoteUser = (num: string) => {
        const userRef = ref(db, `users/+91${num}`);
        return onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            setRemoteUserOnline(Boolean(data?.online));
        });
    };

    const handlePress = (digit: string) => {
        const updated = number + digit;
        setNumber(updated);
        if (updated.length === 10) {
            checkRemoteUser(updated);
        }
    };

    // Handle call button - trigger parent App's startCall, not local navigate
    const handleCall = async () => {
        if (!number) return alert("Enter a number to call");
        const calleeId = `+91${number}`;
        const snapshot = await get(ref(db, `users/${calleeId}`));
        if (!snapshot.val()?.online) {
            alert("User is offline ❌");
            return;
        }
        if (!remoteUserOnline) {
            alert("User is offline — cannot call.");
            return;
        }
        // Optionally prepare connection (audio permissions etc) here
        console.log("Calling number:", number, "Online status:", remoteUserOnline);
        startCall(number, remoteUserOnline); // Pass number and online status to App
    };

    const backspace = () => setNumber((prev) => prev.slice(0, -1));

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50">
            <div className="w-[420px] flex flex-col flex-1 mx-auto">
                {/* Recents */}
                <div className="flex-1 overflow-y-auto p-4">
                    <h1 className="text-2xl font-bold text-blue-900 mb-3 text-center">Recent Calls</h1>
                    {history.length === 0 ? (
                        <p className="text-gray-400 text-center text-sm py-4">No recent calls</p>
                    ) : (
                        history.map((num, i) => (
                            <div key={i} onClick={() => setNumber(num)}
                                className="flex justify-between items-center py-2 px-3 bg-blue-50 hover:bg-blue-100 rounded-xl">
                                <span>{num}</span><span>📞</span>
                            </div>
                        ))
                    )}
                </div>
                {/* Dial Pad */}
                <div className="bg-white p-4 shadow-inner border-t border-blue-200 rounded-t-3xl">
                    <div className="text-center text-lg font-semibold mb-3">{number || "Enter Number"}</div>
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
                        <motion.button onClick={() => setNumber("")}
                            className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600">
                            Clear
                        </motion.button>
                        {/* Call parent startCall handler */}
                        <button onClick={handleCall}
                            className="call-button w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-600">
                            📞
                        </button>
                        <motion.button onClick={backspace}
                            className="flex-1 py-2 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-500">
                            ⌫ Back
                        </motion.button>
                    </div>
                    {calling && (
                        <div className="text-center mt-3 text-blue-800 font-semibold">
                            {callAccepted ? "🔊 Call Connected" : "📞 Calling..."}
                        </div>
                    )}
                </div>
            </div>
            <audio ref={remoteAudioRef} autoPlay />
        </div>
    );
};

export default Home;