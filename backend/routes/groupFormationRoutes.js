import express from "express";
import {createGroup,sendInvitation,getInvitations,respondInvitation,getMyGroup,leaveGroup,disbandGroup,updateGroupInfo,} from "../controllers/groupFormationController.js";
import { isAuthenticated , authorizeRoles} from "../middleware/isAuthenticated.js";
import { singleUpload } from "../middleware/multer.js";

const router = express.Router();
router.post("/create", isAuthenticated, authorizeRoles("student"), createGroup);
router.post("/invite", isAuthenticated, authorizeRoles("student"), sendInvitation);
router.get("/invitations", isAuthenticated, authorizeRoles("student"), getInvitations);
router.post("/respond/:id", isAuthenticated, authorizeRoles("student"), respondInvitation);
router.get("/my-group", isAuthenticated, authorizeRoles("student"), getMyGroup);
router.post("/leave", isAuthenticated, authorizeRoles("student"), leaveGroup);
router.delete("/disband/:id", isAuthenticated, authorizeRoles("student"), disbandGroup);
router.put("/update-info", isAuthenticated, authorizeRoles("student"), singleUpload, updateGroupInfo);

export default router;
