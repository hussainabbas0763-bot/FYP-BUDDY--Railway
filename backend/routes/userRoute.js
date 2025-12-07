import express from "express"
import { resetPassword, forgotPassword, loginUser, logoutUser, registerUser, verifyOTP, 
getAllUsers, updateUser, deleteUser , ChangeEmail , verifyChangeEmailOtp , updateProfile, changePassword} from "../controllers/userController.js"
import { isAuthenticated , authorizeRoles} from "../middleware/isAuthenticated.js"
import {singleUpload} from "../middleware/multer.js"

const router = express.Router()


router.post('/register', isAuthenticated, authorizeRoles("admin"), registerUser)
router.post('/login', loginUser)
router.post('/logout',isAuthenticated, logoutUser)
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp/:email', verifyOTP)
router.post('/reset-password/:email', resetPassword)
router.get('/get-users', isAuthenticated, getAllUsers)
router.route('/update-user/:userId').put(isAuthenticated,authorizeRoles("admin"), updateUser)
router.delete('/delete-user/:userId', isAuthenticated,authorizeRoles("admin"), deleteUser )
router.post('/email-change/:userId', isAuthenticated, ChangeEmail)
router.post('/verify-email/:userId', isAuthenticated, verifyChangeEmailOtp)
router.route('/update-profile/:userId').put(isAuthenticated, singleUpload, updateProfile)
router.put('/change-password/:userId', isAuthenticated, changePassword)


export default router