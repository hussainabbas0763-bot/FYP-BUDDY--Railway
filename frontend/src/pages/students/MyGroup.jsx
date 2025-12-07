import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import GroupInfoCard from "@/components/GroupFormationComponents/GroupInfoCard";
import InviteMemberCard from "@/components/GroupFormationComponents/InviteMemberCard";
import InvitationsList from "@/components/GroupFormationComponents/InvitationsList";
import GroupActions from "@/components/GroupFormationComponents/GroupActions";
import CreateGroupCard from "@/components/GroupFormationComponents/CreateGroupCard";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { setGroup } from "@/redux/groupSlice";
import toast from "react-hot-toast";
import SEO from "@/components/SEO";


const MyGroupPage = () => {
  const dispatch = useDispatch();
  const { group } = useSelector((store) => store.group);
  const [activeTab, setActiveTab] = useState("group");
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);


  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken")


  useEffect(() => {
    fetchGroupData();
    fetchInvitations();
  }, []);

  const fetchGroupData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiURL}/group/my-group`,
        {
          headers:
          {
            Authorization: `Bearer ${accessToken}`
          }, withCredentials: true, validateStatus: () => true,
        }
      );
      if (res.data.success) {
        dispatch(setGroup(res.data.group))
      }
      else {
        dispatch(setGroup(null))
      }
    } catch (error) {
      toast.dismiss();
      const message =
        error.response?.data?.message || error.response?.data || "Failed to create user";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiURL}/group/invitations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setInvitations(res.data.invitations || []);
    } catch (err) {
      console.error("Error fetching invitations:", err);
      toast.error(err.response?.data?.message || "Unable to load invitations");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
    <SEO 
      title="My FYP Group | FYP Buddy - Team Collaboration"
      description="View and manage your FYP group. Collaborate with team members, invite new members, track group progress, and communicate effectively with your project team."
      keywords="FYP group, team collaboration, group management, student team, project group, team members"
    />
    <div className="min-h-screen mt-15 ">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        <Sidebar portalType="student" />

        <main className="flex flex-col gap-6 transition-colors duration-300 text-gray-800 dark:text-gray-100 w-full">
          <Card className="relative w-full max-w-5xl mx-auto text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
            <div>
              <h1 className="text-3xl font-extrabold mb-2">
                My{" "}
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">FYP</span>{" "}
                Group
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Manage your FYP group, members, and invitations.
              </p>
            </div>
          </Card>


          {!group ? (
            <Card className="flex flex-col md:flex-row justify-center items-center p-6 shadow-lg rounded-2xl transition-colors duration-300 bg-white dark:bg-gray-800">
              <div className="space-y-8 text-center mt-8">
                <div className="rounded-lg border p-1 w-full sm:w-[280px] mx-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab("group")}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === "group"
                        ? "bg-purple-600 text-white shadow-sm dark:bg-gray-100 dark:text-gray-700"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>Group</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab("invitations")}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all relative ${activeTab === "invitations"
                        ? "bg-purple-600 text-white shadow-sm dark:bg-gray-100 dark:text-gray-700"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 relative">
                        <Mail className="w-4 h-4" />
                        <span className="font-medium">Invites</span>
                        {invitations.length > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-2 text-xs font-semibold text-white bg-red-500 rounded-full">
                            {invitations.length}
                          </span>
                        )}
                      </div>

                    </button>
                  </div>
                </div>

                {activeTab === "group" ? (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Create a group to get started and invite others.
                    </p>

                    <Dialog
                      open={showCreateDialog}
                      onOpenChange={setShowCreateDialog}
                    >
                      <DialogTrigger asChild>
                        <Button className={"bg-purple-700 text-white hover:bg-purple-600 dark:bg-gray-100 dark:text-gray-700 dark:hover:bg-gray-300 cursor-pointer"}>Create Group</Button>
                      </DialogTrigger>

                      <DialogContent className="max-w-lg rounded-2xl border transition-colors duration-300 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                        <CreateGroupCard />
                      </DialogContent>
                    </Dialog>
                  </div>

                ) : (
                  <InvitationsList />
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2">
                <GroupInfoCard />
              </div>

              <div className="space-y-6">
                <InviteMemberCard
                />
                <GroupActions
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
    </>
  );
};

export default MyGroupPage;
