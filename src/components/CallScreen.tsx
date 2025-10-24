import { useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";

const CallScreen = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    const number = state?.number || "";
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setSeconds((v) => v + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const handleEndCall = () => {
        navigate("/home");
    };

    return (
        <div>
            <h2>Calling {number}...</h2>
            <p>Call duration: {Math.floor(seconds / 60)}:{seconds % 60}</p>
            <button onClick={handleEndCall}>End Call</button>
            {/* Add mute/speaker etc. */}
        </div>
    );
};

export default CallScreen;