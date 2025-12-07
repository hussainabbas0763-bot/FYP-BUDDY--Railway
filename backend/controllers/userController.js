import { sendOtpMail } from "../emailVerify/OtpMail.js"
import { sendChangeMail } from "../emailVerify/ChangeMail.js";
import { Session } from "../models/sessionModel.js";
import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/cloudinary.js";

export const registerUser = async (req, res) => {
    try {
        const { role, username, email, cnic, password, department } = req.body;
        if (!role || !username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with same email already exists"
            })
        }
        const existingUserByCnic = await User.findOne({ cnic })
        if (existingUserByCnic) {
            return res.status(400).json({
                success: false,
                message: "User with same CNIC already exists"
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = await User.create({
            role,
            username,
            email,
            cnic,
            password: hashedPassword,
            department
        })

        await newUser.save()
        return res.status(201).json({
            success: true,
            message: `User Added successfully with role ${newUser.role}`,
            data: newUser
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })

    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            })
        }
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Email not registered yet"
            })
        }

        const passwordCheck = await bcrypt.compare(password, user.password)
        if (!passwordCheck) {
            return res.status(402).json({
                success: false,
                message: "Incorrect Password"
            })

        }

        // Check if student has completed FYP
        if (user.role === "student" && user.activeStudents === false) {
            return res.status(403).json({
                success: false,
                message: "You have completed your FYP and can no longer access the portal."
            })
        }

        // check for existing session and delete it
        const existingSession = await Session.findOne({ userId: user._id });
        if (existingSession) {
            await Session.deleteOne({ userId: user._id })
        }

        //create a new session
        await Session.create({ userId: user._id })

        //Generate tokens
        const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.SECRET_KEY, { expiresIn: "10d" })
        const refreshToken = jwt.sign({ id: user._id, role: user.role }, process.env.SECRET_KEY, { expiresIn: "30d" })

        user.isLoggedIn = true;
        await user.save()

        return res.status(200).json({
            success: true,
            message: `Welcome back ${user.username}`,
            accessToken,
            refreshToken,
            user
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const logoutUser = async (req, res) => {
    try {
        const userId = req.userId;
        await Session.deleteMany({ userId });
        await User.findByIdAndUpdate(userId, { isLoggedIn: false })
        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Email not yet registered on system"
            })
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000)

        user.otp = otp;
        user.otpExpiry = expiry;
        await user.save()
        await sendOtpMail(otp, email);
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const verifyOTP = async (req, res) => {
    const { otp } = req.body
    const email = req.params.email

    if (!otp) {
        return res.status(400).json({
            success: false,
            message: "OTP is requried"
        })
    }

    try {
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: "OTP not generated or already verified"
            })
        }
        if (user.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one"
            })
        }
        if (otp !== user.otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            })
        }

        user.otp = null
        user.otpExpiry = null
        user.otpVerified = true
        await user.save()

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const resetPassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body
    const email = req.params.email

    if (!newPassword || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        })
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "Password do not match"
        })
    }

    try {
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        if (user.otpVerified === false) {
            return res.status(401).json({
                success: false,
                message: "OTP verification is required..."
            })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        user.otpVerified = false
        await user.save()


        return res.status(200).json({
            success: true,
            message: "Password changed successsfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const getAllUsers = async (req, res) => {
    try {
        const user = await User.find().select('-password'); // exclude password field
        res.status(200).json({
            success: true,
            message: "User list fetched successfully",
            total: user.length,
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users"
        });
    }
}

export const updateUser = async (req, res) => {
    try {
        const userId = req.params.userId; // Get userId from URL params, not from token
        const { role, username, email, cnic, department } = req.body;

        const user = await User.findById(userId).select("-password")

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            })
        }
        if (email) {
            const existingUserByEmail = await User.findOne({ email })
            if (existingUserByEmail) {
                return res.status(400).json({
                    success: false,
                    message: "User with same email already exists"
                })
            }
            if (email !== user.tempEmail) {
                return res.status(400).json({
                    success: false,
                    message: "New email not verified yet..."
                })
            }
        }
        if (cnic) {
            const existingUserByCnic = await User.findOne({ cnic })
            if (existingUserByCnic) {
                return res.status(400).json({
                    success: false,
                    message: "User with same CNIC already exists"
                })
            }
        }


        if (role) user.role = role
        if (username) user.username = username
        if (email) user.email = email
        if (cnic) user.cnic = cnic
        if (department) user.department = department
        user.tempEmail = null

        await user.save()
        return res.status(200).json({
            message: "User data updated successfully",
            success: true,
            user
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update user data"
        })
    }
}

