import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  MessageSquare, 
  Calendar, 
  Shield, 
  BookOpen, 
  BarChart3 
} from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: Sparkles,
      title: "Smart Suggestions",
      text: "AI Idea Suggestions to save your time and confusion.",
      gradient: "from-purple-500 to-indigo-500",
    },
    {
      icon: MessageSquare,
      title: "Seamless Communication",
      text: "Chat with supervisors and manage approvals easily.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Calendar,
      title: "Track Progress",
      text: "Visual timeline, deadlines, and team status at a glance.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Shield,
      title: "Secure Submissions",
      text: "Upload reports, presentations, and documents securely.",
      gradient: "from-orange-500 to-amber-500",
    },
    {
      icon: BookOpen,
      title: "Project Repository",
      text: "Access previous projects and inspirations anytime.",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      text: "Track and analyze project performance efficiently.",
      gradient: "from-teal-500 to-blue-500",
    },
  ];

  return (
    <section id="features" className="py-16 px-4 sm:px-6 bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative">
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Powerful features designed to streamline your final year project journey from start to finish
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="border border-gray-200 dark:border-gray-800 hover:border-purple-400 dark:hover:border-gray-600 transition-colors duration-300 hover:shadow-lg bg-white dark:bg-gray-900"
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-3 shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.text}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}