import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["student", "supervisor", "coordinator", "admin"],
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    fatherName: {
        type: String,
        trim: true,
        default: null,
    },
    specialization: {
        type: String,
        trim: true,
        default: null
    },
    cnic: {
        type: String,
        required: true,
        unique: true,
    },
    registrationNo: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    tempEmail: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: Date,
        default: null,
    },
    rollNo: {
        type: String,
        default: null,
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
    },
    department: {
        type: String,
        enum: ["Software Engineering", "Computer Science", "Electrical Engineering", "Information Technology", "Artificial Intelligence", "Cyber Security", "Data Science"],

    },
    shift: {
        type: String,
        enum: ["Morning", "Evening"],
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        default: null
    },
    semester: {
        type: String,
        default: "6",
    },
    section: {
        type: String,
        trim: true,
        enum: ["A", "B", "No Section"],
        default: "A"
    },
    profilePic: {
        type: String,
        default: "",
    },
    profilePicPublicId: {
        type: String,
        default: ""
    },
    supervision: {
        current: { type: Number, default: 0 },
        limit: { type: Number, default: 5 }, 
        isAvailable: { type: Boolean, default: true },
        supervisedGroupId: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
        }],
    },
    phone: {
        type: String,
        trim: true,
        default: null,
    },
    isLoggedIn: {
        type: Boolean,
        default: null
    },
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    otpVerified: {
        type: Boolean,
        default: false
    },
    activeStudents: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true,
    }
);

export const User = mongoose.model("User", userSchema)