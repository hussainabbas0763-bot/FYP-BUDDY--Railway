import express from "express"
import {
    sendChatMessage,
    createNewSession,
    listSessions,
    switchSession,
    getSessionMessages,
    deleteSession,
    renameSession,
    getChatbotHealth
} from "../controllers/chatbotController.js"
import { isAuthenticated, authorizeRoles } from "../middleware/isAuthenticated.js"

const router = express.Router()

router.post('/chat', isAuthenticated, authorizeRoles("student"), sendChatMessage)
router.post('/sessions/new', isAuthenticated, authorizeRoles("student"), createNewSession)
router.get('/sessions', isAuthenticated, authorizeRoles("student"), listSessions)
router.post('/sessions/switch', isAuthenticated, authorizeRoles("student"), switchSession)
router.get('/sessions/:id/messages', isAuthenticated, authorizeRoles("student"), getSessionMessages)
router.delete('/sessions/:id', isAuthenticated, authorizeRoles("student"), deleteSession)
router.post('/sessions/rename', isAuthenticated, authorizeRoles("student"), renameSession)
router.get('/health', getChatbotHealth)

export default router
