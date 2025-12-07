import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";

export default function PrivacyPolicy() {
    return (
        <>
        <SEO 
          title="Privacy Policy | FYP Buddy - Your Data Protection"
          description="Read FYP Buddy's privacy policy to understand how we collect, use, and protect your personal information. Your privacy and data security are our top priorities."
          keywords="privacy policy, data protection, user privacy, FYP Buddy security, personal information, GDPR compliance"
        />
        <div className="min-h-screen py-16 mt-8">
            <section className="px-6 md:px-16 lg:px-24">
                {/* Hero Section */}
                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
                        Privacy <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Policy</span>
                    </h1>
                    <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
                        Your privacy is important to us. This policy outlines how FYP Buddy collects, uses, and protects your personal information.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Main Content Card */}
                <Card className="rounded-[2rem] bg-white dark:bg-gray-800 shadow-lg border-none transition-colors duration-300">
                    <CardContent className="p-8 md:p-12 space-y-8">

                        {/* Information We Collect */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-purple-500 dark:border-gray-100">
                                Information We Collect
                            </h2>
                            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Personal Information</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Name and email address</li>
                                        <li>Student/Supervisor ID</li>
                                        <li>University affiliation</li>
                                        <li>Profile information</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Project Data</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>FYP project details</li>
                                        <li>Task and milestone information</li>
                                        <li>Communication logs</li>
                                        <li>Uploaded documents</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Academic Records</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Grades and evaluations</li>
                                        <li>Feedback and comments</li>
                                        <li>Progress reports</li>
                                        <li>Submission history</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* How We Use Your Information */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-purple-500 dark:border-gray-100">
                                How We Use Your Information
                            </h2>
                            <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100 font-bold mt-0.5">•</span>
                                    <span><strong>Platform Functionality:</strong> To provide and maintain FYP Buddy services, including project management, task tracking, and communication features.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100 font-bold mt-0.5">•</span>
                                    <span><strong>User Authentication:</strong> To verify your identity and manage your account securely.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100 font-bold mt-0.5">•</span>
                                    <span><strong>Communication:</strong> To send notifications, updates, and important information about your projects and platform changes.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100 font-bold mt-0.5">•</span>
                                    <span><strong>Analytics:</strong> To analyze usage patterns and improve our platform's performance and user experience.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100 font-bold mt-0.5">•</span>
                                    <span><strong>Academic Support:</strong> To facilitate collaboration between students, supervisors, and coordinators.</span>
                                </li>
                            </ul>
                        </section>

                        {/* Data Protection */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-purple-500 dark:border-gray-100">
                                Data Protection
                            </h2>
                            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Secure Storage</h3>
                                    <p>All data is encrypted and stored on secure servers with regular backups.</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Access Control</h3>
                                    <p>Role-based access ensures only authorized users can view your information.</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Privacy First</h3>
                                    <p>We never sell your data to third parties or use it for advertising.</p>
                                </div>
                            </div>
                        </section>

                        {/* Your Rights */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-purple-500 dark:border-gray-100">
                                Your Rights
                            </h2>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">You have the right to:</p>
                            <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100">•</span>
                                    <span><strong>Access Your Data:</strong> Request a copy of all personal information we hold about you.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100">•</span>
                                    <span><strong>Correct Information:</strong> Update or correct any inaccurate personal information.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100">•</span>
                                    <span><strong>Delete Your Account:</strong> Request deletion of your account and associated data.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100">•</span>
                                    <span><strong>Data Portability:</strong> Export your data in a commonly used format.</span>
                                </li>
                            </ul>
                        </section>

                        {/* Data Sharing */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-purple-500 dark:border-gray-100">
                                Data Sharing
                            </h2>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                We do not sell or rent your personal information. We may share your data only in the following circumstances:
                            </p>
                            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100">•</span>
                                    <span>With your supervisor and coordinator as part of the FYP management process</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100">•</span>
                                    <span>With your educational institution for academic purposes</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100">•</span>
                                    <span>When required by law or to protect our legal rights</span>
                                </li>
                            </ul>
                        </section>

                        {/* Contact */}
                        <section className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                                Questions About Your Privacy?
                            </h2>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                                If you have any questions or concerns about our privacy practices, please contact {" "}
                                <a href="mailto:no.reply.fypbuddy@gmail.com" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Support
                                </a>
                            </p>
                        </section>

                    </CardContent>
                </Card>
            </section>
        </div>
        </>
    );
}
