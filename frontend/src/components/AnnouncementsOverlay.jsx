import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Megaphone, Calendar, FileText, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const AnnouncementsOverlay = ({ isOpen, onClose, currentPhase }) => {
  const { user } = useSelector((store) => store.auth);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = {};
      if (user?.role === "student" && currentPhase) {
        params.currentPhase = currentPhase;
      }
      
      const res = await axios.get(`${apiURL}/announcements/get-all`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
        withCredentials: true,
      });

      if (res.data.success) {
        setAnnouncements(res.data.data || []);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements();
    }
  }, [isOpen, currentPhase]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = (fileUrl, fileName) => {
    window.open(fileUrl, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-4xl h-[85vh] bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Announcements
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {announcements.length} announcement(s) available
                {announcements.length > 2 && (
                  <span className="ml-2 text-purple-600 dark:text-purple-400">• Scroll for more</span>
                )}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Description - Scrollable area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scroll">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No announcements yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check back later for updates from your coordinator.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <Card
                  key={announcement._id}
                  className="p-5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedAnnouncement(
                    selectedAnnouncement?._id === announcement._id ? null : announcement
                  )}
                >
                  {/* Announcement Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {announcement.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={
                            announcement.entity === "student"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          }
                        >
                          {announcement.entity === "student" ? "Students" : "Supervisors"}
                        </Badge>
                        {announcement.phase && (
                          <Badge
                            className={
                              announcement.phase === "Proposal"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                : announcement.phase === "Progress"
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }
                          >
                            {announcement.phase}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {formatDate(announcement.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Announcement Description */}
                  {selectedAnnouncement?._id === announcement._id && (
                    <div className="mt-4 space-y-4">
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {announcement.description}
                        </p>
                      </div>

                      {/* Files */}
                      {announcement.files && announcement.files.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Attachments ({announcement.files.length})
                          </h4>
                          <div className="space-y-2">
                            {announcement.files.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                              >
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                                  {file.fileName || `Attachment ${index + 1}`}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(file.url, file.fileName);
                                  }}
                                  className="flex items-center gap-1 ml-2"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Posted By */}
                      <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                        Posted by:{" "}
                        <span className="font-medium">
                          {announcement.createdBy?.username || "Coordinator"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Click to expand hint */}
                  {selectedAnnouncement?._id !== announcement._id && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Click to view details
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AnnouncementsOverlay;
