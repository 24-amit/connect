import { useLocation, useNavigate } from "react-router-dom";

const CallScreen = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    const number = state?.number || "";
    const isOnline = state?.remoteUserOnline || false;

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-50">
            <h1 className="text-2xl font-bold text-blue-800 mb-4">
                Calling {number}...
            </h1>
            <p className="text-gray-600 mb-6">
                {isOnline ? "🟢 Online" : "🔴 Offline"}
            </p>

            <div className="flex gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-14 h-14 rounded-full bg-red-500 text-white text-2xl shadow-lg hover:bg-red-600"
                >
                    ❌
                </button>
                <button className="w-14 h-14 rounded-full bg-yellow-400 text-black text-2xl shadow-lg hover:bg-yellow-500">
                    🔇
                </button>
                <button className="w-14 h-14 rounded-full bg-green-500 text-white text-2xl shadow-lg hover:bg-green-600">
                    🔊
                </button>
            </div>
        </div>
    );
};

export default CallScreen;
