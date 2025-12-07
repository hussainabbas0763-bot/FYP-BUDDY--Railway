import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Eye, Search, AlertCircle, Loader2, BookOpen,
  File, Calendar,
  Download
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import SEO from "@/components/SEO";

export default function StudentThesis() {
  const { user } = useSelector((store) => store.auth);
  const { group } = useSelector((store) => store.group);

  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");

  const [loading, setLoading] = useState(false);
  const [milestone, setMilestone] = useState(null);
  const [thesisFiles, setThesisFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sampleDocuments, setSampleDocuments] = useState([]);
  const [loadingSampleDocs, setLoadingSampleDocs] = useState(false);

  const [viewLoadingMap, setViewLoadingMap] = useState({});

  // 📄 Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // ✅ Fetch Thesis files from GitHub
  const fetchThesisFiles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiURL}/thesis/all-github-files`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      setThesisFiles(res.data.success ? res.data.files || [] : []);
    } catch (err) {
      console.error("Error fetching thesis files:", err);
      toast.error("Error loading thesis files");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch current milestone
  const fetchMilestone = async () => {
    if (!group?._id) return;
    try {
      const res = await axios.get(`${apiURL}/milestone/get-my-milestone/${group._id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      if (res.data.success) setMilestone(res.data.milestone);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch milestone");
    }
  };

  // ✅ Fetch sample documents after milestone is known
  const fetchSampleDocuments = async (phase) => {
    if (!phase) return;
    try {
      setLoadingSampleDocs(true);
      const res = await axios.get(`${apiURL}/sample-documents`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      if (res.data.success) {
        const allFiles = res.data.data || [];
        const filtered = allFiles.filter((doc) => doc.phase === phase);
        setSampleDocuments(filtered);
      } else {
        setSampleDocuments([]);
      }
    } catch (err) {
      console.error("Error fetching sample documents:", err);
      setSampleDocuments([]);
    } finally {
      setLoadingSampleDocs(false);
    }
  };

  // ✅ Main lifecycle
  useEffect(() => {
    fetchThesisFiles();
  }, []);

  useEffect(() => {
    if (group?._id) fetchMilestone();
  }, [group]);

  useEffect(() => {
    if (milestone?.phase) fetchSampleDocuments(milestone.phase);
  }, [milestone]);

  // ✅ File type badge
  const getFileTypeInfo = (fileName) => {
    if (!fileName)
      return { icon: FileText, color: "text-gray-500", label: "File" };
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf"))
      return { icon: FileText, color: "text-red-600", label: "PDF" };
    if (lower.endsWith(".doc") || lower.endsWith(".docx"))
      return { icon: File, color: "text-blue-600", label: "Word" };
    if (lower.endsWith(".ppt") || lower.endsWith(".pptx"))
      return { icon: File, color: "text-orange-600", label: "PPTX" };
    return { icon: FileText, color: "text-gray-500", label: "File" };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleViewSampleDoc = async (doc) => {
    try {
      const fileUrl = doc.file;
      const fileName = doc.fileName || "document";
      const fileExt = fileName.split(".").pop().toLowerCase();

      // For other file types (Word, PowerPoint, etc.), force download
      const downloadUrl = `${fileUrl}?fl_attachment=${encodeURIComponent(fileName)}`;
      const response = await fetch(downloadUrl);

      if (!response.ok) throw new Error("File not found");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error("Error opening document:", error);
      toast.error("Error opening document");
    }
  };

  const handleViewGithubFile = async (filePath) => {
    setViewLoadingMap((prev) => ({ ...prev, [filePath]: true }));
    try {
      const res = await axios.get(
        `${apiURL}/thesis/see-github-file/${encodeURIComponent(filePath)}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          responseType: 'blob',
          withCredentials: true,
        }
      );

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error("Error viewing file:", err);
      toast.error("Error opening file");
    } finally {
      setViewLoadingMap((prev) => ({ ...prev, [filePath]: false }));
    }
  };


  // Filtered and sorted thesis files
  const filteredFiles = thesisFiles.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 📄 Pagination calculations
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Pagination handlers
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
  };

  // --- UI ---
  return (
    <>
    <SEO 
      title="Thesis Documents | FYP Buddy - Manage Your Research"
      description="Access and manage your FYP thesis documents. View sample documents, upload submissions, and track your research progress."
      keywords="thesis documents, FYP research, academic writing, thesis submission, sample documents"
    />
    <div className="min-h-screen mt-15">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        <Sidebar portalType="student" />
        <main className="flex flex-col gap-5 w-full">

          {/* HEADER */}
          <Card className="relative w-full max-w-5xl mx-auto text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md mb-8">
            <h1 className="text-4xl font-extrabold mb-2">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Thesis
              </span>{" "}
              Section
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Browse and view all submitted thesis documents
            </p>
          </Card>

          {/* --- SAMPLE DOCUMENTS --- */}
          <Card className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            {!group ? (
              <div className="flex flex-col items-center py-10 text-center">
                <AlertCircle className="w-10 h-10 text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  You’re not part of any group yet. <br />
                  <span className="font-semibold">Create or join a group</span> to view sample documents.
                </p>
              </div>
            ) : loadingSampleDocs ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : sampleDocuments.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <BookOpen className="w-10 h-10 text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  No sample documents shared by coordinator yet for{" "}
                  <span className="font-semibold">{milestone?.phase}</span> phase.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Sample Documents
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Shared for Coordinator for phase: {milestone?.phase}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sampleDocuments.map((doc) => {
                    const fileInfo = getFileTypeInfo(doc.fileName);
                    const FileIcon = fileInfo.icon;
                    return (
                      <Card
                        key={doc._id}
                        className="p-5 border-2 border-gray-500 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 transition-all rounded-2xl"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-xl bg-gray-200 dark:bg-gray-800`}>
                            <FileIcon className={`w-6 h-6 ${fileInfo.color}`} />
                          </div>
                          <Badge variant="outline" className="text-xs font-medium">
                            {fileInfo.label}
                          </Badge>
                        </div>

                        <div
                          className="text-sm font-medium text-gray-900 dark:text-gray-100 overflow-y-auto pr-1 rounded-md"
                          style={{
                            height: "50px",
                            scrollbarWidth: "thin",
                            scrollbarColor: "#9ca3af transparent",
                          }}
                        >
                          {doc.description || "No description provided."}
                        </div>

                        <div className="text-xs flex items-center gap-2">
                          <FileText className="w-3 h-3" /> {doc.fileName}
                        </div>

                        <div className="text-xs flex items-center gap-2">
                          <Calendar className="w-3 h-3" /> {formatDate(doc.createdAt)}
                        </div>

                        <Button
                          onClick={() => handleViewSampleDoc(doc)}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </Card>

          {/* --- THESIS FILES TABLE --- */}
          <Card className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Previous FYP Documents
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total files: {filteredFiles.length}
                </p>
              </div>
              <div className="relative w-full sm:w-auto sm:min-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by file name..."
                  className="pl-10 h-10 border dark:border-gray-700"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                <p className="text-gray-500 mt-3">Loading thesis files...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-10">
                <AlertCircle className="w-10 h-10 text-gray-400 mb-3 mx-auto" />
                <p className="text-gray-500">
                  No thesis files found in the repository.
                </p>
              </div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFiles.map((file) => (
                      <TableRow key={file.path} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                        <TableCell className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-600" />
                          {file.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewGithubFile(file.path)}
                              className="flex items-center gap-2 border-gray-700 dark:border-gray-200 w-20 justify-center cursor-pointer"
                            >
                              {viewLoadingMap[file.path]  ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-purple-600"></div>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  View
                                </>
                              )}
                            </Button>

                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* 📄 Pagination Controls */}
            {!loading && filteredFiles.length > 0 && (
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Left: Items per page selector */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
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
                  Showing <span className="text-gray-800 dark:text-white">{startIndex + 1}</span> to{" "}
                  <span className="text-gray-800 dark:text-white">{Math.min(endIndex, filteredFiles.length)}</span> of{" "}
                  <span className="text-gray-800 dark:text-white">{filteredFiles.length}</span> files
                </div>

                {/* Right: Page Navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
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
                      {totalPages}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
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
}
