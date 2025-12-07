import express from "express";
import {
  createTask,
  updateTask,
  getTasksByGroup,
  submitTask,
  reviewTask,
  deleteTask,
  removeSubmission,
} from "../controllers/taskController.js";
import { isAuthenticated, authorizeRoles } from "../middleware/isAuthenticated.js";
import { singleUpload } from "../middleware/multer.js";

const router = express.Router();

router.post("/create", isAuthenticated, authorizeRoles("supervisor"), createTask);
router.put("/update/:id", isAuthenticated, authorizeRoles("supervisor"), updateTask);
router.get("/get-tasks/:groupId", isAuthenticated, authorizeRoles("student", "supervisor"), getTasksByGroup);
router.route("/submit-task/:id").put(isAuthenticated, authorizeRoles("student"), singleUpload, submitTask);
router.put("/review/:id", isAuthenticated, authorizeRoles("supervisor"), reviewTask);
router.delete("/remove-submission/:id", isAuthenticated, authorizeRoles("student"), removeSubmission);
router.delete("/delete-task/:id", isAuthenticated, authorizeRoles("supervisor"), deleteTask);

export default router;
