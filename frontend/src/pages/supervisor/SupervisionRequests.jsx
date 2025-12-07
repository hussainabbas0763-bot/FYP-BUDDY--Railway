import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Users, Calendar, Check, X, Eye, Loader2, ArrowLeft } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function SupervisionRequests() {
    const apiURL = import.meta.env.VITE_API_URL;
    const accessToken = localStorage.getItem("accessToken");
    const navigate = useNavigate();
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loadingState, setLoadingState] = useState({ id: null, action: null });

    // 🔹 Fetch all pending requests
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await axios.get(`${apiURL}/supervisor/get-requests`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (res.data.success) {
                    setRequests(res.data.Supervisionrequests);
                }
            } catch (err) {
                console.error("Error fetching supervision requests:", err);
                toast.error("Failed to load supervision requests.");
            }
        };
        fetchRequests();
    }, [apiURL, accessToken]);

    // 🔹 Unified Request Handler (Accept / Decline)
    const handleAction = async (requestId, actionType) => {
        try {
            setLoadingState({ id: requestId, action: actionType });
            const res = await axios.put(`${apiURL}/supervisor/respond/${requestId}`, { action: actionType },
                {
                    headers:
                    {
                        Authorization: `Bearer ${accessToken}`
                    },
                    withCredentials: true
                }
            );

            if (res.data.success) {
                setRequests((prev) => prev.filter((req) => req._id !== requestId));
                toast.success(res.data.message);
            }
        } catch (err) {
            console.error(`Error performing ${actionType}:`, err);
            toast.error(`Failed to ${actionType} the request.`);
        } finally {
            setLoadingState({ id: null, action: null });
        }
    };
    const handleBackToDashboard = () => {
        navigate(-1)
    }

    return (
        <>
        <SEO 
          title="Supervision Requests | FYP Buddy - Review Student Requests"
          description="Review and manage FYP supervision requests from students. Accept or decline requests based on your availability and expertise."
          keywords="supervision requests, FYP supervisor, student requests, project supervision"
        />
        <div className="min-h-screen mt-15">
            <div className="flex flex-col md:flex-row gap-5 p-5">
                {/* Sidebar */}
                <Sidebar portalType="supervisor" />

                {/* Main Section */}
                <main className="flex-1 flex flex-col gap-5">
                    {/* Header */}
                    <Card className="relative w-full max-w-5xl mx-auto text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
                        <Button
                            onClick={handleBackToDashboard}
                            className="absolute top-4 left-4 flex items-center gap-2 bg-gray-800 text-white dark:text-gray-800 
                                        hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-gray-200 cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>

                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-8 mb-1">
                            Pending{" "}
                            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Supervision</span>{" "}
                            Requests
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-base">
                            Review, accept, or reject project supervision requests.
                        </p>
                    </Card>


                    {/* Requests */}
                    <Card className="w-full max-w-6xl mx-auto p-5 bg-white dark:bg-gray-800 shadow-md rounded-2xl">
                        {requests.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {requests.map((req) => (
                                    <Card
                                        key={req._id}
                                        className="group relative p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm"
                                    >
                                        {/* Title */}
                                        <div className="mb-3 flex flex-col items-center">
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
                                                {req.fypTitle}
                                            </h2>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>
                                                    {req.createdAt
                                                        ? new Date(req.createdAt).toLocaleDateString(
                                                            "en-US",
                                                            {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            }
                                                        )
                                                        : "N/A"}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => setSelectedRequest(req)}
                                                className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-gray-100 dark:hover:text-gray-200 mt-1 cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                View Description
                                            </button>
                                        </div>

                                        {/* Divider */}
                                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent"></div>

                                        {/* Team Members */}
                                        <div className="mb-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    Team ({req.requestFromGroup?.members?.length || 0})
                                                </h4>
                                            </div>

                                            <div className="space-y-1.5">
                                                {req.requestFromGroup?.members?.length > 0 ? (
                                                    req.requestFromGroup.members.map((m, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                                                                    {m.username.charAt(0)}
                                                                </div>
                                                                <span className="text-sm text-gray-800 dark:text-gray-200">
                                                                    {m.username}
                                                                </span>
                                                            </div>
                                                            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                                                {m.semester && m.section && m.shift
                                                                    ? `${m.semester}-${m.section}-${m.shift.charAt(0)}`
                                                                    : "Not set"}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center py-3">
                                                        No members listed
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                disabled={loadingState.id === req._id}
                                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white cursor-pointer"
                                                onClick={() => handleAction(req._id, "accept")}
                                            >
                                                {loadingState.id === req._id && loadingState.action === "accept" ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        Accept
                                                    </>
                                                )}
                                            </Button>

                                            <Button
                                                size="sm"
                                                disabled={loadingState.id === req._id}
                                                variant="destructive"
                                                className="flex-1 cursor-pointer"
                                                onClick={() => handleAction(req._id, "decline")}
                                            >
                                                {loadingState.id === req._id && loadingState.action === "decline" ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <X className="w-4 h-4" />
                                                        Reject
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Users className="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                                <p className="text-gray-600 dark:text-gray-400 text-base">
                                    No pending requests to review.
                                </p>
                            </div>
                        )}
                    </Card>
                </main>
            </div>

            {/* Request Details Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
                <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl">
                    {selectedRequest && (
                        <>
                            <DialogHeader className="pb-3">
                                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                                    {selectedRequest.fypTitle}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="mt-2">
                                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                    Description
                                </h4>
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {selectedRequest.description ||
                                        "No detailed description available."}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
        </>
    );
}
