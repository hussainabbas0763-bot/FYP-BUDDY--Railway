import { Milestone } from "../models/milestoneModel.js";
import { Group } from "../models/Group_Formation/groupModel.js";
import cloudinary from "../utils/cloudinary.js";
import getDataUri from "../utils/dataUri.js";
import { createDeletionLog } from "./deletionController.js";
import e from "express";

// ✅ Get milestone by group ID
export const getMilestoneByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const milestone = await Milestone.findOne({ groupId });
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: "Milestone not found for this group",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Milestone fetched successfully",
      milestone,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Activate submission window for a phase (optionally by department)
export const activateSubmission = async (req, res) => {
  try {
    const { phase, submissionDeadline, gradingDeadline, conductionDate, department, autoAllocationDate } = req.body;

    // Role restriction
    if (!["coordinator", "admin", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only coordinators, supervisors, or admins can activate submissions.",
      });
    }

    if (!phase || !submissionDeadline) {
      return res.status(400).json({
        success: false,
        message: "Phase and submission deadline are required.",
      });
    }

    if(phase !== "Proposal" && !gradingDeadline){
      return res.status(400).json({
        success: false,
        message: "Grading deadline For Supervisors is required for Progress and Defence phases.",
      });
    }

    if(phase === "Proposal" && !autoAllocationDate){
      return res.status(400).json({
        success: false,
        message: "Auto Supervisor Allocation Date is required for Proposal phase.",
      });
    }

    const validPhases = ["Proposal", "Progress", "Defence"];
    if (!validPhases.includes(phase)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phase. Must be one of: Proposal, Progress, Defence.",
      });
    }

    const filter = { phase };
    if (department) filter.department = department;

    const updateData = {
      isSubmissionActive: true,
      submissionDeadline: new Date(submissionDeadline),
      gradingDeadline: gradingDeadline ? new Date(gradingDeadline) : null,
      conductionDate: conductionDate || null,
    };

    // Add autoAllocationDate only for Proposal phase
    if (phase === "Proposal" && autoAllocationDate) {
      updateData.autoAllocationDate = new Date(autoAllocationDate);
    }

    const result = await Milestone.updateMany(filter, {
      $set: updateData,
    });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: `No milestones found in phase ${phase}${department ? " for " + department : ""}.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Submission window activated for ${result.matchedCount} milestones in ${phase} phase.`,
    });
  } catch (error) {
    console.error("Error activating submissions:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Student uploads submission file
export const uploadSubmission = async (req, res) => {
  try {
    const { groupId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "Submission file is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const milestone = await Milestone.findOne({ groupId });
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found for your group" });
    }

    if (!milestone.isSubmissionActive) {
      return res.status(403).json({ success: false, message: "Submission is currently inactive for this phase." });
    }

    const now = new Date();
    if (milestone.submissionDeadline && now > milestone.submissionDeadline) {
      milestone.isSubmissionActive = false;
      await milestone.save();
      return res.status(403).json({ success: false, message: "Submission deadline has passed." });
    }

    // Handle Cloudinary re-upload logic
    const phaseKey = milestone.phase.toLowerCase();
    const prevFileId = milestone.studentSubmission[phaseKey]?.publicId;

    if (prevFileId) {
      try {
        await cloudinary.uploader.destroy(prevFileId, { resource_type: "raw" });
      } catch (err) {
        console.warn("Old file deletion failed:", err.message);
      }
    }

    // Upload new file
    const fileUri = getDataUri(file);
    const uploadRes = await cloudinary.uploader.upload(fileUri, {
      folder: "FYP_BUDDY_PDFS",
      resource_type: "raw",
      format: "pdf",
    });

    // Update submission info
    milestone.studentSubmission[phaseKey] = {
      file: uploadRes.secure_url,
      publicId: uploadRes.public_id,
      submissionDate: now,
    };

    milestone.status = "Under Review";
    await milestone.save();

    return res.status(200).json({
      success: true,
      message: "Submission uploaded successfully.",
      data: milestone,
    });
  } catch (error) {
    console.error("Error uploading submission:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update milestone status (auto transition logic)
export const updateMilestoneStatus = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!["coordinator"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only coordinators can update milestone status." });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const milestone = await Milestone.findOne({ groupId });
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    // Update current status
    milestone.status = status;
    milestone.updatedBy = userId;
    await milestone.save();

    // Auto phase transition if completed
    if (status === "Completed") {
      const currentPhase = milestone.phase;
      let nextPhase = null;

      if (currentPhase === "Proposal") nextPhase = "Progress";
      else if (currentPhase === "Progress") nextPhase = "Defence";
      else if (currentPhase === "Defence") nextPhase = "Completed";

      if (nextPhase) {
        milestone.previousPhase = {
          title: currentPhase,
          status: "Completed",
        };
        milestone.phase = nextPhase;
        milestone.status = "Pending";
        milestone.isSubmissionActive = false;
        milestone.submissionDeadline = null;
        milestone.gradingDeadline = null;
        milestone.conductionDate = null;

        await milestone.save();

        // If transitioning from Defence to Completed, create deletion log
        if (currentPhase === "Defence") {
          try {
            // Update group status to completed
            group.status = "completed";
            await group.save();

            // Create deletion log with 7-day deadline
            const memberIds = group.members.map((member) => member._id || member);
            const deletionLog = await createDeletionLog(groupId, memberIds);

            return res.status(200).json({
              success: true,
              message: `FYP Completed! Milestone moved from ${currentPhase} → ${nextPhase}. Deletion scheduled in 7 days.`,
              data: {
                milestone,
                group,
                deletionLog,
              },
            });
          } catch (error) {
            console.error("Error creating deletion log:", error);
            return res.status(500).json({
              success: false,
              message: "Milestone updated but failed to create deletion log: " + error.message,
            });
          }
        }

        return res.status(200).json({
          success: true,
          message: `Milestone marked as Completed and moved from ${currentPhase} → ${nextPhase}`,
          data: milestone,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Final phase (Defence) marked as Completed. Project lifecycle finished.",
          data: milestone,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Milestone status updated to ${status}`,
      data: milestone,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all milestones (Admin/Coordinator view)
export const getAllMilestones = async (req, res) => {
  try {
    const milestones = await Milestone.find()
      .populate({
        path: "groupId",
        populate: { path: "members", select: "username email rollNo" },
      })
      .populate("updatedBy", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "All milestones fetched successfully",
      data: milestones,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
