import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  groupIcon: {
    type: String,
    default: ""
  },
  groupIconPublicId: {
    type: String,
    default: ""
  },
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // department of the group
  department: {
    type: String,
    enum: [
      "Software Engineering",
      "Computer Science",
      "Electrical Engineering",
      "Information Technology",
      "Artificial Intelligence",
      "Cyber Security",
      "Data Science"
    ],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "active", "completed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

// Automatically ensure leader is in members list
groupSchema.pre("save", function (next) {
  if (!this.members.includes(this.leaderId)) {
    this.members.push(this.leaderId);
  }
  next();
});

export const Group = mongoose.model("Group", groupSchema);
