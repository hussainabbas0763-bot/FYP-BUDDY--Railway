import { Group } from "../models/Group_Formation/groupModel.js";
import { User } from "../models/userModel.js";
import { GroupInvitation } from "../models/Group_Formation/groupInvitationModel.js";
import { Milestone } from "../models/milestoneModel.js";
import cloudinary from "../utils/cloudinary.js";
import getDataUri from "../utils/dataUri.js";

export const createGroup = async (req, res) => {
    try {
        const { groupName } = req.body;
        const studentId = req.user.id;

        // Fetch the student (leader)
        const student = await User.findById(studentId);

        // Check if user already has a group
        if (student.groupId) {
            return res.status(400).json({
                success: false,
                message: "You are already in a group.",
            });
        }

        if (!student.department || student.department === null) {
            return res.status(400).json({
                success: false,
                message: "You have missing department in your profile.Make sure to fill it.",
            });
        }

        // Check for duplicate group name
        const existingGroupName = await Group.findOne({ groupName });
        if (existingGroupName) {
            return res.status(400).json({
                success: false,
                message: "Group name already taken.",
            });
        }

        // Create new group with leader's department
        const group = await Group.create({
            groupName,
            leaderId: studentId,
            members: [studentId],
            department: student.department,
        });

        // Update user record with group ID
        student.groupId = group._id;
        await student.save();

        // Automatically create a milestone for this group
        const milestone = await Milestone.create({
            groupId: group._id,
            department: group.department,
            phase: "Proposal",
            status: "Pending",
            isSubmissionActive: false,
        });

        // Respond to client
        return res.status(201).json({
            success: true,
            message: "Group created successfully.",
            data: {
                group,
                milestone,
            },
        });
    } catch (err) {
        console.error("Error creating group:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};



export const sendInvitation = async (req, res) => {
    try {
        const { receiverEmail } = req.body;
        const senderId = req.user.id;

        const sender = await User.findById(senderId);
        const receiver = await User.findOne({ email: receiverEmail, role: "student" });

        if (!receiver) return res.status(404).json({ succes: false, message: "Invited User not found." });
        // stop inviting user himself
        if (senderId === receiver._id.toString())
            return res.status(400).json({ success: false, message: "You cannot invite yourself." });

        if (!receiver.department) {
            return res.status(400).json({ success: false, message: "Invited User is missing Profile Details. Ask them to complete their profile" });
        }

        if (receiver.department !== sender.department) {
            return res.status(400).json({ success: false, message: "You can not invite users outside of your department" });
        }
        if (receiver.semester !== sender.semester) {
            return res.status(400).json({ success: false, message: "Invited user must be in same semester as yours" });
        }

        const group = await Group.findById(sender.groupId);

        if (!group)
            return res.status(400).json({ message: "Create a group first, then invite other users." });
        if (group.members.length >= 3)
            return res.status(400).json({ message: "Group is already full, Max 3 students are allowed" });
        if (receiver.groupId)
            return res.status(400).json({ message: "Invited User already in another group." });

        // Check existing invitation
        const existingInvite = await GroupInvitation.findOne({
            senderId,
            receiverId: receiver._id,
            groupId: group._id,
            status: "pending",
        });

        if (existingInvite)
            return res.status(400).json({ message: "Invitation already sent." });

        // Create new invitation
        const invitation = await GroupInvitation.create({
            senderId,
            receiverId: receiver._id,
            groupId: group._id,
        });

        res.status(201).json({
            success: true,
            message: "Invitation sent successfully.",
            invitation,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


export const getInvitations = async (req, res) => {
    try {
        const studentId = req.user.id;

        const invitations = await GroupInvitation.find({
            receiverId: studentId,
            status: "pending",
        })
            .populate("senderId", "username email")
            .populate("groupId", "groupName members");

        res.status(200).json({ success: true, invitations });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const respondInvitation = async (req, res) => {
    try {
        const invitationId = req.params.id;
        const { action } = req.body;
        const studentId = req.user.id;

        // check if there are any invitations for user
        const invitation = await GroupInvitation.findById(invitationId);
        if (!invitation)
            return res.status(404).json({ message: "No Invitations found." });

        // check the user id and receivers id for access confirmation
        if (invitation.receiverId.toString() !== studentId)
            return res.status(403).json({ message: "Unauthorized action." });
        if (action === "accept") {
            // check if either the group is disbanded
            const group = await Group.findById(invitation.groupId);
            if (!group)
                return res.status(404).json({ message: "Group no longer exists." });

            // check for max number of members
            if (group.members.length >= 3)
                return res.status(400).json({ message: "Group is already full." });

            // accepted invitation

            // Add student to group
            group.members.push(studentId);
            await group.save();

            // Update student record
            const student = await User.findById(studentId);
            student.groupId = group._id;
            await student.save();

            invitation.status = "accepted";
            await invitation.save();


            // Delete all other invitations for this student
            await GroupInvitation.deleteMany({
                receiverId: studentId,
                _id: { $ne: invitationId } // not the one just accepted
            });
            // send new data to front end
            const joinedGroup = await Group.findById(student.groupId)
                .populate("supervisor", "username profilePic")
                .populate("leaderId", "_id, username email profilePic")
                .populate("members", "_id, username email profilePic");
            res.json({ success: true, message: "Joined the group successfully.Other Invites declined", joinedGroup });
        }
        // rejected invitation
        else if (action === "reject") {
            invitation.status = "rejected";
            await invitation.save();
            res.json({ success: true, message: "Invitation rejected." });
        }
        // invalid action 
        else {
            res.status(400).json({ message: "Invalid action type." });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getMyGroup = async (req, res) => {
    try {
        const studentId = req.user.id;
        const student = await User.findById(studentId);

        if (!student.groupId)
            return res.status(404).json({ success: false, message: "You are not in any group." });

        const group = await Group.findById(student.groupId)
            .populate("supervisor", "username profilePic")
            .populate("leaderId", "_id, username email profilePic")
            .populate("members", "_id, username email profilePic");

        res.status(200).json({ success: true, group });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


export const leaveGroup = async (req, res) => {
    try {
        const studentId = req.user.id;
        const student = await User.findById(studentId);

        if (!student.groupId)
            return res.status(400).json({ success: false, message: "You are not in any group." });

        const group = await Group.findById(student.groupId);

        if (!group)
            return res.status(404).json({ success: false, message: "Group not found." });

        // If the student is the leader
        if (group.leaderId.toString() === studentId) {
            if (group.members.length > 1) {
                // Transfer leadership to another member
                const newLeaderId = group.members.find(
                    (m) => m.toString() !== studentId
                );
                group.leaderId = newLeaderId;
                group.members = group.members.filter(
                    (m) => m.toString() !== studentId
                );
                await group.save();
                student.groupId = null;
                await student.save();

                return res.status(200).json({
                    success: true,
                    message: "You left the group. Leadership transferred successfully.",
                });
            } else {
                // If no members left, delete group
                await Group.findByIdAndDelete(group._id);
                student.groupId = null;
                await student.save();

                return res.status(200).json({
                    success: true,
                    message: "You were the only member. Group deleted.",
                });
            }
        } else {
            // If not the leader
            group.members = group.members.filter(
                (m) => m.toString() !== studentId
            );
            await group.save();
            student.groupId = null;
            await student.save();

            res.status(200).json({
                success: true,
                message: "You left the group successfully.",
            });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


export const disbandGroup = async (req, res) => {
    try {
        const userId = req.user.id;
        const groupId = req.params.id;

        //  Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found.",
            });
        }

        //  Only group leader or higher role can disband
        if (req.user.role === "student" && group.leaderId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Only the group leader can disband this group.",
            });
        }

        //  Check for existing milestone
        const milestone = await Milestone.findOne({ groupId });

        // If milestone exists, handle deletion carefully
        if (milestone) {
            // Prevent deleting milestones that are completed or have grading history
            if (milestone.status === "Completed" || milestone.status === "Under Review" || milestone.phase !== "Proposal") {
                return res.status(400).json({
                    success: false,
                    message: "This group cannot be disbanded because its milestone is already under review or completed.",
                });
            }

            // Delete the milestone
            await Milestone.findOneAndDelete({ groupId });
        }

        //  Remove group reference from all users
        await User.updateMany(
            { _id: { $in: group.members } },
            { $set: { groupId: null } }
        );

        //  Update supervisor if assigned
        if (group.supervisor) {
            const supervisorId = group.supervisor;
            await User.findByIdAndUpdate(supervisorId, {
                $pull: { "supervision.supervisedGroupId": group._id },
                $inc: { "supervision.current": -1 },
            });
        }

        //  Delete group
        await Group.findByIdAndDelete(groupId);

        return res.status(200).json({
            success: true,
            message: "Group disbanded successfully",
        });
    } catch (err) {
        console.error("Error disbanding group:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const updateGroupInfo = async (req, res) => {
    try {
        const { groupName } = req.body;
        const file = req.file;
        const studentId = req.user.id;

        // Get student and their group
        const student = await User.findById(studentId);
        if (!student.groupId) {
            return res.status(404).json({
                success: false,
                message: "You are not in any group.",
            });
        }

        const group = await Group.findById(student.groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found.",
            });
        }

        // Only group leader can update group info
        if (group.leaderId.toString() !== studentId) {
            return res.status(403).json({
                success: false,
                message: "Only the group leader can update the group information.",
            });
        }

        // Update group name if provided
        if (groupName) {
            if (groupName.trim() === "") {
                return res.status(400).json({
                    success: false,
                    message: "Group name cannot be empty.",
                });
            }

            // Check if new name is already taken by another group
            const existingGroup = await Group.findOne({ 
                groupName: groupName.trim(),
                _id: { $ne: group._id }
            });

            if (existingGroup) {
                return res.status(400).json({
                    success: false,
                    message: "Group name already taken.",
                });
            }

            group.groupName = groupName.trim();
        }

        // Update group icon if file is provided
        if (file) {
            // Delete old icon from cloudinary if exists
            if (group.groupIconPublicId) {
                await cloudinary.uploader.destroy(group.groupIconPublicId);
            }

            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri);
            group.groupIcon = cloudResponse.secure_url;
            group.groupIconPublicId = cloudResponse.public_id;
        }

        await group.save();

        // Return updated group
        const updatedGroup = await Group.findById(group._id)
            .populate("supervisor", "username profilePic")
            .populate("leaderId", "_id username email profilePic")
            .populate("members", "_id username email profilePic");

        return res.status(200).json({
            success: true,
            message: "Group information updated successfully.",
            group: updatedGroup,
        });
    } catch (err) {
        console.error("Error updating group information:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};


