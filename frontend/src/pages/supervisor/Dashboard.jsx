import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { setSupervisedGroups } from "@/redux/supervisedGroupsSlice";
import {
    BookOpen,
    FileText,
    Mail,
    CheckCircle2,
    XCircle,
    Megaphone,
} from "lucide-react";
import SEO from "@/components/SEO";
import userImg from "@/assets/user.jpg";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AnnouncementsOverlay from "@/components/AnnouncementsOverlay";


export default function SupervisorDashboard() {
    const { user } = useSelector((store) => store.auth);
    const apiURL = import.meta.env.VITE_API_URL;
    const accessToken = localStorage.getItem("accessToken")
    const [requests, setRequests] = useState([])
    const [groups, setGroups] = useState([])
    const [activities, setActivities] = useState([])
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
    const [showAnnouncements, setShowAnnouncements] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchSupervisionRequests = async () => {
            try {
                const res = await axios.get(`${apiURL}/supervisor/get-requests`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (res.data.success) {
                    setRequests(res.data.Supervisionrequests)
                }
            } catch (err) {
                console.error("Error fetching invitations:", err);
            }
        };

        const fetchGroups = async () => {
            try {
                const res = await axios.get(`${apiURL}/supervisor/my-groups`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (res.data.success) {
                    dispatch(setSupervisedGroups(res.data.groups))
                    setGroups(res.data.groups || [])
                }
            } catch (err) {
                console.error("Error fetching groups:", err);
            }
        };

        const fetchUnreadMessages = async () => {
            try {
                const res = await axios.get(`${apiURL}/chat/unread-counts`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (res.data.success) {
                    const totalUnread = Object.values(res.data.unreadCounts).reduce(
                        (sum, count) => sum + count,
                        0
                    );
                    setUnreadMessagesCount(totalUnread);
                }
            } catch (err) {
                console.error("Error fetching unread messages:", err);
            }
        };

        fetchSupervisionRequests();
        fetchGroups();
        fetchUnreadMessages();
    }, [accessToken, apiURL]);

    // Build recent activities from tasks of supervised groups
    useEffect(() => {
        const fetchGroupTasks = async () => {
            if (!groups || groups.length === 0) {
                setActivities([]);
                return;
            }

            try {
                const allTasks = [];
                // Fetch tasks per group in parallel
                const requests = groups.map((g) =>
                    axios.get(`${apiURL}/task/get-tasks/${g._id}`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }).then((res) => ({ group: g, tasks: res.data?.tasks || [] }))
                        .catch(() => ({ group: g, tasks: [] }))
                );

                const results = await Promise.all(requests);
                results.forEach(({ group, tasks }) => {
                    tasks.forEach((t) => {
                        // Submission activity
                        if (t.status === "Submitted" && t.submittedAt) {
                            allTasks.push({
                                type: "submitted",
                                groupName: group.fypTitle || group.groupName || "Group",
                                taskTitle: t.title,
                                when: new Date(t.submittedAt),
                                timestamp: t.submittedAt,
                            });
                        }
                        // Review activity (accepted/rejected)
                        if ((t.status === "Accepted" || t.status === "Rejected") && t.reviewedAt) {
                            allTasks.push({
                                type: t.status.toLowerCase(),
                                groupName: group.fypTitle || group.groupName || "Group",
                                taskTitle: t.title,
                                when: new Date(t.reviewedAt),
                                timestamp: t.reviewedAt,
                            });
                        }
                    });
                });

                // Sort by time desc and keep recent 10
                allTasks.sort((a, b) => b.when - a.when);
                setActivities(allTasks.slice(0, 10));
            } catch (e) {
                setActivities([]);
            }
        };

        fetchGroupTasks();
    }, [groups, apiURL, accessToken]);

    return (
        <>
        <SEO 
          title="Supervisor Dashboard | FYP Buddy - Manage Student Projects"
          description="Supervisor dashboard for FYP Buddy. Review supervision requests, manage student groups, assign tasks, grade submissions, and monitor project progress."
          keywords="supervisor dashboard, FYP supervision, student management, project grading, task assignment, thesis supervision"
        />
        <div className="min-h-screen mt-15">
            <div className="flex flex-col md:flex-row gap-5 p-5">
                {/* Sidebar */}
                <Sidebar portalType="supervisor" />

                {/* Content Wrapper */}
                <div className="flex flex-col xl:flex-row flex-1 gap-5 overflow-hidden">
                    {/* Main Section */}
                    <main className="flex-1 flex flex-col gap-5 overflow-y-auto">
                        {/* Header */}
                        <Card className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 p-8 bg-white dark:bg-gray-800 shadow-lg rounded-2xl transition-all duration-300">
                            <div className="flex flex-col text-center md:text-left">
                                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">
                                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Supervisor</span>{" "}
                                    Dashboard
                                </h1>
                                <p className="text-lg text-gray-600 dark:text-gray-400">
                                    Welcome back,{" "}
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                        {user?.username || "Dr. HSR"} 👋
                                    </span>{" "}
                                </p>
                            </div>

                            {/* Profile Section */}
                            <div className="relative flex flex-col items-center">
                                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-gray-300 dark:border-gray-600 shadow-md">
                                    <AvatarImage src={user?.profilePic || userImg} />
                                </Avatar>
                                <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-300">
                                    {user?.username || "Dr. HSR"}
                                </h3>
                            </div>
                        </Card>

                        {/* Status Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            {[
                                {
                                    title: "Supervision Requests",
                                    count: requests.length,
                                    status: "Awaiting Review",
                                    color: "yellow",
                                    icon: FileText,
                                    link: "/supervisor/dashboard/supervision-requests",
                                },
                                {
                                    title: "Active Projects",
                                    count: groups.length,
                                    status: "In Progress",
                                    color: "blue",
                                    icon: BookOpen,
                                    link: "/supervisor/my-groups",
                                },
                                {
                                    title: "Unread Messages",
                                    count: unreadMessagesCount,
                                    status: "New Messages",
                                    color: "green",
                                    icon: Mail,
                                    link: "/supervisor/team-chat",
                                },
                            ].map(({ title, count, status, color, icon: Icon, link }, i) => (
                                <Link key={i} to={link ?? "#"} className="cursor-pointer">
                                    <Card className="flex flex-col items-center p-5 text-center bg-white dark:bg-gray-800 border-none shadow-md transition-all duration-300 hover:-translate-y-1">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${color === "green"
                                                ? "bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300"
                                                : color === "yellow"
                                                    ? "bg-yellow-100 text-yellow-500 dark:bg-yellow-900 dark:text-yellow-300"
                                                    : "bg-blue-100 text-blue-500 dark:bg-blue-900 dark:text-blue-300"
                                                }`}
                                        >
                                            <Icon />
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                            {title}
                                        </h3>
                                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            {count}
                                        </p>
                                        <p
                                            className={`text-sm font-semibold ${color === "green"
                                                ? "text-green-600 dark:text-green-400"
                                                : color === "yellow"
                                                    ? "text-yellow-600 dark:text-yellow-400"
                                                    : "text-blue-600 dark:text-blue-400"
                                                }`}
                                        >
                                            {status}
                                        </p>
                                    </Card>
                                </Link>
                            ))}
                        </div>

                        {/* Recent Proposals */}
                        <Card className="p-6 bg-white dark:bg-gray-800 shadow-md rounded-2xl">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
                                Recent <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Supervision</span> Requests ( last <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">24</span> Hours )
                            </h2>
                            <hr className="w-32 h-[3px] mb-2 mx-auto  rounded border-0 bg-purple-500  dark:bg-gray-100" />

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                                    <thead>
                                        <tr className="border-b dark:border-gray-700">
                                            <th className="py-2 px-4">Project Title</th>
                                            <th className="py-2 px-4">Requested At</th>
                                            <th className="py-2 px-4">Status</th>
                                            <th className="py-2 px-4">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {requests && requests.length > 0 ? (
                                            requests.map((p, i) => (
                                                <tr key={i} className="border-b dark:border-gray-700">
                                                    <td className="py-3 px-4">{p.fypTitle}</td>
                                                    <td className="py-3 px-4">
                                                        {new Date(p.createdAt).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-700 dark:text-gray-100">{p.status}</td>
                                                    <td className="py-3 px-4 flex gap-2">
                                                        <button
                                                            className="bg-purple-600 hover:bg-purple-500 rounded-2xl cursor-pointer text-white dark:bg-gray-100 dark:text-gray-700 dark:hover:bg-gray-200 text-xs px-3 py-1"
                                                            onClick={() => navigate("/supervisor/dashboard/supervision-requests")}
                                                        >
                                                            See details
                                                        </button>

                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="text-center py-4 text-gray-500 dark:text-gray-400"
                                                >
                                                    No Invitations found yet
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                    </main>

                    {/* Right Panel */}
                    <aside className="w-full xl:w-96 flex-shrink-0 flex flex-col gap-6 bg-white dark:bg-gray-800 p-6 shadow-md rounded-2xl transition-colors duration-300">
                        {/* Coordinator Announcements */}
                        <Card className=" p-4 bg-gray-50 dark:bg-gray-800 border-none shadow-sm rounded-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Coordinator <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Announcements</span>
                                </h3>
                            </div>
                            <Button
                                onClick={() => setShowAnnouncements(true)}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-300 hover:shadow-lg"
                            >
                                <Megaphone className="w-5 h-5" />
                                View All Announcements
                            </Button>
                        </Card>

                        {/* Groups */}
                        <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-none shadow-sm rounded-xl">
                            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 flex justify-between">
                                My Groups{" "}
                                <Link
                                    to="/supervisor/my-groups"
                                    className="text-purple-600 dark:text-purple-400 text-sm hover:underline"
                                >
                                    See all
                                </Link>
                            </h3>
                            <div className="flex justify-center flex-wrap gap-6">
                                {groups.length > 0 ? (
                                    groups.slice(0, 3).map((group, i) => {
                                        // Get first letter from FYP title or group name
                                        const displayName = group.fypTitle || group.groupName || `Group ${i + 1}`;
                                        const firstLetter = displayName.charAt(0).toUpperCase();
                                        return (
                                            <div key={group._id || i} className="flex flex-col items-center text-sm">
                                                <Avatar className="w-14 h-14 mb-2 border border-gray-300 dark:border-gray-600">
                                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                                                        {firstLetter}
                                                    </div>
                                                </Avatar>
                                                <span className="text-gray-700 dark:text-gray-300 text-center max-w-[80px] truncate">
                                                    {displayName}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center w-full py-2">
                                        No groups yet
                                    </p>
                                )}
                            </div>
                        </Card>

                        {/* Recent Activities */}
                        <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-none shadow-sm rounded-xl">
                            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                                Recent Activities
                            </h3>

                            {activities && activities.length > 0 ? (
                                <div className="max-h-100 overflow-y-auto pr-1 custom-scroll">
                                    {activities.slice(0, 10).map((a, i) => {
                                        let text = "";
                                        if (a.type === "submitted") {
                                            text = `${a.groupName} has submitted the task ${a.taskTitle}`;
                                        } else if (a.type === "accepted") {
                                            text = `You accepted ${a.groupName}'s submission for ${a.taskTitle}`;
                                        } else if (a.type === "rejected") {
                                            text = `You rejected ${a.groupName}'s submission for ${a.taskTitle}`;
                                        }
                                        const time = new Date(a.timestamp).toLocaleString();
                                        return (
                                            <div key={i} className="flex flex-col mb-3">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarImage src={userImg} />
                                                    </Avatar>
                                                    <div>
                                                        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                                                            {a.groupName}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                            {time}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-700 dark:text-gray-300 ml-10 flex items-start gap-2">
                                                    {a.type === "accepted" && (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                                                    )}
                                                    {a.type === "rejected" && (
                                                        <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                                    )}
                                                    {a.type === "submitted" && (
                                                        <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                                                    )}
                                                    <p>{text}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                            )}
                        </Card>
                    </aside>
                </div>
            </div>

            {/* Announcements Overlay */}
            <AnnouncementsOverlay
                isOpen={showAnnouncements}
                onClose={() => setShowAnnouncements(false)}
            />
        </div>
        </>
    );
}
