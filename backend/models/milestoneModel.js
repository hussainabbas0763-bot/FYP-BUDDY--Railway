import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    phase: {
      type: String,
      enum: ["Proposal", "Progress", "Defence", "Completed"],
      default: "Proposal",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Under Review", "Completed", "Failed"],
      default: "Pending",
      required: true,
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
    previousPhase: {
      title: {
        type: String,
        enum: ["Proposal", "Progress", "Defence"],
        default: null,
      },
      status: {
        type: String,
        enum: ["Completed"],
        default: null,
      },
    },
    conductionDate: Date,

    // --- Submission Controls ---
    isSubmissionActive: {
      type: Boolean,
      default: false,
    },
    submissionDeadline: Date,
    gradingDeadline: Date,
    autoAllocationDate: Date, // Auto-supervisor allocation deadline for groups without supervisors

    // --- Student Submissions ---

    studentSubmission: {
      proposal: {
        file: String,
        publicId: String,
        submissionDate: Date,
      },
      progress: {
        file: String,
        publicId: String,
        submissionDate: Date,
      },
      defence: {
        file: String,
        publicId: String,
        submissionDate: Date,
      },
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Auto check before saving
milestoneSchema.pre("save", function (next) {
  if (this.submissionDeadline && new Date() > this.submissionDeadline) {
    this.isSubmissionActive = false;
  }
  next();
});

// auto check on find queries too
milestoneSchema.post(["find", "findOne"], async function (docs) {
  const now = new Date();

  // Handle both array (find) and single doc (findOne)
  const milestones = Array.isArray(docs) ? docs : [docs];
  const updates = [];

  for (const doc of milestones) {
    if (doc && doc.submissionDeadline && now > doc.submissionDeadline && doc.isSubmissionActive) {
      doc.isSubmissionActive = false;
      updates.push(
        doc.updateOne({ isSubmissionActive: false }) // keep DB consistent
      );
    }
  }

  if (updates.length) await Promise.all(updates);
});

export const Milestone = mongoose.model("Milestone", milestoneSchema);
