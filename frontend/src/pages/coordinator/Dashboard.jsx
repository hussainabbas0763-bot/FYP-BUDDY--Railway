import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/Sidebar";
import userImg from "@/assets/user.jpg";
import { Loader2, Users, FileText, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import SEO from "@/components/SEO";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CoordinatorDashboard = () => {
  const { user } = useSelector((store) => store.auth);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);

  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");

  // ✅ Utility for formatting
  const formatDateTime = (date) => {
    if (!date) return "No date";
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ Fetch milestones
  const fetchAllMilestones = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiURL}/milestone/get-all-milestones`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      if (res.data.success) {
        const allMilestones = res.data.data || [];
        const filtered = allMilestones.filter(
          (m) => m.department === user?.department
        );
        const completedphaseFiltered = filtered.filter(
          (m) => m.phase !== "Completed"
        )

        setMilestones(completedphaseFiltered);
        filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setMilestones(completedphaseFiltered);
      } else {
        setMilestones([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load milestones");
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMilestones();
  }, []);

  // ✅ Stats
  const countUniqueGroupsByPhase = (phase) => {
    const filtered = milestones.filter((m) => m.phase === phase);
    const uniqueGroups = new Set(
      filtered.map((m) =>
        typeof m.groupId === "object" ? m.groupId._id || m.groupId : m.groupId
      )
    );
    return uniqueGroups.size;
  };

  const statsData = [
    {
      number: countUniqueGroupsByPhase("Proposal"),
      label: "Proposal Groups",
      color: "blue",
      icon: FileText,
    },
    {
      number: countUniqueGroupsByPhase("Progress"),
      label: "Progress Groups",
      color: "green",
      icon: Users,
    },
    {
      number: countUniqueGroupsByPhase("Defence"),
      label: "Defence Groups",
      color: "orange",
      icon: GraduationCap,
    },
  ];

  // ✅ Build formatted activities (latest 10)
  const buildActivities = () => {
    const allActivities = [];

    milestones.forEach((milestone) => {
      const now = new Date();
      const submissionDeadline = milestone.submissionDeadline
        ? new Date(milestone.submissionDeadline)
        : null;
      const gradingDeadline = milestone.gradingDeadline
        ? new Date(milestone.gradingDeadline)
        : null;

      // --- STUDENT SUBMISSION STATUS ---
      if (
        milestone.isSubmissionActive &&
        submissionDeadline &&
        now < submissionDeadline
      ) {
        allActivities.push({
          icon: "🟢",
          text: `Student submission portal is active for ${milestone.phase} phase.`,
          time: `Till ${formatDateTime(submissionDeadline)}`,
          updatedAt: milestone.updatedAt,
        });
      } else if (
        !milestone.isSubmissionActive &&
        submissionDeadline &&
        now > submissionDeadline
      ) {
        allActivities.push({
          icon: "⚫",
          text: `Submission portal closed — deadline met for ${milestone.phase} phase.`,
          time: `Closed on ${formatDateTime(submissionDeadline)}`,
          updatedAt: milestone.updatedAt,
        });
      }

      // --- SUPERVISOR GRADING STATUS ---
      if (gradingDeadline && now < gradingDeadline) {
        allActivities.push({
          icon: "🟣",
          text: `Supervisor grading portal is active for ${milestone.phase} phase.`,
          time: `Till ${formatDateTime(gradingDeadline)}`,
          updatedAt: milestone.updatedAt,
        });
      } else if (gradingDeadline && now > gradingDeadline) {
        allActivities.push({
          icon: "⚫",
          text: `Grading portal closed — deadline met for ${milestone.phase} phase.`,
          time: `Closed on ${formatDateTime(gradingDeadline)}`,
          updatedAt: milestone.updatedAt,
        });
      }
    });

    return allActivities
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10);
  };

  const activities = buildActivities();

  return (
    <>
    <SEO 
      title="Coordinator Dashboard | FYP Buddy - Oversee All Projects"
      description="Coordinator dashboard for FYP Buddy. Manage milestones, oversee grading, handle document management, create announcements, and coordinate all FYP activities."
      keywords="coordinator dashboard, FYP coordination, project oversight, milestone management, academic coordination, thesis management"
    />
    <div className="min-h-screen mt-15">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        <Sidebar portalType="coordinator" />

        <main className="flex flex-col gap-5 w-full">
          {/* Header */}
          <Card className="w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-8 p-8 bg-white dark:bg-gray-800 shadow-lg rounded-2xl transition-all duration-300">
            <div className="flex flex-col text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Coordinator
                </span>{" "}
                Dashboard
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Welcome back,{" "}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {user?.username || "Coordinator"}
                </span>{" "}
                👋
              </p>
            </div>

            <div className="flex flex-col items-center">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-gray-300 dark:border-gray-600 shadow-md">
                <AvatarImage src={user?.profilePic || userImg} />
              </Avatar>
              <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-300">
                {user?.username || "Unknown User"}
              </h3>
            </div>
          </Card>

          {/* Loading Spinner */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statsData.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card
                      key={stat.label}
                      className="flex flex-col items-center p-6 text-center bg-white dark:bg-gray-800 border-none shadow-md transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg"
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                          stat.color === "blue"
                            ? "bg-blue-100 text-blue-500 dark:bg-blue-900 dark:text-blue-300"
                            : stat.color === "green"
                            ? "bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300"
                            : "bg-orange-100 text-orange-500 dark:bg-orange-900 dark:text-orange-300"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                        {stat.number}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {stat.label}
                      </p>
                    </Card>
                  );
                })}
              </div>

              {/* Recent Activities */}
              <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl border border-gray-100 dark:border-gray-700 mt-5">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Your Recent Activities
                </h2>

                {activities.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                        <TableHead className="text-gray-600 dark:text-gray-400 font-medium">
                          Activity
                        </TableHead>
                        <TableHead className="text-right text-gray-600 dark:text-gray-400 font-medium">
                          Timeline
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((activity, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition"
                        >
                          <TableCell className="text-gray-800 dark:text-gray-200 text-sm">
                            <span className="font-medium mr-1">
                              {activity.icon}
                            </span>
                            {activity.text}
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Last updated: {formatDateTime(activity.updatedAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-gray-600 dark:text-gray-400 text-sm">
                            {activity.time}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No recent activities to display.
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

export default CoordinatorDashboard;
