import React, { useState } from "react";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import { Routes, Route, useNavigate } from "react-router-dom";

import Home from "./components/Home";
import Login from "./components/Login";
import Otp from "./components/Otp";
import CallScreen from "./components/CallScreen"; // create this component to handle the call screen UI
import { auth } from "./config/firebase.config";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [result, setResult] = useState<ConfirmationResult | undefined>();
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();

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
        navigate("/home");
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
    navigate("/");
  };

  // Pass logout to Home and other props as needed

  return (
    <Routes>
      <Route
        path="/"
        element={
          isLoggedIn ? (
            <Home mobileNumber={mobileNumber} logout={logout} />
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
          )
        }
      />
      <Route path="/home" element={<Home mobileNumber={mobileNumber} logout={logout} />} />
      <Route path="/call" element={<CallScreen />} />
    </Routes>
  );
}

export default App;