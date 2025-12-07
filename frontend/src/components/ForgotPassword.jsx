import React, { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import OtpVerification from "./OtpVerification";
import toast from "react-hot-toast";
import axios from "axios";

export default function ForgotPassword({ open, onClose, onBackToLogin }) {
  const { theme } = useSelector((store) => store.theme);
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(open);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsForgotOpen(open);
  }, [open]);

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!email) return toast.error("Please enter your registered email");

    const apiURL = import.meta.env.VITE_API_URL;
    const toastId = toast.loading("Sending OTP...");

    try {
      setLoading(true);
      const res = await axios.post(`${apiURL}/user/forgot-password`, { email });

      if (res.data.success) {
        toast.success(res.data.message);
        toast.dismiss(toastId);

        // navigation to OTP Verification Page
        setTimeout(() => {
          setIsSent(true);
          setTimeout(() => {
            setIsSent(false);
            setIsForgotOpen(false);
            setTimeout(() => setIsOtpOpen(true), 300);
          }, 1000);
        });
      }
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error(
        error.response?.data?.message || "Failed to send OTP. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent
          className={`sm:max-w-md rounded-3xl backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 shadow-2xl p-0 overflow-hidden border-0 transition-all duration-300 ${
            theme === "dark" ? "dark" : ""
          }`}
        >
          <Card className="border-none shadow-none rounded-3xl bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-gray-900 transition-all duration-300">
            <CardContent className="flex flex-col justify-between p-8">
              {/* Header with Icon */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-400 dark:to-indigo-500 flex items-center justify-center mb-4 shadow-lg">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <DialogHeader className="text-center">
                  <DialogTitle className="text-3xl font-bold text-center mb-2">
                    <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      Forgot Password
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-300 text-center text-sm leading-relaxed">
                    Enter your registered email to receive an OTP for password reset
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* Email Form */}
              {!isSent ? (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="dark:text-gray-100 font-semibold text-sm">
                      Registered Email
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        disabled={loading}
                        className="h-12 border-2 pr-12 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 rounded-xl transition-all duration-200 hover:border-purple-400 dark:hover:border-purple-500"
                      />
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 h-5 w-5" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-purple-500 dark:to-indigo-500 dark:hover:from-purple-600 dark:hover:to-indigo-600 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] mt-6"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                        Sending OTP...
                      </div>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in duration-500">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                    <Mail className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 text-center font-medium leading-relaxed max-w-xs">
                    OTP has been sent to your email. Please check your inbox.
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-6 mt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Remembered your password?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotOpen(false);
                      setTimeout(() => onBackToLogin(), 300);
                    }}
                    className="text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200 underline-offset-4 hover:underline"
                  >
                    Go back to Login
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Popup */}
      <OtpVerification
        open={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        onBackToLogin={onBackToLogin}
        email={email}
        onBackToChangeEmail={() => {
          setIsOtpOpen(false);
          setTimeout(() => setIsForgotOpen(true), 300);
        }}
      />
    </>
  );
}
