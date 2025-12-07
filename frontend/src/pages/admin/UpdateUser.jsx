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
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

export default function UpdateUser({ open, setOpen, selectedUser, onUserUpdated }) {
  const { theme } = useSelector((store) => store.theme);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");

  // 🔹 Email-related states (same as ProfilePage)
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [emailChanged, setEmailChanged] = useState(false);
  const [originalEmail, setOriginalEmail] = useState("");
  const [saveDisabled, setSaveDisabled] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    cnic: "",
    email: "",
    department: "",
  });

  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");
  const emailRegex = /^[a-z0-9.+]+@[a-z0-9.-]+\.[a-z]{2,}$/;



  useEffect(() => {
    if (selectedUser) {
      console.log("UpdateUser received selectedUser:", selectedUser);
      setRole(selectedUser.role || "");
      setFormData({
        fullName: selectedUser.username || "",
        cnic: selectedUser.cnic || "",
        email: selectedUser.email || "",
        department: selectedUser.department || "",
      });
      setVerifiedEmail(selectedUser.email || "");
      setOriginalEmail(selectedUser.email || "");
      setEmailChanged(false);
      setSaveDisabled(false);
    }
  }, [selectedUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") {
      const newEmail = value.trim();
      setFormData((prev) => ({ ...prev, email: newEmail }));

      // Check if email is empty
      if (newEmail === "") {
        setEmailChanged(false);
        setSaveDisabled(true);
        return;
      }

      // Check if email matches verified or original
      if (newEmail === verifiedEmail || newEmail === originalEmail) {
        setEmailChanged(false);
        setSaveDisabled(false);
      } else {
        setEmailChanged(true);
        setSaveDisabled(false);
      }
    }
    else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (name === "fullName") {
      // Only letters and spaces
      const sanitized = value.replace(/[^A-Za-z\s]/g, "");
      setFormData((prev) => ({ ...prev, fullName: sanitized }));
    } else if (name === "email") {
      // Only lowercase letters, digits, @, ., _
      const sanitized = value.replace(/[^a-z0-9@._]/g, "");
      setFormData((prev) => ({ ...prev, email: sanitized }));

      // Track email changes
      if (sanitized === verifiedEmail || sanitized === originalEmail) {
        setEmailChanged(false);
      } else {
        setEmailChanged(true);
      }
    } else if (name === "cnic") {
      // Only digits, max 13
      const sanitized = value.replace(/[^0-9]/g, "").slice(0, 13);
      setFormData((prev) => ({ ...prev, cnic: sanitized }));
    }
  };

  // 🔹 Handle new email request
  const handleNewEmailRequest = async () => {
    if (!emailChanged) return;
    
    // Validate selectedUser exists
    if (!selectedUser || !selectedUser._id) {
      toast.error("User information is missing. Please try again.");
      return;
    }

    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid email address");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${apiURL}/user/email-change/${selectedUser._id}`,
        { newEmail: formData.email },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        setOtpMode(true);
        toast.success(res.data.message);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Unable to verify the new email.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle OTP Verification
  const handleOTPVerification = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter complete 6-digit OTP");
      return;
    }

    // Validate selectedUser exists
    if (!selectedUser || !selectedUser._id) {
      toast.error("User information is missing. Please try again.");
      setOtpMode(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${apiURL}/user/verify-email/${selectedUser._id}`,
        { otp, newEmail: formData.email },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        setOtpMode(false);
        setVerifiedEmail(formData.email);
        setEmailChanged(false);
        toast.success(res.data.message);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Unable to verify your new email";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle full update (after email verified)
  const handleUpdate = async (e) => {
    e.preventDefault();

    // Validate selectedUser exists
    if (!selectedUser || !selectedUser._id) {
      toast.error("User information is missing. Please try again.");
      return;
    }

    const cnicPattern = /^\d{13}$/;
    const cnicValue = String(formData.cnic); // Ensure it's a string

    if (formData.cnic !== selectedUser.cnic && !cnicPattern.test(cnicValue)) {
      toast.error("CNIC must be exactly 13 digits without dashes.");
      return; 
    }

    const payload = {
      role,
      username: formData.fullName,
    };
    if (formData.email !== selectedUser.email) payload.email = formData.email;
    if (formData.cnic !== selectedUser.cnic) payload.cnic = cnicValue;
    if (formData.department !== selectedUser.department) payload.department = formData.department;

    const toastId = toast.loading("Updating user...");
    try {
      setLoading(true);
      const res = await axios.put(
        `${apiURL}/user/update-user/${selectedUser._id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      toast.dismiss(toastId);
      if (res.data.success) {
        toast.success(res.data.message || "User updated successfully!");
        // Refresh the user list
        if (onUserUpdated) {
          onUserUpdated();
        }
        setTimeout(() => setOpen(false), 800);
      }
    } catch (error) {
      toast.dismiss(toastId);
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to update user.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };



  // Don't render if no user is selected
  if (!selectedUser) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={`sm:max-w-2xl rounded-2xl backdrop-blur-md bg-white dark:bg-gray-900 shadow-2xl p-0 overflow-hidden transition-all duration-300 border-0 ${theme === "dark" ? "dark" : ""
          }`}
      >
        <Card className="border-none shadow-none rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
          <CardContent className="flex flex-col justify-between p-8">
            <DialogHeader className="text-center mb-6 space-y-2">
              <DialogTitle className="text-3xl font-bold text-gray-800 dark:text-white text-center">
                Update <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  User Details
                </span> 
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm text-center">
                Modify user information and save changes
              </DialogDescription>
            </DialogHeader>

            <form className="mt-6 space-y-5" onSubmit={handleUpdate}>
              {/* Role dropdown */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Role <span className="text-red-500">*</span>
                </Label>
                <select
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  disabled={loading}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/50 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Role</option>
                  <option value="student">Student</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="coordinator">FYP Coordinator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="fullName"
                    value={formData.fullName || ""}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Enter full name"
                    required
                    className="h-11 rounded-lg border-gray-300 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-500/50 dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 disabled:opacity-50"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="user@example.com"
                    required
                    className="h-11 rounded-lg border-gray-300 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-500/50 dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 disabled:opacity-50"
                  />
                  {emailChanged && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-amber-600 dark:bg-amber-400 rounded-full"></span>
                      Email changed - verification required
                    </p>
                  )}
                </div>

                {/* CNIC */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    CNIC <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="cnic"
                    value={formData.cnic || ""}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="3520212345678"
                    required
                    className="h-11 rounded-lg border-gray-300 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-500/50 dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 disabled:opacity-50"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">13 digits, no dashes</p>
                </div>

                {/* Department */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <select
                    name="department"
                    value={formData.department || ""}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-11 border border-gray-300 dark:border-gray-600 rounded-lg px-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/50 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Department</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="Data Science">Data Science</option>
                  </select>
                </div>
              </div>

              {/* Button group */}
              {emailChanged ? (
                <Button
                  type="button"
                  onClick={handleNewEmailRequest}
                  disabled={loading}
                  className="w-full mt-8 h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg flex items-center justify-center rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Sending OTP...
                    </>
                  ) : (
                    "Verify New Email"
                  )}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || saveDisabled}
                  className="w-full mt-8 h-12 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white shadow-lg flex items-center justify-center rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Saving Changes...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              )}
            </form>

            {/* OTP Dialog - Enhanced UI */}
            {otpMode && (
              <Dialog open={otpMode} onOpenChange={setOtpMode}>
                <DialogContent
                  className={`sm:max-w-lg rounded-2xl backdrop-blur-md bg-white dark:bg-gray-900 shadow-2xl p-0 overflow-hidden transition-all duration-300 border-0 ${theme === "dark" ? "dark" : ""
                    }`}
                >
                  <Card className="border-none shadow-none rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
                    <div className="flex flex-col justify-between p-8">
                      <DialogHeader className="text-center mb-6 space-y-3">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mb-2">
                          <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <DialogTitle className="text-3xl font-bold text-gray-800 dark:text-white text-center ">
                          Verify <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Email
                          </span>
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed text-center">
                          We've sent a 6-digit verification code to
                          <br />
                          <span className="font-semibold text-purple-600 dark:text-purple-400 mt-1 inline-block">
                            {formData.email}
                          </span>
                        </DialogDescription>
                      </DialogHeader>

                      <div className="mt-8 mb-6">
                        <div className="flex justify-center gap-2 sm:gap-3">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <Input
                              key={index}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={otp[index] || ""}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, "");
                                const newOtp =
                                  otp.substring(0, index) + val + otp.substring(index + 1);
                                setOtp(newOtp);
                                if (val && index < 5) {
                                  const next = document.getElementById(`otp-update-${index + 1}`);
                                  next && next.focus();
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Backspace" && !otp[index] && index > 0) {
                                  const prev = document.getElementById(`otp-update-${index - 1}`);
                                  prev && prev.focus();
                                }
                              }}
                              id={`otp-update-${index}`}
                              className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-500/50 focus:border-purple-500 dark:focus:border-purple-500 transition-all duration-200 shadow-sm"
                            />
                          ))}
                        </div>
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                          Didn't receive the code? Check your spam folder
                        </p>
                      </div>

                      <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setOtpMode(false);
                            setOtp("");
                          }}
                          className="w-full sm:w-auto h-11 border-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-100 font-semibold cursor-pointer transition-all duration-200"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleOTPVerification}
                          disabled={loading || otp.length !== 6}
                          className="w-full sm:w-auto h-11 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold cursor-pointer shadow-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="animate-spin h-5 w-5 mr-2" />
                              Verifying...
                            </>
                          ) : (
                            "Verify Code"
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
