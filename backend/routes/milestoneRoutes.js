import express from "express";
import {
  getMilestoneByGroup,
  activateSubmission,
  uploadSubmission,
  updateMilestoneStatus,
  getAllMilestones,
} from "../controllers/milestoneController.js";

import { isAuthenticated , authorizeRoles} from "../middleware/isAuthenticated.js"
import { singleUpload } from "../middleware/multer.js";

const router = express.Router();

router.get("/get-my-milestone/:groupId", isAuthenticated, getMilestoneByGroup);
router.put("/open-submission", isAuthenticated, authorizeRoles("coordinator"), activateSubmission);
router.post("/upload-submission/:groupId", isAuthenticated, authorizeRoles("student"),singleUpload , uploadSubmission);
router.put("/update-milestone/:groupId", isAuthenticated, authorizeRoles("coordinator"), updateMilestoneStatus);
router.get("/get-all-milestones", isAuthenticated, authorizeRoles("coordinator"), getAllMilestones);

export default router;
