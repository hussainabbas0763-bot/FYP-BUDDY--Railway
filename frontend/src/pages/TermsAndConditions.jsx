import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";

export default function TermsAndConditions() {
    return (
        <>
        <SEO 
          title="Terms & Conditions | FYP Buddy - User Agreement"
          description="Review FYP Buddy's terms and conditions. Understand the rules, guidelines, and user agreement for using our Final Year Project management platform."
          keywords="terms and conditions, user agreement, FYP Buddy terms, platform rules, service agreement, legal terms"
        />
        <div className="min-h-screen py-16 mt-8">
            <section className="px-6 md:px-16 lg:px-24">
                {/* Hero Section */}
                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
                        Terms & <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Conditions</span>
                    </h1>
                    <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
                        Please read these terms and conditions carefully before using FYP Buddy platform.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Main Content Card */}
                <Card className="rounded-[2rem] bg-white dark:bg-gray-800 shadow-lg border-none transition-colors duration-300">
                    <CardContent className="p-8 md:p-12 space-y-8">

                        {/* Acceptance of Terms */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-purple-500 dark:border-gray-100">
                                Acceptance of Terms
                            </h2>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                By accessing and using FYP Buddy, you accept and agree to be bound by the terms and provision of this agreement.
                            </p>
                            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100">•</span>
                                    <span>You must be affiliated with an educational institution to use this platform.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100">•</span>
                                    <span>You agree to provide accurate and complete information during registration.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100">•</span>
                                    <span>You are responsible for maintaining the confidentiality of your account credentials.</span>
                                </li>
                            </ul>
                        </section>

                        {/* User Responsibilities */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-purple-500 dark:border-gray-100">
                                User Responsibilities
                            </h2>
                            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Content Guidelines</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Submit only original academic work</li>
                                        <li>Respect intellectual property rights</li>
                                        <li>Avoid plagiarism and academic dishonesty</li>
                                        <li>Use appropriate language and tone</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Account Security</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Keep your password secure</li>
                                        <li>Do not share account credentials</li>
                                        <li>Report suspicious activity immediately</li>
                                        <li>Log out from shared devices</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Prohibited Activities</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Harassment or bullying</li>
                                        <li>Unauthorized access attempts</li>
                                        <li>Spreading malware or viruses</li>
                                        <li>Impersonating others</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Fair Use</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Use platform for academic purposes only</li>
                                        <li>Respect system resources</li>
                                        <li>Follow university guidelines</li>
                                        <li>Cooperate with administrators</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Service Availability */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-purple-500 dark:border-gray-100">
                                Service Availability
                            </h2>
                            <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100 font-bold mt-0.5">•</span>
                                    <span><strong>Uptime:</strong> We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100 font-bold mt-0.5">•</span>
                                    <span><strong>Maintenance:</strong> Scheduled maintenance will be announced in advance when possible.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100 font-bold mt-0.5">•</span>
                                    <span><strong>Updates:</strong> We reserve the right to modify or discontinue features with notice.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100 font-bold mt-0.5">•</span>
                                    <span><strong>Support:</strong> Technical support is available during business hours.</span>
                                </li>
                            </ul>
                        </section>

                        {/* Intellectual Property */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-purple-500 dark:border-gray-100">
                                Intellectual Property
                            </h2>
                            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Platform Content</h3>
                                    <p>All content, features, and functionality of FYP Buddy are owned by us and protected by copyright, trademark, and other intellectual property laws.</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">User Content</h3>
                                    <p>You retain ownership of your academic work. By uploading content, you grant us a license to store, display, and process it solely for providing our services.</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Restrictions</h3>
                                    <p>You may not copy, modify, distribute, or reverse engineer any part of the platform without explicit permission.</p>
                                </div>
                            </div>
                        </section>

                        {/* Limitation of Liability */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-purple-500 dark:border-gray-100">
                                Limitation of Liability
                            </h2>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                FYP Buddy is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.
                            </p>
                            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100">•</span>
                                    <span>We are not responsible for data loss due to technical issues</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100">•</span>
                                    <span>Users should maintain backups of important work</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100">•</span>
                                    <span>We are not liable for academic outcomes or grades</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600 dark:text-gray-100">•</span>
                                    <span>Third-party integrations are used at your own risk</span>
                                </li>
                            </ul>
                        </section>

                        {/* Account Termination */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-purple-500 dark:border-gray-100">
                                Account Termination
                            </h2>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                We reserve the right to suspend or terminate your account if you violate these terms or engage in prohibited activities.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Grounds for Termination</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Violation of terms</li>
                                        <li>Academic misconduct</li>
                                        <li>Abusive behavior</li>
                                        <li>Security threats</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Your Rights</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Request account deletion</li>
                                        <li>Export your data</li>
                                        <li>Appeal termination decisions</li>
                                        <li>Receive notice when possible</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Changes to Terms */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-purple-500 dark:border-gray-100">
                                Changes to Terms
                            </h2>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                We reserve the right to modify these terms at any time. We will notify users of any significant changes via email or platform notifications. Continued use of the platform after changes constitutes acceptance of the new terms.
                            </p>
                        </section>

                        {/* Contact */}
                        <section className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                                Questions About These Terms?
                            </h2>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                                If you have any questions about our Terms and Conditions, please contact our {" "}
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
