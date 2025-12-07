import cloudinary from "../utils/cloudinary.js";
import { SampleDocument } from "../models/sampleDocumentModel.js";
import { User } from "../models/userModel.js";
import path from "path";

export const uploadSampleDocument = async (req, res) => {
  try {
    const { phase, description, department } = req.body;
    const file = req.file;
    const userId = req.user.id;

    // Validate required fields
    if (!phase || !description || !department) {
      return res.status(400).json({
        success: false,
        message: "Phase, description, and department are required.",
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "File is required.",
      });
    }

    // Validate file type (PDF, Word, PowerPoint)
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    const allowedExtensions = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];
    const fileName = file.originalname.toLowerCase();
    const fileExt = path.extname(fileName);

    if (
      !allowedMimeTypes.includes(file.mimetype) ||
      !allowedExtensions.includes(fileExt)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid file type. Only PDF, Word (.doc, .docx), and PowerPoint (.ppt, .pptx) files are allowed.",
      });
    }

    // Ensure uploader is a coordinator
    const user = await User.findById(userId);
    if (!user || user.role !== "coordinator") {
      return res.status(403).json({
        success: false,
        message: "Only coordinators can upload sample documents.",
      });
    }

    // Upload file to Cloudinary with extension preserved
    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "FYP_BUDDY_SAMPLE_DOCS",
            resource_type: "raw",
            public_id: `doc_${Date.now()}_${userId}${fileExt}`, // ✅ keep extension
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

    // Save file info to DB
    const sampleDoc = await SampleDocument.create({
      phase,
      file: uploadRes.secure_url,
      publicId: uploadRes.public_id,
      fileName: file.originalname,
      description: description.trim(),
      department,
      uploadedBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Sample document uploaded successfully.",
      data: sampleDoc,
    });
  } catch (error) {
    console.error("Error uploading sample document:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload sample document.",
    });
  }
};

//Get all sample documents (filtered by department for coordinator)
export const getAllSampleDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If coordinator or student, filter by their department
    const query = {};
    if ((user.role === "coordinator" || user.role === "student") && user.department) {
      query.department = user.department;
    }

    const sampleDocuments = await SampleDocument.find(query)
      .populate("uploadedBy", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Sample documents fetched successfully",
      data: sampleDocuments,
    });
  } catch (error) {
    console.error("Error fetching sample documents:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sample documents",
      error: error.message,
    });
  }
};

// Delete sample document
export const deleteSampleDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the document
    const sampleDoc = await SampleDocument.findById(id);

    if (!sampleDoc) {
      return res.status(404).json({
        success: false,
        message: "Sample document not found",
      });
    }

    // Check if user is the uploader or an admin
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const canDelete =
      sampleDoc.uploadedBy.toString() === userId ||
      (user.role === "coordinator" && user.department === sampleDoc.department);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this document",
      });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(sampleDoc.publicId, {
        resource_type: "raw",
      });
    } catch (cloudinaryError) {
      console.warn("Cloudinary deletion failed:", cloudinaryError.message);
  
    }

    await SampleDocument.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Sample document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting sample document:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete sample document",
      error: error.message,
    });
  }
};