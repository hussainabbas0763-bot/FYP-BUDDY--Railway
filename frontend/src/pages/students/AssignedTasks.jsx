import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import SEO from "@/components/SEO";
import {
    Calendar,
    Clock,
    UploadCloud,
    FileCheck,
    AlertCircle,
    CheckCircle2,
    Trash2,
} from "lucide-react";
import { useSelector } from "react-redux";
import TaskStatusBadge from "@/components/tasks/TaskStatusBadge";
import SubmitDialog from "@/components/tasks/SubmitDialog";

export default function StudentTasks() {
    const { group } = useSelector((store) => store.group);
    const [tasks, setTasks] = useState([]);
    const [fetching, setFetching] = useState(false);
    const [submissionDialog, setSubmissionDialog] = useState(null);
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const apiURL = import.meta.env.VITE_API_URL;
    const accessToken = localStorage.getItem("accessToken");

    // Derived metrics for progress
    // Get today's date only in YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];

    const acceptedCount = tasks.filter(
        (t) => String(t.status || '').toLowerCase() === 'accepted'
    ).length;

    // Overdue = dueDate < today && not accepted
    const overdueCount = tasks.filter((t) => {
        const status = String(t.status || '').toLowerCase();
        const dueDate = String(t.dueDate).split("T")[0]; // ensure pure date
        return status !== 'accepted' && dueDate < today;
    }).length;

    // Pending = assigned && dueDate >= today
    const pendingCount = tasks.filter((t) => {
        const status = String(t.status || '').toLowerCase();
        const dueDate = String(t.dueDate).split("T")[0];
        return status === 'assigned' && dueDate >= today;
    }).length;

    const totalTasks = tasks.length || 0;
    const overallPct = totalTasks ? Math.round((acceptedCount / totalTasks) * 100) : 0;


    // Fetch tasks for student's group
    useEffect(() => {
        const fetchTasks = async () => {
            if (!group?._id) return;
            setFetching(true);
            try {
                const res = await axios.get(`${apiURL}/task/get-tasks/${group._id}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    withCredentials: true,
                });
                if (res.data.success) {
                    setTasks(res.data.tasks || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setFetching(false);
            }
        };
        fetchTasks();
    }, [group]);

    // Handle submission upload (creates or replaces submission)
    async function handleSubmit(taskId) {
        if (!file) {
            toast.error("Please select a file to upload");
            return;
        }

        // Check file size (6MB limit)
        const maxSize = 6 * 1024 * 1024; // 6MB in bytes
        if (file.size > maxSize) {
            toast.error("File size exceeds 6MB limit. Please upload a smaller file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            setSubmitting(true);
            const id = taskId
            const res = await axios.put(`${apiURL}/task/submit-task/${id}`, formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "multipart/form-data",
                },
                withCredentials: true,
            });

            if (res.data.success) {
                toast.success("Submission uploaded successfully!");
                setSubmissionDialog(null);
                setFile(null);
                const updatedTask = res.data.task;
                setTasks((prev) => prev.map((t) => (t._id === taskId ? updatedTask : t)));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit task");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRemoveSubmission(taskId) {
        try {
            const res = await axios.delete(`${apiURL}/task/remove-submission/${taskId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                withCredentials: true,
            });
            if (res.data?.success) {
                toast.success("Submission removed");
                const updatedTask = res.data.task;
                setTasks((prev) => prev.map((t) => (t._id === taskId ? updatedTask : t)));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove submission");
        }
    }


    return (
        <>
        <SEO 
          title="Assigned Tasks | FYP Buddy - Track Your Work"
          description="View and manage your assigned FYP tasks. Track deadlines, submit work, upload files, and stay organized with your project responsibilities."
          keywords="assigned tasks, task management, project deadlines, student tasks, task submission, work tracking"
        />
        <div className="min-h-screen mt-15 ">
            <div className="flex flex-col md:flex-row gap-5 p-5">
                <Sidebar portalType="student" />

                <main className="flex-1 flex flex-col gap-5">
                    {/* Header */}
                    <Card className="relative w-full max-w-5xl mx-auto text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                            My{" "}
                            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Assigned
                            </span>{" "}
                            Tasks
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-base">
                            View and submit tasks assigned to your group.
                        </p>
                    </Card>

                    {/* Tasks */}
                    {fetching ? (
                        <Card className="w-full max-w-6xl mx-auto p-12 text-center bg-white dark:bg-gray-800 shadow-md rounded-2xl">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Loading tasks...
                                </p>
                            </div>
                        </Card>
                    ) : !group?._id ? (
                        <Card className="w-full max-w-6xl mx-auto p-12 text-center bg-white dark:bg-gray-800 shadow-md rounded-2xl">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-600 dark:text-gray-400">
                                No group Found, please create or join a group to view assigned tasks.
                            </p>
                        </Card>
                    ) : tasks.length === 0 ? (
                        <Card className="w-full max-w-6xl mx-auto p-12 text-center bg-white dark:bg-gray-800 shadow-md rounded-2xl">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-600 dark:text-gray-400">
                                No tasks yet assigned by supervisor for your group.
                            </p>
                        </Card>
                    ) : (
                        <>
                            {/* Progress Summary */}
                            <Card className="w-full max-w-6xl mx-auto p-5 bg-white dark:bg-gray-800 shadow-lg rounded-2xl mb-4 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="text-left">
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Overall Progress</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Accepted tasks out of total</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-semibold">Accepted: {acceptedCount}</div>
                                        <div className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">Pending: {pendingCount}</div>
                                        <div className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-semibold">Overdue: {overdueCount}</div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="w-full h-3 rounded-full bg-gray-400 dark:bg-gray-900 overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600" style={{ width: `${overallPct}%` }}></div>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">{overallPct}% complete</div>
                                </div>
                            </Card>

                            {/* Parent Container for Task Cards */}
                            <Card className="w-full max-w-6xl mx-auto p-4 bg-white dark:bg-gray-800 shadow-md rounded-2xl">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {tasks.map((t) => {
                                        const daysRemaining = Math.ceil(
                                            (new Date(t.dueDate) - new Date()) /
                                            (1000 * 60 * 60 * 24)
                                        );
                                        const submitted = Boolean(t.studentSubmission);
                                        const isLate = daysRemaining < 0;
                                        const statusLower = String(t.status || '').toLowerCase();
                                        const canSubmitByStatus = statusLower === 'assigned' || statusLower === 'submitted' || statusLower === 'rejected';
                                        const canSubmitWindow = t.allowLateSubmission || !isLate;
                                        const canSubmit = canSubmitByStatus && canSubmitWindow;
                                        const isAccepted = statusLower === 'accepted';
                                        const canModifyPendingReview = statusLower === 'submitted' && !t.reviewedAt;

                                        return (
                                            <Card
                                                key={t._id}
                                                className="group relative overflow-hidden bg-gray-300 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col"
                                            >
                                                <div className="p-5 flex flex-col gap-3 flex-1">

                                                    {/* === CHANGE IS HERE === */}
                                                    {/* Title & Assigned Date */}
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center">
                                                            {t.title}
                                                        </h3>
                                                        {/* Added Assigned Date below title */}
                                                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
                                                            Assigned: {new Date(t.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>

                                                    {/* Description or Feedback with top-right status badge */}
                                                    {isAccepted ? (
                                                        <>
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Supervisor Feedback</h4>
                                                                <TaskStatusBadge status={t.status} isLate={false} />
                                                            </div>
                                                            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-md h-24 overflow-y-auto custom-scroll">
                                                                {t.feedback || "No feedback provided"}
                                                            </div>
                                                        </>
                                                    ) : statusLower === 'rejected' ? (
                                                        <>
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Supervisor Feedback</h4>
                                                                <TaskStatusBadge status={t.status} isLate={isLate} />
                                                            </div>
                                                            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-md h-24 overflow-y-auto custom-scroll">
                                                                {t.feedback || "No feedback provided"}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</h4>
                                                                <TaskStatusBadge status={t.status} isLate={isLate} />
                                                            </div>
                                                            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-md h-24 overflow-y-auto custom-scroll">
                                                                {t.description || "No description provided"}
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* Details - for Assigned/Submitted/Rejected (not Accepted) */}
                                                    {(statusLower === 'assigned' || statusLower === 'submitted' || statusLower === 'rejected') && (
                                                        <>
                                                            {/* Row 1: Date and Countdown */}
                                                            <div className="flex items-center justify-between text-xs mt-3 border-t pt-2 border-gray-200 dark:border-gray-700">
                                                                {/* Due Date */}
                                                                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    <span>
                                                                        Due:{" "}
                                                                        {new Date(t.dueDate).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                {/* Days Left */}
                                                                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {daysRemaining < 0
                                                                        ? `${Math.abs(daysRemaining)} days overdue`
                                                                        : daysRemaining === 0
                                                                            ? "Due today"
                                                                            : `${daysRemaining} days left`}
                                                                </div>
                                                            </div>

                                                            {/* Row 2: Policy and Status */}
                                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                {/* Late Allowed */}
                                                                <div className="flex items-center gap-1">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    {t.allowLateSubmission ? "Late allowed" : "No late work"}
                                                                </div>

                                                                {/* Submission Status & Review Date (Conditional) */}
                                                                {submitted && statusLower !== 'rejected' ? (
                                                                    <div className="flex items-center gap-3"> {/* Use gap-3 to space them */}
                                                                        {/* Status */}
                                                                        <div className="flex items-center gap-1">
                                                                            <Clock className="w-3.5 h-3.5" />
                                                                            <span>{t.submissionStatus || (isLate ? "Late" : "On Time")}</span>
                                                                        </div>

                                                                        {/* Reviewed At - Only show if reviewed AND status is not 'submitted' */}
                                                                        {t.reviewedAt && statusLower !== 'submitted' && (
                                                                            <span className="text-gray-500 dark:text-gray-400">Reviewed {new Date(t.reviewedAt).toLocaleDateString()}</span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div></div> /* Empty div to maintain justify-between when not submitted */
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                    {/* Details - for - Accepted */}
                                                    {(statusLower === 'accepted') && (
                                                        <>
                                                            {/* Row 1: Date and Countdown */}
                                                            <div className="flex items-center justify-between text-xs mt-3 border-t pt-2 border-gray-200 dark:border-gray-700">
                                                                {/* Due Date */}
                                                                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    <span>
                                                                        Review:{" "}
                                                                        {new Date(t.reviewedAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                {/* Days Left */}
                                                                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {t.submissionStatus}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* Action Button */}
                                                    <div className="pt-2 mt-auto">
                                                        {submitted ? (
                                                            <Button
                                                                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                                                                onClick={() => {
                                                                    window.open(t.studentSubmission, "_blank");
                                                                }}
                                                            >
                                                                <FileCheck className="w-4 h-4" />
                                                                View Submission
                                                            </Button>
                                                        ) : null}

                                                        {canModifyPendingReview ? (
                                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                                <Dialog
                                                                    open={submissionDialog === t._id}
                                                                    onOpenChange={(o) => setSubmissionDialog(o ? t._id : null)}
                                                                >
                                                                    <DialogTrigger asChild>
                                                                        <Button disabled={!canSubmit} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">
                                                                            <UploadCloud className="w-4 h-4" />
                                                                            Replace File
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <SubmitDialog
                                                                        open={submissionDialog === t._id}
                                                                        onOpenChange={(o) => setSubmissionDialog(o ? t._id : null)}
                                                                        task={t}
                                                                        file={file}
                                                                        setFile={setFile}
                                                                        onSubmit={() => handleSubmit(t._id)}
                                                                        submitting={submitting}
                                                                        canSubmit={canSubmit}
                                                                    />
                                                                </Dialog>
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full flex items-center justify-center gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                                                    onClick={() => handleRemoveSubmission(t._id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Remove Files
                                                                </Button>
                                                            </div>
                                                        ) : null}

                                                        {statusLower === 'rejected' ? (
                                                            <Dialog
                                                                open={submissionDialog === t._id}
                                                                onOpenChange={(o) => setSubmissionDialog(o ? t._id : null)}
                                                            >
                                                                <DialogTrigger asChild>
                                                                    <Button disabled={!canSubmit} className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">
                                                                        <UploadCloud className="w-4 h-4" />
                                                                        Resubmit Task
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <SubmitDialog
                                                                    open={submissionDialog === t._id}
                                                                    onOpenChange={(o) => setSubmissionDialog(o ? t._id : null)}
                                                                    task={t}
                                                                    file={file}
                                                                    setFile={setFile}
                                                                    onSubmit={() => handleSubmit(t._id)}
                                                                    submitting={submitting}
                                                                    canSubmit={canSubmit}
                                                                />
                                                            </Dialog>
                                                        ) : null}

                                                        {!submitted && statusLower !== 'rejected' ? (
                                                            <Dialog
                                                                open={submissionDialog === t._id}
                                                                onOpenChange={(o) => setSubmissionDialog(o ? t._id : null)}
                                                            >
                                                                <DialogTrigger asChild>
                                                                    <Button disabled={!canSubmit} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">
                                                                        <UploadCloud className="w-4 h-4" />
                                                                        Submit Task
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <SubmitDialog
                                                                    open={submissionDialog === t._id}
                                                                    onOpenChange={(o) => setSubmissionDialog(o ? t._id : null)}
                                                                    task={t}
                                                                    file={file}
                                                                    setFile={setFile}
                                                                    onSubmit={() => handleSubmit(t._id)}
                                                                    submitting={submitting}
                                                                    canSubmit={canSubmit}
                                                                />
                                                            </Dialog>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </Card>
                        </>
                    )}
                </main>
            </div>
        </div>
        </>
    );
}
