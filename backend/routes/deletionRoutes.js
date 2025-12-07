import express from "express";
import {
  getDeletionLogByGroup,
  executeDeletion
} from "../controllers/deletionController.js";
import { isAuthenticated , authorizeRoles} from "../middleware/isAuthenticated.js"

const router = express.Router();

router.get("/group/:groupId",isAuthenticated,authorizeRoles("student"),getDeletionLogByGroup);
router.post("/execute-deletion",isAuthenticated, authorizeRoles("student"),executeDeletion);


export default router;
