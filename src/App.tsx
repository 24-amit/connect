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

// Optional: type for call screen state
type CallState = {
  active: boolean;
  number: string;
  isOnline: boolean;
};

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [result, setResult] = useState<ConfirmationResult | undefined>();
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const [number, setNumber] = useState("");

  // Manage “navigation” without routes
  const [call, setCall] = useState<CallState>({ active: false, number: "", isOnline: false });

  const handleLogin = () => {
    if (!mobileNumber.trim() || mobileNumber.length < 10) return;

    setIsLoading(true);
    const appVerifier = new RecaptchaVerifier(auth, "sign-in-button", { size: "invisible" });

    signInWithPhoneNumber(auth, `+91${mobileNumber}`, appVerifier)
      .then((response) => {
        setResult(response);
        setIsOtpSent(true);
      })
      .catch((err) => {
        console.error("Login Error:", err);
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
        console.log("Logged in user:", auth.currentUser?.phoneNumber);
        setIsLoggedIn(true);
      })
      .catch((err) => {
        console.error("OTP Validation Error:", err);
        alert("OTP validation failed!");
      })
      .finally(() => setIsLoading(false));
  };

  const logout = () => {
    setIsLoggedIn(false);
    setIsOtpSent(false);
    setMobileNumber("");
    setOtp("");
    // Reset call if open
    setCall({ active: false, number: "", isOnline: false });
  };

  // When the Home screen wants to “navigate” to CallScreen:
  const openCallScreen = (dialNumber: string, isOnline: boolean) => {
    setCall({ active: true, number: dialNumber, isOnline });
  };

  const closeCallScreen = () => {
    setCall({ active: false, number: "", isOnline: false });
  };

  // ORDER: If call screen is active, show it. Otherwise show login/otp/home.
  if (call.active) {
    return (
      <CallScreen
        {...({ number: call.number, isOnline: call.isOnline, onEndCall: closeCallScreen } as any)}
      />
    );
  }

  if (!isLoggedIn) {
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

  // Logged in: show Home
  return (
    <Home
      mobileNumber={mobileNumber}
      logout={logout}
      startCall={openCallScreen}
    />
  );
}

export default App;
