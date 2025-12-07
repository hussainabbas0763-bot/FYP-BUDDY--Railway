import express from "express";
import {
  createAnnouncement,
  getAllAnnouncements,
  deleteAnnouncement,
} from "../controllers/announcementController.js";

import { isAuthenticated, authorizeRoles } from "../middleware/isAuthenticated.js";
import { multipleUpload } from "../middleware/multer.js";

const router = express.Router();

router.post("/create", isAuthenticated, authorizeRoles("coordinator"), multipleUpload, createAnnouncement);
router.get("/get-all", isAuthenticated, getAllAnnouncements);
router.delete("/delete/:id", isAuthenticated, authorizeRoles("coordinator"), deleteAnnouncement);

export default router;
