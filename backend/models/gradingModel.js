import mongoose from "mongoose";

const gradingSchema = new mongoose.Schema(
    {

        milestoneId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Milestone",
            required: true,
        },
        phase: {
            type: String,
            enum: ["Progress", "Defence"],
            required: true,
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // who did the grading
        supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        coordinatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

        supervisorMarks: {
            type: Number,
            min: 0,
            max: 20,
            default: 0,
        },
        coordinatorMarks: {
            type: Number,
            min: 0,
            max: 80,
            default: 0,
        },
        totalMarks: {
            type: Number,
            default: 0,
        },

        gradingStatus: {
            type: String,
            enum: ["Pending", "Graded"],
            default: "Pending",
        },

    },
    { timestamps: true }
);

// Auto-calc total
gradingSchema.pre("save", function (next) {
    this.totalMarks = this.supervisorMarks + this.coordinatorMarks;
    next();
});

export const Grading = mongoose.model("Grading", gradingSchema);
