import React from "react";
import { Button } from "./ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "./ui/card";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "./ui/input-otp";
import { motion } from "framer-motion";

interface OtpProps {
    otp: string;
    mobileNumber: string;
    isLoading: boolean;
    setOtp: React.Dispatch<React.SetStateAction<string>>;
    validateOtp: () => void;
}

const Otp: React.FC<OtpProps> = ({
    otp,
    mobileNumber,
    isLoading,
    setOtp,
    validateOtp,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="w-[320px] flex flex-col gap-4 p-4 bg-gradient-to-br from-blue-100 via-white to-blue-50 shadow-2xl rounded-3xl animate-fade-in">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold text-blue-900">
                        Validate OTP
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col items-center gap-3 space-y-1.5">
                                <label
                                    htmlFor="number"
                                    className="text-gray-700 font-medium text-center"
                                >
                                    Enter the OTP sent to your mobile number: +91 {mobileNumber}
                                </label>
                                <InputOTP
                                    maxLength={6}
                                    value={otp}
                                    onChange={(value) => setOtp(value)}
                                    className="text-[20px] tracking-widest font-semibold"
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
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
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl shadow-md transition-all duration-300"
                            onClick={validateOtp}
                            disabled={isLoading}
                        >
                            {isLoading ? "Verifying..." : "Verify OTP"}
                        </Button>
                    </motion.div>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

export default Otp;