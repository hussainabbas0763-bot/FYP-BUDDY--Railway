import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Crown, GraduationCap, Pencil, Check, X, Camera, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { setGroup } from "@/redux/groupSlice";

const GroupInfoCard = () => {
  const { group } = useSelector((store) => store.group)
  const { user } = useSelector((store) => store.auth)
  const dispatch = useDispatch();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const fileInputRef = useRef(null);

  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");

  const isLeader = group?.leaderId._id === user._id;

  const handleEditClick = () => {
    setNewGroupName(group?.groupName || "");
    setIsEditingName(true);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNewGroupName("");
    setSelectedIcon(null);
    setIconPreview(null);
  };

  const handleIconClick = () => {
    if (isLeader) {
      fileInputRef.current?.click();
    }
  };

  const handleIconChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // If editing name, just set the icon for combined update
      if (isEditingName) {
        setSelectedIcon(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setIconPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        // If not editing name, upload icon immediately
        await uploadIconOnly(file);
      }
    }
  };

  const uploadIconOnly = async (file) => {
    try {
      setIsUpdating(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.put(
        `${apiURL}/group/update-info`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data"
          },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        dispatch(setGroup(res.data.group));
        toast.success("Group icon updated successfully");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update group icon");
    } finally {
      setIsUpdating(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUpdateGroupInfo = async () => {
    if (!newGroupName.trim() && !selectedIcon) {
      toast.error("Please provide a group name or select an icon");
      return;
    }

    if (newGroupName && !newGroupName.trim()) {
      toast.error("Group name cannot be empty");
      return;
    }

    if (newGroupName.trim() === group?.groupName && !selectedIcon) {
      setIsEditingName(false);
      return;
    }

    try {
      setIsUpdating(true);
      const formData = new FormData();
      
      if (newGroupName && newGroupName.trim() !== group?.groupName) {
        formData.append("groupName", newGroupName.trim());
      }
      
      if (selectedIcon) {
        formData.append("file", selectedIcon);
      }

      const res = await axios.put(
        `${apiURL}/group/update-info`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data"
          },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        dispatch(setGroup(res.data.group));
        toast.success(res.data.message);
        setIsEditingName(false);
        setSelectedIcon(null);
        setIconPreview(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update group information");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="p-6 border transition-colors duration-300 bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {/* Group Icon */}
        <div className="relative group/icon">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleIconChange}
            className="hidden"
            disabled={isUpdating}
          />
          <Avatar 
            className={`w-16 h-16 transition-all duration-300 ${
              isLeader && !isUpdating 
                ? "cursor-pointer hover:ring-4 hover:ring-purple-200 dark:hover:ring-purple-800" 
                : isUpdating 
                ? "opacity-50 cursor-wait" 
                : ""
            }`}
            onClick={!isUpdating ? handleIconClick : undefined}
          >
            {iconPreview || group?.groupIcon ? (
              <AvatarImage src={iconPreview || group?.groupIcon} alt={group?.groupName} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <Users className="w-8 h-8" />
              </div>
            )}
            {isUpdating && !isEditingName && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </Avatar>
          {isLeader && !isUpdating && (
            <div 
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-purple-600 text-white shadow-lg opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 cursor-pointer"
              onClick={handleIconClick}
              title="Change group icon"
            >
              <Camera className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Group Name */}
        <div className="flex-1">
          {isEditingName ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="max-w-xs"
                  disabled={isUpdating}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateGroupInfo();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleUpdateGroupInfo}
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {selectedIcon && (
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  New icon selected: {selectedIcon.name}
                </p>
              )}
            </div>
          ) : (
            <div className="group/name flex items-center gap-2">
              <h2 className="text-2xl font-bold">{group?.groupName || "My Group"}</h2>
              {isLeader && (
                <button
                  onClick={handleEditClick}
                  className="opacity-0 group-hover/name:opacity-100 transition-opacity duration-200 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Edit group info"
                >
                  <Pencil className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {group?.members?.length || 0} / 3 Members
          </p>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Group Members
          </h3>
          <div className="space-y-3">
            {group?.members?.map((member) => {
              const memberId = member._id;
              const memberName =
                member.username || "Unknown Member";
              const memberEmail = member.email || "";
              const memberPic = member.profilePic
              const isGroupLeader =
                (group.leaderId._id) === memberId;

              return (
                <div
                  key={memberId}
                  className="flex items-center justify-between p-3 rounded-lg transition-colors duration-300 bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 bg-indigo-500 text-white flex items-center justify-center">
                      {memberPic ? (
                        <AvatarImage src={memberPic} alt={memberName} />
                      ) : (
                        <span className="text-sm font-medium">
                          {memberName?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{memberName}</p>
                      {memberEmail && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {memberEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {isGroupLeader && (
                    <Badge className="flex items-center gap-1 bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700">
                      <Crown className="w-3 h-3" />
                      Leader
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {group.supervisor && (<div>
          <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Supervisor
          </h3>
          <div className="space-y-3">
            {group?.supervisor && (
              <div className="flex items-center justify-between p-3 rounded-lg transition-colors duration-300 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 bg-indigo-500 text-white flex items-center justify-center">
                    {group.supervisor.profilePic ? (
                      <AvatarImage src={group.supervisor.profilePic} alt="img" />
                    ) : (
                      <span className="text-sm font-medium">
                        {group.supervisor.username?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </Avatar>

                  <div>
                    <p className="font-medium">
                      {group.supervisor.username || "Not Selected Yet"}
                    </p>
                  </div>
                </div>

                <Badge className="flex items-center gap-1 bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700">
                  <GraduationCap className="w-3 h-3" />
                  Supervisor
                </Badge>
              </div>
            )}

          </div>

        </div>
        )}
      </div>
    </Card>
  );
};

export default GroupInfoCard;
