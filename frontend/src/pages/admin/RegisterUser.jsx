import React, { useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
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

export default function CreateUser({ open, setOpen }) {
  const { theme } = useSelector((store) => store.theme);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    cnic: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
  });

  // ---------- Input Validation ----------
  const handleChange = (e) => {
    const { name, value } = e.target;

    // username: only letters and spaces
    if (name === "username") {
      const onlyLetters = value.replace(/[^a-zA-Z\s]/g, "");
      setFormData((prev) => ({ ...prev, username: onlyLetters }));
      return;
    }

    // email: always lowercase
    if (name === "email") {
      setFormData((prev) => ({ ...prev, email: value.toLowerCase() }));
      return;
    }

    // cnic: only digits, max 13
    if (name === "cnic") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 13);
      let updated = { ...formData, cnic: digitsOnly };

      // Auto-generate password when CNIC is exactly 13 digits
      if (digitsOnly.length === 13) {
        const generatedPassword = `Numl@${digitsOnly}`;
        if (formData.password === "" || formData.password.startsWith("Numl@")) {
          updated.password = generatedPassword;
          updated.confirmPassword = generatedPassword;
        }
      }
      setFormData(updated);
      return;
    }

    // normal update
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---------- Form Submission ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation checks
    if (!formData.username.match(/^[A-Za-z\s]+$/)) {
      toast.error("Username must contain only letters and spaces.");
      return;
    }

    if (!/^\d{13}$/.test(formData.cnic)) {
      toast.error("CNIC must be exactly 13 digits without dashes or alphabets.");
      return;
    }

    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Email must be lowercase and in a valid format!");
      return;
    }

    if (!role) {
      toast.error("Please select a role!");
      return;
    }

    if (!formData.department) {
      toast.error("Please select a department!");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;

    if (!passwordRegex.test(formData.password)) {
      toast.error(
        "Password must be at least 8 characters long, include uppercase, lowercase, number, and special character."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading(true);
    toast.loading("Creating user...");

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role,
        cnic: formData.cnic,
        department: formData.department,
      };

      const apiUrl = import.meta.env.VITE_API_URL;
      const accessToken = localStorage.getItem("accessToken");

      const res = await axios.post(`${apiUrl}/user/register`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      toast.dismiss();
      if (res.data.success) {
        toast.success("User Created Successfully!");
        setFormData({
          username: "",
          cnic: "",
          email: "",
          password: "",
          confirmPassword: "",
          department: "",
        });
        setRole("");
        setOpen(false);
      }
    } catch (error) {
      toast.dismiss();
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to create user";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
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
                Create a <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  New User
                </span>              
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm text-center">
                Fill in the details below to add a new user to the system
              </DialogDescription>
            </DialogHeader>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
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
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/50 transition-all duration-200 cursor-pointer"
                >
                  <option value="">Select Role</option>
                  <option value="student">Student</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="coordinator">FYP Coordinator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Username */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                    className="h-11 rounded-lg border-gray-300 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-500/50 dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
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
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                    required
                    className="h-11 rounded-lg border-gray-300 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-500/50 dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                  />
                </div>

                {/* CNIC */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    CNIC <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleChange}
                    placeholder="3520212345678"
                    required
                    className="h-11 rounded-lg border-gray-300 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-500/50 dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
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
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="h-11 border border-gray-300 dark:border-gray-600 rounded-lg px-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/50 transition-all duration-200 cursor-pointer"
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

                {/* Password */}
                <div className="flex flex-col gap-2 relative">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      required
                      className="h-11 rounded-lg border-gray-300 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-500/50 pr-11 dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-2 relative">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      required
                      className="h-11 rounded-lg border-gray-300 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-500/50 pr-11 dark:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-8 h-12 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white shadow-lg font-semibold flex items-center justify-center rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Creating User...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
