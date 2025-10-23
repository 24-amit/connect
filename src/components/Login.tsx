import React, { useEffect } from "react";
import { Button } from "./ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "../config/firebase.config";
import { motion } from "framer-motion";

declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}

interface LoginProps {
    mobileNumber: string;
    isLoading: boolean;
    setMobileNumber: React.Dispatch<React.SetStateAction<string>>;
    handleLogin: () => void;
}

const Login: React.FC<LoginProps> = ({
    mobileNumber,
    isLoading,
    setMobileNumber,
    handleLogin,
}) => {
    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, "sign-in-button", {
                size: "invisible",
                callback: (response: any) => {
                    handleLogin();
                },
            });
        }
    }, [handleLogin]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="w-[320px] flex flex-col gap-4 p-4 bg-gradient-to-br from-blue-100 via-white to-blue-50 shadow-2xl rounded-3xl animate-fade-in">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold text-blue-900">Log In</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <label htmlFor="number" className="text-gray-700 font-medium">Mobile Number</label>
                                <Input
                                    id="number"
                                    placeholder="Enter your mobile number"
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value)}
                                    maxLength={10}
                                    className="text-[10px] text-center tracking-widest font-semibold border-2 border-blue-300 focus:border-blue-600 transition duration-300 ease-in-out"
                                />
                            </div>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center mt-4">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full"
                    >
                        <Button
                            id="sign-in-button"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl shadow-md transition-all duration-300"
                            onClick={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? "Loading..." : "Log In"}
                        </Button>
                    </motion.div>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

export default Login;