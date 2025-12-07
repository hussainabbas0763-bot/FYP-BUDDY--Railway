import mongoose from "mongoose";

const deletionLogSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    memberIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    deletionDeadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Deleted"],
      default: "Pending",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const DeletionLog = mongoose.model("DeletionLog", deletionLogSchema);
