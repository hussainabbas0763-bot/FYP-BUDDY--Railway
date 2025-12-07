import mongoose from "mongoose";

const supervisorRequestSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
    },
    fypTitle: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    requestFromGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "declined"],
        default: "pending",
    },
}, {
    timestamps: true
});

export const SupervisorRequest = mongoose.model("SupervisorRequest", supervisorRequestSchema);
