import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import Logout from "./Logout";
import {
  Award,
  LayoutDashboard,
  FolderOpen,
  User,
  LogOut,
  Users,
  ClipboardCheck,
  Briefcase,
  GraduationCap,
  Settings,
  UserCog,
  Bot,
  MessageCircle,
  FileText,
  BookOpen,
  Megaphone,
} from "lucide-react";
import { FaTasks } from "react-icons/fa";

const Sidebar = ({ portalType }) => {
  const [showLogout, setShowLogout] = useState(false);

  const linksData = {
    student: [
      { label: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
      { label: "My FYP Group", path: "/student/fyp-group", icon: FolderOpen, },
      { label: "AI Chatbot", path: "/student/chatbot", icon: Bot },
      { label: "Team Chat", path: "/student/team-chat", icon: MessageCircle },
      { label: "Assigned Tasks", path: "/student/assigned-tasks", icon: FaTasks },
      { label: "Milestones", path: "/student/milestones", icon: Briefcase },
      { label: "My Grades", path: "/student/my-grades", icon: Award },
      { label: "Thesis Section", path: "/student/thesis", icon: BookOpen },
      { label: "Profile", path: "/student/profile", icon: User },
      { label: "Logout", action: "logout", icon: LogOut },
    ],
    supervisor: [
      { label: "Dashboard", path: "/supervisor/dashboard", icon: LayoutDashboard },
      { label: "My Groups", path: "/supervisor/my-groups", icon: Users },
      { label: "Group Chats", path: "/supervisor/team-chat", icon: MessageCircle },
      { label: "Manage Tasks", path: "/supervisor/manage-tasks", icon: FaTasks },
      { label: "Grading", path: "/supervisor/grading", icon: GraduationCap },
      { label: "Profile", path: "/supervisor/profile", icon: User },
      { label: "Logout", action: "logout", icon: LogOut },
    ],
    coordinator: [
      { label: "Dashboard", path: "/coordinator/dashboard", icon: LayoutDashboard },
      { label: "Milestones", path: "/coordinator/milestones", icon: ClipboardCheck },
      { label: "Submitted Files", path: "/coordinator/documents", icon: FileText },
      { label: "Grading", path: "/coordinator/grading", icon: GraduationCap },
      { label: "Sample Documents", path: "/coordinator/sample-documents", icon: BookOpen },
      { label: "Announcements", path: "/coordinator/announcements", icon: Megaphone },
      { label: "Profile", path: "/coordinator/profile", icon: User },
      { label: "Logout", action: "logout", icon: LogOut },
    ],
    admin: [
      { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
      { label: "User Management", path: "/admin/users", icon: Settings },
      { label: "Profile", path: "/admin/profile", icon: UserCog },
      { label: "Logout", action: "logout", icon: LogOut },
    ],
  };

  const links = linksData[portalType] || linksData.student;

  const portalTitle =
    {
      student: "Student Portal",
      supervisor: "Supervisor Portal",
      coordinator: "Coordinator Portal",
      admin: "Admin Portal",
    }[portalType] || "Portal";

  return (
    <>
      <aside
        className="hidden md:flex md:flex-col md:p-5
        bg-gradient-to-b from-purple-600 to-purple-700 text-white dark:from-gray-800 dark:to-gray-900 dark:text-gray-200 
        rounded-xl shadow-lg transition-colors duration-300
        sticky top-20 h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]
        flex-shrink-0 w-64 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/20 dark:border-gray-700">
          <div className="w-10 h-10 rounded-lg bg-white/20 dark:bg-gray-700 flex items-center justify-center text-xl">
            🎓
          </div>
          <span className="font-bold text-lg tracking-tight">{portalTitle}</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden pr-1">
          {links.map((link) => {
            const IconComponent = link.icon;
            return link.action === "logout" ? (
              <button
                key={link.label}
                onClick={() => setShowLogout(true)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-left transition-all duration-200
                  text-white hover:bg-white/20 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white
                  hover:translate-x-1 active:scale-95"
              >
                <IconComponent className="w-5 h-5 flex-shrink-0" />
                <span>{link.label}</span>
              </button>
            ) : (
              <NavLink
                key={link.label}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200
                  ${isActive
                    ? "bg-white/30 text-white shadow-md dark:bg-gray-700 dark:text-gray-100 translate-x-1"
                    : "text-white hover:bg-white/20 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white hover:translate-x-1 active:scale-95"
                  }`
                }
              >
                <IconComponent className="w-5 h-5 flex-shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer decoration */}
        <div className="mt-auto pt-4 border-t border-white/20 dark:border-gray-700">
          <p className="text-xs text-white/70 dark:text-gray-400 text-center">
            FYP Buddy
          </p>
        </div>
      </aside>

      {/* Show Logout Dialog when clicked */}
      <Logout open={showLogout} onClose={() => setShowLogout(false)} />
    </>
  );
};

export default Sidebar;
