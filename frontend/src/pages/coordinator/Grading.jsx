import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Search, ChevronsUpDown, Check, Upload, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import Pagination from "@/components/Pagination";

const CoordinatorGrading = () => {
  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");
  const { user } = useSelector((store) => store.auth)
  const [phase, setPhase] = useState("Progress");
  const [milestones, setMilestones] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(undefined);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [allGrades, setAllGrades] = useState([]);

  // Search states
  const [searchGroupName, setSearchGroupName] = useState("");
  const [searchPhase, setSearchPhase] = useState("all");
  const [searchMemberName, setSearchMemberName] = useState("");
  const [searchRollNo, setSearchRollNo] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Rubrics based on phase
  const PROGRESS_RUBRICS = {
    presentation: [
      { label: "Background and Literature Review", max: 5 },
      { label: "Technical Approach", max: 10 },
      { label: "Problem Solving", max: 10 },
      { label: "Critical Thinking", max: 10 },
      { label: "Communication Skills", max: 5 },
    ],
    report: [
      { label: "Accountability", max: 3 },
      { label: "Abstract", max: 2 },
      { label: "Background Study", max: 3 },
      { label: "Problem Statement", max: 3 },
      { label: "Scope and Objectives", max: 3 },
      { label: "Significance", max: 3 },
      { label: "Comparison with Existing Systems", max: 4 },
      { label: "Methodology", max: 4 },
      { label: "Proposed System", max: 5 },
      { label: "Milestones", max: 2 },
      { label: "References", max: 2 },
      { label: "Writing Skills", max: 2 },
      { label: "Organization", max: 2 },
      { label: "Quality", max: 2 },
    ],
  };

  const DEFENCE_RUBRICS = {
    presentation: [
      { label: "Background and Literature Review", max: 5 },
      { label: "Technical Approach", max: 10 },
      { label: "Problem Solving", max: 10 },
      { label: "Critical Thinking", max: 10 },
      { label: "Communication Skills", max: 5 },
    ],
    report: [
      { label: "Accountability", max: 3 },
      { label: "Abstract", max: 1 },
      { label: "Chapter 1: Background Study", max: 2 },
      { label: "Chapter 1: Problem Statement", max: 2 },
      { label: "Chapter 1: Scope and Objectives", max: 2 },
      { label: "Chapter 2: Background and Existing Work", max: 4 },
      { label: "Chapter 3: Proposed System", max: 5 },
      { label: "Chapter 4: System Design", max: 5 },
      { label: "Chapter 5: Implementation", max: 5 },
      { label: "Chapter 6: Testing Results", max: 2 },
      { label: "Chapter 7: Conclusion and Future Work", max: 2 },
      { label: "References", max: 1 },
      { label: "Writing Skills", max: 1 },
      { label: "Organization", max: 1 },
      { label: "Quality", max: 2 },
    ],
  };

  const currentRubrics = phase === "Progress" ? PROGRESS_RUBRICS : DEFENCE_RUBRICS;
  const allRubrics = [...currentRubrics.presentation, ...currentRubrics.report];

  const loadMilestones = async () => {
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
        // filter out FYP Completed groups
        const completedphaseFiltered = departmentFiltered.filter(
          (m) => m.phase !== "Completed"
        )

        setMilestones(completedphaseFiltered);
      } else {
        setMilestones([]);
      }
    } catch (e) {
      toast.error("Failed to load milestones");
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  };


  const loadAllGrades = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiURL}/grading/get-all-grades`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      if (res.data.success) {
        const allGrades = res.data.data || [];
        const departmentFiltered = allGrades.filter(
          (g) => g.milestoneId?.department === user?.department
        );

        setAllGrades(departmentFiltered);
      } else {
        setAllGrades([]);
      }
    } catch (e) {
      toast.error("Failed to load grades");
      setAllGrades([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadMilestones();
    loadAllGrades();
  }, []);

  const currentPhaseGroups = useMemo(
    () =>
      milestones
        .filter((m) => m.phase === phase)
        .map((m) => ({
          groupId: typeof m.groupId === "object" ? m.groupId._id : m.groupId,
          groupName:
            typeof m.groupId === "object" ? m.groupId.groupName : m.groupId,
          members:
            typeof m.groupId === "object" ? m.groupId.members || [] : [],
        })),
    [milestones, phase]
  );

  const selectedGroup = currentPhaseGroups.find(
    (g) => g.groupId === selectedGroupId
  );

  // Handle rubric marks change
  const handleRubricChange = (memberId, rubricIndex, value) => {
    const rubric = allRubrics[rubricIndex];
    const numValue = Math.max(0, Math.min(Number(value) || 0, rubric.max));

    if (Number.isNaN(numValue)) return;

    // Store current scroll position
    const scrollY = window.scrollY;

    setMarks(prev => ({
      ...prev,
      [memberId]: prev[memberId]?.map((mark, idx) =>
        idx === rubricIndex ? numValue : mark
      ) || allRubrics.map((_, idx) => idx === rubricIndex ? numValue : 0)
    }));

    // Restore scroll position after state update
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  // Calculate total marks for a student (0-80)
  const calculateTotal = (memberId) => {
    const studentMarks = marks[memberId] || [];
    return studentMarks.reduce((sum, mark) => sum + (Number(mark) || 0), 0);
  };

  const submitMark = async (studentId) => {
    const totalMarks = calculateTotal(studentId);
    if (totalMarks === 0) {
      toast.error("Please enter marks before submitting");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${apiURL}/grading/coordinator`,
        { groupId: selectedGroupId, phase, studentId, marks: totalMarks },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        await loadAllGrades();
        setMarks(prev => ({
          ...prev,
          [studentId]: allRubrics.map(() => 0)
        }));
      }
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data || "Failed to submit marks";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Check if coordinator marks exist for this student & phase
  const hasExistingCoordinatorGrade = (studentId) =>
    allGrades.some(
      (g) =>
        g.studentId?._id === studentId &&
        g.phase === phase &&
        g.coordinatorMarks !== 0
    );

  // Filtered grades (filters apply to ALL data, not just current page)
  const filteredRecordedGrades = useMemo(() => {
    const termGroup = searchGroupName.toLowerCase();
    const termMember = searchMemberName.toLowerCase();
    const termRollNo = searchRollNo.toLowerCase();

    return allGrades.filter((g) => {
      const gGroupName =
        g.groupId && typeof g.groupId === "object"
          ? g.groupId.groupName.toLowerCase()
          : "";
      const gStudentName =
        g.studentId && typeof g.studentId === "object"
          ? (g.studentId.username || "").toLowerCase()
          : "";
      const gRollNo =
        g.studentId && typeof g.studentId === "object"
          ? (g.studentId.rollNo || "").toLowerCase()
          : "";
      const gPhase = g.phase || "";

      const groupMatch = gGroupName.includes(termGroup);
      const memberMatch = gStudentName.includes(termMember);
      const rollNoMatch = gRollNo.includes(termRollNo);
      const phaseMatch = searchPhase === "all" ? true : gPhase === searchPhase;

      return groupMatch && memberMatch && rollNoMatch && phaseMatch;
    });
  }, [allGrades, searchGroupName, searchPhase, searchMemberName, searchRollNo]);

  // Paginated grades (only for display)
  const paginatedGrades = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRecordedGrades.slice(startIndex, endIndex);
  }, [filteredRecordedGrades, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRecordedGrades.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchGroupName, searchPhase, searchMemberName, searchRollNo]);

  // Render student grading form for a single member
  const StudentGradingForm = ({ member }) => {
    const totalMarks = calculateTotal(member._id);
    const existingGrade = allGrades.find(g => 
      (g.studentId._id === member._id || g.studentId === member._id) && g.phase === phase
    );
    const hasSubmittedGrades = existingGrade && existingGrade.coordinatorMarks > 0;

    // Calculate section totals
    const presentationTotal = currentRubrics.presentation.reduce((sum, _, idx) => 
      sum + (Number(marks[member._id]?.[idx]) || 0), 0
    );
    const reportTotal = currentRubrics.report.reduce((sum, _, idx) => {
      const actualIndex = currentRubrics.presentation.length + idx;
      return sum + (Number(marks[member._id]?.[actualIndex]) || 0);
    }, 0);

    return (
      <div className="space-y-8">
        {/* Student Info Header */}
        <div className="bg-purple-50 dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xl text-gray-900 dark:text-white">{member.username || member.email}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{member.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Roll Number</p>
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                {member.rollNo || "Not Set"}
              </p>
            </div>
          </div>
        </div>

        {/* Presentation Section */}
        <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-purple-600">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              📊 Presentation Evaluation
            </h3>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Section Total</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{presentationTotal}/40</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentRubrics.presentation.map((rubric, index) => (
              <div key={rubric.label} className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                  {rubric.label}
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 font-normal">(Max: {rubric.max})</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  max={rubric.max}
                  step="0.5"
                  placeholder="0"
                  value={marks[member._id]?.[index] || ""}
                  onChange={(e) => handleRubricChange(member._id, index, e.target.value)}
                  disabled={loading}
                  className="text-center text-lg font-medium bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-lg h-12"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Report Section */}
        <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-blue-600">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              📝 {phase === "Progress" ? "Progress Report" : "Project Report"} Evaluation
            </h3>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Section Total</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{reportTotal}/40</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentRubrics.report.map((rubric, index) => {
              const actualIndex = currentRubrics.presentation.length + index;
              return (
                <div key={rubric.label} className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                    {rubric.label}
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 font-normal">(Max: {rubric.max})</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max={rubric.max}
                    step="0.5"
                    placeholder="0"
                    value={marks[member._id]?.[actualIndex] || ""}
                    onChange={(e) => handleRubricChange(member._id, actualIndex, e.target.value)}
                    disabled={loading}
                    className="text-center text-lg font-medium bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-lg h-12"
                  />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Total and Submit Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Grand Total</p>
            <p className="text-5xl font-extrabold text-purple-600 dark:text-purple-400">
              {totalMarks}/80
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Presentation: {presentationTotal}/40 • Report: {reportTotal}/40
            </p>
          </div>
          <Button
            onClick={() => submitMark(member._id)}
            disabled={loading || totalMarks === 0}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-lg transition-all duration-200 text-lg font-bold"
          >
            {loading ? (
              "Submitting..."
            ) : (
              <>
                <Upload className="w-6 h-6 mr-2" />
                {hasSubmittedGrades ? "Edit Marks" : "Submit Marks"}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
    <SEO 
      title="Grading Overview | FYP Buddy - Coordinator Panel"
      description="View and manage all FYP grades. Monitor student evaluations, review rubrics, and oversee the grading process across all groups."
      keywords="FYP grading, evaluation overview, rubric management, academic assessment"
    />
    <div className="min-h-screen mt-16">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        <Sidebar portalType="coordinator" />
        <main className="flex flex-col gap-6 w-full">
          {/* Header */}
          <Card className="w-full max-w-5xl mx-auto text-center p-8 bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Coordinator{" "}
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Grading
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Select a phase and group to record coordinator marks and review
              grades.
            </p>
          </Card>

          {/* Filters */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Phase */}
              <div>
                <label className="text-sm block mb-1 ">Phase</label>
                <Select value={phase} onValueChange={setPhase}>
                  <SelectTrigger className="border border-gray-400 dark:border-gray-700">
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Progress">Progress</SelectItem>
                    <SelectItem value="Defence">Defence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Group Searchable */}
              <div>
                <label className="text-sm block mb-1">Group</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between border border-gray-400 dark:border-gray-700"
                    >
                      {selectedGroupId
                        ? currentPhaseGroups.find(
                          (g) => g.groupId === selectedGroupId
                        )?.groupName
                        : "Select group..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search group..." />
                      <CommandList>
                        <CommandEmpty>No group found.</CommandEmpty>
                        <CommandGroup>
                          {currentPhaseGroups.map((g) => (
                            <CommandItem
                              key={g.groupId}
                              value={g.groupId}
                              onSelect={() => setSelectedGroupId(g.groupId)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedGroupId === g.groupId
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {g.groupName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Refresh */}
              <div className="flex items-end">
                <Button
                  onClick={loadAllGrades}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh Grades
                </Button>
              </div>
            </div>
          </Card>

          {/* Enter Marks */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl space-y-4">
            {!selectedGroup ? (
              <div className="text-center py-12">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select a group to grade
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a group from the dropdown to begin grading their {phase} phase.
                </p>
              </div>
            ) : selectedGroup?.members?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No members found in this group.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Grade Group Members ({selectedGroup.members.filter(m => m && m._id).length})
                  </h2>
                </div>

                <Tabs defaultValue={selectedGroup.members.filter(m => m && m._id)[0]?._id} className="w-full">
                  <div className="flex justify-center mb-6">
                    <TabsList className="inline-flex w-auto gap-1 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 p-0 rounded-none h-auto">
                      {selectedGroup.members.filter(m => m && m._id).map((member) => (
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

                  {selectedGroup.members.filter(m => m && m._id).map((member) => (
                    <TabsContent key={member._id} value={member._id} className="mt-6">
                      <StudentGradingForm member={member} />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </Card>

          {/* Recorded Grades */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl space-y-4">
            <h3 className="text-lg font-semibold mb-2">Recorded Grades</h3>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search group name..."
                  value={searchGroupName}
                  onChange={(e) => setSearchGroupName(e.target.value)}
                  className="pl-10 border border-gray-400 dark:border-gray-700"
                />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search member name..."
                  value={searchMemberName}
                  onChange={(e) => setSearchMemberName(e.target.value)}
                  className="pl-10 border border-gray-400 dark:border-gray-700"
                />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search roll number..."
                  value={searchRollNo}
                  onChange={(e) => setSearchRollNo(e.target.value)}
                  className="pl-10 border border-gray-400 dark:border-gray-700"
                />
              </div>

              <div>
                <Select value={searchPhase} onValueChange={setSearchPhase}>
                  <SelectTrigger className={"border border-gray-400 dark:border-gray-700"}>
                    <SelectValue placeholder="Filter by phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Phases</SelectItem>
                    <SelectItem value="Progress">Progress</SelectItem>
                    <SelectItem value="Defence">Defence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grades Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <Table className="min-w-full text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>Group</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Coordinator</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedGrades.map((g) => {
                    const gGroupName =
                      typeof g.groupId === "object"
                        ? g.groupId.groupName
                        : g.groupId;
                    const gStudent = typeof g.studentId === "object" ? g.studentId : null;
                    const gStudentName = gStudent?.username || "Unknown";
                    const gStudentRollNo = gStudent?.rollNo || "Not Set";
                    return (
                      <TableRow key={g._id}>
                        <TableCell>{gGroupName}</TableCell>
                        <TableCell>{gStudentName}</TableCell>
                        <TableCell>{gStudentRollNo}</TableCell>
                        <TableCell>{g.phase}</TableCell>
                        <TableCell>{g.supervisorMarks ?? 0}</TableCell>
                        <TableCell>{g.coordinatorMarks ?? 0}</TableCell>
                        <TableCell className="font-medium">
                          {(g.supervisorMarks || 0) +
                            (g.coordinatorMarks || 0)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredRecordedGrades.length > 0 && (
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Left: Items per page selector */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-gray-600 dark:text-gray-400">entries</span>
                </div>

                {/* Center: Showing info */}
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Showing <span className="text-gray-800 dark:text-white">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
                  <span className="text-gray-800 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredRecordedGrades.length)}</span> of{" "}
                  <span className="text-gray-800 dark:text-white">{filteredRecordedGrades.length}</span> grades
                </div>

                {/* Right: Page Navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                      {currentPage}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">/</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {totalPages || 1}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
    </>
  );
};

export default CoordinatorGrading;
