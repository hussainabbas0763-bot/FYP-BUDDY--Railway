import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import axios from "axios";
import toast from "react-hot-toast";
import { Target, ClipboardCheck, User, CheckCircle, XCircle } from "lucide-react"; // Added new icons
import { setGroup } from "@/redux/groupSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SEO from "@/components/SEO";

export default function MyGrades() {
  const { group } = useSelector((s) => s.group);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(true);
  const dispatch = useDispatch();

  const apiURL = import.meta.env.VITE_API_URL;
  const accessToken = localStorage.getItem("accessToken");

  // Fetch the user's group
  const fetchGroupData = async () => {
    setGroupLoading(true);
    try {
      const res = await axios.get(`${apiURL}/group/my-group`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.data.success) {
        dispatch(setGroup(res.data.group));
      } else {
        dispatch(setGroup(null));
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch group data";
      toast.error(message);
    } finally {
      setGroupLoading(false);
    }
  };

  // Fetch grades for the group
  const fetchGrades = async () => {
    if (!group?._id) return;

    setLoading(true);
    try {

      const res = await axios.get(
        `${apiURL}/grading/get-group-marks/${group._id}`, // Corrected URL
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        setGrades(res.data.data); // This is an array
      } else {
        setGrades([]);
        toast.error(res.data.message || "No grades available");
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch grades";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchGroupData();
    if (group) {
      fetchGrades();
    }
  }, []);


  // ✨ NEW: Process the grades array into two separate arrays for each phase
  const { progressGrades, defenceGrades } = useMemo(() => {
    const progress = grades.filter((g) => g.phase === "Progress");
    const defence = grades.filter((g) => g.phase === "Defence");
    return { progressGrades: progress, defenceGrades: defence };
  }, [grades]); // This recalculates whenever 'grades' state updates

  return (
    <>
    <SEO 
      title="My Grades | FYP Buddy - Track Your Performance"
      description="View your FYP grades and evaluation results. Track your performance across milestones, tasks, and final assessments."
      keywords="FYP grades, project evaluation, academic performance, milestone grades, task scores"
    />
    <div className="min-h-screen mt-15">
      <div className="flex flex-col md:flex-row gap-5 p-5">
        <Sidebar portalType="student" />

        <main className="flex-1">
          {/* Header */}
          <Card className="relative w-full max-w-5xl mx-auto text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md mb-8">
            <h1 className="text-4xl font-extrabold mb-2">
              Group{" "}
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Grades
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              View your group's evaluation results for all members
            </p>
          </Card>

          {/* Grades Overview */}
          <div className="max-w-6xl mx-auto space-y-8">
            {groupLoading || loading ? (
              <Card className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">
                Loading group grades...
              </Card>
            ) : !group ? (
               <Card className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">
                Please create or join a group to see grades.
              </Card>
            ) : (
              <>
                {/* ✨ NEW: Progress Phase Section */}
                <GradesTable
                  title="Progress Phase Marks"
                  gradesData={progressGrades}
                />

                {/* ✨ NEW: Defence Phase Section */}
                <GradesTable
                  title="Defence Phase Marks"
                  gradesData={defenceGrades}
                />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
    </>
  );
}

//Reusable GradesTable Component (using shadcn/ui)
const GradesTable = ({ title, gradesData, icon }) => {
  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 border border-white/20 overflow-hidden">
      <div className="p-4 border-b dark:border-gray-700"> {/* Compact header */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
        </div>
      </div>

      {gradesData.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No marks have been submitted for this phase yet.
        </p>
      ) : (
        // No overflow-x-auto div needed, shadcn handles responsiveness
        <Table>
          <TableHeader>
            <TableRow>
              {/* Using text-xs for compact header */}
              <TableHead >Student</TableHead>
              <TableHead >Supervisor (20)</TableHead>
              <TableHead >Coordinator (80)</TableHead>
              <TableHead >Total (100)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gradesData.map((grade) => (
              <TableRow key={grade._id}>
                <TableCell className="py-2">
                  <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {grade.studentId?.username || "Unknown Student"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2 font-medium text-gray-500 dark:text-gray-300">
                  {grade.supervisorMarks}
                </TableCell>
                <TableCell className="py-2 font-medium text-gray-500 dark:text-gray-300">
                  {grade.coordinatorMarks}
                </TableCell>
                <TableCell className="py-2 font-medium font-bold text-gray-900 dark:text-gray-100">
                  {grade.totalMarks}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
};