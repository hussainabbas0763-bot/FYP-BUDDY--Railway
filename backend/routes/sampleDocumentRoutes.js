import express from "express";
import {
  uploadSampleDocument,
  getAllSampleDocuments,
  deleteSampleDocument,
} from "../controllers/sampleDocumentController.js";
import { isAuthenticated, authorizeRoles } from "../middleware/isAuthenticated.js";
import { singleUpload } from "../middleware/multer.js";

const router = express.Router();

// Get all sample documents (coordinators and admins can access)
router.get(
  "/",
  isAuthenticated,
  authorizeRoles("coordinator", "student"),
  getAllSampleDocuments
);

// Upload sample document (only coordinators)
router.post(
  "/upload",
  isAuthenticated,
  authorizeRoles("coordinator"),
  singleUpload,
  uploadSampleDocument
);

// Delete sample document (coordinators and admins)
router.delete(
  "/:id",
  isAuthenticated,
  authorizeRoles("coordinator", "admin"),
  deleteSampleDocument
);

export default router;

