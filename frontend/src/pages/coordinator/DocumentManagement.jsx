import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SEO from "@/components/SEO";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Users, Search, Eye, Github } from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import Pagination from "@/components/Pagination";

const CoordinatorDocumentManagement = () => {
  const { user } = useSelector((store) => store.auth);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("submissionDate");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");

  // Fetch all milestones
  const fetchAllMilestones = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiURL}/milestone/get-all-milestones`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      });

      if (res.data.success) {
        const allMilestones = res.data.data || [];

        // ✅ Filter milestones by coordinator’s department
        const departmentFiltered = allMilestones.filter(
          (m) => m.department === user?.department
        );
          // filter out groups whose FYP are completed
        const completedphaseFiltered = departmentFiltered.filter(
          (m) => m.phase !== "Completed"
        )

        setMilestones(completedphaseFiltered);
      } else {
        setMilestones([]);
      }
    } catch (error) {
      console.error("Error fetching milestones:", error);
      toast.error("Failed to load milestones");
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMilestones();
  }, []);

  // Get document data for a specific phase
  const getDocumentData = (milestone, phase) => {
    // Helper function to safely get document data
    const phaseKey = phase?.toLowerCase();
    if (!phaseKey || !milestone.studentSubmission || !milestone.studentSubmission[phaseKey]) {
      return null;
    }
    return milestone.studentSubmission[phaseKey] || null;
  };


  const processedMilestones = useMemo(() => {
    let filtered = milestones
      .map((milestone) => {
        const documents = [];


        let phaseToCheck = milestone.phase;
        if (phaseToCheck === "Completed") {
          phaseToCheck = null;
        }

        const submittablePhases = ["Proposal", "Progress", "Defence"];

        if (submittablePhases.includes(phaseToCheck)) {

          const docData = getDocumentData(milestone, phaseToCheck);

          if (docData && docData.file) {
            documents.push({
              ...milestone,
              documentPhase: phaseToCheck,
              documentData: docData,
              groupName: milestone.groupId?.groupName || "Unknown Group",
              groupId: milestone.groupId?._id || milestone.groupId,
              members: milestone.groupId?.members || [],
            });
          }
        }

        return documents;
      })
      .flat();

    if (selectedPhase !== "All") {
      filtered = filtered.filter((doc) => doc.documentPhase === selectedPhase);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((doc) =>
        doc.groupName.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "submissionDate":
          aValue = new Date(a.documentData.submissionDate || 0);
          bValue = new Date(b.documentData.submissionDate || 0);
          break;
        case "groupName":
          aValue = a.groupName.toLowerCase();
          bValue = b.groupName.toLowerCase();
          break;
        case "phase":
          aValue = a.documentPhase;
          bValue = b.documentPhase;
          break;
        default:
          return 0;
      }

    });

    return filtered;
  }, [milestones, selectedPhase, searchTerm, sortBy]);

  // Pagination logic
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return processedMilestones.slice(startIndex, endIndex);
  }, [processedMilestones, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedMilestones.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPhase, searchTerm, sortBy]);


  // Handle view document
  const handleViewDocument = (fileUrl) => {
    window.open(fileUrl, "_blank");
  };

  const [uploadingDocs, setUploadingDocs] = useState(new Set());

  const handlePushToGitHub = async (doc) => {
    const docId = doc.groupId + "-" + doc.documentPhase;
    try {
      // Add to uploading set
      setUploadingDocs(prev => new Set(prev).add(docId));
      toast.loading("Pushing file to GitHub...", { id: docId });

      const res = await axios.post(
        `${apiURL}/thesis/push-to-github`,
        {
          cloudUrl: doc.documentData.file,
          groupName: doc.groupName,
          phase: doc.documentPhase,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data.success)
        toast.success(res.data.message, { id: docId });
      else {
        toast.error(res.data.message, { id: docId });
      }
    } catch (err) {
      toast.dismiss(docId);
      const errorMessage = err.response?.data?.message || "An error occurred";
      toast.error(errorMessage, { id: docId });
    } finally {
      // Remove from uploading set
      setUploadingDocs(prev => {
        const newSet = new Set(prev);
        newSet.delete(docId);
        return newSet;
      });
    }
  };


  // Format date
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

  // Get phase color
  const getPhaseColor = (phase) => {
    switch (phase) {
      case "Proposal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Progress":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Defence":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };


  return (
    <>
    <SEO 
      title="Document Management | FYP Buddy - Coordinator Panel"
      description="Manage all FYP thesis documents. Review submissions, track document status, and oversee the thesis submission process."
      keywords="document management, thesis submissions, FYP documents, coordinator oversight"
    />
    <div className="min-h-screen mt-15">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        <Sidebar portalType="coordinator" />

        <main className="flex flex-col gap-5 w-full">
          {/* Header */}
          <Card className="w-full max-w-5xl mx-auto text-center p-8 bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
              Document{" "}
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Management
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all submitted milestone documents from student groups.
            </p>
          </Card>

          {/* Filters and Controls */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-center">
              {/* Phase Filter */}
              <div className="md:col-span-1">
                <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                  Filter by Phase
                </label>
                <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                  <SelectTrigger className="border border-gray-400 dark:border-gray-700">
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Phases</SelectItem>
                    <SelectItem value="Proposal">Proposal</SelectItem>
                    <SelectItem value="Progress">Progress</SelectItem>
                    <SelectItem value="Defence">Defence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="md:col-span-1">
                <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                  Search Groups
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search by group name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border border-gray-400 dark:border-gray-700"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div className="md:col-span-1">
                <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="border border-gray-400 dark:border-gray-700">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submissionDate">Submission Date</SelectItem>
                    <SelectItem value="groupName">Group Name</SelectItem>
                    <SelectItem value="phase">Phase</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Documents Table */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
              </div>
            ) : (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Submitted Documents
                  </h2>
                  <Badge variant="outline" className="text-sm">

                    {processedMilestones.length} documents found
                  </Badge>
                </div>

                {processedMilestones.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No documents found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedPhase === "All"
                        ? "No documents have been submitted yet."
                        : `No documents found for ${selectedPhase} phase.`
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Group Name</TableHead>
                            <TableHead>Phase</TableHead>
                            <TableHead>Submission Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedDocuments.map((doc, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {doc.groupName}
                              </TableCell>
                              <TableCell>
                                <Badge className={getPhaseColor(doc.documentPhase)}>

                                  {doc.documentPhase}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">
                                    {formatDate(doc.documentData.submissionDate)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewDocument(doc.documentData.file)}
                                    className="flex items-center gap-1 cursor-pointer"
                                  >
                                    View
                                  </Button>
                                  {/* defence phase doc push to gitHub */}
                                  {doc.documentPhase === "Defence" && (
                                    <Button
                                      size="sm"
                                      onClick={() => handlePushToGitHub(doc)}
                                      className="flex items-center gap-1"
                                      disabled={uploadingDocs.has(doc.groupId + "-" + doc.documentPhase)}
                                    >
                                      {uploadingDocs.has(doc.groupId + "-" + doc.documentPhase) ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Github className="w-4 h-4" />

                                      )}
                                      Push
                                    </Button>
                                  )}

                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {processedMilestones.length > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={processedMilestones.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(value) => {
                          setItemsPerPage(value);
                          setCurrentPage(1);
                        }}
                        itemLabel="documents"
                      />
                    )}
                  </>
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

export default CoordinatorDocumentManagement;