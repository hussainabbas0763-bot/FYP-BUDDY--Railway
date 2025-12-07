import { ChatMessage } from "../models/chatMessageModel.js";
import { ChatReadReceipt } from "../models/chatReadReceiptModel.js";
import { ChatDeliveryReceipt } from "../models/chatDeliveryReceiptModel.js";
import { buildUserRooms } from "../utils/chatRoomBuilder.js";
import { formatChatMessage } from "../utils/chatFormatter.js";
import { getOnlineUsers } from "../socket/chatGateway.js";

export const getUserChatRooms = async (req, res) => {
    try {
        const payload = await buildUserRooms(req.user.id);
        const onlineUsersList = getOnlineUsers();

        const roomsWithUnread = await Promise.all(
            payload.rooms.map(async (room) => {
                const lastRead = await ChatReadReceipt.findOne(
                    { roomKey: room.id, userId: req.user.id },
                    {},
                    { sort: { readAt: -1 } }
                ).lean();

                const lastReadTime = lastRead?.readAt || new Date(0);

                const unreadCount = await ChatMessage.countDocuments({
                    roomKey: room.id,
                    sender: { $ne: req.user.id },
                    createdAt: { $gt: lastReadTime },
                });

                const participantsWithStatus = room.participants?.map((p) => ({
                    ...p,
                    isOnline: onlineUsersList.includes(p.id),
                })) || [];

                return {
                    ...room,
                    participants: participantsWithStatus,
                    unreadCount,
                };
            })
        );

        return res.status(200).json({
            success: true,
            rooms: roomsWithUnread,
            user: payload.user,
            group: payload.group,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Unable to fetch chat rooms",
        });
    }
};

export const getRoomMessages = async (req, res) => {
    try {
        const { roomKey } = req.params;
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
        const before = req.query.before ? new Date(req.query.before) : null;

        const { rooms } = await buildUserRooms(req.user.id);
        const allowedRoom = rooms.find((room) => room.id === roomKey);

        if (!allowedRoom) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this chat",
            });
        }

        const query = {
            roomKey,
            deletedBy: { $ne: req.user.id },
        };
        if (before && !isNaN(before.getTime())) {
            query.createdAt = { $lt: before };
        }

        const messages = await ChatMessage.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("sender", "username profilePic role")
            .lean();

        const messageIds = messages.map((m) => m._id);
        const readReceipts = await ChatReadReceipt.find({
            messageId: { $in: messageIds },
        }).lean();

        const deliveryReceipts = await ChatDeliveryReceipt.find({
            messageId: { $in: messageIds },
        }).lean();

        const formatted = messages.map((message) =>
            formatChatMessage(message, readReceipts, deliveryReceipts)
        );
        // Return ascending order for UI while fetching latest slice efficiently
        formatted.reverse();

        return res.status(200).json({
            success: true,
            messages: formatted,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Unable to fetch chat messages",
        });
    }
};

export const getUnreadCounts = async (req, res) => {
    try {
        const { rooms } = await buildUserRooms(req.user.id);
        const unreadCounts = {};

        for (const room of rooms) {
            const lastRead = await ChatReadReceipt.findOne(
                { roomKey: room.id, userId: req.user.id },
                {},
                { sort: { readAt: -1 } }
            );

            const count = await ChatMessage.countDocuments({
                roomKey: room.id,
                sender: { $ne: req.user.id },
                createdAt: {
                    $gt: lastRead?.readAt || new Date(0),
                },
            });

            unreadCounts[room.id] = count;
        }

        return res.status(200).json({
            success: true,
            unreadCounts,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Unable to fetch unread counts",
        });
    }
};
