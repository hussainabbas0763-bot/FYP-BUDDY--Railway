import { Grading } from "../models/gradingModel.js";
import { Milestone } from "../models/milestoneModel.js";
import { Group } from "../models/Group_Formation/groupModel.js";

// Supervisor assigns or updates marks (0–20)
export const assignSupervisorMarks = async (req, res) => {
    try {
        const { groupId, phase, studentId, marks } = req.body;
        const supervisorId = req.user.id;

        if (!["Progress", "Defence"].includes(phase)) {
            return res.status(400).json({
                success: false,
                message: "Supervisor can only grade Progress or Defence phases.",
            });
        }

        if (marks < 0 || marks > 20) {
            return res.status(400).json({
                success: false,
                message: `Invalid marks ${marks}. Supervisor marks must be between 0 and 20.`,
            });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found." });
        }

        if (!group.members.includes(studentId)) {
            return res.status(400).json({ success: false, message: "This student is not in this group." });
        }

        const milestone = await Milestone.findOne({ groupId });
        if (!milestone) {
            return res.status(404).json({ success: false, message: "Milestone not found for this group." });
        }

        if (milestone.phase !== phase) {
            return res.status(400).json({
                success: false,
                message: `The group is in ${milestone.phase} phase.`,
            });
        }

        let grading = await Grading.findOne({ groupId, studentId, phase });

        if (grading) {
            grading.supervisorMarks = marks;
        } else {
            grading = new Grading({
                milestoneId: milestone._id,
                phase,
                groupId,
                studentId,
                supervisorMarks: marks,
            });
        }

        grading.status = "Graded";
        grading.supervisorId = supervisorId;

        await grading.save();

        return res.status(200).json({
            success: true,
            message: `Marking done successfully.`,
            data: grading,
        });
    } catch (error) {
        console.error("Error assigning supervisor marks:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Coordinator assigns or updates marks (0–80)
export const assignCoordinatorMarks = async (req, res) => {
    try {
        const { groupId, phase, studentId, marks } = req.body;
        const coordinatorId = req.user.id;

        if (!["Progress", "Defence"].includes(phase)) {
            return res.status(400).json({
                success: false,
                message: "Coordinator can only grade Progress or Defence phases.",
            });
        }

        if (marks < 0 || marks > 80) {
            return res.status(400).json({
                success: false,
                message: `Invalid marks ${marks}. Coordinator marks must be between 0 and 80.`,
            });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found." });
        }

        if (!group.members.includes(studentId)) {
            return res.status(400).json({ success: false, message: "This student is not in this group." });
        }

        const milestone = await Milestone.findOne({ groupId });
        if (!milestone) {
            return res.status(404).json({ success: false, message: "Milestone not found for this group." });
        }

        if (milestone.phase !== phase) {
            return res.status(400).json({
                success: false,
                message: `The group is in ${milestone.phase} phase.`,
            });
        }

        let grading = await Grading.findOne({ groupId, studentId, phase });

        if (grading) {
            grading.coordinatorMarks = marks;
        } else {
            grading = new Grading({
                milestoneId: milestone._id,
                phase,
                groupId,
                studentId,
                coordinatorMarks: marks,
            });
        }

        grading.status = "Graded";
        grading.coordinatorId = coordinatorId;

        await grading.save();

        return res.status(200).json({
            success: true,
            message: `Marking done successfully.`,
            data: grading,
        });
    } catch (error) {
        console.error("Error assigning coordinator marks:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get grades for a specific group and phase
export const getGroupGrades = async (req, res) => {
    try {
        const { groupId } = req.params;
        const grades = await Grading.find({ groupId }).populate("studentId", "username email rollNo");

        if (!grades || grades.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No grading records found for this group and phase.",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Grades fetched successfully.`,
            data: grades,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get all grading records (Coordinator/Admin)
export const getAllGrades = async (req, res) => {
    try {
        const grades = await Grading.find()
            .populate("groupId")
            .populate("studentId", "username email rollNo")
            .populate("milestoneId", "department")

        return res.status(200).json({
            success: true,
            message: "All grading records fetched successfully.",
            data: grades,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

