import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { FaSun, FaMoon } from "react-icons/fa";
import { HiMenuAlt1, HiMenuAlt3 } from "react-icons/hi";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import logo from "../assets/logo.jpeg";
import userLogo from "../assets/user.jpg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  FolderOpen,
  Bot,
  MessageCircle,
  Briefcase,
  Award,
  BookOpen,
  User,
  LogOut,
  Users,
  GraduationCap,
  ClipboardCheck,
  FileText,
  UserCog,
  Settings,
} from "lucide-react";
import { FaTasks } from "react-icons/fa";
import ResponsiveMenu from "./ResponsiveMenu";
import LoginPage from "./Login";
import { toggleTheme } from "@/redux/themeSlice";
import { useDispatch, useSelector } from "react-redux";
import Logout from "./Logout";

export default function Navbar() {
  const { user } = useSelector((store) => store.auth);
  const { theme } = useSelector((store) => store.theme);
  const dispatch = useDispatch();
  const [openNav, setOpenNav] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const toggleNav = () => setOpenNav(!openNav);

  // Static menu for user dropdown (Home, About, Contact)
  const staticMenuItems = [
    { name: "Home", path: "/", icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { name: "About", path: "/about-us", icon: <User className="h-4 w-4 mr-2" /> },
    { name: "Contact", path: "/contact-us", icon: <MessageCircle className="h-4 w-4 mr-2" /> },
  ];


  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled
        ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-gray-800"
        : "bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
        }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 lg:px-8 py-3">
        {/* Left Side - Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-2 ring-purple-500/20 dark:ring-gray-600/40 group-hover:ring-purple-500/40 dark:group-hover:ring-gray-500/60 transition-all duration-300">
            <img
              src={logo}
              alt="Logo"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/10 dark:from-gray-500/0 dark:to-gray-500/10 group-hover:from-purple-500/10 group-hover:to-purple-500/20 dark:group-hover:from-gray-500/10 dark:group-hover:to-gray-500/20 transition-all duration-300"></div>
          </div>
          <span className="font-bold text-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent transition-all duration-300">
            FYP Buddy
          </span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-6">
          {/* Desktop Navigation */}
          <div>
            <ul className="hidden md:flex items-center gap-1">
              {[
                { name: "Home", path: "/" },
                { name: "About", path: "/about-us" },
                { name: "Contact", path: "/contact-us" },
              ].map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className="relative px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 font-medium text-bold transition-all duration-300 hover:text-purple-600 dark:hover:text-gray-200 group"
                >
                  {({ isActive }) => (
                    <>
                      {/* Text */}
                      <span className="relative z-10">{link.name}</span>

                      {/* Active Background */}
                      {isActive && (
                        <span className="absolute inset-0 bg-purple-200 dark:bg-gray-700/40 rounded-lg"></span>
                      )}

                      {/* Hover Underline (Only on Hover, Not Active) */}
                      {!isActive && (
                        <span
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-gradient-to-r from-purple-500 to-purple-700 dark:from-gray-400 dark:to-gray-500 transition-all duration-300 group-hover:w-8"
                        ></span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </ul>
          </div>


          {/* Right Buttons (Theme + Auth) */}
          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative group cursor-pointer">
                    <Avatar className="w-10 h-10 ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-purple-500 dark:group-hover:ring-gray-500 transition-all duration-300">
                      <AvatarImage src={user.profilePic || userLogo} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white font-semibold">
                        {user.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 group-hover:scale-110 transition-transform duration-300"></div>
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
                  <DropdownMenuLabel className="text-gray-900 dark:text-gray-100 font-semibold">
                    Menu
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />

                  {/* Static menu items (Home, About, Contact) */}
                  {staticMenuItems.map((item) => (
                    <DropdownMenuItem
                      key={item.name}
                      onClick={() => navigate(item.path)}
                      className="cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700/60 hover:text-purple-600 dark:hover:text-gray-100 transition-colors duration-200"
                    >
                      {item.icon} {item.name}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                  <DropdownMenuItem
                    onClick={() => setShowLogout(true)}
                    className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex gap-2">
                <Button
                  onClick={() => setIsLoginOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg px-6 py-2 rounded-lg text-sm font-semibold"
                >
                  Login
                </Button>
                <LoginPage open={isLoginOpen} setOpen={setIsLoginOpen} />
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 hover:scale-105"
            >
              {theme === "light" ? <FaMoon size={18} /> : <FaSun size={18} />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleNav}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
            >
              {openNav ? <HiMenuAlt3 size={24} /> : <HiMenuAlt1 size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {openNav && (
        <div className="md:hidden inset-0 z-40">
          <ResponsiveMenu openNav={openNav} setOpenNav={setOpenNav} />
        </div>
      )}

      {/* Logout Dialog */}
      <Logout open={showLogout} onClose={() => setShowLogout(false)} />
    </nav>
  );
}