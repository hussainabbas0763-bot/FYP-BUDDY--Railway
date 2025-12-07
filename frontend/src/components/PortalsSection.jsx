import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  GraduationCap, 
  UserCog, 
  Shield, 
  Briefcase,
  ArrowRight 
} from "lucide-react";

export default function PortalsSection() {
  const portals = [
    {
      icon: GraduationCap,
      title: "Student Portal",
      text: "Find & submit projects, manage your progress, and collaborate with your team.",
      gradient: "from-purple-500 to-indigo-500",
    },
    {
      icon: UserCog,
      title: "Supervisor Portal",
      text: "Review student projects, guide teams, and provide valuable feedback.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Briefcase,
      title: "Coordinator Portal",
      text: "Manage topics, timelines, and monitor overall progress across departments.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Shield,
      title: "Admin Portal",
      text: "Oversee system settings, user roles, permissions, and platform management.",
      gradient: "from-orange-500 to-amber-500",
    },
  ];

  return (
    <section
      id="get-started"
      className="py-16 px-4 sm:px-6"
    >
      
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            Specialized{" "}
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Portals
            </span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Start managing your final year project today with our specialized portals
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {portals.map((portal, index) => {
            const Icon = portal.icon;
            return (
              <Card
                key={index}
                className="border border-gray-200 dark:border-gray-800 hover:border-purple-400 dark:hover:border-gray-600 transition-colors duration-300 hover:shadow-lg bg-white dark:bg-gray-900"
              >
                <CardHeader className="flex flex-col items-center text-center pb-3">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${portal.gradient} flex items-center justify-center mb-3 shadow-md`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    {portal.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {portal.text}
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