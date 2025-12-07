import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import ResetPassword from "./ResetPassword";
import toast from "react-hot-toast";
import axios from "axios";

export default function OTPVerification({
  open,
  onClose,
  onBackToLogin,
  email,
  onBackToChangeEmail,
}) {
  const { theme } = useSelector((store) => store.theme);
  const [OTP, setOTP] = useState(["", "", "", "", "", ""]);
  const [isVerified, setIsVerified] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const maskEmail = (email) => {
    if (!email || !email.includes("@")) return "your email";
    const [local, domain] = email.split("@");
    const visiblePart = local.slice(0, 2);
    const hidden = "*".repeat(Math.max(local.length - 2, 3));
    return `${visiblePart}${hidden}@${domain}`;
  };

  useEffect(() => {
    if (open) setCooldown(60);
  }, [open]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (/^[0-9]?$/.test(value)) {
      const newOTP = [...OTP];
      newOTP[index] = value;
      setOTP(newOTP);
      if (value && index < 5) inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !OTP[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };
  const resetOTPFields = () => {
    setOTP(["", "", "", "", "", ""]);
    inputRefs.current.forEach((input) => {
      if (input) input.value = "";
    });
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otp = OTP.join("");
    if (otp.length !== 6) return toast.error("Enter all 6 digits");

    try {
      setLoading(true);
      const apiURL = import.meta.env.VITE_API_URL;
      const res = await axios.post(`${apiURL}/user/verify-otp/${email}`, { otp });

      if (res.data.success) {
        toast.success(res.data.message);
        setIsVerified(true);
        resetOTPFields();
        setTimeout(() => {
          setIsResetOpen(true);
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.log(error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const apiURL = import.meta.env.VITE_API_URL;
      const res = await axios.post(`${apiURL}/user/forgot-password`, { email });
      if (res.data.success) {
        toast.success(res.data.message);
        resetOTPFields();
        setCooldown(60);
      }
    } catch (error) {
      console.log(error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className={`sm:max-w-md rounded-3xl backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 shadow-2xl p-0 overflow-hidden border-0 transition-all duration-300 ${theme === "dark" ? "dark" : ""
            }`}
        >
          <Card className="border-none shadow-none rounded-3xl bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-gray-900 transition-all duration-300">
            <CardContent className="flex flex-col justify-between p-8">
              {/* Header with Icon */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-400 dark:to-indigo-500 flex items-center justify-center mb-4 shadow-lg">
                  <ShieldCheck className="h-8 w-8 text-white" />
                </div>
                <DialogHeader className="text-center">
                  <DialogTitle className="text-3xl font-bold text-center mb-2">
                    <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      Verify OTP
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-300 text-center text-sm leading-relaxed">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {maskEmail(email)}
                    </span>
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* OTP Form */}
              {!isVerified ? (
                <>
                  <form onSubmit={handleVerify} className="space-y-6">
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {OTP.map((digit, index) => (
                        <Input
                          key={index}
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700/50 dark:text-gray-100 focus:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200 hover:border-purple-400 dark:hover:border-purple-500"
                        />
                      ))}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-purple-500 dark:to-indigo-500 dark:hover:from-purple-600 dark:hover:to-indigo-600 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                          Verifying...
                        </div>
                      ) : (
                        "Verify OTP"
                      )}
                    </Button>
                  </form>

                  {/* Resend + Change Email Section */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      {cooldown > 0 ? (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 px-4 py-2 rounded-lg">
                          <span className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse"></span>
                          Resend in{" "}
                          <span className="font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                            {cooldown}s
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResend}
                          className="text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200 underline-offset-4 hover:underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                      Wrong email?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          resetOTPFields();
                          onClose();
                          setTimeout(() => onBackToChangeEmail(), 300);
                        }}
                        className="text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200 underline-offset-4 hover:underline"
                      >
                        Change Email
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in duration-500">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                    <ShieldCheck className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 text-center font-medium leading-relaxed max-w-xs">
                    OTP verified successfully! Redirecting to password reset...
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-6 mt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Want to go back?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      resetOTPFields();
                      onClose();
                      setTimeout(() => onBackToLogin(), 300);
                    }}
                    className="text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200 underline-offset-4 hover:underline"
                  >
                    Back to Login
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Reset Password Popup */}
      <ResetPassword
        open={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onBackToLogin={onBackToLogin}
        email={email}
      />
    </>
  );
}
