import { Router } from "express";
import {
    getRoomMessages,
    getUserChatRooms,
    getUnreadCounts,
} from "../controllers/chatController.js";
import {
    uploadAttachment,
    uploadAttachmentMiddleware,
} from "../controllers/chatAttachmentController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = Router();

router.get("/rooms", isAuthenticated, getUserChatRooms);
router.get("/rooms/:roomKey/messages", isAuthenticated, getRoomMessages);
router.get("/unread-counts", isAuthenticated, getUnreadCounts);
router.post(
    "/upload",
    isAuthenticated,
    uploadAttachmentMiddleware,
    uploadAttachment
);

export default router;
