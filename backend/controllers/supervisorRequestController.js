import { SupervisorRequest } from "../models/supervisorRequestModel.js";
import { Group } from "../models/Group_Formation/groupModel.js";
import { User } from "../models/userModel.js";
import { Milestone } from "../models/milestoneModel.js";
import { Task } from "../models/taskModel.js";
import cloudinary from "../utils/cloudinary.js";

// POST /api/supervisor-requests
export const sendRequest = async (req, res) => {
    try {
        const { fypTitle, description, groupId, supervisorId } = req.body;

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group)
            return res.status(404).json({ success: false, message: "Group not found." });

        //  Prevent duplicate supervisor assignment
        if (group.supervisor)
            return res
                .status(400)
                .json({ success: false, message: "Group already has a supervisor." });

        // Check if supervisor exists and has capacity
        const supervisor = await User.findById(supervisorId);
        if (!supervisor)
            return res
                .status(404)
                .json({ success: false, message: "Supervisor not found." });

        // Check if supervisor is from the same department as the group
        if (supervisor.department !== group.department)
            return res.status(400).json({
                success: false,
                message: `You can only send requests to supervisors from your department (${group.department}).`,
            });

        if (!supervisor.supervision.isAvailable)
            return res.status(400).json({
                success: false,
                message: "Supervisor already has 5 groups",
            });

        if (supervisor.supervision.current >= supervisor.supervision.limit)
            return res.status(400).json({
                success: false,
                message: "Supervisor already has 5 groups .",
            });

        // Prevent duplicate pending requests
        const existing = await SupervisorRequest.findOne({
            groupId,
            supervisorId,
            status: "pending",
        });

        if (existing)
            return res.status(400).json({
                success: false,
                message: "Request already sent to this supervisor.",
            });

        // Create new request
        const newRequest = await SupervisorRequest.create({
            fypTitle,
            description,
            groupId,
            supervisorId,
            requestFromGroup: groupId,
        });

        res.status(201).json({
            success: true,
            message: "Supervisor request sent successfully.",
            request: newRequest,
        });
    } catch (error) {
        console.error("Error sending supervisor request:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

export const getRequestsForSupervisor = async (req, res) => {
    try {
        const supervisorId = req.user.id;

        const Supervisionrequests = await SupervisorRequest.find({
            supervisorId: supervisorId,
            status: "pending",
        })
            .populate({
                path: "requestFromGroup",
                select: "groupName members",
                populate: {
                    path: "members",
                    select: "username  semester section shift",
                },
            })
            .populate("supervisorId", "username email");

        if (!Supervisionrequests) {
            return res.status(404).json({
                success: false,
                message: "No Requests found."
            })
        }

        res.status(200).json({ success: true, Supervisionrequests });
    } catch (error) {
        res.status(500).json({ message: "Error fetching requests", error: error.message });
    }
};

export const updateRequestStatus = async (req, res) => {
    try {
        const { action } = req.body;
        const requestId = req.params.requestId
        const request = await SupervisorRequest.findById(requestId);

        //  Check if Request Exists or Removed
        if (!request)
            return res.status(404).json({ success: false, message: "Supervision Request not found" });

        // Accept Logic
        if (action === "accept") {
            // Fetch the supervisor
            const supervisor = await User.findById(request.supervisorId);

            if (!supervisor)
                return res.status(404).json({ success: false, message: "Supervisor not found" });

            // Check if supervisor can take more groups
            if (!supervisor.supervision.isAvailable)
                return res
                    .status(400)
                    .json({ success: false, message: "You already have max group supervision limit of 5." });

            if (supervisor.supervision.current >= supervisor.supervision.limit)
                return res
                    .status(400)
                    .json({ success: false, message: "You already have max group supervision limit of 5." });

            // Update request status
            request.status = "accepted";
            await request.save();

            //  Assign supervisor to the group
            await Group.findByIdAndUpdate(request.groupId, {
                supervisor: request.supervisorId, status: "active"
            });


            //  Increment supervision count and add group ID to supervisedGroupId array
            const updatedSupervisor = await User.findByIdAndUpdate(
                request.supervisorId,
                {
                    $inc: { "supervision.current": 1 },
                    $push: { "supervision.supervisedGroupId": request.groupId },
                },
                { new: true }
            );

            //  If limit reached after increment → mark unavailable
            if (updatedSupervisor.supervision.current >= updatedSupervisor.supervision.limit) {
                await User.findByIdAndUpdate(request.supervisorId, {
                    "supervision.isAvailable": false,
                });
            }

            return res.json({
                success: true,
                message: "You have successfully accepted the supervision request.",
            });
        }

        //  Decline Logic
        if (action === "decline") {
            request.status = "declined";
            await request.save();
            return res.json({ success: true, message: "Supervision Request declined successfully." });
        }

        //  Invalid Action
        return res.status(400).json({ success: false, message: "Invalid action type." });
    } catch (error) {
        console.error("Error updating request status:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Get all groups supervised by the current supervisor
export const getMyGroups = async (req, res) => {
    try {
        const supervisorId = req.user.id;

        // Get supervisor with populated supervisedGroupId
        const supervisor = await User.findById(supervisorId).select("supervision.supervisedGroupId");

        if (!supervisor || !supervisor.supervision.supervisedGroupId || supervisor.supervision.supervisedGroupId.length === 0) {
            return res.status(200).json({ success: true, groups: [] });
        }

        // Get groups from supervisedGroupId array
        const groups = await Group.find({
            _id: { $in: supervisor.supervision.supervisedGroupId }
        })
            .populate("leaderId", "username email profilePic rollNo")
            .populate("members", "username email profilePic semester section shift rollNo")
            .populate("supervisor", "username profilePic email")
            .sort({ createdAt: -1 });

        // Get FYP title and description from SupervisorRequest for each group
        const groupsWithDetails = await Promise.all(
            groups.map(async (group) => {
                const request = await SupervisorRequest.findOne({
                    groupId: group._id,
                    supervisorId: supervisorId,
                    status: "accepted"
                }).select("fypTitle description");

                const groupObj = group.toObject();
                if (request) {
                    groupObj.fypTitle = request.fypTitle;
                    groupObj.description = request.description;
                }
                return groupObj;
            })
        );

        res.status(200).json({ success: true, groups: groupsWithDetails });
    } catch (error) {
        console.error("Error fetching supervisor groups:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Auto-allocate supervisor to a specific group
export const autoAllocateSupervisor = async (req, res) => {
    try {
        const { groupId } = req.body;

        // Find the group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found." });
        }

        // Check if group already has a supervisor
        if (group.supervisor) {
            return res.status(400).json({
                success: false,
                message: "Group already has a supervisor assigned."
            });
        }

        // Find available supervisors in the same department, sorted by least loaded
        const availableSupervisors = await User.find({
            role: "supervisor",
            department: group.department,
            "supervision.isAvailable": true,
            $expr: { $lt: ["$supervision.current", "$supervision.limit"] }
        }).sort({ "supervision.current": 1 });

        if (availableSupervisors.length === 0) {
            return res.status(400).json({
                success: false,
                message: `No available supervisors found in ${group.department} department.`
            });
        }

        // Select the supervisor with the lowest current load
        const supervisor = availableSupervisors[0];

        // Create supervisor request as accepted
        await SupervisorRequest.create({
            fypTitle: `Auto-allocated FYP for ${group.groupName}`,
            description: "Automatically allocated by system",
            groupId: group._id,
            supervisorId: supervisor._id,
            requestFromGroup: group._id,
            status: "accepted"
        });

        // Assign supervisor to group
        group.supervisor = supervisor._id;
        group.status = "active";
        await group.save();

        // Update supervisor's supervision data
        supervisor.supervision.current += 1;
        supervisor.supervision.supervisedGroupId.push(group._id);

        // Mark unavailable if limit reached
        if (supervisor.supervision.current >= supervisor.supervision.limit) {
            supervisor.supervision.isAvailable = false;
        }

        await supervisor.save();

        res.status(200).json({
            success: true,
            message: "Supervisor allocated successfully.",
            group: {
                groupId: group._id,
                groupName: group.groupName,
                supervisor: {
                    supervisorId: supervisor._id,
                    supervisorName: supervisor.username,
                    email: supervisor.email
                }
            }
        });
    } catch (error) {
        console.error("Error auto-allocating supervisor:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

export const unSuperviseGroup = async (req, res) => {
    try {
        const supervisorId = req.user.id;
        const { groupId } = req.params;

        // Find the group
        const group = await Group.findById(groupId);
        if (!group)
            return res.status(404).json({ success: false, message: "Group not found." });
        if (group.supervisor?.toString() !== supervisorId)
            return res.status(403).json({ success: false, message: "You are not the supervisor of this group." });

        // Check for milestones under review (prevent unsupervising if beyond Proposal phase)
        const milestone = await Milestone.findOne({ groupId: groupId });
        if (milestone && milestone.status !== "Pending" && milestone.phase !== "Proposal") {
            return res.status(400).json({
                success: false,
                message: "Cannot un-supervise group with active milestones beyond Proposal phase."
            });
        }

        // Delete task submission files from Cloudinary before deleting tasks
        const tasks = await Task.find({ groupId: groupId, supervisorId: supervisorId });
        for (const task of tasks) {
            if (task.publicId) {
                try {
                    await cloudinary.uploader.destroy(task.publicId, { resource_type: "raw" });
                } catch (err) {
                    console.warn(`Failed to delete task file from Cloudinary: ${task.publicId}`, err.message);
                }
            }
        }

        // Delete all tasks associated with this group and supervisor
        await Task.deleteMany({ groupId: groupId, supervisorId: supervisorId });

        // Update the supervisor request status to declined
        await SupervisorRequest.findOneAndUpdate(
            { groupId: groupId, supervisorId: supervisorId, status: "accepted" },
            { status: "declined" }
        );

        // Remove supervisor from group
        group.supervisor = null;
        group.status = "pending";
        await group.save();

        // Update supervisor's supervision data
        const supervisor = await User.findById(supervisorId);
        if (supervisor) {
            supervisor.supervision.current = Math.max(0, supervisor.supervision.current - 1);
            supervisor.supervision.supervisedGroupId = supervisor.supervision.supervisedGroupId.filter(
                id => id.toString() !== groupId
            );
            if (supervisor.supervision.current < supervisor.supervision.limit) {
                supervisor.supervision.isAvailable = true;
            }
            await supervisor.save();
        }

        res.status(200).json({ success: true, message: "You have successfully un-supervised the group." });
    } catch (error) {
        console.error("Error un-supervising group:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};