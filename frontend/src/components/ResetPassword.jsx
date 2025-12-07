import React, { useState } from "react";
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
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

export default function ResetPassword({ open, onClose, onBackToLogin, email }) {
  const { theme } = useSelector((store) => store.theme);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const maskEmail = (email) => {
    if (!email || !email.includes("@")) return "your email";
    const [local, domain] = email.split("@");
    const visiblePart = local.slice(0, 2);
    const hidden = "*".repeat(Math.max(local.length - 2, 3));
    return `${visiblePart}${hidden}@${domain}`;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!password.trim() || !confirm.trim()) {
      toast.error("Please fill out both password fields.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@]).{8,}$/;
    if (!passwordRegex.test(password) || !passwordRegex.test(confirm)) {
      toast.error(
        "Password must be at least 8 characters and include 1 uppercase, 1 lowercase, 1 digit, and @ symbol."
      );
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Resetting password...");

      const apiURL = import.meta.env.VITE_API_URL;
      const res = await axios.post(`${apiURL}/user/reset-password/${email}`, {
        newPassword: password,
        confirmPassword: confirm,
      });

      toast.dismiss();

      if (res.data.success) {
        toast.success(res.data.message);

        setIsSaved(true);
        setPassword("");
        setConfirm("");

        setTimeout(() => {
          setIsSaved(false);
          onClose();
          setTimeout(() => onBackToLogin(), 500);
        }, 2500);
      }
    } catch (error) {
      toast.dismiss();
      console.log(error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
                <Lock className="h-8 w-8 text-white" />
              </div>
              <DialogHeader className="text-center">
                <DialogTitle className="text-3xl font-bold text-center mb-2">
                  <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    Reset Password
                  </span>
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-300 text-center text-sm leading-relaxed">
                  Create a new password for{" "}
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {maskEmail(email)}
                  </span>
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Form */}
            {!isSaved ? (
              <form onSubmit={handleSave} className="space-y-5">
                {/* New Password */}
                <div className="space-y-2">
                  <Label className="dark:text-gray-100 font-semibold text-sm" htmlFor="password">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword1 ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      className="h-12 border-2 focus:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 dark:bg-gray-700/50 dark:text-gray-100 dark:border-gray-600 pr-12 rounded-xl transition-all duration-200 hover:border-purple-400 dark:hover:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword1(!showPassword1)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 p-1"
                    >
                      {showPassword1 ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Must include uppercase, lowercase, digit, and @ symbol
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label className="dark:text-gray-100 font-semibold text-sm" htmlFor="confirm">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showPassword2 ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                      required
                      className="h-12 border-2 focus:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 dark:bg-gray-700/50 dark:text-gray-100 dark:border-gray-600 pr-12 rounded-xl transition-all duration-200 hover:border-purple-400 dark:hover:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword2(!showPassword2)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 p-1"
                    >
                      {showPassword2 ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-purple-500 dark:to-indigo-500 dark:hover:from-purple-600 dark:hover:to-indigo-600 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] mt-6"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-5 w-5" />
                      Saving...
                    </div>
                  ) : (
                    "Save Password"
                  )}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in duration-500">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                  <Lock className="h-10 w-10 text-white" />
                </div>
                <p className="text-gray-700 dark:text-gray-200 text-center font-medium leading-relaxed max-w-xs">
                  Password reset successfully! Redirecting to login...
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-6 mt-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Ready to log in?{" "}
                <button
                  type="button"
                  onClick={() => {
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
  );
}
