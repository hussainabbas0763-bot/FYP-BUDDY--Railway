import React, { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Avatar, AvatarImage } from "./ui/avatar";
import { useSelector } from "react-redux";
import LoginPage from "./Login";
import Logout from "./Logout";
import userimg from "../assets/user.jpg";
import {
  Award,
  LayoutDashboard,
  FolderOpen,
  User,
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

const ResponsiveMenu = ({ openNav, setOpenNav }) => {
  const { user } = useSelector((store) => store.auth);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [animateItems, setAnimateItems] = useState(false);

  // ✅ Handle scroll lock properly
  useEffect(() => {
    if (openNav) {
      document.body.classList.add("overflow-hidden");
      const timer = setTimeout(() => setAnimateItems(true), 100);
      return () => {
        clearTimeout(timer);
        document.body.classList.remove("overflow-hidden");
      };
    } else {
      document.body.classList.remove("overflow-hidden");
      setAnimateItems(false);
    }
  }, [openNav]);

  const handleLinkClick = () => {
    setOpenNav(false);
    document.body.classList.remove("overflow-hidden");
  };

  const handleLogout = () => {
    setShowLogout(true);
  };

  // Role-based sidebar navigation items
  const roleMenus = {
    student: [
      { label: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
      { label: "My FYP Group", path: "/student/fyp-group", icon: FolderOpen },
      { label: "AI Chatbot", path: "/student/chatbot", icon: Bot },
      { label: "Team Chat", path: "/student/team-chat", icon: MessageCircle },
      { label: "Assigned Tasks", path: "/student/assigned-tasks", icon: FaTasks },
      { label: "Milestones", path: "/student/milestones", icon: Briefcase },
      { label: "My Grades", path: "/student/my-grades", icon: Award },
      { label: "Thesis Section", path: "/student/thesis", icon: BookOpen },
      { label: "Profile", path: "/student/profile", icon: User },
    ],
    supervisor: [
      { label: "Dashboard", path: "/supervisor/dashboard", icon: LayoutDashboard },
      { label: "My Groups", path: "/supervisor/my-groups", icon: Users },
      { label: "Group Chats", path: "/supervisor/team-chat", icon: MessageCircle },
      { label: "Manage Tasks", path: "/supervisor/manage-tasks", icon: FaTasks },
      { label: "Grading", path: "/supervisor/grading", icon: GraduationCap },
      { label: "Profile", path: "/supervisor/profile", icon: User },
    ],
    coordinator: [
      { label: "Dashboard", path: "/coordinator/dashboard", icon: LayoutDashboard },
      { label: "Milestones", path: "/coordinator/milestones", icon: ClipboardCheck },
      { label: "Submitted Files", path: "/coordinator/documents", icon: FileText },
      { label: "Grading", path: "/coordinator/grading", icon: GraduationCap },
      { label: "Sample Documents", path: "/coordinator/sample-documents", icon: BookOpen },
      { label: "Announcements", path: "/coordinator/announcements", icon: Megaphone },
      { label: "Profile", path: "/coordinator/profile", icon: User },
    ],
    admin: [
      { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
      { label: "User Management", path: "/admin/users", icon: Settings },
      { label: "Profile", path: "/admin/profile", icon: UserCog },
    ],
  };

  // Static menu for guests (not logged in)
  const guestMenuItems = [
    { to: "/", label: "Home", icon: LayoutDashboard },
    { to: "/about-us", label: "About", icon: User },
    { to: "/contact-us", label: "Contact", icon: MessageCircle },
  ];

  // Get menu items based on user role
  const menuItems = user ? roleMenus[user.role] || [] : guestMenuItems;

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out md:hidden ${
          openNav ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setOpenNav(false)}
      />

      {/* Sliding Menu */}
      <div
        className={`fixed top-0 left-0 z-50 h-screen w-[75%] max-w-[300px] bg-white dark:bg-gray-800 
        shadow-2xl transform transition-all duration-300 ease-out md:hidden rounded-r-2xl
        ${openNav ? "translate-x-0 opacity-100" : "-translate-x-full opacity-90"}`}
      >
        <div className="flex flex-col h-full justify-between pb-8">
          {/* Header */}
          <div
            className={`p-6 border-b border-gray-200 dark:border-gray-700 transition-all duration-500 ease-out ${
              animateItems ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
            }`}
          >
            <div className="flex items-center gap-3">
              {user ? (
                <Avatar className="w-14 h-14 ring-2 ring-purple-500 dark:ring-gray-100 transition-all duration-300">
                  <AvatarImage src={user.profilePic || userimg} />
                </Avatar>
              ) : (
                <FaUserCircle size={56} className="text-gray-400" />
              )}
              <div>
                <h1 className="font-semibold text-lg">
                  Hello,{" "}
                  <span className="text-purple-500 dark:text-gray-100">
                    {user?.username?.split(" ")[0] || "User"}
                  </span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role || "Guest"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 overflow-y-auto">
            <ul className="flex flex-col gap-3 text-base font-semibold">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                const itemPath = user ? item.path : item.to;
                
                return (
                  <li
                    key={itemPath}
                    className={`transform transition-all duration-700 ease-out hover:translate-x-2 ${
                      animateItems
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-8 opacity-0"
                    }`}
                    style={{
                      transitionDelay: animateItems ? `${index * 80 + 100}ms` : "0ms",
                    }}
                  >
                    <Link
                      to={itemPath}
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md"
                    >
                      <IconComponent className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}

              <li
                className={`mt-6 transform transition-all duration-700 ease-out ${
                  animateItems
                    ? "translate-x-0 opacity-100 scale-100"
                    : "-translate-x-8 opacity-0 scale-95"
                }`}
                style={{
                  transitionDelay: animateItems
                    ? `${menuItems.length * 80 + 200}ms`
                    : "0ms",
                }}
              >
                {user ? (
                  <Button
                    onClick={handleLogout}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                  >
                    Logout
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => setIsLoginOpen(true)}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                    >
                      Login
                    </Button>
                    <LoginPage open={isLoginOpen} setOpen={setIsLoginOpen} />
                  </>
                )}
              </li>
            </ul>
          </nav>

          {/* Footer */}
          <div
            className={`p-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400 transition-all duration-700 ease-out ${
              animateItems ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{
              transitionDelay: animateItems
                ? `${menuItems.length * 150 + 300}ms`
                : "0ms",
            }}
          >
            © {new Date().getFullYear()} <span className="text-purple-500 dark:text-gray-100 font-medium">FYP Buddy</span>. All rights reserved.
          </div>
        </div>
      </div>

      {/* Logout Dialog */}
      <Logout open={showLogout} onClose={() => setShowLogout(false)} />
    </>
  );
};

export default ResponsiveMenu;
