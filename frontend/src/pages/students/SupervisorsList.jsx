import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, Award, BookOpen } from "lucide-react";
import userImg from "@/assets/user.jpg";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import SEO from "@/components/SEO";

export default function SupervisorsList() {
    const [supervisors, setSupervisors] = useState({});
    const [selectedSupervisor, setSelectedSupervisor] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fypTitle, setFypTitle] = useState("")
    const [description, setDescription] = useState("")
    const navigate = useNavigate();
    const accessToken = localStorage.getItem("accessToken");
    const apiURL = import.meta.env.VITE_API_URL;
    const { group } = useSelector((store) => store.group)
    const { user } = useSelector((store) => store.auth)
    const groupId = group._id || null
    const userDepartment = user?.department || null

    const getSupervsiors = async () => {
        try {
            setLoading(true);

            if (!userDepartment) {
                toast.error("User department not found");
                setLoading(false);
                return;
            }

            const res = await axios.get(`${apiURL}/user/get-users`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                withCredentials: true,
            });

            if (res.data.success) {
                // Filter only supervisors from the same department as the user
                const onlySupervisors = res.data.user.filter(
                    (u) => u.role === "supervisor" && u.department === userDepartment
                );

                // Group supervisors by department
                const grouped = onlySupervisors.reduce((acc, sup) => {
                    const dept = sup.department || "Other";
                    if (!acc[dept]) acc[dept] = [];
                    acc[dept].push(sup);
                    return acc;
                }, {});

                setSupervisors(grouped);
            } else {
                toast.error(res.data.message || "Failed to fetch users");
            }
        } catch (error) {
            toast.error("Failed to load Supervisors");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userDepartment) {
            getSupervsiors();
        }
    }, [userDepartment]);

    const handleSelect = (supervisor) => {
        setSelectedSupervisor(supervisor);
        setShowForm(false);
    };

    const handleSendRequest = () => setShowForm(true);
    const handleBack = () => {
        setSelectedSupervisor(null);
        setShowForm(false);
    };
    const handleBackToProfile = () => setShowForm(false);
    const handleBackToDashboard = () => {
        setSelectedSupervisor(null);
        setShowForm(false);
        navigate(-1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!groupId) {
            toast.error("Group not found. Please form a group first.");
            return;
        }

        try {
            setLoading(true);

            const res = await axios.post(`${apiURL}/supervisor/send-request`,
                {
                    fypTitle,
                    description,
                    groupId,
                    supervisorId: selectedSupervisor._id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    withCredentials: true,
                }
            );

            if (res.data.success) {
                toast.success(res.data.message || "Request sent successfully!");
                setShowForm(false);
                setSelectedSupervisor(null);
                setFypTitle("");
                setDescription("");
            } else {
                toast.error(res.data.message || "Failed to send request");
            }
        } catch (error) {
            console.error("Error sending request:", error);
            toast.error(error.response?.data?.message || "Failed to send request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <SEO 
          title="Find Supervisors | FYP Buddy - Connect with Faculty"
          description="Browse available supervisors for your FYP. View their expertise, availability, and send supervision requests to guide your final year project."
          keywords="FYP supervisors, project mentors, faculty advisors, supervision requests"
        />
        <div className="min-h-screen mt-15">
            <div className="flex flex-col md:flex-row gap-5 p-5">
                <Sidebar portalType="student" />

                <main className="flex-1 flex flex-col gap-6 overflow-y-auto">
                    <Card className="relative bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 p-8 text-center shadow-xl rounded-2xl transition-all duration-300 border-2 border-purple-100 dark:border-gray-700">
                        <Button
                            onClick={handleBackToDashboard}
                            className="absolute top-4 left-4 flex items-center gap-2 bg-gray-800 text-white dark:text-gray-800 hover:bg-gray-700 dark:bg-gray-100 cursor-pointer dark:hover:bg-gray-200 shadow-md"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>

                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-2 mt-6">
                            Meet Your{" "}
                            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Future</span>{" "}
                            Mentors
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            Connect with experienced supervisors ready to guide you through your FYP journey.
                        </p>
                    </Card>

                    {/* Supervisors List by Department */}
                    {!selectedSupervisor && !showForm && (
                        <div className="flex flex-col items-center w-full">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
                                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading supervisors...</p>
                                </div>
                            ) : Object.keys(supervisors).length === 0 ? (
                                <Card className="p-12 text-center bg-white dark:bg-gray-800 shadow-lg rounded-2xl max-w-md">
                                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                        No Supervisors Available
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        There are currently no supervisors available in your department ({userDepartment}).
                                    </p>
                                </Card>
                            ) : (
                                Object.entries(supervisors).map(([dept, list]) => (
                                    <div key={dept} className="w-full max-w-6xl text-center mt-8">
                                        <div className="flex items-center justify-center gap-3 mb-6">
                                            <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {dept} Department
                                            </h2>
                                        </div>
                                        <hr className="w-32 h-[3px] mb-8 mx-auto rounded border-0 bg-gradient-to-r from-purple-500 to-blue-500 dark:from-purple-400 dark:to-blue-400" />

                                        <div
                                            className="grid gap-6 justify-items-center"
                                            style={{
                                                gridTemplateColumns:
                                                    "repeat(auto-fit, minmax(240px, 1fr))",
                                            }}
                                        >
                                            {list.map((sup) => {
                                                const availableSlots = 5 - (sup.supervision.current || 0);
                                                const isAvailable = sup.supervision.isAvailable && availableSlots > 0;
                                                
                                                return (
                                                    <Card
                                                        key={sup._id}
                                                        onClick={() => handleSelect(sup)}
                                                        className={`cursor-pointer flex flex-col items-center text-center bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 w-full max-w-[250px] p-5 border-2 ${
                                                            isAvailable 
                                                                ? 'border-purple-200 dark:border-purple-900 hover:border-purple-400 dark:hover:border-purple-600' 
                                                                : 'border-gray-200 dark:border-gray-700 opacity-75'
                                                        }`}
                                                    >
                                                        <img
                                                            src={sup.profilePic || userImg}
                                                            alt={sup.username}
                                                            className="w-24 h-24 rounded-full mb-3 border-4 border-purple-100 dark:border-purple-900 object-cover"
                                                        />
                                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-tight text-base">
                                                            {sup.username}
                                                        </h3>
                                                        <div className="flex items-center gap-1 mt-2 mb-2">
                                                            <BookOpen className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                                            <p className="text-gray-700 dark:text-gray-300 text-xs leading-snug">
                                                                {sup.specialization}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                                                isAvailable 
                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                                                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                                            }`}>
                                                                {isAvailable ? `${availableSlots} Slots` : 'Unavailable'}
                                                            </span>
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Selected Supervisor */}
                    {selectedSupervisor && !showForm && (
                        <Card className="relative p-8 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-900 text-center shadow-xl rounded-2xl transition-all duration-300 max-w-lg mx-auto border-2 border-purple-100 dark:border-gray-700">
                            <div>
                                <Button
                                    onClick={handleBack}
                                    className="absolute top-4 left-4 flex items-center gap-2 bg-gray-800 text-white dark:text-gray-800 hover:bg-gray-700 dark:bg-gray-100 cursor-pointer dark:hover:bg-gray-200 text-sm px-3 py-1 shadow-md"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                                
                                <div className="relative inline-block mb-4">
                                    <img
                                        src={selectedSupervisor.profilePic || userImg}
                                        alt={selectedSupervisor.username}
                                        className="w-32 h-32 rounded-full mx-auto border-4 border-purple-200 dark:border-purple-900 object-cover shadow-lg"
                                    />
                                    {selectedSupervisor.supervision.isAvailable && (
                                        <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800"></div>
                                    )}
                                </div>
                                
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    {selectedSupervisor.username}
                                </h2>
                                
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                        {selectedSupervisor.department}
                                    </p>
                                </div>

                                <div className="bg-purple-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Specialization</p>
                                    <p className="text-gray-900 dark:text-gray-100 font-semibold">
                                        {selectedSupervisor.specialization}
                                    </p>
                                </div>

                                <div className="flex justify-center gap-4 mb-6">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Available Slots</p>
                                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                            {5 - (selectedSupervisor.supervision.current || 0)}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</p>
                                        <p className={`text-sm font-bold ${
                                            selectedSupervisor.supervision.isAvailable 
                                                ? 'text-green-600 dark:text-green-400' 
                                                : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {selectedSupervisor.supervision.isAvailable ? 'Available' : 'Unavailable'}
                                        </p>
                                    </div>
                                </div>
                                
                                <Button
                                    onClick={handleSendRequest}
                                    disabled={!selectedSupervisor.supervision.isAvailable || (5 - (selectedSupervisor.supervision.current || 0)) <= 0}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 cursor-pointer hover:from-purple-700 hover:to-blue-700 text-white dark:from-purple-500 dark:to-blue-500 dark:hover:from-purple-600 dark:hover:to-blue-600 px-6 py-3 text-base font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Send FYP Request
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Request Form */}
                    {showForm && (
                        <Card className="p-8 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-900 shadow-xl rounded-2xl transition-all duration-300 max-w-lg mx-auto border-2 border-purple-100 dark:border-gray-700">
                            <div className="flex flex-col">
                                <Button
                                    onClick={handleBackToProfile}
                                    className="flex items-center gap-2 mb-4 bg-gray-800 text-white dark:text-gray-800 hover:bg-gray-700 dark:bg-gray-100 cursor-pointer dark:hover:bg-gray-200 text-sm px-3 w-fit shadow-md"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                                
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                        Send FYP Request
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Submit your project idea to {selectedSupervisor?.username}
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5 flex flex-col">
                                    <div className="flex-shrink-0">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                                            FYP Idea Title *
                                        </label>
                                        <Input
                                            type="text"
                                            required
                                            placeholder="Enter your project title"
                                            className="text-sm border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 transition-colors"
                                            value={fypTitle}
                                            onChange={(e) => setFypTitle(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex-shrink-0 flex flex-col">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                                            FYP Idea Description *
                                        </label>
                                        <Textarea
                                            rows={6}
                                            required
                                            placeholder="Describe your project idea, objectives, and expected outcomes..."
                                            className="text-sm resize-none overflow-y-auto border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 transition-colors"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            style={{ 
                                                resize: "none",
                                                maxHeight: "10rem",
                                                minHeight: "6rem"
                                            }}
                                        />
                                        <div className="flex justify-between items-center mt-2">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {description.length} characters
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {description.split(/\s+/).filter(w => w.length > 0).length} words
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full cursor-pointer bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white dark:from-purple-500 dark:to-blue-500 dark:hover:from-purple-600 dark:hover:to-blue-600 py-3 mt-4 flex-shrink-0 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Sending...
                                            </span>
                                        ) : (
                                            "Send Request"
                                        )}
                                    </Button>
                                </form>
                            </div>
                        </Card>
                    )}
                </main>
            </div>
        </div>
        </>
    );
}
