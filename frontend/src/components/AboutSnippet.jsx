import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Lightbulb, 
  Target, 
  Trophy,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function AboutSection() {
  const infoItems = [
    {
      icon: Users,
      number: "01",
      title: "Who We Are",
      text: "An AI-powered platform to support your FYP journey from start to finish.",
      gradient: "from-purple-500 to-indigo-500",
    },
    {
      icon: Lightbulb,
      number: "02",
      title: "What We Do",
      text: "We suggest smart project ideas, connect you with guides, and streamline submissions.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Target,
      number: "03",
      title: "How We Help",
      text: "With progress tracking, supervisor chat, and organized timelines — all in one place.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Trophy,
      number: "04",
      title: "Your Success Story",
      text: "FYP Buddy turns confusion into clarity and ideas into impactful projects.",
      gradient: "from-orange-500 to-amber-500",
    },
  ];

  return (
    <section
      id="about"
      className="py-16 px-4 sm:px-6 bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative"
    >
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Section */}
          <div className="flex flex-col">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight leading-tight">
              Say Goodbye to{" "}
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                FYP Stress
              </span>
            </h2>
            
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              We've got your back! FYP Buddy is your comprehensive solution for managing 
              final year projects with ease. From AI-powered matching to seamless collaboration, 
              we make your FYP journey smooth and successful.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                "AI-Powered Matching",
                "Real-time Collaboration",
                "Progress Tracking",
                "Secure Platform"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-gray-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            <NavLink to="/about-us">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg px-6 py-2 rounded-lg text-sm font-semibold">
                Learn More
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </NavLink>
          </div>

          {/* Right Section - Cards */}
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {infoItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={index}
                    className="border border-gray-200 dark:border-gray-800 hover:border-purple-400 dark:hover:border-gray-600 transition-colors duration-300 hover:shadow-lg bg-white dark:bg-gray-900"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${item.gradient} flex items-center justify-center shadow-md`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-200 dark:text-gray-700">
                          {item.number}
                        </span>
                      </div>
                      <CardTitle className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {item.text}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}