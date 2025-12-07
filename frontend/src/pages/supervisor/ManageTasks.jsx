import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {
    Calendar,
    List,
    Plus,
    Edit2,
    Trash2,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileCheck,
    Clock1,
} from "lucide-react";
import { useSelector } from "react-redux";
import ManageSubmittedTasks from "./ManageSubmittedTasks";
import TaskStatusBadge from "@/components/tasks/TaskStatusBadge";

export default function Milestones() {
    const { supervised_groups } = useSelector((store) => store.supervised_groups);
    const [tasks, setTasks] = useState([]);
    const [groups, setGroups] = useState(supervised_groups || []);
    const [search, setSearch] = useState("");
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
    const [activeTaskForReview, setActiveTaskForReview] = useState(null);
    const [form, setForm] = useState({
        title: "",
        description: "",
        dueDate: "",
        allowLateSubmission: false,
    });
    const [statusTab, setStatusTab] = useState("All"); // All | Assigned | Submitted | Rejected | Accepted

    const apiURL = import.meta.env.VITE_API_URL;
    const accessToken = localStorage.getItem("accessToken");

    useEffect(() => {
        let isActive = true;
        const fetchTasks = async () => {
            if (!selectedGroup?._id) {
                setTasks([]);
                return;
            }

            setFetching(true);
            setTasks([]);

            try {
                const res = await axios.get(`${apiURL}/task/get-tasks/${selectedGroup._id}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    withCredentials: true,
                });

                if (res.data.success && isActive) {
                    setTasks(res.data.tasks || []);
                }
            } catch (error) {
                if (isActive) {
                    console.log(error)
                }
            } finally {
                if (isActive) setFetching(false);
            }
        };

        fetchTasks();
        return () => {
            isActive = false;
        };
    }, [selectedGroup]);

    async function refreshTasksAfterReview(updatedTask) {
        if (!updatedTask) return setActiveTaskForReview(null);
        setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
        setActiveTaskForReview(null);
    }

    function openCreateModal() {
        if (!selectedGroup?._id) {
            toast.error("Select a group before creating a task");
            return;
        }
        setEditing(null);
        setForm({
            title: "",
            description: "",
            dueDate: "",
            allowLateSubmission: false,
        });
        setDialogOpen(true);
    }

    function openEditModal(task) {
        setEditing(task._id);
        setForm({
            title: task.title || "",
            description: task.description || "",
            dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
            allowLateSubmission: task.allowLateSubmission || false,
        });
        setDialogOpen(true);
    }

    async function handleDelete(id) {
        try {
            const res = await axios.delete(`${apiURL}/task/delete-task/${id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                withCredentials: true,
            });
            if (res.data.success) {
                setTasks((prev) => prev.filter((t) => t._id !== id));
                toast.success(res.data.message);
            }
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data ||
                "Failed to delete task";
            toast.error(message);
        }
    }

    function handleFormChange(e) {
        const { name, value, type, checked } = e.target;
        setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!form.title.trim() || !form.dueDate) {
            toast.error("Please fill all required fields: Title & Due Date");
            return;
        }

        if (!selectedGroup?._id) {
            toast.error("Please select a valid group before creating a task");
            return;
        }

        try {
            setLoading(true);
            if (editing) {
                // edit the task
                const res = await axios.put(
                    `${apiURL}/task/update/${editing}`,
                    { ...form },
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        withCredentials: true,
                    }
                );
                if (res.data.success) {
                    setTasks((prev) =>
                        prev.map((t) => (t._id === editing ? res.data.task : t))
                    );
                    toast.success(res.data.message);
                }
            } else {
                //create the task
                const res = await axios.post(
                    `${apiURL}/task/create`,
                    { groupId: selectedGroup._id, ...form },
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        withCredentials: true,
                    }
                );
                if (res.data.success) {
                    setTasks((prev) => [res.data.task, ...prev]);
                    toast.success(res.data.message);
                }
            }

            setDialogOpen(false);
            setEditing(null);
            setForm({
                title: "",
                description: "",
                dueDate: "",
                allowLateSubmission: false,
            });
        } catch (err) {
            console.error("Error saving task:", err);
            toast.error(err.response?.data?.message || "Failed to save task");
        } finally {
            setLoading(false);
        }
    }

    const byText = tasks.filter((t) => {
        const q = search.toLowerCase();
        return (
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q)
        );
    });
    const filtered = byText.filter((t) => {
        if (statusTab === "All") return true;
        return String(t.status || "").toLowerCase() === statusTab.toLowerCase();
    });

    return (
        <>
        <SEO 
          title="Manage Tasks | FYP Buddy - Assign & Track Work"
          description="Create and manage tasks for your supervised FYP groups. Assign work, set deadlines, review submissions, and track student progress."
          keywords="task management, FYP assignments, student tasks, project tracking"
        />
        <div className="min-h-screen mt-15">
            <div className="flex flex-col md:flex-row gap-5 p-5">
                <Sidebar portalType="supervisor" />

                <main className="flex-1 flex flex-col gap-5">
                    {/* Header */}
                    <Card className="relative w-full max-w-5xl mx-auto text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                            Manage{" "}
                            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Group
                            </span>{" "}
                            Tasks
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-base">
                            Create and manage tasks for your assigned groups.
                        </p>
                    </Card>


                    {/* Controls Bar */}
                    <Card className="w-full max-w-6xl mx-auto p-5 bg-white dark:bg-gray-800 shadow-md rounded-2xl">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-5xl mx-auto w-full">
                            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                                <Select
                                    value={selectedGroup?._id || "none"}
                                    onValueChange={(groupId) => {
                                        if (groupId === "none") {
                                            setSelectedGroup(null);
                                            setTasks([]);
                                        } else {
                                            const group = groups.find((g) => g._id === groupId);
                                            setSelectedGroup(group || null);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Select Group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Select Group</SelectItem>
                                        {groups.map((g) => (
                                            <SelectItem key={g._id} value={g._id}>
                                                {g.groupName || `Group ${g._id.slice(-4)}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="relative flex-1 max-w-md">
                                    <Input
                                        placeholder="Search Task"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>

                                {/* Status Filter Dropdown */}
                                <Select value={statusTab} onValueChange={(v) => setStatusTab(v)} >
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Filter Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['All', 'Assigned', 'Submitted', 'Rejected', 'Accepted'].map((tab) => (
                                            <SelectItem key={tab} value={tab}>{tab}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={openCreateModal} className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg px-6 py-2 rounded-lg text-sm font-semibold">
                                <Plus className="w-4 h-4" /> Create Task
                            </Button>
                        </div>
                    </Card>
                    {/* Tasks Display */}
                    {fetching ? (
                        <Card className="w-full max-w-6xl mx-auto p-12 bg-white dark:bg-gray-800 shadow-md rounded-2xl text-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Loading tasks...
                                </p>
                            </div>
                        </Card>
                    ) : (
                        <Card className="w-full max-w-6xl mx-auto p-5 bg-white dark:bg-gray-800 shadow-md rounded-2xl">
                            {!selectedGroup?._id ? (
                                <div className="text-center py-12">
                                    <List className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Select a group to see their tasks
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Choose a group from the dropdown to manage their tasks.
                                    </p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-12">
                                    <List className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        No Tasks Found
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {search ? "Try adjusting your search terms" : "Create one to get started."}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                                    {filtered.map((t) => {
                                        const statusValue = t.status;
                                        const statusLower = String(statusValue || '').toLowerCase();
                                        const isAccepted = statusLower === 'accepted';
                                        const hasSubmission = Boolean(t.studentSubmission);
                                        const daysRemaining = Math.ceil((new Date(t.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

                                        return (
                                            <Card
                                                key={t._id}

                                                className="group relative overflow-hidden bg-gray-200 dark:bg-gray-900 rounded-xl border border-gray-700 dark:border-gray-200  h-full flex flex-col"
                                            >

                                                <div className="p-4 pt-5 flex flex-col flex-1">
                                                    {/* Header Section */}
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1 pr-2">
                                                            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight mb-1.5 line-clamp-2">
                                                                {t.title}
                                                            </h3>
                                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                <span>{new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                            </div>
                                                        </div>

                                                        {/* Status Badge */}
                                                        <TaskStatusBadge status={statusValue} isLate={daysRemaining < 0} />
                                                    </div>

                                                    {/* Description */}
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-md h-24 overflow-y-auto custom-scroll mb-2">
                                                        {t.description || "No description provided"}
                                                    </div>

                                                    {/* View/Review Submission */}
                                                    {hasSubmission && (
                                                        <>
                                                            {/* Show 'Review' button ONLY for 'submitted' status */}
                                                            {statusLower === 'submitted' && (
                                                                <button
                                                                    onClick={() => setActiveTaskForReview(t)}
                                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg text-sm font-semibold"
                                                                >
                                                                    <FileCheck className="w-4 h-4" />
                                                                    Review Submission
                                                                </button>
                                                            )}

                                                            {/* Show 'View' link for 'accepted' OR 'rejected' status */}
                                                            {(statusLower === 'accepted' || statusLower === 'rejected') && (
                                                                <div className="mb-3 flex flex-row items-center justify-between">
                                                                    <a
                                                                        href={t.studentSubmission}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 text-sm font-medium text-purple-700 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200 hover:underline"
                                                                    >
                                                                        <FileCheck className="w-4 h-4" />
                                                                        View submission
                                                                    </a>

                                                                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                                                        <Clock className="w-3.5 h-3.5" />
                                                                        <p>{t.submissionStatus}</p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        </>
                                                    )}


                                                    {/* Wrapper div with mt-auto to push buttons to bottom */}
                                                    <div className="mt-auto">
                                                        {/* Stats Section */}
                                                        {!isAccepted ? (
                                                            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${daysRemaining < 0
                                                                        ? 'bg-red-100 dark:bg-red-900/30'
                                                                        : daysRemaining <= 3
                                                                            ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                                                            : 'bg-purple-100 dark:bg-purple-900/30'
                                                                        }`}>
                                                                        <Clock className={`w-4 h-4 ${daysRemaining < 0
                                                                            ? 'text-red-600 dark:text-red-400'
                                                                            : daysRemaining <= 3
                                                                                ? 'text-yellow-600 dark:text-yellow-400'
                                                                                : 'text-purple-600 dark:text-purple-400'
                                                                            }`} />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                                                                            Time Left
                                                                        </p>
                                                                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                                                                            {daysRemaining < 0
                                                                                ? `${Math.abs(daysRemaining)} days overdue`
                                                                                : daysRemaining === 0
                                                                                    ? 'Today'
                                                                                    : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.allowLateSubmission
                                                                        ? 'bg-blue-100 dark:bg-blue-900/30'
                                                                        : 'bg-gray-100 dark:bg-gray-800'
                                                                        }`}>
                                                                        <CheckCircle2 className={`w-4 h-4 ${t.allowLateSubmission
                                                                            ? 'text-blue-600 dark:text-blue-400'
                                                                            : 'text-gray-400 dark:text-gray-500'
                                                                            }`} />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                                                                            Late Work
                                                                        </p>
                                                                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                                                                            {t.allowLateSubmission ? 'Accepted' : 'Not Accepted'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-800 text-xs">
                                                                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                    <span>Task accepted</span>
                                                                </div>
                                                                {t.reviewedAt && (
                                                                    <span className="text-gray-500 dark:text-gray-400">Reviewed {new Date(t.reviewedAt).toLocaleDateString()}</span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Action Buttons */}
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => openEditModal(t)}
                                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 text-purple-700 dark:text-purple-300 font-semibold transition-all duration-200 text-xs"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                Edit
                                                            </button>
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <button
                                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 dark:hover:from-red-900/30 dark:hover:to-orange-900/30 text-red-700 dark:text-red-300 font-semibold transition-all duration-200 text-xs"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                        Delete
                                                                    </button>
                                                                </DialogTrigger>

                                                                <DialogContent className="max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl">
                                                                    <DialogHeader>
                                                                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                                                            Are you sure you want to delete this task?
                                                                        </DialogTitle>
                                                                    </DialogHeader>

                                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                        This action cannot be undone. This will permanently remove the task for the group.
                                                                    </p>

                                                                    <div className="flex justify-end gap-3 mt-6">
                                                                        <DialogClose asChild>
                                                                            <Button
                                                                                variant="outline"
                                                                                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                        </DialogClose>
                                                                        <Button
                                                                            onClick={() => handleDelete(t._id)}
                                                                            className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
                                                                        >
                                                                            Confirm
                                                                        </Button>
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </div>
                                                    </div> {/* End of mt-auto wrapper */}
                                                </div>

                                                {/* Hover Accent */}
                                                <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-200 dark:group-hover:border-gray-200 rounded-xl pointer-events-none transition-all duration-300"></div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    )}
                </main>
            </div>

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white text-center">
                            {editing ? (
                                <>
                                    Edit <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Task</span>
                                </>
                            ) : (
                                <>
                                    Create New <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Task</span>
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {/* Title */}
                        <div>
                            <Label
                                htmlFor="title"
                                className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 block"
                            >
                                Task Title *
                            </Label>
                            <Input
                                id="title"
                                name="title"
                                value={form.title}
                                onChange={handleFormChange}
                                placeholder="Enter task title"
                                required
                                className="border-gray-200 dark:border-gray-700"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <Label
                                htmlFor="description"
                                className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 block"
                            >
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={form.description}
                                onChange={handleFormChange}
                                placeholder="Provide task details"
                                rows={3}
                                className="border-gray-200 dark:border-gray-700 resize-none overflow-y-auto overflow-x-hidden max-h-32 min-h-[6rem] rounded-md whitespace-pre-wrap break-words break-all "
                            />

                        </div>

                        {/* Due Date */}
                        <div>
                            <Label
                                htmlFor="dueDate"
                                className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 block"
                            >
                                Due Date *
                            </Label>
                            <Input
                                id="dueDate"
                                name="dueDate"
                                type="date"
                                value={form.dueDate}
                                onChange={handleFormChange}
                                required
                                min={new Date().toISOString().split("T")[0]}
                                className="border-gray-200 dark:border-gray-700"
                            />

                        </div>

                        {/* Late Submission */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="allowLateSubmission"
                                name="allowLateSubmission"
                                checked={form.allowLateSubmission}
                                onChange={handleFormChange}
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            <Label
                                htmlFor="allowLateSubmission"
                                className="text-sm font-medium cursor-pointer text-gray-800 dark:text-gray-200"
                            >
                                Allow late submissions
                            </Label>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                className="flex-1"
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg px-6 py-2 rounded-lg text-sm font-semibold"
                                disabled={loading}
                            >
                                {loading ? "Saving..." : editing ? "Update" : "Create"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Centralized Review Modal */}
            {activeTaskForReview && (
                <ManageSubmittedTasks
                    task={activeTaskForReview}
                    onClose={(updatedTask) => refreshTasksAfterReview(updatedTask)}
                />
            )}

        </div>
        </>
    );
}