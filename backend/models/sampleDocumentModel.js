import mongoose from "mongoose";

const sampleDocumentSchema = new mongoose.Schema(
  {
    phase: {
      type: String,
      enum: ["Proposal", "Progress", "Defence"],
      required: true,
    },
    file: {
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
    description: {
      type: String,
      required: true,
      trim: true,
    },
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
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
sampleDocumentSchema.index({ department: 1, phase: 1 });
sampleDocumentSchema.index({ uploadedBy: 1 });

export const SampleDocument = mongoose.model("SampleDocument", sampleDocumentSchema);

