import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import ForgotPassword from "./ForgotPassword";
import toast from "react-hot-toast";
import { setUser } from "@/redux/authSlice";
import axios from "axios";

export default function LoginPage({ open, setOpen }) {
  const { theme } = useSelector((store) => store.theme);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotKey, setForgotKey] = useState(0);
  const [loading, setLoading] = useState(false);


  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const openForgotPassword = () => {
    setOpen(false);
    setTimeout(() => {
      setForgotKey((prev) => prev + 1);
      setIsForgotOpen(true);
    }, 300);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.loading("Checking credentials...");
    const apiURL = import.meta.env.VITE_API_URL;
    try {
      const res = await axios.post(`${apiURL}/user/login`, formData);
      if (res.data.success) {
        dispatch(setUser(res.data.user))
        localStorage.setItem("accessToken", res.data.accessToken);

        toast.success(res.data.message || "Login successful");
        if (res.data.user.role === "student") {
          navigate("/student/dashboard")

        }
        else if (res.data.user.role === "supervisor") {
          navigate('/supervisor/dashboard')
        }
        else if (res.data.user.role === "coordinator") {
          navigate('/coordinator/dashboard')
        }
        else {
          navigate('/admin/dashboard')
        }
        toast.dismiss();
      }

      toast.success(`Login successful 🎉 Welcome back ${res.data.user.username}`);
      setOpen(false);
    } catch (error) {
      toast.dismiss();
      const message =
        error.response?.data?.message || error.response?.data || "Failed to create user";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={`sm:max-w-md rounded-3xl backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 shadow-2xl p-0 overflow-hidden border-0 transition-all duration-300 ${theme === "dark" ? "dark" : ""
          }`}
      >
        <Card className="border-none shadow-none rounded-3xl bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-gray-900 transition-all duration-300">
          <CardContent className="flex flex-col justify-between p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <DialogHeader className="text-center">
                <DialogTitle className="text-3xl font-bold text-center mb-2">
                  Welcome to <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">FYP Buddy</span>
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-300 text-sm text-center leading-relaxed">
                  Login to continue your FYP Journey
                </DialogDescription>
              </DialogHeader>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-gray-100 font-semibold text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="h-12 border-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 rounded-xl transition-all duration-200 hover:border-purple-400 dark:hover:border-purple-500"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-gray-100 font-semibold text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="h-12 border-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 pr-12 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 rounded-xl transition-all duration-200 hover:border-purple-400 dark:hover:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-left text-sm">
                <span className="text-gray-600 dark:text-gray-300">Forgot your password? </span>
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200 underline-offset-4 hover:underline"
                >
                  Click here
                </button>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-purple-500 dark:to-indigo-500 dark:hover:from-purple-600 dark:hover:to-indigo-600 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5" />
                    Logging in...
                  </div>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="pt-6 mt-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Don't have an account?{" "}
                <span className="text-purple-600 dark:text-purple-400 font-semibold cursor-pointer hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200 underline-offset-4 hover:underline">
                  Contact Admin
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>

      {/* Forgot Password Dialog */}
      <ForgotPassword
        key={forgotKey}
        open={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        onBackToLogin={() => {
          setIsForgotOpen(false);
          setTimeout(() => setOpen(true), 300);
        }}
      />
    </Dialog>
  );
}
