import React, { useState } from "react";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import Home from "./components/Home";
import Login from "./components/Login";
import Otp from "./components/Otp";
import CallScreen from "./components/CallScreen"; // Import CallScreen
import { auth } from "./config/firebase.config";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [result, setResult] = useState<ConfirmationResult | undefined>();

  // Add these states for calling
  const [isCalling, setIsCalling] = useState(false);
  const [callNumber, setCallNumber] = useState("");
  const [calleeOnline, setCalleeOnline] = useState(false);

  const handleLogin = () => {
    if (!mobileNumber.trim() || mobileNumber.length < 10) return;

    setIsLoading(true);

    const appVerifier = new RecaptchaVerifier(auth, "sign-in-button", {
      size: "invisible",
    });

    signInWithPhoneNumber(auth, `+91${mobileNumber}`, appVerifier)
      .then((response) => {
        setResult(response);
        setIsOtpSent(true);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const validateOtp = () => {
    if (!otp.trim() || otp.length < 6) return;

    setIsLoading(true);

    result
      ?.confirm(otp)
      .then(() => {
        const userId = auth.currentUser?.phoneNumber;
        console.log("Logged in user:", userId);

        setIsLoggedIn(true);
      })
      .catch((err) => {
        console.log(err);
        alert("OTP validation failed!");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const logout = () => {
    setIsLoggedIn(false);
    setIsOtpSent(false);
    setMobileNumber("");
    setOtp("");
    setIsCalling(false); // Reset call state on logout
  };

  // Handler for starting a call, called from Home
  const handleStartCall = (number, online) => {
    setCallNumber(number);
    setCalleeOnline(online);
    setIsCalling(true);
  };

  // Handler to end the call from CallScreen
  const handleEndCall = () => {
    setIsCalling(false);
    setCallNumber("");
    setCalleeOnline(false);
  };

  if (isCalling) {
    return (
      <CallScreen
        number={callNumber}
        isOnline={calleeOnline}
        onEndCall={handleEndCall}
      />
    );
  }

  return isLoggedIn ? (
    <Home
      mobileNumber={mobileNumber}
      logout={logout}
      startCall={handleStartCall}
    />
  ) : isOtpSent ? (
    <Otp
      mobileNumber={mobileNumber}
      otp={otp}
      isLoading={isLoading}
      setOtp={setOtp}
      validateOtp={validateOtp}
    />
  ) : (
    <Login
      mobileNumber={mobileNumber}
      isLoading={isLoading}
      setMobileNumber={setMobileNumber}
      handleLogin={handleLogin}
    />
  );
}

export default App;