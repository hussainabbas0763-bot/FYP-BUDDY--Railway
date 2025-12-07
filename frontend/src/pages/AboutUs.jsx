import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, TrendingUp } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import about from "@/assets/about.png";
import hussain from "@/assets/Hussain.jpg";
import Rafay from "@/assets/Rafay.png";
import sahab from "@/assets/user.jpg";
import SEO from "@/components/SEO";

export default function AboutUs() {
    return (
        <>
        <SEO 
          title="About Us | FYP Buddy - Your Project Management Solution"
          description="Learn about FYP Buddy, an intelligent collaborative platform designed to simplify the Final Year Project journey for students, supervisors, and coordinators. Discover our mission and team."
          keywords="about FYP Buddy, project management platform, academic collaboration, FYP solution, student project management, thesis platform"
        />
        <div className="min-h-screen space-y-20 py-16">

            {/* Hero Section */}
            <section className="flex flex-col-reverse md:flex-row items-center justify-between px-6 md:px-16 lg:px-24 gap-12">
                <div className="text-center md:text-left space-y-6 md:w-1/2">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-gray-100">
                        About <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">FYP Buddy</span>
                    </h1>
                    <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                        FYP Buddy is an intelligent, collaborative platform designed to
                        simplify and streamline the Final Year Project journey for students,
                        supervisors, and coordinators.
                    </p>
                </div>
                <div className="md:w-1/2 flex justify-center">
                    <img
                        src={about}
                        alt="Collaboration"
                        className="rounded-3xl w-[85%] object-cover"
                    />
                </div>
            </section>

            {/* Mission & Vision Section */}
            <section className="px-6 md:px-16 lg:px-24">
                <Card className="rounded-[2rem] bg-[rgba(217,184,124,0.285)] dark:bg-gray-700 shadow-lg border-none transition-colors duration-300">
                    <CardHeader>
                        <CardTitle className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-gray-100">
                            Our <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Mission</span> &{" "}
                            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Vision</span>
                        </CardTitle>
                        <hr className="w-32 h-[3px] mx-auto mt-3 rounded border-0 bg-purple-500  dark:bg-gray-100" />
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-10 items-center">
                        <div className="space-y-5 text-left">
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                Empowering Academic Excellence
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                FYP Buddy’s mission is to empower students and supervisors
                                through a unified, technology-driven platform. Our vision is to
                                revolutionize how final year projects are managed — making the
                                entire process efficient, transparent, and engaging.
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <div className="bg-[#fff9c4] dark:bg-gray-600 p-4 rounded-full shadow-inner w-[260px] h-[260px] flex items-center justify-center">
                                <img
                                    src={logo}
                                    alt="Mission and Vision"
                                    className="rounded-full w-[240px] h-[240px] object-cover shadow-lg"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Founders Section */}
            <section className="px-6 md:px-16 lg:px-24">
                <Card className="rounded-[2rem] bg-[#fde2e4] dark:bg-gray-700 shadow-lg border-none py-12 transition-colors duration-300">
                    <CardHeader>
                        <CardTitle className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-gray-100">
                            Meet the <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Founders</span>
                        </CardTitle>
                        <hr className="w-32 h-[3px] mx-auto mt-3 rounded border-0 bg-purple-500  dark:bg-gray-100" />
                    </CardHeader>
                    <CardContent className="flex flex-wrap justify-center gap-12">
                        {[
                            { name: "Hussain Abbas", role: "Lead Developer", image: hussain },
                            { name: "Muhammad Rafay Naeem", role: "Full stack Developer", image: Rafay },
                            { name: "Sahab Kashaf", role: "AI/ML Engineer", image: sahab },
                        ].map((member, i) => (
                            <div
                                key={i}
                                className="bg-[#fff7ed] dark:bg-gray-800 p-6 rounded-3xl shadow-md w-64 hover:shadow-xl transition-colors duration-300"
                            >
                                <div className="w-32 h-32 rounded-full overflow-hidden mx-auto shadow-lg border-4 border-purple-300 dark:border-gray-400">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className="mt-4 font-bold text-lg text-center text-gray-900 dark:text-gray-100">{member.name}</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-center">{member.role}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            {/* Why Choose FYP Buddy */}
            <section className="px-6 md:px-16 lg:px-24">
                <Card className="rounded-[2rem] bg-[#dceefc] dark:bg-gray-700 shadow-lg border-none transition-colors duration-300">
                    <CardHeader>
                        <CardTitle className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-gray-100">
                            Why <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Choose</span> FYP Buddy
                        </CardTitle>
                        <hr className="w-32 h-[3px] mx-auto mt-3 rounded border-0 bg-purple-500  dark:bg-gray-100" />
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
                        <div className="p-10 bg-white dark:bg-gray-800 rounded-3xl shadow-md transition-colors duration-300">
                            <BookOpen className="w-10 h-10 mx-auto mb-4 text-purple-600 dark:text-gray-100" />
                            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                                Structured Workflow
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Organized FYP processes with smart tracking and automation.
                            </p>
                        </div>
                        <div className="p-10 bg-white dark:bg-gray-800 rounded-3xl shadow-md transition-colors duration-300">
                            <Users className="w-10 h-10 mx-auto mb-4 text-purple-600 dark:text-gray-100" />
                            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                                Collaborative Platform
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Communication made seamless between students and supervisors.
                            </p>
                        </div>
                        <div className="p-10 bg-white dark:bg-gray-800 rounded-3xl shadow-md transition-colors duration-300">
                            <TrendingUp className="w-10 h-10 mx-auto mb-4 text-purple-600 dark:text-gray-100" />
                            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                                Scalable & Modern
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                MERN-based architecture ensures flexibility and scalability.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </section>

        </div>
        </>
    );
}