export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById({ _id: userId });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Delete User
        await User.findByIdAndDelete({ _id: userId });

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting Course", error: error.message });
    }
};

export const ChangeEmail = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { newEmail } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check if new email already exists
        const existing = await User.findOne({ email: newEmail });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Email is already in use by another account",
            });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        // Temporarily store OTP and new email
        user.otp = otp;
        user.otpExpiry = expiry;

        await user.save();
        await sendChangeMail(otp, newEmail);

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully to the new email address",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const verifyChangeEmailOtp = async (req, res) => {
    const { otp, newEmail } = req.body
    const userId = req.params.userId

    if (!otp) {
        return res.status(400).json({
            success: false,
            message: "OTP is requried"
        })
    }

    try {
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found, please try later..."
            })
        }
        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: "OTP not generated or already verified"
            })
        }
        if (user.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one"
            })
        }
        if (otp !== user.otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            })
        }

        user.otp = null
        user.otpExpiry = null
        user.tempEmail = newEmail
        await user.save()

        return res.status(200).json({
            success: true,
            message: "Email Verified Successfully, Saving your Data",
            data: newEmail
        })
    } catch (error) {
        console.error("Error in verifyChangeEmailOtp:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { username, fatherName, specialization, cnic, email, registrationNo, dateOfBirth, rollNo, gender, department, shift, semester, section, phone } = req.body;
        const file = req.file;

        const user = await User.findById(userId).select("-password")

        if (!user) {
            return res.status(404).json({
                message: "User not found, please try again later",
                success: false
            })
        }
        if (email) {
            const existingUserByEmail = await User.findOne({ email })
            if (existingUserByEmail) {
                return res.status(400).json({
                    success: false,
                    message: "User with same email already exists"
                })
            }
            if (email !== user.tempEmail) {
                return res.status(400).json({
                    success: false,
                    message: "New email not verified yet..."
                })
            }
        }

        if (cnic) {
            const existingUserByCnic = await User.findOne({ cnic })
            if (existingUserByCnic) {
                return res.status(400).json({
                    success: false,
                    message: "User with same CNIC already exists"
                })
            }
        }

        // Prevent non-admin users from changing their department
        if (department && department !== user.department && user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to change your department. Please contact admin."
            })
        }

        if (file) {
            if (user.profilePicPublicId) {
                await cloudinary.uploader.destroy(user.profilePicPublicId)
            }
            const fileUri = getDataUri(file)
            let cloudResponse = await cloudinary.uploader.upload(fileUri)
            user.profilePic = cloudResponse.secure_url
            user.profilePicPublicId = cloudResponse.public_id
        }


        if (username) user.username = username
        if (fatherName) user.fatherName = fatherName
        if (email) user.email = email
        if (cnic) user.cnic = cnic
        if (specialization) user.specialization = specialization
        if (registrationNo) user.registrationNo = registrationNo
        if (dateOfBirth) user.dateOfBirth = dateOfBirth
        if (rollNo) user.rollNo = rollNo
        if (gender) user.gender = gender
        if (shift) user.shift = shift
        if (semester) user.semester = semester
        if (section) user.section = section
        if (phone) user.phone = phone
        user.tempEmail = null


        await user.save()
        return res.status(200).json({
            message: "Profile updated successfully",
            success: true,
            user
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update your data"
        })
    }
}

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body
    const id = req.params.userId


    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "All fields are required",
        })
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "Passwords do not match",
        })
    }

    try {
        const user = await User.findOne({ _id: id })
        if (!user) {
            console.log(id)
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }


        const isMatch = await bcrypt.compare(currentPassword, user.password)
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            })
        }


        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        await user.save()

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        })
    } catch (error) {
        console.error("Error changing password:", error)
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
}