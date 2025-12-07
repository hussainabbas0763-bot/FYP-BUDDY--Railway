import express from "express";
import { isAuthenticated , authorizeRoles} from "../middleware/isAuthenticated.js"
import { assignSupervisorMarks, assignCoordinatorMarks, getGroupGrades, getAllGrades } from "../controllers/gradingController.js";

const router = express.Router();

router.post("/supervisor", isAuthenticated, authorizeRoles("supervisor"),assignSupervisorMarks)
router.post("/coordinator", isAuthenticated, authorizeRoles("coordinator"), assignCoordinatorMarks)
router.get("/get-group-marks/:groupId", isAuthenticated, authorizeRoles("student","supervisor"), getGroupGrades)
router.get("/get-all-grades", isAuthenticated, authorizeRoles("coordinator"), getAllGrades)

export default router;