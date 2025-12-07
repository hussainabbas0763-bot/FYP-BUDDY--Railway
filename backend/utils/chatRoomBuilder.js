import { Group } from "../models/Group_Formation/groupModel.js";
import { User } from "../models/userModel.js";

const formatUser = (userDoc) => {
    if (!userDoc) {
        return null;
    }
    return {
        id: userDoc._id?.toString(),
        username: userDoc.username,
        profilePic: userDoc.profilePic || "",
        role: userDoc.role,
    };
};

const buildDirectRoomKey = (firstId, secondId) => {
    return ["direct", ...[firstId, secondId].sort()].join("-");
};

export const buildUserRooms = async (userId) => {
    const user = await User.findById(userId)
        .select("username profilePic role groupId")
        .lean();

    if (!user) {
        throw new Error("User not found");
    }

    let groupDetails = null;

    if (user.groupId) {
        groupDetails = await Group.findById(user.groupId)
            .populate({
                path: "members",
                select: "username profilePic role",
            })
            .populate({
                path: "supervisor",
                select: "username profilePic role",
            })
            .lean();
    }

    const rooms = [];
    const currentUser = {
        id: user._id?.toString(),
        username: user.username,
        profilePic: user.profilePic || "",
        role: user.role,
        groupId: user.groupId?.toString() || null,
    };

    if (groupDetails) {
        const groupMembers = (groupDetails.members || [])
            .map((member) => formatUser(member))
            .filter(Boolean);
        const otherMembers = groupMembers.filter(
            (member) => member && member.id !== currentUser.id
        );

        // Individual supervisor-student chats removed - only group communication allowed

        otherMembers.forEach((member) => {
            const directKey = buildDirectRoomKey(currentUser.id, member.id);
            rooms.push({
                id: directKey,
                type: "individual",
                name: member.username,
                participant: member,
                participants: [member, currentUser],
                participantIds: [member.id, currentUser.id],
                meta: { scope: "peer" },
            });
        });

        if (groupMembers.length) {
            rooms.push({
                id: `group-team-${groupDetails._id}`,
                type: "group",
                name: `${groupDetails.groupName} (Team)`,
                groupId: groupDetails._id.toString(),
                participants: groupMembers,
                participantIds: groupMembers.map((member) => member.id),
                meta: { scope: "team" },
            });
        }

        if (groupDetails.supervisor) {
            const supervisor = formatUser(groupDetails.supervisor);
            const groupWithSupervisor = [
                ...groupMembers,
                supervisor,
            ].filter(Boolean);

            rooms.push({
                id: `group-supervisor-${groupDetails._id}`,
                type: "group",
                name: `${groupDetails.groupName} (With Supervisor)`,
                groupId: groupDetails._id.toString(),
                participants: groupWithSupervisor,
                participantIds: groupWithSupervisor.map((person) => person.id),
                meta: { scope: "withSupervisor" },
            });
        }
    }

    if (user.role === "supervisor") {
        const supervisedGroups = await Group.find({ supervisor: userId })
            .populate({
                path: "members",
                select: "username profilePic role",
            })
            .populate({
                path: "supervisor",
                select: "username profilePic role",
            })
            .lean();

        for (const group of supervisedGroups) {
            const groupMembers = (group.members || []).map(formatUser).filter(Boolean);
            const supervisor = formatUser(group.supervisor);

            // Individual supervisor-student chats removed - only group communication allowed

            // Group chat (With Supervisor)
            const groupWithSupervisor = [...groupMembers, supervisor].filter(Boolean);
            rooms.push({
                id: `group-supervisor-${group._id}`,
                type: "group",
                name: `${group.groupName} Group`,
                groupId: group._id.toString(),
                participants: groupWithSupervisor,
                participantIds: groupWithSupervisor.map((p) => p.id),
                meta: { scope: "withSupervisor" },
            });
        }
    }

    rooms.push({
        id: "public-chat",
        type: "public",
        name: "Public Chat",
        participantIds: [],
        participants: [],
        meta: { scope: "public" },
    });

    return {
        user: currentUser,
        group: groupDetails
            ? {
                id: groupDetails._id.toString(),
                groupName: groupDetails.groupName,
            }
            : null,
        rooms,
    };
};
