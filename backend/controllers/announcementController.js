import cloudinary from "../utils/cloudinary.js";
import { Announcement } from "../models/announcementModel.js";
import { User } from "../models/userModel.js";
import path from "path";

// Create announcement
export const createAnnouncement = async (req, res) => {
  try {
    const { title, description, entity, phase } = req.body;
    const files = req.files;
    const userId = req.user.id;

    // Validate required fields
    if (!title || !description || !entity) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and entity are required.",
      });
    }

    // Validate entity
    if (!["student", "supervisor"].includes(entity)) {
      return res.status(400).json({
        success: false,
        message: "Entity must be either 'student' or 'supervisor'.",
      });
    }

    // Validate phase for students
    if (entity === "student" && !phase) {
      return res.status(400).json({
        success: false,
        message: "Phase is required for student announcements.",
      });
    }

    if (entity === "student" && !["Proposal", "Progress", "Defence"].includes(phase)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phase. Must be one of: Proposal, Progress, Defence.",
      });
    }

    // Ensure user is a coordinator
    const user = await User.findById(userId);
    if (!user || user.role !== "coordinator") {
      return res.status(403).json({
        success: false,
        message: "Only coordinators can create announcements.",
      });
    }

    if (!user.department) {
      return res.status(400).json({
        success: false,
        message: "User department not found.",
      });
    }

    // Handle file uploads if any
    const uploadedFiles = [];
    if (files && files.length > 0) {
      // Validate file types
      const allowedMimeTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];

      const allowedExtensions = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png"];

      for (const file of files) {
        const fileName = file.originalname.toLowerCase();
        const fileExt = path.extname(fileName);

        if (
          !allowedMimeTypes.includes(file.mimetype) ||
          !allowedExtensions.includes(fileExt)
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid file type for ${file.originalname}. Only PDF, Word, PowerPoint, and images are allowed.`,
          });
        }

        // Upload to Cloudinary
        const uploadToCloudinary = () => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "FYP_BUDDY_ANNOUNCEMENTS",
                resource_type: "auto",
                public_id: `announcement_${Date.now()}_${userId}${fileExt}`,
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );

            uploadStream.end(file.buffer);
          });
        };

        const uploadRes = await uploadToCloudinary();
        uploadedFiles.push({
          url: uploadRes.secure_url,
          publicId: uploadRes.public_id,
          fileName: file.originalname,
        });
      }
    }

    // Create announcement
    const announcement = await Announcement.create({
      title: title.trim(),
      description: description.trim(),
      entity,
      phase: entity === "student" ? phase : null,
      files: uploadedFiles,
      department: user.department,
      createdBy: userId,
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate("createdBy", "username email");

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully.",
      data: populatedAnnouncement,
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create announcement.",
    });
  }
};

// Get all announcements
export const getAllAnnouncements = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPhase } = req.query;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

  
    const query = {};

    if (user.role === "coordinator") {
      // Coordinators see announcements from their department
      query.department = user.department;
    } else if (user.role === "student") {
      // Students see announcements for students in their department
      query.department = user.department;
      query.entity = "student";
      
      // Filter by current phase if provided
      if (currentPhase && ["Proposal", "Progress", "Defence", "Completed"].includes(currentPhase)) {
        query.phase = currentPhase;
      }

    } else if (user.role === "supervisor") {
      // Supervisors see announcements for supervisors in their department
      query.department = user.department;
      query.entity = "supervisor";
    }

    const announcements = await Announcement.find(query)
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Announcements fetched successfully",
      data: announcements,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
      error: error.message,
    });
  }
};

// Delete announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the announcement
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Check if user is the creator or a coordinator from the same department
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const canDelete =
      announcement.createdBy.toString() === userId ||
      (user.role === "coordinator" && user.department === announcement.department);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this announcement",
      });
    }

    // Delete files from Cloudinary
    if (announcement.files && announcement.files.length > 0) {
      for (const file of announcement.files) {
        try {
          await cloudinary.uploader.destroy(file.publicId, {
            resource_type: "auto",
          });
        } catch (cloudinaryError) {
          console.warn("Cloudinary deletion failed:", cloudinaryError.message);
        }
      }
    }

    await Announcement.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
      error: error.message,
    });
  }
};
