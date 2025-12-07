import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, File, Mail, MessageSquare, Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import toast from "react-hot-toast";

function ManageSubmittedTasks({ task, onClose }) {
  const [feedback, setFeedback] = useState(task?.feedback || "");
  const [loadingAction, setLoadingAction] = useState(null); // "accept" or "reject"
  const apiUrl = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken")

  if (!task) return null;

  const handleAction = async (action) => {
    setLoadingAction(action);
    try {
      const id = task._id
      const status = action;
      const res = await axios.put(`${apiUrl}/task/review/${id}`, { status, feedback }, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }, withCredentials: true
      });
      if (res.data.success) {
        toast.success(res.data.message)
        onClose(res.data.task);
      }

    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit task");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Dialog open={!!task} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white text-center">
            {task.title || "Task Details"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Student Submission */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
              <File className="w-4 h-4" />
              Student Submission
            </h4>

            {task.studentSubmission ? (
              <a
                href={task.studentSubmission}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline text-sm font-medium"
              >
                View Submitted File
              </a>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No submission found.
              </p>
            )}
          </div>


          {/* Submitted At */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Submitted at
            </h4>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
              {task.submittedAt
                ? new Date(task.submittedAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : "N/A"}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Feedback
            </h4>
            <Textarea
              placeholder="Write your feedback here..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px] resize-none text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              size="sm"
              disabled={loadingAction === "Rejected"}
              variant="destructive"
              className="flex-1 cursor-pointer"
              onClick={() => handleAction("Rejected")}
            >
              {loadingAction === "Rejected" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <X className="w-4 h-4" />
                  Reject
                </>
              )}
            </Button>

            <Button
              size="sm"
              disabled={loadingAction === "Accepted"}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white cursor-pointer"
              onClick={() => handleAction("Accepted")}
            >
              {loadingAction === "Accepted" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Accept
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ManageSubmittedTasks;
