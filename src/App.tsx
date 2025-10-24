import React, { useState } from "react";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import Home from "./components/Home";
import Login from "./components/Login";
import Otp from "./components/Otp";
import CallScreen from "./components/CallScreen";
import { auth } from "./config/firebase.config";
import { Routes, Route } from "react-router-dom";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [result, setResult] = useState<ConfirmationResult | undefined>();
  const [isCalling, setIsCalling] = useState(false); // 👈 New state for CallScreen

  // ------------------ LOGIN ------------------
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

  // ------------------ OTP ------------------
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

  // ------------------ LOGOUT ------------------
  const logout = () => {
    setIsLoggedIn(false);
    setIsOtpSent(false);
    setMobileNumber("");
    setOtp("");
    setIsCalling(false);
  };

  // ------------------ CALL FLOW ------------------
  if (isCalling) {
    const CallScreenAny = CallScreen as any;
    return (
      <CallScreenAny
        callerNumber={mobileNumber}
        onEndCall={() => setIsCalling(false)}
      />
    );
  }

  if (isLoggedIn) {
    const HomeAny = Home as any;
    return (
      <HomeAny
        mobileNumber={mobileNumber}
        logout={logout}
        startCall={() => setIsCalling(true)} // 👈 Pass trigger to open CallScreen
      />
    );
  }

  if (isOtpSent) {
    return (
      <Otp
        mobileNumber={mobileNumber}
        otp={otp}
        isLoading={isLoading}
        setOtp={setOtp}
        validateOtp={validateOtp}
      />
    );
  }

  return (
    <Login
      mobileNumber={mobileNumber}
      isLoading={isLoading}
      setMobileNumber={setMobileNumber}
      handleLogin={handleLogin}
    />
  );
}

export default App;
