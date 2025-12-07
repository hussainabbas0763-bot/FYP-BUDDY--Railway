import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { setUser } from "@/redux/authSlice";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { setMilestone } from "@/redux/milestoneSlice";
import { setGroup } from "@/redux/groupSlice";

const Logout = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { theme } = useSelector((store) => store.theme);
  const dispatch = useDispatch();
  const accessToken = localStorage.getItem("accessToken");

  const [loading, setLoading] = useState(false);

  const logoutHandler = async () => {
    const apiURL = import.meta.env.VITE_API_URL;
    setLoading(true);
    toast.loading("Logging you out...");

    try {
      const res = await axios.post(
        `${apiURL}/user/logout`,
        {},
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
        onClose();
      }
    } catch (error) {
      toast.dismiss();
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to log out";
      toast.error(message);
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent
        className={`rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg transition-colors duration-300 ${theme === "dark"
            ? "dark bg-gray-900 text-gray-100"
            : "bg-white text-gray-800"
          }`}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Confirm Logout
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
            Are you sure you want to log out? You’ll need to sign in again to
            continue.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex justify-end gap-3 mt-4">
          <AlertDialogCancel
            onClick={onClose}
            disabled={loading}
            className={`border border-gray-300 dark:border-gray-600 rounded-md transition-colors duration-300 ${theme === "dark"
                ? "bg-gray-800 text-gray-100 hover:bg-gray-700"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={logoutHandler}
            disabled={loading}
            className={`rounded-md flex items-center justify-center transition-colors duration-300 ${theme === "dark"
                ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                : "bg-purple-600 text-white hover:bg-purple-700"
              } ${loading ? "opacity-75 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Logging out...
              </>
            ) : (
              "Logout"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default Logout;
