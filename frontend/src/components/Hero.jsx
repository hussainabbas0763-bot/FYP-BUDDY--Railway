import React, { useState } from "react";
import heroImg from "../assets/hero.png";
import LoginPage from "./Login";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  Users, 
  TrendingUp,
  Zap,
  Target,
  Shield,
  Play,
  Award,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();



  const goToHandler = () => {
    if (user.role === "student") {
      navigate("/student/dashboard");
    } else if (user.role === "supervisor") {
      navigate("/supervisor/dashboard");
    } else if (user.role === "coordinator") {
      navigate("/coordinator/dashboard");
    } else if (user.role === "admin") {
      navigate("/admin/dashboard");
    }
  };

  return (
    <section className="relative w-full min-h-screen flex items-center overflow-hidden mt-8">  
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-5 text-center lg:text-left">
              {/* Main Heading */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                  <span className="block text-gray-900 dark:text-white">
                    Your FYP Journey
                  </span>
                  <span className="block mt-1">
                    <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Simplified
                    </span>
                  </span>
                </h1>
                
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  The all-in-one platform for final year projects. From intelligent supervisor matching to seamless collaboration and milestone tracking.
                </p>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {[
                  { icon: Zap, text: "AI Ideas" },
                  { icon: Users, text: "Team Collaboration" },
                  { icon: TrendingUp, text: "Progress Tracking" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <item.icon className="w-3.5 h-3.5 text-purple-600 dark:text-gray-400" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                {user ? (
                  <Button
                    onClick={goToHandler}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg px-6 py-2 rounded-lg text-sm font-semibold"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsLoginOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg px-6 py-2 rounded-lg text-sm font-semibold"
                  >
                    Start Your Project
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  className="border-2 border-gray-300 dark:border-gray-600 hover:border-purple-600 dark:hover:border-gray-100 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-800 px-6 py-2 rounded-lg text-sm font-semibold"
                >
                  Learn more
                </Button>
              </div>

              {/* Social Proof Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                {[
                  { icon: Users, number: "1,000+", label: "Students" },
                  { icon: Award, number: "500+", label: "Projects" },
                  { icon: CheckCircle2, number: "98%", label: "Success" }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center lg:text-left">
                    <div className="inline-flex items-center gap-1.5 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                        <stat.icon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{stat.number}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative lg:mt-0 mt-8 flex flex-col items-center">
              {/* Main Dashboard Preview */}
              <div className="relative w-full max-w-md">
                {/* Image Container */}
                <div className="relative rounded-xl  overflow-hidden">
                  <img
                    src={heroImg}
                    alt="FYP Management Platform Dashboard"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>

              {/* Bottom Feature Highlights */}
              <div className="grid grid-cols-2 gap-3 mt-4 w-full max-w-md">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 p-3">
                  <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-1.5" />
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">Secure & Private</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Secure and Safe Portals</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 p-3">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-1.5" />
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">Real-time Sync</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Instant collaboration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginPage open={isLoginOpen} setOpen={setIsLoginOpen} />
    </section>
  );
}