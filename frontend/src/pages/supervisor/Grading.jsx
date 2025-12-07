import React, { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Lock, Users, Upload, AlertCircle, List, GraduationCap } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import SEO from "@/components/SEO";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SupervisorGrading() {
    const apiURL = import.meta.env.VITE_API_URL;
    const accessToken = localStorage.getItem("accessToken");

    const [groups, setGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [milestone, setMilestone] = useState(null);
    const [grades, setGrades] = useState([]);

    // 6 Rubrics for supervisor grading (total 20)
    const RUBRICS = [
        { label: "Engagement in Weekly Interactions", max: 5, description: "Active participation in weekly meetings" },
        { label: "Task Progress Reporting", max: 3, description: "Regular and clear progress updates" },
        { label: "Understanding", max: 3, description: "Understanding of project scope and requirements" },
        { label: "Explanation", max: 3, description: "Ability to explain work and decisions" },
        { label: "Supporting References", max: 3, description: "Use of appropriate references and resources" },
        { label: "Weekly Entry", max: 3, description: "Consistent weekly documentation" },
    ];

    const [marks, setMarks] = useState({});
    const [loading, setLoading] = useState({ groups: false, details: false, submit: false });

    const selectedGroup = groups.find((g) => g._id === selectedGroupId) || null;
    const members = selectedGroup?.members || [];
    const gradingDeadline = milestone?.gradingDeadline;
    const isGradingClosed = gradingDeadline ? new Date(gradingDeadline) < new Date() : false;
    const isValidPhase = milestone?.phase === "Progress" || milestone?.phase === "Defence";

    const formatDeadline = (date) => {
        if (!date) return "No deadline set";
        return new Date(date).toLocaleString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Fetch supervisor's groups
    const fetchGroups = useCallback(async () => {
        if (!accessToken) {
            toast.error("Please login again");
            return;
        }

        try {
            setLoading(prev => ({ ...prev, groups: true }));
            const res = await axios.get(`${apiURL}/supervisor/my-groups`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }, withCredentials: true
            });

            if (res.data?.success && Array.isArray(res.data.groups)) {
                setGroups(res.data.groups);
            } else {
                toast.error("Failed to load groups");
                setGroups([]);
            }
        } catch (err) {
            console.error("Error fetching groups:", err);
            toast.error(err.response?.data?.message || "Failed to load your groups");
            setGroups([]);
        } finally {
            setLoading(prev => ({ ...prev, groups: false }));
        }
    }, [apiURL, accessToken]);

    // Load groups on component mount
    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    // Fetch group grades
    const fetchGroupGrades = async (currentMilestone) => {
        if (!selectedGroupId || !currentMilestone) return;

        setLoading(true);
        try {
            const res = await axios.get(
                `${apiURL}/grading/get-group-marks/${selectedGroupId}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    withCredentials: true,
                }
            );

            if (res.data.success) {
                const gradesData = res.data.data;

                // Filter grades for the current milestone phase
                const filteredGrades = gradesData.filter(
                    (grade) => grade.phase === currentMilestone.phase
                );

                if (filteredGrades.length > 0) {
                    setGrades(filteredGrades);
                } else {
                    setGrades([]);
                    toast.error("No grades available for the current phase");
                }
            } else {
                setGrades([]);
                toast.error(res.data.message || "Failed to fetch grades");
            }
        } catch (error) {
            const message =
                error.response?.data?.message || "Failed to fetch grades";
            toast.error(message);
            console.error("Error fetching grades:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch milestone and grades when a group is selected
    useEffect(() => {
        if (!selectedGroupId) {
            setMilestone(null);
            setMarks({});
            setGrades([]);
            return;
        }

        const fetchGroupMilestone = async () => {
            try {
                setLoading((prev) => ({ ...prev, details: true }));
                setMarks({});

                const res = await axios.get(
                    `${apiURL}/milestone/get-my-milestone/${selectedGroupId}`,
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        withCredentials: true,
                    }
                );

                if (res.data.success) {
                    const fetchedMilestone = res.data.milestone;
                    setMilestone(fetchedMilestone);

                    // Pass milestone directly to avoid null issue
                    fetchGroupGrades(fetchedMilestone);
                } else {
                    setMilestone(null);
                    toast.error("Failed to fetch milestone details");
                }
            } catch (err) {
                console.error("Error fetching milestone:", err);
                toast.error(
                    err.response?.data?.message || "Failed to fetch milestone details"
                );
                setMilestone(null);
            } finally {
                setLoading((prev) => ({ ...prev, details: false }));
            }
        };

        fetchGroupMilestone();
    }, [selectedGroupId, apiURL, accessToken]);


    // Handle rubric marks change
    const handleRubricChange = (memberId, rubricIndex, value) => {
        if (isGradingClosed || !isValidPhase) return;

        const rubric = RUBRICS[rubricIndex];
        const numValue = Math.max(0, Math.min(Number(value) || 0, rubric.max));

        if (Number.isNaN(numValue)) return;

        setMarks(prev => ({
            ...prev,
            [memberId]: prev[memberId]?.map((mark, idx) =>
                idx === rubricIndex ? numValue : mark
            ) || RUBRICS.map((_, idx) => idx === rubricIndex ? numValue : 0)
        }));
    };

    // Calculate total marks for a student (0-20)
    const calculateTotal = (memberId) => {
        const studentMarks = marks[memberId] || [];
        return studentMarks.reduce((sum, mark) => sum + (Number(mark) || 0), 0);
    };

    // Submit marks for a student
    const submitMarks = async (memberId) => {
        if (!selectedGroupId || !milestone || !isValidPhase) return;

        const member = members.find(m => m._id === memberId);
        if (!member) return;

        const totalMarks = calculateTotal(memberId);
        if (totalMarks === 0) {
            toast.error("Please enter marks before submitting");
            return;
        }

        try {
            setLoading(prev => ({ ...prev, submit: true }));

            const payload = {
                studentId: memberId,
                groupId: selectedGroupId,
                phase: milestone.phase,
                marks: totalMarks
            };

            const res = await axios.post(
                `${apiURL}/grading/supervisor`,
                payload,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (res.data?.success) {
                toast.success(`Marks submitted for ${member.username || member.email}`);
                fetchGroupGrades(milestone);
                setMarks(prev => ({
                    ...prev,
                    [memberId]: RUBRICS.map(() => 0)
                }));
            } else {
                toast.error(res.data?.message || "Failed to submit marks");
            }
        } catch (err) {
            console.error("Error submitting marks:", err);
            toast.error(err.response?.data?.message || "Failed to submit marks");
        } finally {
            setLoading(prev => ({ ...prev, submit: false }));
        }
    };


    // Render student grading form for a single member
    const StudentGradingForm = ({ member }) => {
        const totalMarks = calculateTotal(member._id);
        
        // Check if this member already has submitted grades
        const existingGrade = grades.find(g => g.studentId._id === member._id || g.studentId === member._id);
        const hasSubmittedGrades = !!existingGrade;

        return (
            <div className="space-y-6">
                {/* Student Info Header */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white">{member.username || member.email}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Roll Number</p>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {member.rollNo || "Not Set"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Rubrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {RUBRICS.map((rubric, index) => (
                        <div key={rubric.label} className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {rubric.label}
                                <span className="text-xs text-gray-500 ml-1">(Max: {rubric.max})</span>
                            </Label>
                            <Input
                                type="number"
                                min="0"
                                max={rubric.max}
                                step="0.5"
                                placeholder="0"
                                value={marks[member._id]?.[index] || ""}
                                onChange={(e) => handleRubricChange(member._id, index, e.target.value)}
                                disabled={isGradingClosed || !isValidPhase || loading.submit}
                                className="text-center text-lg font-medium bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-lg h-12"
                            />
                        </div>
                    ))}
                </div>

                {/* Total and Submit Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center sm:text-left">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Marks</p>
                        <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            {totalMarks}/20
                        </p>
                    </div>
                    <Button
                        onClick={() => submitMarks(member._id)}
                        disabled={isGradingClosed || !isValidPhase || loading.submit || totalMarks === 0}
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg transition-all duration-200 text-base font-medium"
                    >
                        {loading.submit ? (
                            "Submitting..."
                        ) : (
                            <>
                                <Upload className="w-5 h-5 mr-2" />
                                {hasSubmittedGrades ? "Edit Marks" : "Submit Marks"}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        );
    };

    // Render recorded grades table
    const RecordedGradesTable = ({ grades }) => {
        if (!grades || grades.length === 0) {
            return (
                <div className="text-center py-6 text-gray-600 dark:text-gray-400">
                    No recorded grades available.
                </div>
            );
        }

        return (
            <Card className={"w-full mt-2 p-5 bg-white dark:bg-gray-800 shadow-md rounded-2xl"}>
                <Table className="w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[25%]">Student Name</TableHead>
                            <TableHead className="w-[30%]">Email</TableHead>
                            <TableHead className="w-[20%]">Roll Number</TableHead>
                            <TableHead className="w-[25%] text-right">Supervisor Marks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {grades.map((grade) => (
                            <TableRow key={grade.studentId}>
                                <TableCell>{grade.studentName || "Unknown Student"}</TableCell>
                                <TableCell className="text-sm text-gray-600 dark:text-gray-400">{grade.email || "N/A"}</TableCell>
                                <TableCell>{grade.rollNo || "Not Set"}</TableCell>
                                <TableCell className="text-right font-medium">{grade.supervisorMarks || 0}/20</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        );
    };

    return (
        <>
        <SEO 
          title="Grading | FYP Buddy - Evaluate Student Work"
          description="Grade and evaluate FYP submissions. Assess milestones, tasks, and final projects for your supervised student groups."
          keywords="FYP grading, student evaluation, project assessment, academic grading"
        />
        <div className="min-h-screen mt-15">
            <div className="flex flex-col md:flex-row gap-5 p-5">
                {/* Sidebar */}
                <Sidebar portalType="supervisor" />

                {/* Main Section */}
                <main className="flex-1 flex flex-col gap-5">
                    {/* Header */}
                    <Card className="relative w-full max-w-5xl mx-auto text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                            Grade{" "}
                            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Groups
                            </span>{" "}

                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-base">
                            Review and assign grades for your supervised groups' progress and defence phases.
                        </p>
                    </Card>

                    {/* Group Selection Card */}
                    <Card className="w-full max-w-6xl mx-auto p-5 bg-white dark:bg-gray-800 shadow-md rounded-2xl">
                        <div className="flex flex-row flex-wrap items-center justify-between gap-6">

                            {/* Group Select */}
                            <Select
                                value={selectedGroupId || "none"}
                                onValueChange={(groupId) => setSelectedGroupId(groupId === "none" ? "" : groupId)}
                                disabled={loading.groups || loading.details}
                            >
                                <SelectTrigger className="w-48 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                    <SelectValue placeholder={loading.groups ? "Loading groups..." : "Choose a group"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        {loading.groups ? "Loading groups..." : "Choose a group"}
                                    </SelectItem>
                                    {groups.map((group) => (
                                        <SelectItem key={group._id} value={group._id}>
                                            {group.groupName || `Group ${group._id.slice(-4)}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Phase Display */}
                            <div className="text-center md:text-left font-medium text-gray-700 dark:text-gray-300">
                                {`Phase: ${milestone ? milestone.phase : "--"}`}
                            </div>

                            {/* Grading Deadline */}
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-gray-500" />
                                <div className="flex flex-col">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Grading Deadline:</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {formatDeadline(gradingDeadline)}
                                    </p>
                                </div>
                            </div>

                        </div>
                    </Card>



                    <Card className="w-full max-w-6xl mx-auto p-5 bg-white dark:bg-gray-800 shadow-md rounded-2xl">
                        {/* No group selected */}
                        {!selectedGroupId && !loading.details && (
                            <div className="text-center py-12">
                                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Select a group to grade their Phases
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Choose a group from the dropdown to begin grading their Progress or Defence phase.
                                </p>
                            </div>
                        )}

                        {/* Loading state */}
                        {loading.details && (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-600 dark:text-gray-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-3"></div>
                                <p>Loading group details...</p>
                            </div>
                        )}

                        {/* No milestone found */}
                        {!loading.details && selectedGroupId && !milestone && (
                            <div className="text-center py-12">
                                <List className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    No Milestone Found
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    There is currently no milestone assigned for this group.
                                </p>
                            </div>
                        )}

                        {/* Invalid phase */}
                        {!loading.details && milestone && !isValidPhase && (
                            <div className="text-center py-12">
                                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                                <h3 className="text-lg font-semibold text-yellow-600 mb-2">
                                    Grading Unavailable
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Grading is only available during Progress and Defence phases.
                                </p>
                            </div>
                        )}

                        {/* Grading closed */}
                        {!loading.details && isGradingClosed && (
                            <>
                                <div className="text-center py-4">
                                    <Lock className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                        Grading Closed
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        The grading deadline has passed for this milestone. Contact Coordinator incase of missing grades.
                                    </p>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                                        Recorded Grades
                                    </h2>
                                    <RecordedGradesTable grades={grades.length > 0 ? grades.map(g => {
                                        const member = members.find(m => m._id === g.studentId);
                                        return {
                                            studentId: g.studentId,
                                            studentName: member?.username || "Unknown Student",
                                            email: member?.email,
                                            rollNo: member?.rollNo,
                                            supervisorMarks: g.supervisorMarks
                                        };
                                    }) : []} />
                                </div>
                            </>
                        )}

                        {/* Group has no members */}
                        {!loading.details && selectedGroupId && milestone && isValidPhase && members.length === 0 && (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    No Members Found
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    This group currently has no assigned members.
                                </p>
                            </div>
                        )}

                        {/* Members list and grading with Tabs */}
                        {!loading.details && selectedGroupId && milestone && isValidPhase && members.length > 0 && !isGradingClosed && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Grade Group Members ({members.length})
                                    </h2>
                                </div>

                                <Tabs defaultValue={members[0]?._id} className="w-full">
                                    <div className="flex justify-center mb-6">
                                        <TabsList className="inline-flex w-auto gap-1 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 p-0 rounded-none h-auto">
                                            {members.map((member) => (
                                                <TabsTrigger
                                                    key={member._id}
                                                    value={member._id}
                                                    className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 data-[state=active]:bg-transparent bg-transparent hover:text-purple-500 hover:bg-gray-50 dark:hover:bg-gray-800 px-6 py-3 text-sm font-medium transition-all whitespace-nowrap text-gray-600 dark:text-gray-400"
                                                >
                                                    {member.username || member.email.split('@')[0]}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </div>

                                    {members.map((member) => (
                                        <TabsContent key={member._id} value={member._id} className="mt-6">
                                            <StudentGradingForm member={member} />
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </div>
                        )}
                    </Card>

                    {/* Recorded Grades Card - Separate */}
                    {!loading.details && selectedGroupId && milestone && isValidPhase && members.length > 0 && !isGradingClosed && (
                        <Card className="w-full max-w-6xl mx-auto p-5 bg-white dark:bg-gray-800 shadow-md rounded-2xl">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Recorded Grades
                            </h2>
                            <RecordedGradesTable grades={grades.length > 0 ? grades.map(g => {
                                const member = members.find(m => m._id === g.studentId._id || m._id === g.studentId);
                                return {
                                    studentId: g.studentId,
                                    studentName: member?.username || "Unknown Student",
                                    email: member?.email,
                                    rollNo: member?.rollNo,
                                    supervisorMarks: g.supervisorMarks
                                };
                            }) : []} />
                        </Card>
                    )}

                </main>
            </div>
        </div>
        </>
    );
}
