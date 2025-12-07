import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Pencil, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Calendar,
  Shield,
  Save,
  X,
  Edit,
  Lock,
  Camera
} from "lucide-react";
import userImg from "@/assets/user.jpg";
import ChangePassword from "./ChangePassword";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { setUser } from "@/redux/authSlice";

const ProfilePage = () => {
  const { theme } = useSelector((store) => store.theme);
  const { user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();

  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");
  const role = user?.role?.toLowerCase() || "student";


  // --- States ---
  const [isEditing, setIsEditing] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [email, setEmail] = useState(user?.email || "");
  const [emailChanged, setEmailChanged] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState(user?.email || "");
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [saveDisabled, setSaveDisabled] = useState(false)

  // Loading state
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    fullName: user?.username || "",
    fatherName: user?.fatherName || "",
    specialization: user?.specialization || "",
    cnicPassport: user?.cnic || "",
    registrationNo: user?.registrationNo || "",
    dateOfBirth: user?.dateOfBirth || "",
    rollNo: user?.rollNo || "",
    gender: user?.gender || "",
    department: user?.department || "",
    shift: user?.shift || "",
    semester: user?.semester || "",
    section: user?.section || "",
    phone: user?.phone || "",
  });

  const [originalEmail] = useState(user?.email || "");
  const [originalCnic] = useState(user?.cnic || "")

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;
    //block empty values saving
    if (value == null || value.trim() === "") {
      setSaveDisabled(true)
    }
    else {
      setSaveDisabled(false)
    }
    // Form Validation
    if (name === "fullName" || name === "fatherName") {
      updatedValue = value.replace(/[^a-zA-Z\s]/g, "");
    }
    else if (name === "cnicPassport") {
      updatedValue = value.replace(/\D/g, "").slice(0, 13);
    }

    else if (name === "email") {
      updatedValue = value.toLowerCase();
    }

    else if (name === "phone") {
      updatedValue = value.replace(/\D/g, "").slice(0, 11);
    }

    else {
      updatedValue = value;
    }

    setProfile((prev) => ({ ...prev, [name]: updatedValue }));
  };


  const handleEmailChange = (e) => {
    const newEmail = e.target.value.trim();
    setEmail(newEmail);
    // Check if email is empty
    if (newEmail === "") {
      setEmailChanged(false);
      setSaveDisabled(true);
      return;
    }
    if (newEmail === verifiedEmail) {
      setEmailChanged(false);
      setSaveDisabled(false)
    } else if (newEmail === originalEmail) {
      setEmailChanged(false);
      setSaveDisabled(false)
    } else {
      setEmailChanged(true);
      setSaveDisabled(false)
    }
  };

  const toggleEdit = () => setIsEditing((prev) => !prev);


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };


  const handleCancel = () => {
    // Reset profile data
    setProfile({
      fullName: user?.username || "",
      fatherName: user?.fatherName || "",
      specialization: user?.specialization || "",
      cnicPassport: user?.cnic || "",
      registrationNo: user?.registrationNo || "",
      dateOfBirth: user?.dateOfBirth || "",
      rollNo: user?.rollNo || "",
      gender: user?.gender || "",
      department: user?.department || "",
      shift: user?.shift || "",
      semester: user?.semester || "",
      section: user?.section || "",
      phone: user?.phone || "",
    });

    // Reset other fields
    setEmail(user?.email || "");
    setPreviewImage(null);
    setSelectedImage(null);
    setOtpMode(false);
    setEmailChanged(false);
    setSaveDisabled(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const cnicPattern = /^\d{13}$/;
    const phonePattern = /^\d{11}$/;

    const cnicValue = String(profile.cnicPassport);
    const phoneValue = String(profile.phone);
    if (profile.cnicPassport !== originalCnic && !cnicPattern.test(cnicValue)) {
      toast.error("CNIC must be exactly 13 digits without dashes.");
      return;
    }
    const nameletterCount = profile.fullName.replace(/\s/g, "").length;
    if (nameletterCount < 3) {
      toast.error(`Full Name must have at least 3 letters`);
      return;
    }
    const fNameletterCount = profile.fullName.replace(/\s/g, "").length;
    if (fNameletterCount < 3) {
      toast.error(`Father's Name must have at least 3 letters`);
      return;
    }
    if (!phonePattern.test(phoneValue)) {
      toast.error("Contact Number must conatin 11 digits")
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("username", profile.fullName);
      formData.append("fatherName", profile.fatherName);
      formData.append("specialization", profile.specialization);
      formData.append("registrationNo", profile.registrationNo);
      formData.append("dateOfBirth", profile.dateOfBirth);
      formData.append("rollNo", profile.rollNo);
      formData.append("gender", profile.gender);
      formData.append("department", profile.department);
      formData.append("shift", profile.shift);
      formData.append("semester", profile.semester);
      formData.append("section", profile.section);
      formData.append("phone", profile.phone);

      if (selectedImage) formData.append("file", selectedImage);
      if (email !== originalEmail) formData.append("email", email);
      if (profile.cnicPassport !== originalCnic) formData.append("cnic", profile.cnicPassport);

      const res = await axios.put(`${apiURL}/user/update-profile/${user._id}`, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setIsEditing(false);
        dispatch(setUser(res.data.user));
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Failed to update profile";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewEmailRequest = async () => {
    if (!emailChanged) return;
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email address");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${apiURL}/user/email-change/${user._id}`,
        { newEmail: email },
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
        "Unable to verify your new email";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter complete 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${apiURL}/user/verify-email/${user._id}`,
        { otp, newEmail: email },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        setOtpMode(false);
        setVerifiedEmail(email);
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

  const isStudent = role === "student";
  const isSupervisor = role === "supervisor";
  const isAdmin = role === "admin";
  const isCoordinator = role === "coordinator"

  const visibleFields = [
    { key: "fullName", label: "Full Name" },
    ...(isStudent ? [{ key: "fatherName", label: "Father Name" }] : []),
    ...(isSupervisor
      ? [
        {
          key: "specialization",
          label: "Specialization",
          type: "select",
          options: [
            "Computer Science",
            "Database Engineer",
            "Machine Learning",
            "Artificial Intelligence",
            "Software Engineering",
          ],
        },
      ]
      : []),
    { key: "cnicPassport", label: "CNIC / Passport" },
    { key: "email", label: "Email" },
    ...(isStudent ? [{ key: "dateOfBirth", label: "Date of Birth", type: "date" }] : []),
    ...(isStudent ? [{ key: "rollNo", label: "Roll No" }] : []),
    {
      key: "gender",
      label: "Gender",
      type: "select",
      options: ["Male", "Female", "Other"],
    },
    {
      key: "department",
      label: "Department",
      type: "select",
      options: [
        "Software Engineering",
        "Computer Science",
        "Electrical Engineering",
        "Information Technology",
        "Artificial Intelligence",
        "Cyber Security",
        "Data Science"
      ],
    },
    ...(isStudent
      ? [
        {
          key: "shift",
          label: "Shift",
          type: "select",
          options: ["Morning", "Evening"],
        },
        {
          key: "semester",
          label: "Semester",
          type: "select",
          options: ["6", "7", "8"],
        },
        {
          key: "section",
          label: "Section",
          type: "select",
          options: ["A", "B", "No Section"],
        },
      ]
      : []),
    { key: "phone", label: "Contact" },
  ];

  // Group fields into sections
  const personalFields = [
    { key: "fullName", label: "Full Name", icon: User },
    ...(isStudent ? [{ key: "fatherName", label: "Father Name", icon: User }] : []),
    { key: "cnicPassport", label: "CNIC / Passport", icon: Shield },
    ...(isStudent ? [{ key: "dateOfBirth", label: "Date of Birth", type: "date", icon: Calendar }] : []),
    {
      key: "gender",
      label: "Gender",
      type: "select",
      options: ["Male", "Female", "Other"],
      icon: User,
    },
  ];

  const contactFields = [
    { key: "email", label: "Email", icon: Mail },
    { key: "phone", label: "Contact", icon: Phone },
  ];

  const academicFields = [
    ...(isSupervisor
      ? [
          {
            key: "specialization",
            label: "Specialization",
            type: "select",
            options: [
              "Computer Science",
              "Database Engineer",
              "Machine Learning",
              "Artificial Intelligence",
              "Software Engineering",
            ],
            icon: GraduationCap,
          },
        ]
      : []),
    {
      key: "department",
      label: "Department",
      type: "select",
      options: [
        "Software Engineering",
        "Computer Science",
        "Electrical Engineering",
        "Information Technology",
        "Artificial Intelligence",
        "Cyber Security",
        "Data Science",
      ],
      icon: GraduationCap,
    },
    ...(isStudent
      ? [
          { key: "rollNo", label: "Roll No", icon: GraduationCap },
          {
            key: "semester",
            label: "Semester",
            type: "select",
            options: ["6", "7", "8"],
            icon: GraduationCap,
          },
          {
            key: "section",
            label: "Section",
            type: "select",
            options: ["A", "B", "No Section"],
            icon: GraduationCap,
          },
          {
            key: "shift",
            label: "Shift",
            type: "select",
            options: ["Morning", "Evening"],
            icon: GraduationCap,
          },
        ]
      : []),
    ...(isStudent ? [{ key: "registrationNo", label: "Registration No", icon: GraduationCap }] : []),
  ];

  const renderField = ({ key, label, type, options, icon: Icon }) => {
    return (
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {Icon && <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
          {label}
        </label>
        {isEditing ? (
          type === "select" ? (
            key === "department" && !isAdmin ? (
              // Department field is disabled for non-admin users
              <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 opacity-60 cursor-not-allowed">
                <p className="text-gray-700 dark:text-gray-300">
                  {profile[key] || "—"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Contact admin to change department
                </p>
              </div>
            ) : (
              <select
                name={key}
                value={profile[key] || ""}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all"
              >
                <option value="">Select {label}</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )
          ) : key === "email" ? (
            <Input
              type="email"
              name={key}
              value={email}
              onChange={handleEmailChange}
              className="dark:bg-gray-700 border-gray-300 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-400"
            />
          ) : key === "dateOfBirth" ? (
            <Input
              type="date"
              name="dateOfBirth"
              value={
                profile.dateOfBirth
                  ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
                  : ""
              }
              className="dark:bg-gray-700 border-gray-300 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-400"
              onChange={handleChange}
            />
          ) : (
            <Input
              type={type || "text"}
              name={key}
              value={profile[key] || ""}
              onChange={handleChange}
              className="dark:bg-gray-700 border-gray-300 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-400"
            />
          )
        ) : (
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-900 dark:text-gray-100">
              {key === "email"
                ? email || "—"
                : key === "dateOfBirth" && profile[key]
                  ? (() => {
                      const d = new Date(profile[key]);
                      return d.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      });
                    })()
                  : profile[key] || "—"}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen mt-15">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        <Sidebar portalType={role} />

        <main className="flex-1 flex flex-col gap-6">
          {/* Profile Header Card */}
          <Card className="p-6 md:p-8 bg-white dark:bg-gray-800 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
              {/* Avatar Section */}
              <div className="relative flex-shrink-0">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-purple-200 dark:border-gray-700 shadow-lg">
                    <img
                      src={previewImage || user?.profilePic || userImg}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isEditing && (
                    <label
                      htmlFor="profileImage"
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center cursor-pointer transition-opacity"
                    >
                      <Camera className="w-8 h-8 text-white" />
                    </label>
                  )}
                  <input
                    type="file"
                    id="profileImage"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              {/* User Info Section */}
              <div className="flex-1 text-center lg:text-left space-y-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {profile.fullName || "User"}
                  </h1>
                  <div className="flex items-center justify-center lg:justify-start gap-2 mt-2">
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 capitalize">
                      {role}
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your personal information and account settings
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {isEditing ? (
                  emailChanged ? (
                    <>
                      <Button
                        onClick={handleNewEmailRequest}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            Sending...
                          </>
                        ) : (
                          "Verify Email"
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          setOtpMode(false);
                          setEmailChanged(false);
                          setEmail(originalEmail);
                        }}
                        variant="outline"
                        className="cursor-pointer"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleSave}
                        disabled={loading || saveDisabled}
                        className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="cursor-pointer"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )
                ) : (
                  <>
                    <Button
                      onClick={toggleEdit}
                      className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 cursor-pointer"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button
                      onClick={() => setOpenChangePassword(true)}
                      variant="outline"
                      className="cursor-pointer"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Information Cards */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card className="p-6 bg-white dark:bg-gray-800 shadow-md rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Personal</span> Information
                </h2>
              </div>
              <div className="space-y-4">
                {personalFields.map((field) => renderField(field))}
              </div>
            </Card>

            {/* Contact Information */}
            <Card className="p-6 bg-white dark:bg-gray-800 shadow-md rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Contact</span> Information
                </h2>
              </div>
              <div className="space-y-4">
                {contactFields.map((field) => renderField(field))}
              </div>
            </Card>

            {/* Academic Information */}
            <Card className={`p-6 bg-white dark:bg-gray-800 shadow-md rounded-2xl border border-gray-200 dark:border-gray-700 ${academicFields.length > 0 ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Academic</span> Information
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {academicFields.map((field) => renderField(field))}
              </div>
            </Card>
          </div>

          {/* OTP Dialog */}
          {otpMode && (
            <Dialog open={otpMode} onOpenChange={setOtpMode}>
              <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-xl">
                <Card className="border-none shadow-none bg-transparent">
                  <div className="p-2">
                    <DialogHeader className="text-center mb-6">
                      <DialogTitle className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                        Verify New Email
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
                        Enter the OTP sent to{" "}
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          {email}
                        </span>
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-center gap-2 mb-6">
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
                              otp.substring(0, index) +
                              val +
                              otp.substring(index + 1);
                            setOtp(newOtp);

                            if (val && index < 5) {
                              const next = document.getElementById(`otp-${index + 1}`);
                              next && next.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !otp[index] && index > 0) {
                              const prev = document.getElementById(`otp-${index - 1}`);
                              prev && prev.focus();
                            }
                          }}
                          id={`otp-${index}`}
                          className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                        />
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOtpMode(false)}
                        className="cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleOTPVerification}
                        disabled={loading || otp.length !== 6}
                        className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            Verifying...
                          </>
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </DialogContent>
            </Dialog>
          )}

          {/* Change Password Dialog */}
          <ChangePassword
            open={openChangePassword}
            setOpen={setOpenChangePassword}
            userId={user?._id}
          />
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
