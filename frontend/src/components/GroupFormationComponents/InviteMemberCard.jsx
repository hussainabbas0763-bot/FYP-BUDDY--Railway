import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MailPlus, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const InviteMemberCard = () => {
  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken")
  const { group } = useSelector((store) => store.group)
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const memberCount = group?.members?.length || 0;
  const isGroupFull = memberCount >= 3;

  // 📨 Handle Invite Member
  const handleInvite = async () => {

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (isGroupFull) {
      toast.error("Group is full, maximum 3 members allowed");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${apiURL}/group/invite`, { groupId: group._id, receiverEmail: email },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }, withCredentials: true
        }
      );

      if (res.data.success) {
        toast.success(res.data.message)
        setEmail("");
      } else {
        toast.error(res.data.message || "Failed to send invitation");
      }
    } catch (err) {
      console.error("Error sending invite:", err);
      toast.error(err.response?.data?.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 border transition-colors duration-300 bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
          <MailPlus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Invite Members</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add students to your group
          </p>
        </div>
      </div>

      {/* Group Full Message */}
      {isGroupFull ? (
        <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300">
          <p className="text-sm">
            Your group is full. You cannot invite more members.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Student Email
            </label>
            <Input
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || isGroupFull}
              className="transition-colors duration-300 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInvite();
                }
              }}
            />
          </div>


          {/* Invite Button */}
          <Button
            onClick={handleInvite}
            disabled={loading || isGroupFull || !email}
            className="w-full flex items-center justify-center py-6 text-base transition-all duration-300 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MailPlus className="w-4 h-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default InviteMemberCard;
