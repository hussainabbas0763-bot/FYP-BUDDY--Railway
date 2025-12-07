import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import CreateUser from "./RegisterUser";
import UpdateUser from "./UpdateUser";
import { Pencil, Search, Trash2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import userImg from "@/assets/user.jpg";

// ✅ Role Badge Component
const RoleBadge = ({ role }) => {
  const colors = {
    student: "bg-blue-100 text-blue-700",
    supervisor: "bg-green-100 text-green-700",
    coordinator: "bg-purple-100 text-purple-700",
    admin: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${colors[role] || "bg-gray-100 text-gray-600"
        }`}
    >
      {role}
    </span>
  );
};

const UserManagement = () => {
  const { theme } = useSelector((store) => store.theme);
  const { user } = useSelector((store) => store.auth)
  const currentUser = user;
  const [openDialog, setOpenDialog] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // 🔍 Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Roles");

  // 📄 Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // ✅ Fetch Users from Backend
  const getAllUsers = async () => {
    const apiURL = import.meta.env.VITE_API_URL;
    const accessToken = localStorage.getItem("accessToken");

    try {
      setLoading(true);
      const res = await axios.get(`${apiURL}/user/get-users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      });

      if (res.data.success) {
        setUsers(res.data.user || []);
      } else {
        toast.error(res.data.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to fetch users";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllUsers();
  }, []);

  // ✅ Open delete confirmation dialog
  const confirmDelete = (user) => {
    setToDelete(user);
    setOpenDialog(true);
  };

  // ✅ Delete User Function
  const handleRemove = async () => {
    if (!toDelete) return;

    const apiURL = import.meta.env.VITE_API_URL;
    const accessToken = localStorage.getItem("accessToken");

    try {
      setLoading(true);
      const res = await axios.delete(
        `${apiURL}/user/delete-user/${toDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        toast.success(`${toDelete.username} has been removed`);
        await getAllUsers();
      } else {
        toast.error(res.data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to delete user";
      toast.error(message);
    } finally {
      setOpenDialog(false);
      setToDelete(null);
      setLoading(false);
    }
  };


  const filteredUsers = users
    .filter((user) => user._id !== currentUser?._id)
    .filter((user) => {
      const matchesSearch =
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole =
        selectedRole === "All Roles" ||
        user.role?.toLowerCase() === selectedRole.toLowerCase();

      return matchesSearch && matchesRole;
    });

  // 📄 Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole, itemsPerPage]);

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


  return (
    <>
    <SEO 
      title="User Management | FYP Buddy - Admin Panel"
      description="Manage all users in the FYP Buddy system. Create, update, and delete user accounts for students, supervisors, and coordinators."
      keywords="user management, admin panel, user accounts, system administration"
    />
    <div className="min-h-screen mt-15">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        <Sidebar portalType="admin" />

        <main className="flex flex-col gap-5 w-full overflow-x-hidden">
          <Card className="p-4 dark:bg-gray-800 w-full">

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white text-center lg:text-right">
                  Users <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Management</span>
                </h1>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                {/* 🔍 Search Bar */}
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 dark:focus:border-gray-200"
                  />
                </div>

                {/* 🎚 Role Filter */}
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm dark:bg-gray-800"
                >
                  <option>All Roles</option>
                  <option>Student</option>
                  <option>Supervisor</option>
                  <option>Coordinator</option>
                  <option>Admin</option>
                </select>

                {/* ➕ Add User Button */}
                <div className="md:flex gap-2">
                  <Button
                    onClick={() => setOpenCreateDialog(true)}
                    className="w-full md:w-auto bg-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg cursor-pointer"
                  >
                    Add User
                  </Button>
                  <CreateUser
                    open={openCreateDialog}
                    setOpen={setOpenCreateDialog}
                    onUserCreated={getAllUsers}
                  />
                </div>
              </div>
            </div>

            {/* ✅ Table Section */}
            {loading ? (
              <div className="text-center py-10 text-gray-600 dark:text-gray-300">
                Loading users...
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">{error}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No matching users found.
              </div>
            ) : (
              <div className="relative w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-400 shadow-sm">
                <div className="inline-block min-w-full align-middle">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginatedUsers.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={user.profilePic || userImg}
                                alt={user.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                {user.username}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                            {user.email}
                          </TableCell>

                          <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                            {user.department || "—"}
                          </TableCell>

                          <TableCell>
                            <RoleBadge role={user.role} />
                          </TableCell>

                          <TableCell className="text-center">
                            <div className="flex justify-center items-center gap-2">
                              {/* ✏️ Edit Button */}
                              <Button
                                variant="ghost"
                                className="p-2 cursor-pointer"
                                onClick={() => {
                                  console.log("Selected user:", user);
                                  if (user && user._id) {
                                    setSelectedUser(user);
                                    setOpenUpdateDialog(true);
                                  } else {
                                    toast.error("Unable to select user. Please try again.");
                                  }
                                }}
                              >
                                <Pencil />
                              </Button>

                              {/* 🗑 Delete Button */}
                              <AlertDialog
                                open={openDialog && toDelete?._id === user._id}
                                onOpenChange={setOpenDialog}
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="p-2 text-red-600 cursor-pointer hover:text-red-500"
                                    onClick={() => confirmDelete(user)}
                                  >
                                    <Trash2 />
                                  </Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent
                                  className={`rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg ${theme === "dark"
                                      ? "dark bg-gray-900 text-gray-100"
                                      : "bg-white text-gray-800"
                                    }`}
                                >
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Remove User
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove{" "}
                                      <strong>{user.username}</strong>? This
                                      action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>

                                  <AlertDialogFooter className="flex justify-end gap-3 mt-4">
                                    <Button
                                      variant="outline"
                                      onClick={() => setOpenDialog(false)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleRemove}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      Remove User
                                    </Button>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* 📄 Pagination Controls */}
            {!loading && !error && filteredUsers.length > 0 && (
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
                  <span className="text-gray-800 dark:text-white">{Math.min(endIndex, filteredUsers.length)}</span> of{" "}
                  <span className="text-gray-800 dark:text-white">{filteredUsers.length}</span> users
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

          {/* ✏️ Update User Dialog - Outside the loop */}
          {selectedUser && (
            <UpdateUser
              open={openUpdateDialog}
              setOpen={setOpenUpdateDialog}
              selectedUser={selectedUser}
              onUserUpdated={getAllUsers}
            />
          )}
        </main>
      </div>
    </div>
    </>
  );
};

export default UserManagement;
