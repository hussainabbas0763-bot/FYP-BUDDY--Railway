import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogOut, Trash2, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { setGroup } from "@/redux/groupSlice";

const GroupActions = () => {
  const { group } = useSelector((store) => store.group)
  const { user } = useSelector((store) => store.auth)
  const dispatch = useDispatch();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDisbandDialog, setShowDisbandDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const isLeader = group.leaderId._id === user._id;
  const apiURL = import.meta.env.VITE_API_URL
  const accessToken = localStorage.getItem("accessToken")

  // Handle Leave Group (Member)
  const handleLeaveGroup = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${apiURL}/group/leave`,{}, 
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        });
      if (res.data.success) {
        toast.success(res.data.message)
        dispatch(setGroup(null))
        setShowLeaveDialog(false);
      }
    } catch (error) {
      toast.dismiss();
      const message =
        error.response?.data?.message || error.response?.data || "Failed to create user";
      toast.error(message)
    } finally {
      setLoading(false);
    }
  };

  // Handle Disband Group (Leader)
  const handleDisbandGroup = async () => {
    setLoading(true);
    try {
      const res = await axios.delete(`${apiURL}/group/disband/${group._id}`,
        {
          headers:
          {
            Authorization: `Bearer ${accessToken}`
          }, withCredentials: true
        });

      if (res.data.success) {
        setShowDisbandDialog(false);
        dispatch(setGroup(null))
      }
    } catch (error) {
      toast.dismiss();
      const message =
        error.response?.data?.message || error.response?.data || "Failed to create user";
      toast.error(message)
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Main Card */}
      <div>
        <Card className="p-6 rounded-2xl border shadow-md dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100">
          <h2 className="text-xl font-bold mb-4">Group Actions</h2>

          <div className="space-y-3">
            {/* Leave Group */}
              <Button
                onClick={() => setShowLeaveDialog(true)}
                variant="outline"
                className="w-full justify-start border text-orange-600 hover:bg-orange-50 transition-colors duration-300 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Group
              </Button>
            {/* Disband Group */}
            {isLeader && (

              <Button
                onClick={() => setShowDisbandDialog(true)}
                variant="outline"
                className="w-full justify-start border text-red-600 hover:bg-red-50 transition-colors duration-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Disband Group
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Leave Group Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent className="rounded-xl transition-colors duration-300 bg-white dark:bg-gray-900 dark:text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              {`Are you sure you want to leave this group? ${isLeader?"You will loose the leadership once you leave." : "You will need to be invited again to rejoin"}`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={loading}
              className="transition-colors duration-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleLeaveGroup}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Leaving...
                </>
              ) : (
                "Leave Group"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disband Group Dialog */}
      <AlertDialog open={showDisbandDialog} onOpenChange={setShowDisbandDialog}>
        <AlertDialogContent className="rounded-xl transition-colors duration-300 bg-white dark:bg-gray-900 dark:text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Disband Group?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              This action cannot be undone. The group will be permanently
              deleted and all members will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={loading}
              className="transition-colors duration-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDisbandGroup}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disbanding...
                </>
              ) : (
                "Disband Group"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GroupActions;
