import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Trash2, Loader2, Eye, Search } from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "@/components/Pagination";

const CoordinatorSampleDocuments = () => {
  const { user } = useSelector((store) => store.auth);
  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");

  const [selectedPhase, setSelectedPhase] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sampleDocuments, setSampleDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const fetchSampleDocuments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiURL}/sample-documents`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      if (res.data.success) {
        const filtered = (res.data.data || []).filter(
          (doc) => doc.department === user?.department
        );
        setSampleDocuments(filtered);
      } else setSampleDocuments([]);
    } catch (error) {
      if (error.response?.status !== 404)
        toast.error("Failed to load sample documents");
      setSampleDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSampleDocuments();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    const allowedExt = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];
    const valid =
      allowedTypes.includes(file.type) ||
      allowedExt.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!valid) {
      toast.error("Select only PDF, Word, or PowerPoint files");
      e.target.value = "";
      return;
    }

    // Check file size (6MB limit)
    const maxSize = 6 * 1024 * 1024; // 6MB in bytes
    if (file.size > maxSize) {
      toast.error("File size exceeds 6MB limit. Please upload a smaller file.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedPhase || !selectedFile || !description.trim()) {
      toast.error("All fields are required");
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("phase", selectedPhase);
      formData.append("description", description.trim());
      formData.append("department", user?.department);

      const res = await axios.post(`${apiURL}/sample-documents/upload`, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success("Document uploaded successfully");
        setSelectedFile(null);
        setDescription("");
        setSelectedPhase("");
        document.getElementById("file-input").value = "";
        fetchSampleDocuments();
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const res = await axios.delete(`${apiURL}/sample-documents/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      if (res.data.success) {
        toast.success("Document deleted");
        fetchSampleDocuments();
      }
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = useMemo(() => {
    return sampleDocuments.filter((doc) =>
      [doc.description, doc.phase, doc.fileName]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [sampleDocuments, searchTerm]);

  // Pagination logic
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDocuments.slice(startIndex, endIndex);
  }, [filteredDocuments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getPhaseColor = (phase) => {
    const colors = {
      Proposal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      Progress: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      Defence: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    };
    return colors[phase] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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

  return (
    <>
    <SEO 
      title="Sample Documents | FYP Buddy - Coordinator Panel"
      description="Manage sample FYP documents and templates. Upload reference materials to guide students in their thesis writing."
      keywords="sample documents, FYP templates, reference materials, thesis examples"
    />
    <div className="min-h-screen mt-16">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        <Sidebar portalType="coordinator" />
        <main className="w-full flex flex-col gap-6">
          {/* Header */}
          <Card className="w-full max-w-5xl mx-auto text-center p-8 bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Sample{" "}
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Documents
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Share sample documents for each phase to guide students.
            </p>
          </Card>

          {/* Unified Upload Card */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl">
            <h3 className="text-lg font-semibold">Upload Sample Document</h3>

            {/* Phase */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Phase
              </label>
              <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                <SelectTrigger className={"border-gray-700 dark:border-gray-400 w-full"}>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Proposal">Proposal</SelectItem>
                  <SelectItem value="Progress">Progress</SelectItem>
                  <SelectItem value="Defence">Defence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                File (PDF, Word, PowerPoint)
              </label>
              <Input
                className={"border-gray-700 dark:border-gray-400"}
                id="file-input"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleFileSelect}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Description
              </label>
              <Textarea
                placeholder="Enter a short description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] border-gray-700 dark:border-gray-400"
              />
            </div>

            {/* Upload Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Documents Table */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">All Shared Documents</h3>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2" />
                <p>No sample documents found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phase</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDocuments.map((doc) => (
                        <TableRow key={doc._id}>
                          <TableCell>
                            <Badge className={getPhaseColor(doc.phase)}>
                              {doc.phase}
                            </Badge>
                          </TableCell>
                          <TableCell>{doc.fileName || "N/A"}</TableCell>
                          <TableCell>{formatDate(doc.uploadedAt || doc.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                className={"border-gray-700 dark:border-gray-400 cursor-pointer"}
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewSampleDoc(doc)}
                              >
                                <Eye className="w-4 h-4 mr-1" /> View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-600 dark:border-red-700 cursor-pointer"
                                onClick={() => {
                                  setDocToDelete(doc._id);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-1" /> Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {filteredDocuments.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredDocuments.length}
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
          </Card>
        </main>

        {/* Delete Confirmation */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[400px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this sample document?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  await handleDelete(docToDelete);
                  setShowDeleteDialog(false);
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </>
  );
};

export default CoordinatorSampleDocuments;
