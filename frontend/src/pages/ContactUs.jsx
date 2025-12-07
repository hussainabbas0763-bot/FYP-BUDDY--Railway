import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin } from "lucide-react";
import SEO from "@/components/SEO";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = () => {
    const { name, email, subject, message } = formData;

    const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=no.reply.fypbuddy@gmail.com&su=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    )}`;

    window.open(gmailLink, "_blank");
  };


  return (
    <>
    <SEO 
      title="Contact Us | FYP Buddy - Get in Touch"
      description="Have questions about FYP Buddy? Contact our team for support, inquiries, or feedback. We're here to help you with your Final Year Project management needs."
      keywords="contact FYP Buddy, support, help, inquiries, FYP assistance, project management support"
    />
    <section className="min-h-screen  py-20 flex items-center justify-center px-6 duration-300">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-gray-100 mb-4 transition-colors duration-300">
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Contact</span> Us
            <hr className="w-32 h-[3px] mx-auto mt-3 rounded border-0 bg-purple-500  dark:bg-gray-100" />
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-base leading-relaxed transition-colors duration-300">
            Have questions, feedback, or collaboration ideas? Reach out to us —
            we’d love to hear from you!
          </p>
        </div>

        {/* Contact Section */}
        <Card className="border-none shadow-xl dark:bg-gray-800 rounded-3xl overflow-hidden transition-colors duration-300">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-5">

              {/* Left Info Card */}
              <div className="ml-4 mr-4 md:mr-0 md:col-span-2 bg-purple-600 dark:bg-gray-700 text-white p-10 relative flex flex-col justify-between rounded-l-3xl rounded-r-3xl transition-colors duration-300">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
                  <p className="text-purple-100 dark:text-gray-200 text-sm mb-10">
                    Our team is always available to assist you. Let’s make
                    something great together!
                  </p>

                  <div className="space-y-6 text-sm">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5" />
                      <div>
                        <p>+92 300 1234567</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5" />
                      <p>support@fypbuddy.com</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5" />
                      <p>NUML, Islamabad, Pakistan</p>
                    </div>
                  </div>
                </div>

                {/* Decorative Circle */}
                <div className="absolute bottom-0 right-0 w-56 h-56 bg-purple-400/30 dark:bg-gray-600/30 rounded-full translate-x-1/3 translate-y-1/3 transition-colors duration-300"></div>
              </div>

              {/* Right Form Card */}
              <div className="md:col-span-3 bg-white dark:bg-gray-800 p-10 rounded-l-3xl rounded-r-3xl transition-colors duration-300">
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="space-y-6 text-gray-700 dark:text-gray-200 transition-colors duration-300"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                        Your Name
                      </label>
                      <Input
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 rounded-xl px-4 py-2 focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 transition-colors duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                        Your Email
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 rounded-xl px-4 py-2 focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 transition-colors duration-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                      Subject
                    </label>
                    <Input
                      placeholder="Subject of your message"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 rounded-xl px-4 py-2 focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                      Message
                    </label>
                    <Textarea
                      placeholder="Write your message here..."
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 rounded-xl px-4 py-2 min-h-[120px] focus-visible:ring-purple-500 dark:focus-visible:ring-gray-100 resize-none transition-colors duration-300"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full bg-purple-500 hover:purple-400 text-white dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300 py-5 rounded-xl font-semibold shadow-md transition-all duration-300"
                  >
                    Send Message
                  </Button>
                </form>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </section>
    </>
  );
}
