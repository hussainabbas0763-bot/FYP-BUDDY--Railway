import React, { useState } from "react";
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
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";

export default function ChangePassword({ open, setOpen, userId }) {
  const { theme } = useSelector((store) => store.theme);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@]).{8,}$/;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    if (!passwordRegex.test(formData.newPassword)) {
      toast.error(
        "Password must contain at least 8 characters, one uppercase, one lowercase, one digit, and '@'."
      );
      return;
    }

    const apiURL = import.meta.env.VITE_API_URL;
    const accessToken = localStorage.getItem("accessToken")
    setLoading(true);
    toast.loading("Updating password...");

    try {
      const res = await axios.put(
        `${apiURL}/user/change-password/${userId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      toast.dismiss();
      if (res.data.success) {
        toast.success(res.data.message || "Password changed successfully!");
        setOpen(false);
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      toast.dismiss();
      const message =
        error.response?.data?.message || "Server error. Try again later.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={`sm:max-w-md rounded-2xl backdrop-blur-md bg-white dark:bg-gray-900 shadow-xl p-0 overflow-hidden transition-colors duration-300 ${
          theme === "dark" ? "dark" : ""
        }`}
      >
        <Card className="border-none shadow-md rounded-xl bg-white dark:bg-gray-800 transition-colors duration-300">
          <CardContent className="flex flex-col justify-between p-6">
            <DialogHeader className="text-center mb-4">
              <DialogTitle className="text-2xl font-semibold text-purple-600 dark:text-gray-100 flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" /> Change Password
              </DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-300 text-sm text-center">
                Update your account password securely
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4 mt-4" onSubmit={handlePasswordChange}>
              {/* Current Password */}
              <div className="space-y-2 relative">
                <Label htmlFor="currentPassword" className="dark:text-gray-100">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword.current ? "text" : "password"}
                    placeholder="Enter current password"
                    required
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        current: !prev.current,
                      }))
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-purple-600"
                  >
                    {showPassword.current ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2 relative">
                <Label htmlFor="newPassword" className="dark:text-gray-100">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword.new ? "text" : "password"}
                    placeholder="Enter new password"
                    required
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        new: !prev.new,
                      }))
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-purple-600"
                  >
                    {showPassword.new ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2 relative">
                <Label
                  htmlFor="confirmPassword"
                  className="dark:text-gray-100"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword.confirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-purple-600"
                  >
                    {showPassword.confirm ? (
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
                className="w-full mt-6 bg-purple-600  cursor-pointer hover:bg-purple-700 dark:bg-gray-100 dark:text-gray-900 font-semibold flex items-center justify-center py-5 rounded-xl shadow-md transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Updating...
                  </>
                ) : (
                  "Save Password"
                )}
              </Button>
            </form>

          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
