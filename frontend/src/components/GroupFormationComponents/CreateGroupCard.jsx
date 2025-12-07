import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setGroup } from "@/redux/groupSlice";

const CreateGroupCard = () => {
  const { theme } = useSelector((store) => store.theme);
  const dispatch = useDispatch();
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken")



  const handleCreateGroup = async () => {

    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (groupName.length < 3) {
      toast.error("Group name must be at least 3 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${apiURL}/group/create`, { groupName },
        {
          headers:
          {
            Authorization: `Bearer ${accessToken}`
          }, withCredentials: true
        }
      );

      if (res.data.success) {
        toast.success(res.data.message)
        setGroupName("");
        try {
          const res = await axios.get(`${apiURL}/group/my-group`,
            {
              headers:
              {
                Authorization: `Bearer ${accessToken}`
              }, withCredentials: true
            }
          );
          if (res.data.success) {
            console.log(res.data.group);
            dispatch(setGroup(res.data.group))
          }
        } catch (error) {
          toast.dismiss();
          const message =
            error.response?.data?.message || error.response?.data || "Failed to create user";
          toast.error(message);
        }
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

  return (
    <div
      className={`w-full max-w-md mx-auto transition-colors duration-300 ${theme === "dark" ? "dark" : ""
        }`}
    >
      <Card
        className={`p-6 rounded-xl shadow-md border transition-colors duration-300 ${theme === "dark"
            ? "bg-gray-900 border-gray-700 text-gray-100"
            : "bg-white border-gray-200 text-gray-900"
          }`}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <div
            className={`inline-flex p-3 rounded-full mb-3 ${theme === "dark" ? "bg-gray-700/30" : "bg-purple-100"
              }`}
          >
            <Users
              className={`w-8 h-8 ${theme === "dark" ? "text-purple-400" : "text-purple-600"
                }`}
            />
          </div>
          <h2 className="text-xl font-bold mb-1">Create Your Group</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Start collaborating with your teammates
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Enter Unique Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={loading}
              maxLength={50}
              className={`transition-colors duration-300 ${theme === "dark"
                  ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500 focus-visible:ring-gray-100"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus-visible:ring-purple-500"
                }`}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {groupName.length}/50 characters
            </p>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreateGroup}
            disabled={loading}
            className={`w-full py-4 text-base font-medium transition-all duration-300 cursor-pointer ${theme === "dark"
                ? "bg-gray-100 hover:bg-gray-300 text-gray-700"
                : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Group...
              </>
            ) : (
              <>
                Create Group
              </>
            )}
          </Button>
        </div>

        {/* Guidelines */}
        <div
          className={`mt-5 p-3 rounded-lg border text-sm  ${theme === "dark"
              ? "bg-gray-700/20 border-gray-100 text-gray-100"
              : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
        >
          <h4 className="font-semibold mb-1">Group Guidelines</h4>
          <ul className="text-xs space-y-1">
            <li>• Group name must be already taken</li>
            <li>• Maximum 3 members per group</li>
            <li>• Group creator becomes the leader</li>
            <li>• You can invite members after creating the group</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default CreateGroupCard;
