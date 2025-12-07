import { DeletionLog } from "../models/deletionLogModel.js";
import { Grading } from "../models/gradingModel.js";
import { Milestone } from "../models/milestoneModel.js";
import { Task } from "../models/taskModel.js";
import { SupervisorRequest } from "../models/supervisorRequestModel.js";
import { GroupInvitation } from "../models/Group_Formation/groupInvitationModel.js";
import { Group } from "../models/Group_Formation/groupModel.js";
import { User } from "../models/userModel.js";
import { ChatMessage } from "../models/chatMessageModel.js";
import { ChatDeliveryReceipt } from "../models/chatDeliveryReceiptModel.js";
import { ChatReadReceipt } from "../models/chatReadReceiptModel.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

// -----------------------------------------------------------
// Create Deletion Log (Service Function - No Express Response)
// -----------------------------------------------------------
export const createDeletionLog = async (groupId, memberIds) => {
  try {
    if (!groupId) {
      throw new AppError("groupId is required", 400);
    }

    // ensure group exists
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError("Group not found", 404);
    }

    // check for existing pending log
    const existingLog = await DeletionLog.findOne({
      groupId,
      status: "Pending",
    });

    if (existingLog) {
      return { existed: true, deletionLog: existingLog };
    }

    // compute deadline (7 days from now)
    const deletionDeadline = new Date();
    deletionDeadline.setDate(deletionDeadline.getDate() + 7);

    const deletionLog = new DeletionLog({
      groupId,
      memberIds: memberIds || group.members.map((m) => m._id || m),
      deletionDeadline,
      status: "Pending",
    });

    await deletionLog.save();

    return { existed: false, deletionLog };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error("createDeletionLog service error:", err);
    throw new Error("Failed to create deletion log");
  }
};

// -----------------------------------------------------------
// Get Deletion Log for a Group
// -----------------------------------------------------------
export const getDeletionLogByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const deletionLog = await DeletionLog.findOne({
      groupId,
      status: "Pending",
    })
      .populate("groupId", "groupName")
      .populate("memberIds", "username email");

    if (!deletionLog) {
      return res.status(404).json({
        success: false,
        message: "No pending deletion log found for this group.",
      });
    }

    return res.status(200).json({
      success: true,
      data: deletionLog,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Internal server error , ${error}`,
    });
  }
};

// -----------------------------------------------------------
// Execute Full Deletion for a Group (Service Function)
// -----------------------------------------------------------
export const executeDeletion = async (req, res) => {
  const { groupId } = req.body
  try {
    const group = await Group.findById(groupId).populate("supervisor members");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group Not Found"
      })
    }

    const currentMemberIds = group.members.map((m) => m._id || m);

    // 1. Delete grading records
    await Grading.deleteMany({ groupId });

    // 2. Delete milestone files and documents
    const milestones = await Milestone.find({ groupId });
    for (const milestone of milestones) {
      // Proposal
      if (milestone.studentSubmission?.proposal?.publicId) {
        try {
          await cloudinary.uploader.destroy(
            milestone.studentSubmission.proposal.publicId,
            { resource_type: "raw" }
          );
        } catch (err) {
          console.warn("Failed to delete proposal file:", err.message);
        }
      }

      // Progress
      if (milestone.studentSubmission?.progress?.publicId) {
        try {
          await cloudinary.uploader.destroy(
            milestone.studentSubmission.progress.publicId,
            { resource_type: "raw" }
          );
        } catch (err) {
          console.warn("Failed to delete progress file:", err.message);
        }
      }

      // Defence
      if (milestone.studentSubmission?.defence?.publicId) {
        try {
          await cloudinary.uploader.destroy(
            milestone.studentSubmission.defence.publicId,
            { resource_type: "raw" }
          );
        } catch (err) {
          console.warn("Failed to delete defence file:", err.message);
        }
      }
    }
    await Milestone.deleteMany({ groupId });

    // 3. Delete tasks and files
    const tasks = await Task.find({ groupId });
    for (const task of tasks) {
      if (task.publicId) {
        try {
          await cloudinary.uploader.destroy(task.publicId, {
            resource_type: "raw",
          });
        } catch (err) {
          console.warn("Failed to delete task file:", err.message);
        }
      }
    }
    await Task.deleteMany({ groupId });

    // 4. Delete supervisor requests
    await SupervisorRequest.deleteMany({ groupId });

    // 5. Delete group invitations
    await GroupInvitation.deleteMany({ groupId });

    // 6. Delete chat messages and attachments
    const chatMessages = await ChatMessage.find({ groupId });
    for (const message of chatMessages) {
      if (message.attachments && message.attachments.length > 0) {
        for (const attachment of message.attachments) {
          if (attachment.publicId) {
            try {
              const resourceType = attachment.fileType?.startsWith("image") 
                ? "image" 
                : attachment.fileType?.startsWith("video")
                ? "video"
                : "raw";
              
              await cloudinary.uploader.destroy(attachment.publicId, {
                resource_type: resourceType,
              });
            } catch (err) {
              console.warn("Failed to delete chat attachment:", err.message);
            }
          }
        }
      }
    }
    await ChatMessage.deleteMany({ groupId });

    // 7. Delete chat delivery receipts
    const chatRoomKey = `group_${groupId}`;
    await ChatDeliveryReceipt.deleteMany({ roomKey: chatRoomKey });

    // 8. Delete chat read receipts
    await ChatReadReceipt.deleteMany({ roomKey: chatRoomKey });

    // 9. Delete chatbot sessions for group members
    try {
      const chatSessionsCollection = mongoose.connection.db.collection("chat_sessions");
      await chatSessionsCollection.deleteMany({
        user_id: { $in: currentMemberIds.map(id => id.toString()) }
      });
    } catch (err) {
      console.warn("Failed to delete chatbot sessions:", err.message);
    }

    // 10. Update supervisor slots safely
    if (group.supervisor) {
      const supervisor = await User.findById(group.supervisor);

      if (supervisor) {
        await User.findByIdAndUpdate(group.supervisor, {
          $inc: { "supervision.current": -1 },
          $pull: { "supervision.supervisedGroupId": groupId },
        });

        if (supervisor.supervision.current < supervisor.supervision.limit) {
          supervisor.supervision.isAvailable = true;
          await supervisor.save();
        }
      } else {
        console.warn(`Supervisor ${group.supervisor} missing — skipping update`);
      }
    }

    // 11. Update student statuses
    await User.updateMany(
      { _id: { $in: currentMemberIds } },
      { $set: { activeStudents: false, groupId: null } }
    );

    // 12. Delete Group
    await Group.findByIdAndDelete(groupId);

    // 13. Mark deletion log as completed
    await DeletionLog.findOneAndUpdate(
      { groupId, status: "Pending" },
      { status: "Deleted", deletedAt: new Date() }
    );

    // 14. Delete the Log itself
    await DeletionLog.deleteMany({groupId: groupId})

    return res.status(200).json({
      success: true,
      message: "Group data deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `internal Sever Error ${error}`
    })
  }
};
