import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import userImg from "@/assets/user.jpg";
import { User, BookOpen, FileText, CheckCircle2, XCircle, Megaphone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { setGroup } from "@/redux/groupSlice";
import { setMilestone } from "@/redux/milestoneSlice";
import AnnouncementsOverlay from "@/components/AnnouncementsOverlay";
import { DeletionNoticeCompact } from "@/components/DeletionNotice";
import SEO from "@/components/SEO";



export default function StudentDashboard() {
  const { user } = useSelector((store) => store.auth);
  const { group } = useSelector((store) => store.group)
  const { milestone } = useSelector((store) => store.milestone)
  const status = group?.supervisor ? "Accepted" : "Waiting"
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [groupTasks, setGroupTasks] = useState([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [hasDeletionLog, setHasDeletionLog] = useState(false);
  const pendingTasks = groupTasks.filter((t) => {
    const s = String(t.status || '').toLowerCase();
    return s === 'assigned' || s === 'rejected';
  });
  const nearestTask = (() => {
    if (!groupTasks || groupTasks.length === 0) return null;
    const withDue = groupTasks.filter((t) => t.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    return withDue[0] || null;
  })();


  const latestAssignedByDue = (() => {
    const assigned = groupTasks.filter((t) => String(t.status || '').toLowerCase() === 'assigned');
    if (!assigned.length) return null;
    // Prefer nearest upcoming due date; otherwise earliest overall
    const now = new Date();
    const upcoming = assigned.filter((t) => new Date(t.dueDate) >= now);
    const pool = (upcoming.length ? upcoming : assigned).filter((t) => t.dueDate);
    if (!pool.length) return null;
    pool.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    return pool[0];
  })();


  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");

  // Check and trigger auto-allocation if deadline reached
  useEffect(() => {
    const checkAutoAllocation = async () => {
      if (!group?._id || group?.supervisor || !milestone?.autoAllocationDate) return;

      const now = new Date();
      const allocationDate = new Date(milestone.autoAllocationDate);

      // If deadline has passed and group has no supervisor, trigger auto-allocation
      if (now >= allocationDate) {
        try {
          const res = await axios.post(
            `${apiURL}/supervisor/auto-allocate`,
            { groupId: group._id },
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              withCredentials: true,
            }
          );

          if (res.data.success) {
            toast.success("Supervisor auto-allocated successfully!");
            // Refresh group data
            const groupRes = await axios.get(`${apiURL}/group/my-group`, {
              headers: { Authorization: `Bearer ${accessToken}` },
              withCredentials: true,
            });
            if (groupRes.data.success) {
              dispatch(setGroup(groupRes.data.group));
            }
          }
        } catch (error) {
          console.error("Auto-allocation error:", error);
          // Don't show error toast to avoid spamming user
        }
      }
    };

    checkAutoAllocation();
  }, [group?._id, group?.supervisor, milestone?.autoAllocationDate, apiURL, accessToken]);

  useEffect(() => {
    // Check for deletion log
    const checkDeletionLog = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${apiURL}/deletion/group/${group?._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.data.success) {
          setHasDeletionLog(true);
        }
      } catch (error) {
        setHasDeletionLog(false);
      }
    };

    // get supervisor tasks
    const fetchTasks = async () => {
      if (!group?._id) {
        setGroupTasks([]);
        return;
      }
      try {
        const res = await axios.get(`${apiURL}/task/get-tasks/${group._id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setGroupTasks(res.data?.tasks || []);
      } catch (e) {
        setGroupTasks([]);
      }
    };
    // get group data
    const fetchGroup = async () => {
      try {
        const res = await axios.get(`${apiURL}/group/my-group`,
          {
            headers:
            {
              Authorization: `Bearer ${accessToken}`
            }, withCredentials: true, validateStatus: () => true,
          }
        );
        if (res.data.success) {
          dispatch(setGroup(res.data.group))
        }
      } catch (error) {
        toast.error("Create a Group or Join a Group to get started");

      }
    }
    // get milestone data
    const fetchGroupMilestone = async () => {
      if (!group?._id) {
        dispatch(setMilestone(null))
        return;
      }
      try {
        const groupId = group._id
        const res = await axios.get(`${apiURL}/milestone/get-my-milestone/${groupId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        });

        if (res.data.success) {
          dispatch(setMilestone(res.data.milestone))
        }

      } catch (error) {
        toast.error("Failed to load milestones");
      }
    };

    checkDeletionLog();
    fetchTasks();
    fetchGroup();
    fetchGroupMilestone();
  }, [group?._id, apiURL, accessToken]);

  return (
    <>
    <SEO 
      title="Student Dashboard | FYP Buddy - Manage Your Project"
      description="Access your student dashboard on FYP Buddy. View your FYP group, track tasks, check milestones, communicate with supervisors, and manage your final year project efficiently."
      keywords="student dashboard, FYP management, project tasks, thesis tracking, student portal, group collaboration"
    />
    <div className="min-h-screen mt-15">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        {/* Sidebar */}
        <Sidebar portalType="student" />

        {/* Content Wrapper (Main + Right) */}
        <div className="flex flex-col xl:flex-row flex-1 gap-5 overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 flex flex-col gap-5 overflow-y-auto">
            {/* Header */}
            <Card className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 p-8 bg-white dark:bg-gray-800 shadow-lg rounded-2xl transition-all duration-300">
              {/* Left Section */}
              <div className="flex flex-col text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">
                  <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Student</span>{" "}
                  Dashboard
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Welcome back,{" "}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {user?.username || "Student"}
                  </span>{" "}
                  👋
                </p>
              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-gray-300 dark:border-gray-600 shadow-md">
                  <AvatarImage src={user?.profilePic || userImg} />
                </Avatar>
                <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-300">
                  {user?.username || "Unknown User"}
                </h3>
              </div>
            </Card>


            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                {
                  title: "Supervisor Status",
                  status: status,
                  color: "green",
                  icon: User,
                  link: "/student/dashboard/supervisors",
                },
                {
                  title: "Pending Tasks",
                  status: String(pendingTasks.length),
                  color: "yellow",
                  icon: FileText,
                  link: null,
                },
                {
                  title: "Current Milestone",
                  status: milestone?.phase || "N/A",
                  color: "blue",
                  icon: BookOpen,
                  link: null,
                },
              ].map(({ title, status, color, icon: Icon, link }, i) => (
                <Link
                  key={i}
                  to={link ?? "#"}
                  onClick={(e) => {
                    // 👇 Block only Supervisor card if no group
                    if (title === "Supervisor Status" && !group) {
                      e.preventDefault();
                      toast.error("Please create or join a group first");
                    } else if (title === "Supervisor Status" && group?.supervisor) {
                      e.preventDefault();
                      toast.success("A Supervsior already accepted your request")
                    }
                    if (title === "Pending Tasks") {
                      e.preventDefault();
                      navigate("/student/assigned-tasks");
                    }
                    if (title === "Current Milestone") {
                      e.preventDefault();
                      navigate("/student/milestones");
                    }
                  }}
                  className="cursor-pointer"
                >
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
                    <p
                      className={`text-lg font-bold ${color === "green"
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



            {/* Tasks Section */}
            <Card id="pending-tasks-section" className="p-6 bg-white dark:bg-gray-800 shadow-md rounded-2xl">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Pending <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Supervisor </span>Tasks
              </h2>
              <Card className="p-4 bg-purple-50 dark:bg-gray-700 border-none shadow-sm transition-all duration-300">

                <div className="grid sm:grid-cols-2 gap-4">
                  {(pendingTasks.length > 0 ? pendingTasks : []).slice(0, 6).map((t) => (
                    <Card
                      key={t._id}
                      className="flex justify-between items-center p-4 bg-purple-50 dark:bg-gray-700 border-none shadow-sm transition-all duration-300"
                    >
                      <>
                        <span className="text-sm text-gray-700 dark:text-gray-100">
                          Task: <strong>{t.title}</strong>
                        </span>
                        <Button
                          onClick={() => navigate("/student/assigned-tasks")}
                          className="bg-purple-600 dark:bg-gray-100 dark:text-gray-700 hover:bg-purple-700 dark:hover:bg-gray-300 cursor-pointer text-white text-sm px-4 py-1 rounded-md"
                        >
                          View
                        </Button>
                      </>
                    </Card>
                  ))}

                  {pendingTasks.length === 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                        No pending tasks
                      </p>
                    </div>
                  )}
                </div>
              </Card>


              <h2 className="text-lg font-semibold mt-8 mb-4 text-gray-900 dark:text-gray-100">
                Current <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Milestone</span>{" "} Submission
              </h2>

              <Card className="flex justify-between items-center p-4 bg-purple-50 dark:bg-gray-700 border-none shadow-sm transition-all duration-300">
                {milestone?.isSubmissionActive ? (
                  <>
                    <span className="text-sm text-gray-700 dark:text-gray-100">
                      Submission Open for the phase: <strong>{milestone?.phase || "N/A"}</strong>
                    </span>
                    <Button
                      onClick={() => navigate("/student/milestones")}
                      className="bg-purple-600 dark:bg-gray-100 dark:text-gray-700 hover:bg-purple-700 dark:hover:bg-gray-300 cursor-pointer text-white text-sm px-4 py-1 rounded-md"
                    >
                      View
                    </Button>
                  </>
                ) : (
                  <span className="text-sm text-gray-700 dark:text-gray-100">
                    No Active Submission for the phase: <strong>{milestone?.phase || "N/A"}</strong>
                  </span>
                )}
              </Card>

            </Card>
          </main>

          {/* Right Panel */}
          <aside className="w-full xl:w-96 flex-shrink-0 flex flex-col gap-6 bg-white dark:bg-gray-800 p-6 shadow-md rounded-2xl transition-colors duration-300">
            {/* Group Members */}
            <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-none shadow-sm rounded-xl">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 text-center">
                Group <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Members</span>
              </h3>
              {group?.members && group.members.length > 0 ? (
                <div className="flex justify-center flex-wrap gap-6">
                  {group.members.map((member, i) => (
                  <div key={member._id || i} className="flex flex-col items-center text-sm">
                    <Avatar className="w-14 h-14 mb-2 border border-gray-300 dark:border-gray-600">
                      <AvatarImage src={member.profilePic || userImg} />
                    </Avatar>
                    <span className="text-gray-700 dark:text-gray-300 text-center">
                      {member?.username?.split(" ").slice(0, 2).join(" ")}
                    </span>
                  </div>
                ))}
              </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Create/Join a Group
                  </p>
                  <Button
                    onClick={() => navigate("/student/groups")}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-md"
                  >
                    Create or Join Group
                  </Button>
                </div>
              )}
            </Card>

            {/* Coordinator Announcements */}
            <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-none shadow-sm rounded-xl">
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

            {/* Notices / Deletion Countdown */}
            <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-none shadow-sm">
              <h3 className="text-lg font-semibold mb-3 flex justify-between text-gray-900 dark:text-gray-100">
                {hasDeletionLog ? "FYP Completion Notice" : "Daily Notices"}
                {!hasDeletionLog && (
                  <a
                    href="#"
                    className="text-purple-600 dark:text-purple-400 text-sm hover:underline"
                  >
                    See all
                  </a>
                )}
              </h3>
              
              {hasDeletionLog ? (
                <DeletionNoticeCompact />
              ) : (
                <div className="space-y-0">
                <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  {latestAssignedByDue ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong className="text-purple-600 dark:text-purple-400">Reminder:</strong> Next deadline — <span className="font-semibold">{latestAssignedByDue.title}</span> due on {new Date(latestAssignedByDue.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong className="text-purple-600 dark:text-purple-400">Reminder:</strong> No assigned task deadlines yet.
                    </p>
                  )}
                </div>
                <div className="py-3 border-b border-gray-200 dark:border-gray-700">
                  {group?.supervisor ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong className="text-green-600 dark:text-green-400">Success:</strong> Supervisor has been allocated to your group.
                    </p>
                  ) : !group?.supervisor && milestone?.autoAllocationDate ? (
                    (() => {
                      const now = new Date();
                      const allocationDate = new Date(milestone.autoAllocationDate);
                      const daysLeft = Math.ceil((allocationDate - now) / (1000 * 60 * 60 * 24));

                      if (daysLeft > 0) {
                        return (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong className="text-orange-600 dark:text-orange-400">Alert:</strong> Auto Supervisor Allocation in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}.
                          </p>
                        );
                      } else {
                        return (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong className="text-orange-600 dark:text-orange-400">Alert:</strong> Auto Supervisor Allocation in progress...
                          </p>
                        );
                      }
                    })()
                  ) : !group?.supervisor && !milestone?.autoAllocationDate ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong className="text-orange-600 dark:text-orange-400">Alert:</strong> Auto Supervisor Allocation starting soon.
                    </p>
                  ) : null}
                </div>
                <div className="pt-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong className="text-blue-600 dark:text-blue-400">Tip:</strong> Chatbot available 24/7.
                  </p>
                </div>
              </div>
              )}
            </Card>

            {/* Supervisor's Tasks & Reviews */}
            <Card className="p-5 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 border-none shadow-md rounded-xl">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Updates from your Supervisor
              </h3>
              <div className="max-h-60 overflow-y-auto pr-1 custom-scroll space-y-3">
                {group && group.supervisor && groupTasks.length > 0 ? (
                  [...groupTasks]
                    .map((t) => ({
                      createdAt: t.createdAt,
                      reviewedAt: t.reviewedAt,
                      status: t.status,
                      title: t.title,
                    }))
                    .flatMap((t) => {
                      const entries = [];
                      if (t.createdAt) {
                        entries.push({
                          when: new Date(t.createdAt),
                          text: `${group.supervisor.username || "Supervisor"} has posted a task ${t.title}`,
                          type: "posted",
                        });
                      }
                      if ((t.status === "Accepted" || t.status === "Rejected") && t.reviewedAt) {
                        const verb = t.status === "Accepted" ? "accepted" : "rejected";
                        entries.push({
                          when: new Date(t.reviewedAt),
                          text: `${group.supervisor.username || "Supervisor"} has ${verb} your task submission for ${t.title}`,
                          type: t.status.toLowerCase(),
                        });
                      }
                      return entries;
                    })
                    .sort((a, b) => b.when - a.when)
                    .slice(0, 10)
                    .map((e, i) => (
                      <div key={i} className="text-sm text-gray-800 dark:text-gray-200 flex items-start gap-2">
                        {e.type === "accepted" && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                        )}
                        {e.type === "rejected" && (
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                        )}
                        {e.type === "posted" && (
                          <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                        )}
                        <div>
                          <p>{e.text}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{e.when.toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No updates yet</p>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </div >

      {/* Announcements Overlay */}
      <AnnouncementsOverlay
        isOpen={showAnnouncements}
        onClose={() => setShowAnnouncements(false)}
        currentPhase={milestone?.phase}
      />
    </div>
    </>
  );
}
