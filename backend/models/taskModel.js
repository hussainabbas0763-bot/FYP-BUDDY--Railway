import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        // The FYP group this task belongs to
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
        },

        // Supervisor who created the task
        supervisorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Task title (e.g., "Submit Proposal PDF", "Submit Final Report")
        title: {
            type: String,
            required: true,
            trim: true,
        },

        // Detailed description of what the task requires
        description: {
            type: String,
            required: true,
        },

        // Deadline for submission
        dueDate: {
            type: Date,
            required: true,
        },

        // Task status (pending, submitted, accepted, rejected)
        status: {
            type: String,
            enum: ["Assigned", "Submitted", "Accepted", "Rejected"],
            default: "Assigned",
        },

        // File path or URL for the student's submitted PDF
        studentSubmission: {
            type: String,
            default: null,
        },
        publicId: {
            type: String,
        },

        // Feedback provided by the supervisor
        feedback: {
            type: String,
            default: "",
        },

        // Date when student submitted the task
        submittedAt: {
            type: Date,
        },

        // Date when supervisor reviewed it
        reviewedAt: {
            type: Date,
        },
        allowLateSubmission: {
            type: Boolean,
            default: false,
        },

        submissionStatus: {
            type: String,
            enum: ["On Time", "Late", null],
            default: null,
        },

    },
    { timestamps: true }
);

export const Task = mongoose.model("Task", taskSchema);
