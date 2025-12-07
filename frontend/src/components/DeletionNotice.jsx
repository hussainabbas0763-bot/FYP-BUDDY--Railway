import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/redux/authSlice";
import { setGroup } from "@/redux/groupSlice";
import { setMilestone } from "@/redux/milestoneSlice";
import store from "@/redux/Store";
import toast from "react-hot-toast";

// Compact version for Daily Notices section
export const DeletionNoticeCompact = () => {
  const [deletionLog, setDeletionLog] = useState(null);
  const { group } = useSelector((store) => store.group);
  const groupId = group?._id;
  const accessToken = localStorage.getItem("accessToken");
  const apiURL = import.meta.env.VITE_API_URL;
  const dispatch = useDispatch();
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeletionLog();
  }, []);

  const fetchDeletionLog = async () => {
    try {

      const response = await axios.get(`${apiURL}/deletion/group/${groupId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.data.success) {
        setDeletionLog(response.data.data);
      }
    } catch (error) {
      console.log("Error fetching deletion log:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!deletionLog) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const deadline = new Date(deletionLog.deletionDeadline).getTime();
      const distance = deadline - now;

      if (distance <= 0) {
        clearInterval(interval);
        handleDeletionComplete();
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [deletionLog]);


  const handleDeletionComplete = () => {
    try {
      const res = axios.post(`${apiURL}/deletion/execute-deletion`, {
        groupId: groupId,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }, withCredentials: true
      });
      handlelogout();
    } catch (error) {
      console.error("Error executing deletion:", error);
      toast.error("Error executing deletion. Please try again later.");
    }
  }
  const handlelogout = async () => {
    try {

      const res = await axios.post(`${apiURL}/user/logout`, {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      toast.dismiss();

      if (res.data.success) {
        dispatch(setUser(null));
        dispatch(setMilestone(null));
        dispatch(setGroup(null));
        toast.success(res.data.message || "Logged out successfully!");
        localStorage.clear();
        navigate("/");
      }
    } catch (error) {
      toast.dismiss();
      const message = error.response?.data?.message || error.response?.data || "Failed to log out";
      toast.error(message);
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!deletionLog) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 p-4 rounded-lg border-2 border-green-500 dark:border-green-600">
        <h4 className="text-base font-bold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
          🎉 FYP Completed!
        </h4>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          Congratulations on completing your FYP! Your access will end in:
        </p>

        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center shadow-sm">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {countdown.days}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Days</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center shadow-sm">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {countdown.hours}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Hours</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center shadow-sm">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {countdown.minutes}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Mins</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center shadow-sm">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {countdown.seconds}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Secs</div>
          </div>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400">
          ⚠️ After the countdown ends, your account will be deactivated and all your FYP data will be permanently deleted.
        </p>
      </div>
    </div>
  );
};

export default DeletionNoticeCompact;
