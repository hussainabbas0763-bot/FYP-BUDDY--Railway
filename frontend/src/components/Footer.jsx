import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Linkedin, Instagram, Facebook, ArrowUp, Mail, Phone } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-300 overflow-hidden border-t border-gray-800">

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1 flex flex-col space-y-4">
            <div className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-purple-500/30 dark:ring-cyan-500/30 group-hover:ring-purple-500/60 dark:group-hover:ring-cyan-500/60 transition-all duration-500 group-hover:scale-105 shadow-lg group-hover:shadow-purple-500/50 dark:group-hover:shadow-cyan-500/50">
                <img
                  src={logo}
                  alt="FYP Buddy Logo"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-cyan-500/0 group-hover:from-purple-500/10 group-hover:to-cyan-500/10 transition-all duration-500"></div>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:via-blue-300 group-hover:to-cyan-300 transition-all duration-500">
                FYP Buddy
              </span>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Empowering students to plan, manage, and complete their Final Year
              Projects smarter and faster with cutting-edge technology.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4 pt-2">
              <a
                href="#"
                className="group relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800/50 hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50 border border-gray-700/50 hover:border-blue-500/50"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </a>
              <a
                href="#"
                className="group relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800/50 hover:bg-gradient-to-br hover:from-pink-500 hover:to-rose-600 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-500/50 border border-gray-700/50 hover:border-pink-500/50"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </a>
              <a
                href="#"
                className="group relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800/50 hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-600/50 border border-gray-700/50 hover:border-blue-600/50"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-white font-semibold text-lg mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Quick Links
            </h3>
            <nav className="flex flex-col space-y-3">
              {[
                { name: "Home", path: "/" },
                { name: "About Us", path: "/about-us" },
                { name: "Contact Us", path: "/contact-us" },
              ].map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className="group relative text-sm text-gray-400 hover:text-white transition-all duration-300 inline-flex items-center w-fit"
                >
                  <span className="relative z-10">{link.name}</span>
                  <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-full transition-all duration-300 rounded-full"></span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Legal Section */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-white font-semibold text-lg mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Legal
            </h3>
            <nav className="flex flex-col space-y-3">
              <NavLink
                to="/privacy-policy"
                className="group relative text-sm text-gray-400 hover:text-white transition-all duration-300 inline-flex items-center w-fit"
              >
                <span className="relative z-10">Privacy Policy</span>
                <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-full transition-all duration-300 rounded-full"></span>
              </NavLink>
              <NavLink
                to="/terms-and-conditions"
                className="group relative text-sm text-gray-400 hover:text-white transition-all duration-300 inline-flex items-center w-fit"
              >
                <span className="relative z-10">Terms & Conditions</span>
                <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-full transition-all duration-300 rounded-full"></span>
              </NavLink>
            </nav>
          </div>

          {/* Contact Section */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-white font-semibold text-lg mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Contact
            </h3>
            <div className="flex flex-col space-y-3">
              <div
                className="group flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-all duration-300"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800/50 group-hover:bg-gradient-to-br group-hover:from-purple-500/20 group-hover:to-cyan-500/20 border border-gray-700/50 group-hover:border-purple-500/50 transition-all duration-300">
                  <Mail className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <a href="mailto:support@fypbuddy.com" className="hover:underline">
                  support@fypbuddy.com
                </a>
              </div>
              <a
                href="tel:+1234567890"
                className="group flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-all duration-300"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800/50 group-hover:bg-gradient-to-br group-hover:from-purple-500/20 group-hover:to-cyan-500/20 border border-gray-700/50 group-hover:border-purple-500/50 transition-all duration-300">
                  <Phone className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span>+1 (234) 567-890</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-gray-800/50 bg-gray-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-center items-center">
          <p className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} FYP Buddy. All Rights Reserved.
          </p>
        </div>
      </div>


      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 border border-white/10 backdrop-blur-sm ${showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
  );
}
