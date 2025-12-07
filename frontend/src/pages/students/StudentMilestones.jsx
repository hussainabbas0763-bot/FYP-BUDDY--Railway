import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Celebration from "@/components/Celebration";
import SEO from "@/components/SEO";
import {
  Upload,
  FileCheck,
  Lock,
  Trophy,
  Clock,
  Calendar,
  AlertCircle,
  UploadCloud,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { setMilestone } from "@/redux/milestoneSlice";

export default function StudentMilestones() {
  const { group } = useSelector((s) => s.group);
  const { milestone } = useSelector((s) => s.milestone);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");

  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploading, setUploading] = useState({});
  const [replaceMode, setReplaceMode] = useState({});
  const [cooldown, setCooldown] = useState({});

  const phases = useMemo(() => ["Proposal", "Progress", "Defence"], []);

  /** Fetch milestone data **/
  const fetchMilestone = async () => {
    if (!group?._id) return;
    try {
      const { data } = await axios.get(
        `${apiURL}/milestone/get-my-milestone/${group._id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      if (data.success) dispatch(setMilestone(data.milestone));
    } catch {
      toast.error("Failed to fetch milestone");
    }
  };

  /** Effects **/
  useEffect(() => {
    fetchMilestone();
    const i = setInterval(fetchMilestone, 15000);
    return () => clearInterval(i);
  }, [group ? group._id : undefined]);



  /** Helper utilities **/
  const getPhaseStatus = (phase) => {
    if (!milestone) return { status: "locked", message: "Create or Join a Group to Get Started" };

    const i = phases.indexOf(phase);
    const current = phases.indexOf(milestone.phase);

    const deadlinePassed =
      milestone.submissionDeadline &&
      new Date(milestone.submissionDeadline) < new Date();

    if (milestone.phase === "Completed") {
      return { status: "completed", message: "All milestones completed!" };
    }

    //  If current milestone reopened for submission (previously failed)
    if (i === current && milestone.isSubmissionActive && milestone.status === "Failed") {

      return { status: "active", message: "Submission open for Failed Projects" };
    }

    //  If current milestone reopened for submission (previously failed)
    if (i === current && milestone.isSubmissionActive) {

      return { status: "active", message: "Submission window open" };
    }

    //  If milestone is failed AND submission not reopened
    if (milestone.status === "Failed" && phase === milestone.phase && !milestone.isSubmissionActive) {
      return {
        status: "failed",
        message: "Phase failed - Waiting for resubmission",
      };
    }

    //  If current phase deadline has passed and submission is closed
    if (i === current && !milestone.isSubmissionActive && milestone.status === "Under Review") {
      return {
        status: "under-review",
        message: "Deadline passed - Under Review",
      };
    }

    if (!milestone.isSubmissionActive && i === current &&
      (!milestone.studentSubmission?.[phase.toLowerCase()]?.file || milestone.studentSubmission?.[phase.toLowerCase()]?.file === "")
      && deadlinePassed) {
      return {
        status: "Expired",
        message: "Deadline passed - No File Submitted",
      };
    }
    //  If previous phase is completed
    if (
      milestone?.previousPhase?.title === phase &&
      milestone?.previousPhase?.status === "Completed"
    ) {
      return { status: "completed", message: "Phase completed successfully!" };
    }

    //  Current phase when not active
    if (i === current) {
      return { status: "waiting", message: "Awaiting submission window" };
    }

    // 🔒 Lock future phases
    if (i > current)
      return { status: "locked", message: "Locked until prior phase is complete" };

    if (phase !== milestone.phase)
      return { status: "completed", message: "Phase completed successfully!" };
  };

  const getProgressValue = () => {
    if (!milestone) return 0;

    // If all phases are done
    if (milestone.phase === "Completed") {
      return 100;
    }

    // Determine completion based on current phase and status
    const phase = milestone.phase;
    const status = milestone.status;

    if (phase === "Proposal" && status === "Completed") return 33.3;
    if (phase === "Progress" && status === "Completed") return 66.6;
    if (phase === "Defence" && status === "Completed") return 100;

    // If the phase is currently active or under review, show the *previous* phase’s progress
    if (phase === "Proposal") return 0;
    if (phase === "Progress") return 33.3;
    if (phase === "Defence") return 66.6;

    return 0;
  };


  const handleFileSelect = (phase, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }

    // Check file size (6MB limit)
    const maxSize = 6 * 1024 * 1024; // 6MB in bytes
    if (file.size > maxSize) {
      toast.error("File size exceeds 6MB limit. Please upload a smaller file.");
      e.target.value = ""; // Clear the input
      return;
    }

    setSelectedFiles((p) => ({ ...p, [phase]: file }));
  };

  /** Unified upload handler **/
  const uploadFile = async (phase, replace = false) => {
    const file = selectedFiles[phase];
    if (!file) return toast.error("Please select a file first");

    setUploading((p) => ({ ...p, [phase]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("phase", phase);
      formData.append("groupId", group._id);

      const res = await axios.post(
        `${apiURL}/milestone/upload-submission/${group._id}`,
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
        toast.success(res.data.message || "Submission successful");
        setSelectedFiles((p) => ({ ...p, [phase]: null }));
        setReplaceMode((p) => ({ ...p, [phase]: false }));
        fetchMilestone();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setUploading((p) => ({ ...p, [phase]: false }));
    }
  };

  const triggerCelebrate = (phase) => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 6000);
    setCooldown((p) => ({ ...p, [phase]: true }));
    setTimeout(
      () => setCooldown((p) => ({ ...p, [phase]: false })),
      30000
    );
  };

  const formatDeadline = (d) =>
    d
      ? new Date(d).toLocaleString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      : "No deadline";

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      : "No date";

  /** Reusable Upload Section **/
  const UploadSection = ({ phase, isReplace }) => (
    <>
      <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <UploadCloud className="w-4 h-4" />
        {isReplace ? "Replace Document" : "Upload Document"}
      </Label>

      <Input
        type="file"
        accept=".pdf"
        onChange={(e) => handleFileSelect(phase, e)}
        disabled={uploading[phase]}
      />

      {selectedFiles[phase] && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-300 dark:border-green-700">
          <FileCheck className="w-5 h-5 text-green-600" />
          <p className="text-xs text-green-800 dark:text-green-300 truncate">
            {selectedFiles[phase].name}
          </p>
        </div>
      )}

      <Button
        onClick={() => uploadFile(phase, isReplace)}
        disabled={!selectedFiles[phase] || uploading[phase]}
        className="w-full bg-gradient-to-r from-green-500 to-green-800 text-white font-bold py-4 rounded-xl shadow-xl"
      >
        {uploading[phase] ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 mr-2" />
            {isReplace ? `Replace Document` : `Submit Document`}
          </>
        )}
      </Button>

      {isReplace && (
        <Button
          variant="ghost"
          className="w-full text-gray-500 dark:text-gray-400 mt-2"
          onClick={() =>
            setReplaceMode((p) => ({ ...p, [phase]: false }))
          }
        >
          Cancel Replace
        </Button>
      )}
    </>
  );

  /** --- MAIN RETURN --- **/
  return (
    <>
    <SEO 
      title="Project Milestones | FYP Buddy - Track Progress"
      description="Monitor your FYP milestones and track project progress. Submit deliverables, stay on schedule with important deadlines, and achieve your thesis goals."
      keywords="project milestones, progress tracking, FYP deadlines, thesis milestones, deliverables, project phases"
    />
    <div className="min-h-screen mt-15">
      {/* show the celebration component */}
      {showCelebration && (
        <Celebration />
      )}

      <div className="flex flex-col md:flex-row gap-5 p-5">
        <Sidebar portalType="student" />

        <main className="flex-1">
          {/* Header */}
          <Card className="relative w-full max-w-5xl mx-auto text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md mb-8">
            <h1 className="text-4xl font-extrabold mb-2">
              Milestone{" "}
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Management
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Track your FYP milestones and submit your work
            </p>
          </Card>

          {/* Progress */}
          <Card
            className={"max-w-6xl mx-auto mb-6 p-6 shadow-lg rounded-2xl bg-white dark:bg-gray-800"}
          >
            {/* Header Row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <h2 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">
                Milestone Progress
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-purple-600">Proposal:</span> 33.3% |{" "}
                <span className="font-medium text-blue-600">Progress:</span> 33.3% |{" "}
                <span className="font-medium text-indigo-600">Defence:</span> 33.3%
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 rounded-full bg-gray-400 dark:bg-gray-900 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 transition-[width] duration-700 ease-in-out"
                style={{ width: `${getProgressValue()}%` }}
              ></div>
            </div>

            {/* Percentage Text */}
            <div className="text-right">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {getProgressValue().toFixed(1)}% Completed
              </span>
            </div>
          </Card>

          {/* Milestone Cards */}
          <Card className="max-w-6xl mx-auto p-8 shadow-2xl rounded-3xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:bg-gray-900">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {phases.map((phase, i) => {
                const info = getPhaseStatus(phase);
                const isCompleted = info.status === "completed";
                const isActive = info.status === "active";
                const isUnderReview = info.status === "under-review";
                const isFailed = info.status === "failed";
                const isExpired = info.status === "Expired";
                const phaseKey = phase.toLowerCase();
                const submitted =
                  milestone?.studentSubmission?.[phaseKey]?.file;

                return (
                  <Card
                    key={phase}
                    className={`relative overflow-hidden rounded-2xl border-2 shadow-xl transition-all duration-300 dark:bg-gray-800 ${isCompleted
                      ? "border-green-400"
                      : isActive
                        ? "border-green-400"
                        : isUnderReview
                          ? "border-yellow-400"
                          : isFailed
                            ? "border-red-400"
                            : isExpired
                              ? "border-red-400"
                              : "border-gray-400"
                      }`}
                  >
                    <div className="absolute top-1 right-1 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center font-bold text-lg">
                      <span
                        className={
                          isCompleted
                            ? "text-green-600"
                            : isActive
                              ? "text-green-600"
                              : isUnderReview
                                ? "text-yellow-600"
                                : isFailed
                                  ? "text-red-600"
                                  : isExpired
                                    ? "text-red-600"
                                    : "text-gray-400"
                        }
                      >
                        {i + 1}
                      </span>
                    </div>

                    <div className="p-6 flex flex-col gap-2 h-full ">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <h3
                          className={`text-2xl font-black ${isCompleted
                            ? "text-green-600"
                            : isActive
                              ? "text-green-600"
                              : isUnderReview
                                ? "text-yellow-600"
                                : isFailed
                                  ? "text-red-600"
                                  : isExpired
                                    ? "text-red-600"
                                    : "text-gray-600"
                            }`}
                        >
                          {phase}
                        </h3>

                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md ${isCompleted
                            ? "bg-green-500 text-white"
                            : isActive
                              ? "bg-green-500 text-white"
                              : isUnderReview
                                ? "bg-yellow-500 text-white"
                                : isFailed
                                  ? "bg-red-500 text-white"
                                  : info.status === "locked"
                                    ? "bg-gray-500 text-white"
                                    : isExpired
                                      ? "bg-red-500 text-white"
                                      : "bg-gray-400 text-white"
                            }`}
                        >
                          {isCompleted
                            ? "✓ Completed"
                            : isActive
                              ? "Active"
                              : isUnderReview
                                ? "Under Review"
                                : isFailed
                                  ? "✗ Failed"
                                  : info.status === "locked"
                                    ? " Locked"
                                    : isExpired
                                      ? " ✗ Expired"
                                      : "Waiting"}
                        </span>
                      </div>
                      <div
                        className={`p-4 rounded-xl text-sm font-medium ${isCompleted
                          ? "bg-green-200 dark:bg-green-900/30"
                          : isActive
                            ? "bg-green-200 dark:bg-green-900/30"
                            : isUnderReview
                              ? "bg-yellow-200 dark:bg-yellow-900/30"
                              : isFailed
                                ? "bg-red-200 dark:bg-red-900/30"
                                : info.status === "locked"
                                  ? "bg-gray-200 dark:bg-gray-700/50"
                                  : info.status === "waiting"
                                    ? "bg-blue-200 dark:bg-blue-700/20"
                                    : isExpired
                                      ? "bg-red-200 dark:bg-red-900/30"
                                      : "bg-gray-200 dark:bg-gray-800/60"
                          }`}
                      >
                        {info.message}
                      </div>


                      {isActive && milestone?.isSubmissionActive && (
                        <div className="space-y-3">
                          <div className="p-4 rounded-xl bg-white/90 dark:bg-gray-800/90 border-2 border-green-200 dark:border-green-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                Deadline
                              </div>
                              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {formatDeadline(
                                  milestone.submissionDeadline
                                )}
                              </div>
                            </div>
                          </div>

                          {milestone?.conductionDate && (
                            <div className="p-4 rounded-xl bg-white/90 dark:bg-gray-800/90 border-2 border-green-200 dark:border-green-700 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                  Conduction Date
                                </div>
                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                  {formatDate(milestone.conductionDate)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {isUnderReview && (
                        <div className="space-y-3">
                          <div className="p-4 rounded-xl bg-white/90 dark:bg-gray-800/90 border-2 border-yellow-200 dark:border-yellow-700">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                Submission Deadline
                              </div>
                            </div>
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {formatDeadline(milestone.submissionDeadline)}
                            </div>
                          </div>

                          {milestone?.conductionDate && (
                            <div className="p-4 rounded-xl bg-white/90 dark:bg-gray-800/90 border-2 border-yellow-200 dark:border-yellow-700">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                  Conduction Date
                                </div>
                              </div>
                              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {formatDate(milestone.conductionDate)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {isFailed && (
                        <div className="p-6 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-300 dark:border-red-700">
                          <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-red-900 dark:text-red-300 mb-1">
                                Phase Failed
                              </p>
                              <p className="text-xs text-red-700 dark:text-red-400">
                                Please wait for the coordinator to reopen submissions for failed projects.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {info.status === "waiting" && (
                        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700">
                          <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                              <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
                                Submission Window Not Open
                              </p>
                              <p className="text-xs text-blue-700 dark:text-blue-400">
                                The coordinator hasn't opened submissions yet. Please check back later.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {isExpired && (
                        <div className="p-6 rounded-xl bg-gradient-to-br from-red-50 to-red-5=100 dark:from-red-900/20 dark:to-red-800/20 border-2 border-dashed border-red-300 dark:border-red-700">
                          <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                              <Clock className="w-8 h-8 text-red-600 dark:text-red-400 animate-pulse" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-red-700 dark:text-red-300 mb-1">
                                Submission Window Dealine Passed
                              </p>
                              <p className="text-xs text-red-700 dark:text-red-400">
                                The submission deadline has passed and no file was submitted for this phase. Please contact your coordinator for further assistance.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-auto space-y-3">
                        {isActive &&
                          milestone?.isSubmissionActive &&
                          (!submitted || replaceMode[phase] ? (
                            <UploadSection
                              phase={phase}
                              isReplace={replaceMode[phase]}
                            />
                          ) : (
                            <>
                              <Button
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 rounded-xl shadow-xl"
                                onClick={() =>
                                  window.open(
                                    milestone?.studentSubmission?.[
                                      phaseKey
                                    ]?.file,
                                    "_blank"
                                  )
                                }
                              >
                                <FileCheck className="w-5 h-5 mr-2" /> View
                                Current Submission
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full border-2 border-green-400 text-green-600 dark:border-green-600 dark:text-green-300 dark:hover:bg-gray-800"
                                onClick={() => {
                                  setReplaceMode((p) => ({
                                    ...p,
                                    [phase]: true,
                                  }));
                                }}
                              >
                                <Upload className="w-5 h-5 mr-2" /> Replace
                                Submission
                              </Button>
                            </>
                          ))}

                        {isUnderReview && submitted && (
                          <Button
                            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold py-4 rounded-xl shadow-xl"
                            onClick={() =>
                              window.open(
                                milestone?.studentSubmission?.[phaseKey]?.file,
                                "_blank"
                              )
                            }
                          >
                            <FileCheck className="w-5 h-5 mr-2" /> View Submitted Document
                          </Button>
                        )}

                        {isFailed && submitted && (
                          <Button
                            className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-4 rounded-xl shadow-xl"
                            onClick={() =>
                              window.open(
                                milestone?.studentSubmission?.[phaseKey]?.file,
                                "_blank"
                              )
                            }
                          >
                            <FileCheck className="w-5 h-5 mr-2" /> View Previous Submission
                          </Button>
                        )}

                        {isCompleted && (
                          <>
                            <Button
                              className="w-full bg-gradient-to-r from-green-500 to-green-800 text-white font-bold py-4 rounded-xl shadow-xl"
                              onClick={() =>
                                window.open(
                                  milestone?.studentSubmission?.[phaseKey]?.file,
                                  "_blank"
                                )
                              }
                            >
                              <FileCheck className="w-5 h-5 mr-2" /> View Submitted File
                            </Button>
                            <Button
                              onClick={() => triggerCelebrate(phase)}
                              disabled={cooldown[phase]}
                              className="w-full bg-gradient-to-r from-green-500 to-green-800 text-white font-bold py-4 rounded-xl shadow-xl disabled:opacity-50"
                            >
                              {cooldown[phase] ? (
                                <>
                                  <Clock className="w-5 h-5 mr-2" /> Wait 30s...
                                </>
                              ) : (
                                <>
                                  <Trophy className="w-5 h-5 mr-2" /> Celebrate{" "}
                                  {phase}!
                                </>
                              )}
                            </Button>
                          </>

                        )}
                        {info.status === "locked" && (
                          <div className="rounded-xl bg-gray-100 dark:bg-gray-800 p-6 border-2 border-dashed border-gray-300 text-center">
                            <Lock className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Locked
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Complete previous phases to unlock
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}

            </div>

            {/* Instructions */}
            <Card className="mt-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-white/50 shadow-lg">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-blue-600" />
                Milestone Instructions
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                <li className="p-3 bg-white/50 dark:bg-gray-700/30 rounded-lg">
                  🔵 Ensure uploaded files are supervisor-approved.
                </li>
                <li className="p-3 bg-white/50 dark:bg-gray-700/30 rounded-lg">
                  🔵 Unapproved submissions may result in mark deduction.
                </li>
                <li className="p-3 bg-white/50 dark:bg-gray-700/30 rounded-lg">
                  🔵 Wait for coordinator review after submission.
                </li>
                <li className="p-3 bg-white/50 dark:bg-gray-700/30 rounded-lg">
                  🔵 Milestone Progress depends on in-uni event results.
                </li>
              </ul>
            </Card>
          </Card>
        </main >
      </div >
    </div >
    </>
  );
}