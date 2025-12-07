import { Task } from "../models/taskModel.js";
import { Group } from "../models/Group_Formation/groupModel.js";
import cloudinary from "../utils/cloudinary.js";
import getDataUri from "../utils/dataUri.js";

// supervisor creates a task
export const createTask = async (req, res) => {
  try {
    const { groupId, title, description, dueDate, allowLateSubmission } = req.body;
    const supervisorId = req.user.id;

    // Validate group existence
    const group = await Group.findById(groupId);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });

    // Ensure only assigned supervisor can create tasks for this group
    if (group.supervisor.toString() !== supervisorId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create tasks for this group",
      });
    }

    //  Create new task
    const newTask = await Task.create({
      groupId,
      supervisorId,
      title,
      description,
      dueDate,
      allowLateSubmission: allowLateSubmission || false,
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: newTask,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating task",
      error: error.message,
    });
  }
};


export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, allowLateSubmission } = req.body;
    const supervisorId = req.user.id;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    // Authorization check
    if (task.supervisorId.toString() !== supervisorId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "You are not authorized to update this task" });
    }

    // Apply updates if provided
    if (title) task.title = title;
    if (description) task.description = description;
    if (dueDate) task.dueDate = new Date(dueDate);
    if (typeof allowLateSubmission === "boolean")
      task.allowLateSubmission = allowLateSubmission;

    await task.save();

    res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({
      message: "Server error while updating task",
      error: error.message,
    });
  }
};

//get tasks for the group
export const getTasksByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const tasks = await Task.find({ groupId });

    if (!tasks || tasks.length === 0)
      return res.status(404).json({ success: false, message: "No tasks found for this group" });

    res.status(200).json({ success: true, message: "Tasks fetched successfully", tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching tasks", error: error.message });
  }
};

// student submits a task 
export const submitTask = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    const task = await Task.findById(id);

    if (!task)
      return res.status(404).json({ success: false, message: "Task not found" });

    if (!file)
      return res.status(400).json({ success: false, message: "No PDF file uploaded" });

    const currentDate = new Date();
    const isLate = currentDate.getTime() > new Date(task.dueDate).getTime();

    if (isLate && !task.allowLateSubmission) {
      return res.status(400).json({
        success: false,
        message: "Your Supervisor did not allow late submissions",
      });
    }

    // ✅ If resubmitting, delete previous file from Cloudinary
    if (task.publicId) {
      await cloudinary.uploader.destroy(task.publicId, { resource_type: "raw" });
    }

    // ✅ Upload new PDF
    const fileUri = getDataUri(file);
    const cloudResponse = await cloudinary.uploader.upload(fileUri, {
      folder: "FYP_BUDDY_PDFS",
      resource_type: "raw",
      format: "pdf",       
    });

    const submissionStatus = currentDate <= new Date(task.dueDate) ? "On Time" : "Late";

    // ✅ Save updated details in database
    task.studentSubmission = cloudResponse.secure_url; // public URL
    task.publicId = cloudResponse.public_id;
    task.status = "Submitted";
    task.submittedAt = currentDate;
    task.submissionStatus = submissionStatus;
    task.feedback = ""; // reset for resubmissions

    await task.save();

    res.status(200).json({
      success: true,
      message: "Task submitted successfully",
      task,
    });
  } catch (error) {
    console.error("Error submitting task:", error);
    res.status(500).json({
      success: false,
      message: "Server error while submitting task",
      error: error.message,
    });
  }
};


// supervisor reviews the task
export const reviewTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;
    const supervisorId = req.user.id;

    const task = await Task.findById(id);
    if (!task)
      return res.status(404).json({ success: false, message: "Task not found" });

    //  Ensure only the assigned supervisor can review
    if (task.supervisorId.toString() !== supervisorId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to review this task",
      });
    }

    //  Validate status input
    if (!["Accepted", "Rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid review status (Accepted/Rejected only)" });
    }

    //  Handle review update
    task.status = status;
    task.feedback = feedback || "";
    task.reviewedAt = new Date();

    await task.save();

    res.status(200).json({
      success: true,
      message: `Task ${status.toLowerCase()} successfully`,
      task,
    });
  } catch (error) {
    console.error("Error reviewing task:", error);
    res.status(500).json({
      success: false,
      message: "Server error while reviewing task",
      error: error.message,
    });
  }
};


// student removes a submission before review
export const removeSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task)
      return res.status(404).json({ success: false, message: "Task not found" });

    // Only allow removal if not reviewed yet and currently in Submitted state
    if (task.reviewedAt) {
      return res.status(400).json({ success: false, message: "Submission already reviewed and cannot be removed" });
    }
    if (task.status !== "Submitted") {
      return res.status(400).json({ success: false, message: "No active submission to remove" });
    }

    // Delete file from Cloudinary if exists
    if (task.publicId) {
      try {
        await cloudinary.uploader.destroy(task.publicId, { resource_type: "raw" });
      } catch (err) {
        // proceed even if deletion fails, but log
        console.error("Cloudinary deletion failed:", err.message);
      }
    }

    // Reset submission-related fields
    task.studentSubmission = null;
    task.publicId = undefined;
    task.status = "Assigned";
    task.submittedAt = null;
    task.submissionStatus = null;
    task.feedback = "";

    await task.save();

    return res.status(200).json({ success: true, message: "Submission removed", task });
  } catch (error) {
    console.error("Error removing submission:", error);
    return res.status(500).json({ success: false, message: "Server error while removing submission", error: error.message });
  }
};

// supervisor deletes the task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const supervisorId = req.user.id;

    // Find the task first
    const task = await Task.findById(id);
    if (!task)
      return res.status(404).json({ success: false, message: "Task not found" });

    // Verify authorization — only the assigned supervisor can delete
    if (task.supervisorId.toString() !== supervisorId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "You are not authorized to delete this task" });
    }

    // If file exists on Cloudinary, remove it
    if (task.publicId) {
      await cloudinary.uploader.destroy(task.publicId, { resource_type: "raw" });
    }

    // Delete task from DB
    await Task.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting task",
      error: error.message,
    });
  }
};
