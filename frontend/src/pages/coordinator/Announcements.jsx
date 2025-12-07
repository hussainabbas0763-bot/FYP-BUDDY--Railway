import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SEO from "@/components/SEO";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, Megaphone, Trash2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "@/components/Pagination";

const CoordinatorAnnouncements = () => {
    const { user } = useSelector((store) => store.auth);
    const [loading, setLoading] = useState(false);
    const [entity, setEntity] = useState("");
    const [phase, setPhase] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [fetchingAnnouncements, setFetchingAnnouncements] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const apiURL = import.meta.env.VITE_API_URL;
    const accessToken = localStorage.getItem("accessToken");

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        
        // Check file size (6MB limit)
        const maxSize = 6 * 1024 * 1024; // 6MB in bytes
        const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
        
        if (oversizedFiles.length > 0) {
            toast.error(`${oversizedFiles.length} file(s) exceed 6MB limit. Please select smaller files.`);
            e.target.value = ""; // Clear the input
            return;
        }
        
        setFiles((prev) => [...prev, ...selectedFiles]);
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!entity) {
            toast.error("Please select an entity");
            return;
        }

        if (entity === "student" && !phase) {
            toast.error("Please select a phase for students");
            return;
        }

        if (!title.trim()) {
            toast.error("Please enter a title");
            return;
        }

        if (!description.trim()) {
            toast.error("Please enter a description");
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("entity", entity);
            if (entity === "student") {
                formData.append("phase", phase);
            }
            formData.append("title", title);
            formData.append("description", description);

            files.forEach((file) => {
                formData.append("files", file);
            });

            const res = await axios.post(`${apiURL}/announcements/create`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "multipart/form-data",
                    },
                    withCredentials: true,
                }
            );

            if (res.data.success) {
                toast.success("Announcement created successfully!");
                setEntity("");
                setPhase("");
                setTitle("");
                setDescription("");
                setFiles([]);
                fetchAnnouncements();
            }
        } catch (error) {
            console.error("Error creating announcement:", error);
            const message =
                error.response?.data?.message || "Failed to create announcement";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEntity("");
        setPhase("");
        setTitle("");
        setDescription("");
        setFiles([]);
    };

    const fetchAnnouncements = async () => {
        try {
            setFetchingAnnouncements(true);
            const res = await axios.get(`${apiURL}/announcements/get-all`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                withCredentials: true,
            });

            if (res.data.success) {
                const allAnnouncements = res.data.data || [];
                const filtered = allAnnouncements.filter(
                    (a) => a.department === user?.department
                );
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setAnnouncements(filtered);
            } else {
                setAnnouncements([]);
            }
        } catch (error) {
            console.error("Error fetching announcements:", error);
            toast.error("Failed to load announcements");
            setAnnouncements([]);
        } finally {
            setFetchingAnnouncements(false);
        }
    };

    const handleDelete = async (announcementId) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) {
            return;
        }

        try {
            setDeletingId(announcementId);
            const res = await axios.delete(
                `${apiURL}/announcements/delete/${announcementId}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    withCredentials: true,
                }
            );

            if (res.data.success) {
                toast.success("Announcement deleted successfully!");
                fetchAnnouncements();
            }
        } catch (error) {
            console.error("Error deleting announcement:", error);
            const message =
                error.response?.data?.message || "Failed to delete announcement";
            toast.error(message);
        } finally {
            setDeletingId(null);
        }
    };

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

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    // Pagination logic
    const paginatedAnnouncements = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return announcements.slice(startIndex, endIndex);
    }, [announcements, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(announcements.length / itemsPerPage);

    return (
        <>
        <SEO 
          title="Announcements | FYP Buddy - Coordinator Panel"
          description="Create and manage FYP announcements. Communicate important updates, deadlines, and information to all students and supervisors."
          keywords="FYP announcements, system notifications, coordinator communications, project updates"
        />
        <div className="min-h-screen mt-15">
            <div className="flex flex-col md:flex-row gap-5 p-5">
                <Sidebar portalType="coordinator" />

                <main className="flex flex-col gap-5 w-full">
                    {/* Header */}
                    <Card className="w-full max-w-5xl mx-auto text-center p-8 bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                            Manage {" "}
                            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Announcements
                            </span>
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Make announcements for students and supervisors in your department.
                        </p>
                    </Card>

                    {/* Announcement Form */}
                    <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Entity Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="entity" className="text-sm font-medium">
                                    Select Audience 
                                </Label>
                                <Select value={entity} onValueChange={setEntity}>
                                    <SelectTrigger
                                        id="entity"
                                        className="border border-gray-400 dark:border-gray-700 w-full"
                                    >
                                        <SelectValue placeholder="Student or Supervisor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">Students</SelectItem>
                                        <SelectItem value="supervisor">Supervisors</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Phase Selection (Only for Students) */}
                            {entity === "student" && (
                                <div className="space-y-2">
                                    <Label htmlFor="phase" className="text-sm font-medium">
                                        Select Phase 
                                    </Label>
                                    <Select value={phase} onValueChange={setPhase}>
                                        <SelectTrigger
                                            id="phase"
                                            className="border border-gray-400 dark:border-gray-700 w-full"
                                        >
                                            <SelectValue placeholder="Select phase" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Proposal">Proposal</SelectItem>
                                            <SelectItem value="Progress">Progress</SelectItem>
                                            <SelectItem value="Defence">Defence</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-medium">
                                    Title 
                                </Label>
                                <Input
                                    id="title"
                                    type="text"
                                    placeholder="Enter announcement title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="border border-gray-400 dark:border-gray-700"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium">
                                    Description 
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Enter announcement description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={6}
                                    className="border border-gray-400 dark:border-gray-700 resize-none"
                                />
                            </div>

                            {/* File Upload */}
                            <div className="space-y-2">
                                <Label htmlFor="files" className="text-sm font-medium">
                                    Attachments (Optional)
                                </Label>
                                <div className="flex items-center gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => document.getElementById("file-input").click()}
                                        className="flex items-center gap-2"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Upload Files
                                    </Button>
                                    <input
                                        id="file-input"
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {files.length > 0
                                            ? `${files.length} file(s) selected`
                                            : "No files selected"}
                                    </span>
                                </div>

                                {/* Display Selected Files */}
                                {files.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {files.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                                            >
                                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                                    {file.name}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeFile(index)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Megaphone className="w-4 h-4 mr-2" />
                                            Create Announcement
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                    disabled={loading}
                                    className="px-8"
                                >
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {/* Announcements Table */}
                    <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Your Announcements
                            </h2>
                            <Button
                                onClick={fetchAnnouncements}
                                disabled={fetchingAnnouncements}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <RefreshCw
                                    className={`w-4 h-4 ${fetchingAnnouncements ? "animate-spin" : ""}`}
                                />
                                Refresh
                            </Button>
                        </div>

                        {fetchingAnnouncements ? (
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
                                    Create your first announcement using the form above.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Audience</TableHead>
                                                <TableHead>Phase</TableHead>
                                                <TableHead>Created At</TableHead>
                                                <TableHead className="text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedAnnouncements.map((announcement) => (
                                                <TableRow key={announcement._id}>
                                                    <TableCell className="font-medium">
                                                        {announcement.title}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            className={
                                                                announcement.entity === "student"
                                                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                                                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                            }
                                                        >
                                                            {announcement.entity === "student"
                                                                ? "Students"
                                                                : "Supervisors"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {announcement.phase ? (
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
                                                        ) : (
                                                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                                                                N/A
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                                        {formatDate(announcement.createdAt)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(announcement._id)}
                                                            disabled={deletingId === announcement._id}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        >
                                                            {deletingId === announcement._id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {announcements.length > 0 && (
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        itemsPerPage={itemsPerPage}
                                        totalItems={announcements.length}
                                        onPageChange={setCurrentPage}
                                        onItemsPerPageChange={(value) => {
                                            setItemsPerPage(value);
                                            setCurrentPage(1);
                                        }}
                                        itemLabel="announcements"
                                    />
                                )}
                            </>
                        )}
                    </Card>
                </main>
            </div>
        </div>
        </>
    );
};

export default CoordinatorAnnouncements;
