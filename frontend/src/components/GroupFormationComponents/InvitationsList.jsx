import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Check, X, Loader2, AlertTriangle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { setGroup } from "@/redux/groupSlice";

const InvitationsList = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});


  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken")
  const dispatch = useDispatch();


  // 🟣 Fetch Invitations
  useEffect(() => {
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

    fetchInvitations();
  }, [accessToken]);

  // 🟢 Accept / Reject Response Handler
  const handleResponse = async (invitationId, action) => {
    setProcessing((prev) => ({ ...prev, [invitationId]: action }));
    try {
      const res = await axios.post(`${apiURL}/group/respond/${invitationId}`, { action },
        {
          headers:
          {
            Authorization: `Bearer ${accessToken}`
          }, withCredentials: true
        }
      );

      if (res.data.success) {
        setInvitations((prev) =>
          prev.filter((inv) => inv._id !== invitationId)
        );
        if(res.data.joinedGroup){
          dispatch(setGroup(res.data.joinedGroup))
          toast.success(res.data.message)
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process invitation");
    } finally {
      setProcessing((prev) => {
        const newState = { ...prev };
        delete newState[invitationId];
        return newState;
      });
    }
  };
  const noInvitations = !invitations || invitations.length === 0

  if (loading) {
    return (
      <Card className="p-8 border transition-colors duration-300 bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-purple-600 dark:text-purple-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading invitations...</p>
        </div>
      </Card>
    );
  }

  return (
    noInvitations ?
      <Card className="p-8 border transition-all duration-300 bg-gradient-to-br from-white to-gray-50 border-gray-200 text-gray-900 dark:from-gray-900 dark:to-gray-900/50 dark:border-gray-800 dark:text-gray-100 shadow-sm">
        <div className="text-center">
          <div className="inline-flex p-4 rounded-full mb-4 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10">
            <Mail className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Pending Invitations</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You do not have any group invitations at the moment.
          </p>
        </div>
      </Card>
      :
      <div className="space-y-4 transition-colors duration-300">
        {invitations.map((invitation) => {
          const invitationId = invitation._id || invitation.id;
          const isProcessing = !!processing[invitationId];
          const action = processing[invitationId];
          const memberCount = invitation.groupId?.members?.length || 0;
          const isFull = memberCount >= 3;

          return (
            <Card
              key={invitationId}
              className="group relative overflow-hidden p-6 border transition-all duration-300 hover:shadow-lg hover:scale-[1.01] bg-gradient-to-br from-white to-gray-50/50 border-gray-200 text-gray-900 dark:from-gray-900 dark:to-gray-900/50 dark:border-gray-800 dark:text-gray-100 hover:border-purple-300 dark:hover:border-purple-700"
            >
              {/* Decorative gradient overlay */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative flex items-start justify-between gap-4">
                {/* Left: Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="relative p-3 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-900/20 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                    <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                  </div>

                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">
                        {invitation.groupId.groupName || "Group Invitation"}
                      </h3>
                      <Badge
                        variant="outline"
                        className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400 shadow-sm"
                      >
                        Pending
                      </Badge>
                    </div>
                    
                    <div className="space-y-1.5 w-full">
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                        <span className="text-gray-500 dark:text-gray-500">Invited by</span>
                        <span className="font-semibold text-purple-700 dark:text-purple-400">
                          {invitation.senderId.username || "Unknown"}
                        </span>
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="flex -space-x-1">
                            {[...Array(3)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-medium ${
                                  i < memberCount
                                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                }`}
                              >
                                {i < memberCount ? '✓' : ''}
                              </div>
                            ))}
                          </div>
                          <span className={`font-medium ml-1 ${isFull ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {memberCount} / 3 members
                          </span>
                        </div>
                        
                        {isFull && (
                          <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400 text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Full
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleResponse(invitationId, "accept")}
                    disabled={isProcessing || isFull}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed px-4"
                  >
                    {isProcessing && action === "accept" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResponse(invitationId, "reject")}
                    disabled={isProcessing}
                    className="border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:border-red-700 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed px-4"
                  >
                    {isProcessing && action === "reject" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
  );
};

export default InvitationsList;
