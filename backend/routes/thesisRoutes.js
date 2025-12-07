import express from "express";
import {
    pushCloudFileToGitHub,
    fetchAllFileMetadata,
    fetchAndServeFile
} from "../controllers/ThesisController.js";
import { isAuthenticated, authorizeRoles } from "../middleware/isAuthenticated.js";

const router = express.Router();


router.post("/push-to-github", isAuthenticated, authorizeRoles("coordinator"), pushCloudFileToGitHub);
router.get("/all-github-files", isAuthenticated, authorizeRoles("student"), fetchAllFileMetadata);
router.get("/see-github-file/:filePath(*)", isAuthenticated, fetchAndServeFile);

export default router;