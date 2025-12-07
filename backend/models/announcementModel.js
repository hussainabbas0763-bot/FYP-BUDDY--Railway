import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    entity: {
      type: String,
      enum: ["student", "supervisor"],
      required: true,
    },
    phase: {
      type: String,
      enum: ["Proposal", "Progress", "Defence"],
      default: null,
    },
    files: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        fileName: {
          type: String,
          default: "",
        },
      },
    ],
    department: {
      type: String,
      enum: [
        "Software Engineering",
        "Computer Science",
        "Electrical Engineering",
        "Information Technology",
        "Artificial Intelligence",
        "Cyber Security",
        "Data Science",
      ],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
announcementSchema.index({ department: 1, entity: 1 });
announcementSchema.index({ createdBy: 1 });
announcementSchema.index({ createdAt: -1 });

export const Announcement = mongoose.model("Announcement", announcementSchema);
