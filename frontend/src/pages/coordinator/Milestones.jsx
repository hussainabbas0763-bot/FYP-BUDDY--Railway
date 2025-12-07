import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Clock, Calendar, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import Pagination from "@/components/Pagination";

const CoordinatorMilestones = () => {
  const apiURL = import.meta.env.VITE_API_URL;
  const { user } = useSelector((store) => store.auth)
  const [loading, setLoading] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [activateForm, setActivateForm] = useState({
    phase: "Proposal",
    submissionDeadline: "",
    gradingDeadline: "",
    conductionDate: "",
    autoAllocationDate: "",
  });
  const [statusUpdate, setStatusUpdate] = useState({});
  const [openPhases, setOpenPhases] = useState([]);
  const [phaseFilter, setPhaseFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const accessToken = localStorage.getItem("accessToken");

  const fetchAllMilestones = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiURL}/milestone/get-all-milestones`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      if (res.data.success) {
        const allMilestones = res.data.data || [];

        // ✅ Filter milestones by coordinator’s department
        const departmentFiltered = allMilestones.filter(
          (m) => m.department === user?.department
        );

        const completedphaseFiltered = departmentFiltered.filter(
          (m) => m.phase !== "Completed"
        )

        setMilestones(completedphaseFiltered);

        // ✅ Get open phases from filtered milestones
        const open = [
          ...new Set(
            departmentFiltered
              .filter((m) => m.isSubmissionActive)
              .map((m) => m.phase)
          ),
        ];
        setOpenPhases(open);
      } else {
        setMilestones([]);
        setOpenPhases([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load milestones");
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAllMilestones();
  }, []);

  const handleActivateSubmission = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.put(`${apiURL}/milestone/open-submission`,
        {
          phase: activateForm.phase,
          submissionDeadline: activateForm.submissionDeadline,
          gradingDeadline: activateForm.gradingDeadline ,
          conductionDate: activateForm.conductionDate || undefined,
          autoAllocationDate: activateForm.autoAllocationDate ,
          department: user?.department,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        await fetchAllMilestones();
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to open submission";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (groupId) => {
    const newStatus = statusUpdate[groupId];
    if (!newStatus) return;
    try {
      setLoading(true);
      const res = await axios.put(
        `${apiURL}/milestone/update-milestone/${groupId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        await fetchAllMilestones();
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to update the status";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isPhaseOpen = openPhases.includes(activateForm.phase);
  const filteredMilestones = useMemo(() => {
    let filtered = milestones;

    if (phaseFilter !== "All") {
      filtered = filtered.filter((m) => m.phase === phaseFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter((m) =>
        m.groupId?.groupName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [milestones, phaseFilter, searchTerm]);

  // Pagination logic
  const paginatedMilestones = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredMilestones.slice(startIndex, endIndex);
  }, [filteredMilestones, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredMilestones.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [phaseFilter, searchTerm]);

  return (
    <>
    <SEO 
      title="Milestones Management | FYP Buddy - Coordinator Panel"
      description="Manage FYP milestones across all groups. Create phases, set deadlines, and monitor student progress throughout the project lifecycle."
      keywords="milestone management, FYP phases, project deadlines, coordinator tools"
    />
    <div className="min-h-screen mt-15">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        <Sidebar portalType="coordinator" />

        <main className="flex flex-col gap-5 w-full">
          {/* Header */}
          <Card className="w-full max-w-5xl mx-auto text-center p-8 bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
              Milestone {" "}
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Management
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Activate or edit submission windows and manage milestone statuses
              across groups.
            </p>
          </Card>

          {/* Activate/Edit Submission */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-5">
              Manage Submission Window
            </h2>

            <form
              onSubmit={handleActivateSubmission}
              className="flex flex-wrap md:flex-nowrap items-end gap-3"
            >
              <div className="flex flex-col w-[160px]">
                <label className="text-sm font-medium mb-1">Phase</label>
                <select
                  className="border border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md h-10 px-2"
                  value={activateForm.phase}
                  onChange={(e) =>
                    setActivateForm((s) => ({ ...s, phase: e.target.value }))
                  }
                >
                  <option value="Proposal">Proposal</option>
                  <option value="Progress">Progress</option>
                  <option value="Defence">Defence</option>
                </select>
              </div>

              <div className="flex flex-col w-[220px]">
                <label className="text-sm font-medium mb-1">
                  Submission Deadline
                </label>
                <Input
                  type="datetime-local"
                  className="border border-gray-400 dark:border-gray-700 h-10 rounded-md px-3 dark:bg-gray-900 dark:text-gray-100"
                  value={activateForm.submissionDeadline}
                  onChange={(e) =>
                    setActivateForm((s) => ({
                      ...s,
                      submissionDeadline: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Add grading deadline input conditionally */}
              {(activateForm.phase === "Progress" || activateForm.phase === "Defence") && (
                <div className="flex flex-col w-[220px]">
                  <label className="text-sm font-medium mb-1">
                    Grading Deadline
                  </label>
                  <Input
                    type="datetime-local"
                    className="border border-gray-400 dark:border-gray-700 h-10 rounded-md px-3 dark:bg-gray-900 dark:text-gray-100"
                    value={activateForm.gradingDeadline}
                    onChange={(e) =>
                      setActivateForm((s) => ({
                        ...s,
                        gradingDeadline: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div className="flex flex-col w-[200px]">
                <label className="text-sm font-medium mb-1">
                  Conduction Date (optional)
                </label>
                <Input
                  type="date"
                  className="border border-gray-400 dark:border-gray-700 h-10 rounded-md px-3 dark:bg-gray-900 dark:text-gray-100"
                  value={activateForm.conductionDate}
                  onChange={(e) =>
                    setActivateForm((s) => ({
                      ...s,
                      conductionDate: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Auto Allocation Date - Only for Proposal Phase */}
              {activateForm.phase === "Proposal" && (
                <div className="flex flex-col w-[220px]">
                  <label className="text-sm font-medium mb-1">
                    Auto Supervisor Allocation Date
                  </label>
                  <Input
                    type="datetime-local"
                    className="border border-gray-400 dark:border-gray-700 h-10 rounded-md px-3 dark:bg-gray-900 dark:text-gray-100"
                    value={activateForm.autoAllocationDate}
                    onChange={(e) =>
                      setActivateForm((s) => ({
                        ...s,
                        autoAllocationDate: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !activateForm.phase ||
                    !activateForm.submissionDeadline
                  }
                  className={`h-10 px-5 rounded-md font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white `}
                >
                  {isPhaseOpen ? "Edit" : "Activate"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Active Phase Deadlines Overview */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Active Phase Deadlines
            </h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {["Proposal", "Progress", "Defence"].map((phaseName, index) => {
                  const phaseData = milestones.find(
                    (m) => m.phase === phaseName && m.isSubmissionActive
                  );
                  
                  
                  return (
                    <Card
                      key={phaseName}
                      className={"relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg border-gray-700 dark:border-gray-200 bg-gray-200 dark:bg-gray-800"
                    }
                    >
                      {/* Header with Icon */}
                      <div className="p-4 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-blue-400 flex items-center justify-center`}>
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                              {phaseName}
                            </h3>
                            <div className="flex items-center gap-1 mt-0.5">
                              {phaseData ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Inactive</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="px-4 pb-4">
                        {phaseData ? (
                          <div className="space-y-3">
                            {/* Submission Deadline */}
                            <div className="flex items-start gap-2 p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                              <Clock className="w-4 h-4 mt-0.5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Submission Deadline</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {phaseData.submissionDeadline
                                    ? new Date(phaseData.submissionDeadline).toLocaleString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })
                                    : "—"}
                                </p>
                              </div>
                            </div>

                            {/* Grading Deadline */}
                            {phaseData.gradingDeadline && (
                              <div className="flex items-start gap-2 p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                                <AlertCircle className="w-4 h-4 mt-0.5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Grading Deadline</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {new Date(phaseData.gradingDeadline).toLocaleString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Conduction Date */}
                            {phaseData.conductionDate && (
                              <div className="flex items-start gap-2 p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                                <Calendar className="w-4 h-4 mt-0.5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Conduction Date</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {new Date(phaseData.conductionDate).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric"
                                    })}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Auto Allocation (Proposal only) */}
                            {phaseName === "Proposal" && phaseData.autoAllocationDate && (
                              <div className="flex items-start gap-2 p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                                <Clock className="w-4 h-4 mt-0.5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Auto Supervisor Allocation Deadline</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {new Date(phaseData.autoAllocationDate).toLocaleString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <XCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                No active submission window
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Groups Management Table */}
          <Card className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Groups Management
              </h2>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:static">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap">Filter by Phase:</label>
                  <select
                    value={phaseFilter}
                    onChange={(e) => setPhaseFilter(e.target.value)}
                    className="border border-gray-400 dark:border-gray-700 rounded-md h-9 px-2 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="All">All</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Progress">Progress</option>
                    <option value="Defence">Defence</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap">Search:</label>
                  <Input
                    type="text"
                    placeholder="Search by group name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-400 dark:border-gray-700 rounded-md h-9 px-2 dark:bg-gray-900 dark:text-gray-100 w-full sm:w-auto"
                  />
                </div>
              </div>
            </div>


            {loading ? (
              <div className="w-full max-w-6xl mx-auto p-10 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Loading milestones…
                </p>
              </div>
            ) : filteredMilestones.length === 0 ? (
              <div className="w-full max-w-6xl mx-auto p-10 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No Groups found within the filters.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Group Name</TableHead>
                        <TableHead className="whitespace-nowrap">Current Phase</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Submission Window</TableHead>
                        <TableHead className="text-center whitespace-nowrap">Update Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMilestones.map((m) => {
                        const groupName =
                          typeof m.groupId === "object"
                            ? m.groupId.groupName
                            : m.groupId;

                        return (
                          <TableRow
                            key={m._id}
                            className="hover:bg-gray-50/70 dark:hover:bg-gray-900/40"
                          >
                            <TableCell>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {groupName}
                              </div>
                            </TableCell>

                            <TableCell>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                {m.phase}
                              </span>
                            </TableCell>

                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${m.status === "Completed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : m.status === "Failed"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                  }`}
                              >
                                {m.status}
                              </span>
                            </TableCell>

                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${m.isSubmissionActive
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                  }`}
                              >
                                {m.isSubmissionActive ? "Open" : "Closed"}
                              </span>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <select
                                  value={statusUpdate[m.groupId?._id || m.groupId] || ""}
                                  onChange={(e) =>
                                    setStatusUpdate((s) => ({
                                      ...s,
                                      [m.groupId?._id || m.groupId]: e.target.value,
                                    }))
                                  }
                                  className="border border-gray-400 dark:border-gray-700 rounded-md h-9 px-2 text-sm dark:bg-gray-900 dark:text-gray-100"
                                >
                                  <option value="">Select status</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Failed">Failed</option>
                                </select>

                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateStatus(m.groupId?._id || m.groupId)
                                  }
                                  disabled={
                                    loading ||
                                    !statusUpdate[m.groupId?._id || m.groupId]
                                  }
                                  className="whitespace-nowrap bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                                >
                                  Update
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {filteredMilestones.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredMilestones.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(value) => {
                      setItemsPerPage(value);
                      setCurrentPage(1);
                    }}
                    itemLabel="groups"
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

export default CoordinatorMilestones;
