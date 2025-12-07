import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/Sidebar";
import userImg from "@/assets/user.jpg";
import { Loader2, User, User2 } from "lucide-react";
import SEO from "@/components/SEO";

const AdminDashboard = () => {
  const { user } = useSelector((store) => store.auth); // ✅ logged-in admin
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const apiURL = import.meta.env.VITE_API_URL;

  // ✅ Fetch users
  const getAllUsers = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      const res = await axios.get(`${apiURL}/user/get-users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      });

      if (res.data.success) {
        setUsers(res.data.user);
      } else {
        toast.error(res.data.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllUsers();
  }, []);

  // ✅ Compute statistics dynamically
  const totalStudents = users.filter((u) => u.role === "student").length;
  const totalFaculty = users.filter((u) => u.role === "supervisor").length;
  const totalCoordinators = users.filter((u) => u.role === "coordinator").length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;

  const statsData = [
    { number: totalStudents, label: "Students", color: "blue" },
    { number: totalFaculty, label: "Supervisors", color: "green" },
    { number: totalCoordinators, label: "Coordinators", color: "orange" },
    { number: totalAdmins, label: "Admins", color: "purple" },
  ];

  // ✅ Format timestamp
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ✅ Recent activity: users registered within last 24 hours
  const now = new Date();
  const activityData = users
    .filter((u) => {
      if (!u.createdAt) return false;
      const createdAt = new Date(u.createdAt);
      const diffHours = (now - createdAt) / (1000 * 60 * 60); // hours difference
      return diffHours <= 24; // only show within last 24 hours
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((u) => ({
      title: `${u.username} registered as ${u.role}`,
      time: formatDate(u.createdAt),
      tag: "recent",
      color: "green",
    }));

  return (
    <>
    <SEO 
      title="Admin Dashboard | FYP Buddy - System Management"
      description="Admin dashboard for FYP Buddy. Manage users, oversee system operations, handle user registrations, and maintain the FYP management platform."
      keywords="admin dashboard, user management, system administration, FYP admin, platform management"
    />
    <div className="min-h-screen mt-15">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        <Sidebar portalType={"admin"} />

        {/* Make Main span full available width */}
        <main className="flex flex-col gap-5 w-full">

          {/* Remove max-w-5xl to allow full-width */}
          <Card className="w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-8 p-8 bg-white dark:bg-gray-800 shadow-lg rounded-2xl transition-all duration-300">
            {/* Left Section */}
            <div className="flex flex-col text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Admin</span> Dashboard
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Welcome back,{" "}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {user?.username || "Admin"}
                </span>{" "}
                👋
              </p>
            </div>

            {/* Right Section - Avatar */}
            <div className="flex flex-col items-center">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-gray-300 dark:border-gray-600 shadow-md">
                <AvatarImage src={user?.profilePic || userImg} />
              </Avatar>
              <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-300">
                {user?.username || "Unknown User"}
              </h3>
            </div>
          </Card>

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
            </div>
          ) : (
            <>
              {/* Stats Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsData.map((stat) => (
                  <Card
                    key={stat.label}
                    className="flex flex-col items-center p-4 text-center bg-white dark:bg-gray-800 border-none shadow-md transition-colors duration-300"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${stat.color === "blue"
                          ? "bg-blue-100 text-blue-500 dark:bg-blue-900 dark:text-blue-300"
                          : stat.color === "green"
                            ? "bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300"
                            : stat.color === "orange"
                              ? "bg-orange-100 text-orange-500 dark:bg-orange-900 dark:text-orange-300"
                              : "bg-purple-100 text-purple-500 dark:bg-purple-900 dark:text-purple-300"
                        }`}
                    >
                      <User2 />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                      {stat.number}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </p>
                  </Card>
                ))}
              </div>

              {/* Recent Activity Section */}
              <Card className="p-4 flex flex-col gap-3 bg-white dark:bg-gray-800 border-none shadow-md rounded-xl">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  Recent <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Registrations</span> (Last <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">24</span> Hours)
                </h2>
                {activityData.length > 0 ? (
                  activityData.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${activity.color === "green"
                            ? "bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300"
                            : "bg-blue-100 text-blue-500 dark:bg-blue-900 dark:text-blue-300"
                          }`}
                      >
                        <User />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-1">
                          {activity.title}
                        </p>
                        <p className="text-[0.7rem] text-gray-400 dark:text-gray-500">
                          {activity.time}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-[0.625rem] whitespace-nowrap bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300">
                        {activity.tag}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No new registrations in the last 24 hours.
                  </p>
                )}
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
    </>
  );
};

export default AdminDashboard;
