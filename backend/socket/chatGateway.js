import jwt from "jsonwebtoken";
import { ChatMessage } from "../models/chatMessageModel.js";
import { ChatReadReceipt } from "../models/chatReadReceiptModel.js";
import { ChatDeliveryReceipt } from "../models/chatDeliveryReceiptModel.js";
import { buildUserRooms } from "../utils/chatRoomBuilder.js";
import { formatChatMessage } from "../utils/chatFormatter.js";

const onlineUsers = new Map();
const activeCallParticipants = new Map();
const screenSharingState = new Map(); // Track screen sharing: roomKey -> { userId, isSharing }

export const registerChatGateway = (io) => {
    io.use((socket, next) => {
        try {
            const authHeader = socket.handshake.auth?.token;
            if (!authHeader) {
                return next(new Error("Unauthorized"));
            }
            const decoded = jwt.verify(authHeader, process.env.SECRET_KEY);
            socket.user = { id: decoded.id, role: decoded.role };
            next();
        } catch (error) {
            return next(new Error("Authentication failed"));
        }
    });

    io.on("connection", async (socket) => {
        try {
            const userId = String(socket.user.id);
            const existing = onlineUsers.get(userId) || new Set();
            const wasOffline = existing.size === 0;
            existing.add(socket.id);
            onlineUsers.set(userId, existing);
            console.log(`User ${userId} connected with socket ID ${socket.id}. Now ${existing.size} connection(s)`);

            await hydrateRoomsForSocket(socket, io);
            if (wasOffline) {
                broadcastOnlineStatus(io, userId, true);
            }

            socket.on("disconnect", (reason) => {
                console.log(`User ${userId} disconnected: ${reason}`);
                const set = onlineUsers.get(userId);
                if (set) {
                    set.delete(socket.id);
                    if (set.size === 0) {
                        onlineUsers.delete(userId);
                        broadcastOnlineStatus(io, userId, false);
                    } else {
                        onlineUsers.set(userId, set);
                    }
                }
            });
        } catch (error) {
            console.error("Error in socket connection:", error);
            socket.emit("chat:error", { message: "Unable to join chat rooms" });
            socket.disconnect(true);
        }

        socket.on("chat:send", async (payload, callback) => {
            try {
                const { text, roomKey, messageType, attachments, contactData, meta } = payload || {};

                if (!roomKey) {
                    callback?.({
                        success: false,
                        message: "Room key is required",
                    });
                    return;
                }

                if (!text?.trim() && !attachments?.length && !contactData) {
                    callback?.({
                        success: false,
                        message: "Message content is required",
                    });
                    return;
                }

                const allowedRoom = socket.data.rooms?.find(
                    (room) => room.id === roomKey
                );

                if (!allowedRoom) {
                    callback?.({
                        success: false,
                        message: "You cannot send messages to this chat",
                    });
                    return;
                }

                const messageDoc = await ChatMessage.create({
                    roomKey,
                    chatType: allowedRoom.type,
                    groupId: allowedRoom.groupId || null,
                    participants:
                        allowedRoom.participantIds?.length > 0
                            ? allowedRoom.participantIds
                            : [socket.user.id],
                    sender: socket.user.id,
                    text: text?.trim() || "",
                    messageType: messageType || "text",
                    attachments: attachments || [],
                    contactData: contactData || null,
                    isEncrypted: payload.isEncrypted || false,
                    meta: meta || null,
                });

                await messageDoc.populate("sender", "username profilePic role");
                if (contactData?.userId) {
                    await messageDoc.populate("contactData.userId", "username email phone profilePic");
                }

                const formattedMessage = formatChatMessage(messageDoc, [], []);

                // Broadcast to all sockets in the room (including sender)
                io.to(roomKey).emit("chat:new-message", formattedMessage);

                // Get room info for logging
                const roomSockets = await io.in(roomKey).fetchSockets();
                console.log(`Message sent to room ${roomKey} by user ${socket.user.id}. ${roomSockets.length} socket(s) in room`);

                // Track delivery for online recipients (excluding sender)
                const messageId = messageDoc._id.toString();
                const senderId = socket.user.id;
                const recipientIds = allowedRoom.participantIds || [];
                
                for (const recipientId of recipientIds) {
                    const recipientIdStr = String(recipientId);
                    if (recipientIdStr === senderId) continue; // Skip sender
                    
                    // Check if recipient is online
                    if (onlineUsers.has(recipientIdStr)) {
                        try {
                            // Create delivery receipt
                            await ChatDeliveryReceipt.findOneAndUpdate(
                                { messageId: messageDoc._id, userId: recipientId },
                                { roomKey, deliveredAt: new Date() },
                                { upsert: true, new: true }
                            );
                        } catch (err) {
                            console.error(`Failed to create delivery receipt for user ${recipientIdStr}:`, err);
                        }
                    }
                }

                // Notify sender about delivery status
                if (recipientIds.length > 0) {
                    const deliveredUserIds = recipientIds
                        .filter(id => String(id) !== senderId && onlineUsers.has(String(id)))
                        .map(id => String(id));
                    
                    if (deliveredUserIds.length > 0) {
                        io.to(roomKey).emit("chat:message-delivered", {
                            messageId,
                            roomKey,
                            deliveredTo: deliveredUserIds,
                        });
                    }
                }

                callback?.({ success: true, messageId: messageDoc._id.toString() });
            } catch (error) {
                callback?.({
                    success: false,
                    message: "Failed to send message",
                });
            }
        });

        socket.on("chat:mark-delivered", async (payload, callback) => {
            try {
                const { roomKey, messageIds } = payload || {};

                if (!roomKey || !Array.isArray(messageIds) || messageIds.length === 0) {
                    callback?.({
                        success: false,
                        message: "Room key and message IDs are required",
                    });
                    return;
                }

                const allowedRoom = socket.data.rooms?.find(
                    (room) => room.id === roomKey
                );

                if (!allowedRoom) {
                    callback?.({
                        success: false,
                        message: "You cannot mark messages as delivered in this chat",
                    });
                    return;
                }

                const userId = socket.user.id;

                for (const messageId of messageIds) {
                    try {
                        await ChatDeliveryReceipt.findOneAndUpdate(
                            { messageId, userId },
                            { roomKey, deliveredAt: new Date() },
                            { upsert: true, new: true }
                        );
                    } catch (err) {
                        console.error(`Failed to create delivery receipt for message ${messageId}:`, err);
                    }
                }

                io.to(roomKey).emit("chat:message-delivered", {
                    roomKey,
                    deliveredTo: [userId],
                    messageIds,
                });

                callback?.({ success: true });
            } catch (error) {
                callback?.({
                    success: false,
                    message: "Failed to mark messages as delivered",
                });
            }
        });

        socket.on("chat:mark-read", async (payload, callback) => {
            try {
                const { roomKey, messageIds } = payload || {};

                if (!roomKey || !Array.isArray(messageIds) || messageIds.length === 0) {
                    callback?.({
                        success: false,
                        message: "Room key and message IDs are required",
                    });
                    return;
                }

                const allowedRoom = socket.data.rooms?.find(
                    (room) => room.id === roomKey
                );

                if (!allowedRoom) {
                    callback?.({
                        success: false,
                        message: "You cannot mark messages as read in this chat",
                    });
                    return;
                }

                const userId = socket.user.id;
                const receipts = [];

                // First mark as delivered if not already
                for (const messageId of messageIds) {
                    try {
                        await ChatDeliveryReceipt.findOneAndUpdate(
                            { messageId, userId },
                            { roomKey, deliveredAt: new Date() },
                            { upsert: true, new: true }
                        );
                    } catch (err) {
                        console.error(`Failed to create delivery receipt for message ${messageId}:`, err);
                    }
                }

                // Then mark as read
                for (const messageId of messageIds) {
                    const existing = await ChatReadReceipt.findOne({
                        messageId,
                        userId,
                    });

                    if (!existing) {
                        const receipt = await ChatReadReceipt.create({
                            messageId,
                            roomKey,
                            userId,
                        });
                        receipts.push(receipt);
                    }
                }

                io.to(roomKey).emit("chat:messages-read", {
                    roomKey,
                    userId,
                    messageIds,
                });

                callback?.({ success: true });
            } catch (error) {
                callback?.({
                    success: false,
                    message: "Failed to mark messages as read",
                });
            }
        });

        socket.on("chat:delete", async (payload, callback) => {
            try {
                const { messageId, deleteForEveryone } = payload || {};

                if (!messageId) {
                    callback?.({
                        success: false,
                        message: "Message ID is required",
                    });
                    return;
                }

                const message = await ChatMessage.findById(messageId);

                if (!message) {
                    callback?.({
                        success: false,
                        message: "Message not found",
                    });
                    return;
                }

                const userId = socket.user.id;
                const senderId = message.sender.toString ? message.sender.toString() : message.sender._id?.toString() || message.sender;
                const isSender = senderId === userId;

                if (deleteForEveryone) {
                    if (!isSender) {
                        callback?.({
                            success: false,
                            message: "You can only delete your own messages for everyone",
                        });
                        return;
                    }

                    message.isDeleted = true;
                    message.text = "This message was deleted";
                    message.attachments = [];
                    message.contactData = null;
                    await message.save();

                    io.to(message.roomKey).emit("chat:message-deleted", {
                        messageId,
                        roomKey: message.roomKey,
                        deleteForEveryone: true,
                    });
                } else {
                    const deletedByIds = message.deletedBy.map((id) => id.toString ? id.toString() : id._id?.toString() || id);
                    if (!deletedByIds.includes(userId)) {
                        message.deletedBy.push(userId);
                        await message.save();
                    }

                    socket.emit("chat:message-deleted", {
                        messageId,
                        roomKey: message.roomKey,
                        deleteForEveryone: false,
                    });
                }

                callback?.({ success: true });
            } catch (error) {
                callback?.({
                    success: false,
                    message: "Failed to delete message",
                });
            }
        });

        socket.on("chat:refresh", async (_, callback) => {
            try {
                await hydrateRoomsForSocket(socket, io);
                callback?.({ success: true });
            } catch (error) {
                callback?.({ success: false, message: "Unable to refresh chats" });
            }
        });

        socket.on("rtc:offer", (payload, callback) => {
            try {
                const { to, roomKey, offer } = payload || {};
                if (!to || !roomKey || !offer) {
                    console.error(`[RTC:OFFER] Invalid payload from user ${socket.user.id}`);
                    callback?.({ success: false, message: "Invalid payload" });
                    return;
                }
                const allowedRoom = socket.data.rooms?.find((room) => room.id === roomKey);
                if (!allowedRoom) {
                    console.error(`[RTC:OFFER] Room ${roomKey} not allowed for user ${socket.user.id}`);
                    callback?.({ success: false, message: "Room not allowed" });
                    return;
                }
                const participantIds = allowedRoom.participantIds || [];
                if (!participantIds.map(String).includes(String(to))) {
                    console.error(`[RTC:OFFER] Target ${to} not in room ${roomKey}`);
                    callback?.({ success: false, message: "Target not in room" });
                    return;
                }
                const targetSet = onlineUsers.get(String(to));
                if (targetSet && targetSet.size) {
                    console.log(`[RTC:OFFER] Forwarding offer from ${socket.user.id} to ${to} in room ${roomKey} (${targetSet.size} socket(s))`);
                    for (const sid of targetSet) {
                        socket.to(sid).emit("rtc:offer", { from: socket.user.id, roomKey, offer });
                    }
                    callback?.({ success: true });
                } else {
                    console.warn(`[RTC:OFFER] Target user ${to} is not online`);
                    callback?.({ success: false, message: "Target user is not online" });
                }
            } catch (error) {
                console.error(`[RTC:OFFER] Error:`, error);
                callback?.({ success: false, message: "Failed to forward offer" });
            }
        });

        socket.on("rtc:answer", (payload, callback) => {
            try {
                const { to, roomKey, answer } = payload || {};
                if (!to || !roomKey || !answer) {
                    console.error(`[RTC:ANSWER] Invalid payload from user ${socket.user.id}`);
                    callback?.({ success: false, message: "Invalid payload" });
                    return;
                }
                const allowedRoom = socket.data.rooms?.find((room) => room.id === roomKey);
                if (!allowedRoom) {
                    console.error(`[RTC:ANSWER] Room ${roomKey} not allowed for user ${socket.user.id}`);
                    callback?.({ success: false, message: "Room not allowed" });
                    return;
                }
                const participantIds = allowedRoom.participantIds || [];
                if (!participantIds.map(String).includes(String(to))) {
                    console.error(`[RTC:ANSWER] Target ${to} not in room ${roomKey}`);
                    callback?.({ success: false, message: "Target not in room" });
                    return;
                }
                const targetSet = onlineUsers.get(String(to));
                if (targetSet && targetSet.size) {
                    console.log(`[RTC:ANSWER] Forwarding answer from ${socket.user.id} to ${to} in room ${roomKey} (${targetSet.size} socket(s))`);
                    for (const sid of targetSet) {
                        socket.to(sid).emit("rtc:answer", { from: socket.user.id, roomKey, answer });
                    }
                    callback?.({ success: true });
                } else {
                    console.warn(`[RTC:ANSWER] Target user ${to} is not online`);
                    callback?.({ success: false, message: "Target user is not online" });
                }
            } catch (error) {
                console.error(`[RTC:ANSWER] Error:`, error);
                callback?.({ success: false, message: "Failed to forward answer" });
            }
        });

        socket.on("rtc:candidate", (payload, callback) => {
            try {
                const { to, roomKey, candidate } = payload || {};
                if (!to || !roomKey || !candidate) {
                    callback?.({ success: false, message: "Invalid payload" });
                    return;
                }
                const allowedRoom = socket.data.rooms?.find((room) => room.id === roomKey);
                if (!allowedRoom) {
                    callback?.({ success: false, message: "Room not allowed" });
                    return;
                }
                const participantIds = allowedRoom.participantIds || [];
                if (!participantIds.map(String).includes(String(to))) {
                    callback?.({ success: false, message: "Target not in room" });
                    return;
                }
                const targetSet = onlineUsers.get(String(to));
                if (targetSet && targetSet.size) {
                    for (const sid of targetSet) {
                        socket.to(sid).emit("rtc:candidate", { from: socket.user.id, roomKey, candidate });
                    }
                    callback?.({ success: true });
                } else {
                    callback?.({ success: false, message: "Target user is not online" });
                }
            } catch (error) {
                console.error(`[RTC:CANDIDATE] Error:`, error);
                callback?.({ success: false, message: "Failed to forward candidate" });
            }
        });

        socket.on("rtc:end", (payload, callback) => {
            try {
                const { to, roomKey } = payload || {};
                if (!to || !roomKey) {
                    callback?.({ success: false, message: "Invalid payload" });
                    return;
                }
                const allowedRoom = socket.data.rooms?.find((room) => room.id === roomKey);
                if (!allowedRoom) {
                    callback?.({ success: false, message: "Room not allowed" });
                    return;
                }
                const participantIds = allowedRoom.participantIds || [];
                if (!participantIds.map(String).includes(String(to))) {
                    callback?.({ success: false, message: "Target not in room" });
                    return;
                }
                const targetSet = onlineUsers.get(String(to));
                if (targetSet && targetSet.size) {
                    console.log(`[RTC:END] Forwarding end call from ${socket.user.id} to ${to} in room ${roomKey} (${targetSet.size} socket(s))`);
                    for (const sid of targetSet) {
                        socket.to(sid).emit("rtc:end", { from: socket.user.id, roomKey });
                    }
                    callback?.({ success: true });
                } else {
                    console.warn(`[RTC:END] Target user ${to} is not online`);
                    callback?.({ success: false, message: "Target user is not online" });
                }
                const roomKeyStr = String(roomKey);
                const set = activeCallParticipants.get(roomKeyStr);
                if (set) {
                    set.delete(String(socket.user.id));
                    if (set.size === 0) {
                        activeCallParticipants.delete(roomKeyStr);
                        // Clean up screen sharing state when call ends
                        screenSharingState.delete(roomKeyStr);
                    } else {
                        // If the user who left was screen sharing, clean up and notify others
                        const screenState = screenSharingState.get(roomKeyStr);
                        if (screenState && screenState.userId === String(socket.user.id)) {
                            screenSharingState.delete(roomKeyStr);
                        }
                    }
                }
            } catch (error) {
                console.error(`[RTC:END] Error:`, error);
                callback?.({ success: false, message: "Failed to forward end" });
            }
        });

        socket.on("rtc:ring", (payload, callback) => {
            try {
                const { to, roomKey } = payload || {};
                if (!to || !roomKey) {
                    console.error(`[RTC:RING] Invalid payload from user ${socket.user.id}`);
                    callback?.({ success: false, message: "Invalid payload" });
                    return;
                }
                const allowedRoom = socket.data.rooms?.find((room) => room.id === roomKey);
                if (!allowedRoom) {
                    console.error(`[RTC:RING] Room ${roomKey} not allowed for user ${socket.user.id}`);
                    callback?.({ success: false, message: "Room not allowed" });
                    return;
                }
                const participantIds = allowedRoom.participantIds || [];
                if (!participantIds.map(String).includes(String(to))) {
                    console.error(`[RTC:RING] Target ${to} not in room ${roomKey}`);
                    callback?.({ success: false, message: "Target not in room" });
                    return;
                }
                const targetSet = onlineUsers.get(String(to));
                if (targetSet && targetSet.size) {
                    console.log(`[RTC:RING] Forwarding ring from ${socket.user.id} to ${to} in room ${roomKey} (${targetSet.size} socket(s))`);
                    const callerInfo = (allowedRoom.participants || []).find((p) => String(p.id) === String(socket.user.id)) || {};
                    const caller = {
                        id: String(socket.user.id),
                        username: callerInfo.username,
                        profilePic: callerInfo.profilePic,
                        role: callerInfo.role,
                    };
                    for (const sid of targetSet) {
                        socket.to(sid).emit("rtc:ring", { from: socket.user.id, roomKey, peers: payload.peers, isAudioOnly: payload.isAudioOnly, caller });
                    }
                    callback?.({ success: true });
                } else {
                    console.warn(`[RTC:RING] Target user ${to} is not online`);
                    callback?.({ success: false, message: "Target user is not online" });
                }
            } catch (error) {
                console.error(`[RTC:RING] Error:`, error);
                callback?.({ success: false, message: "Failed to forward ring" });
            }
        });

        socket.on("rtc:ring:accept", (payload, callback) => {
            try {
                const { to, roomKey } = payload || {};
                if (!to || !roomKey) {
                    console.error(`[RTC:RING:ACCEPT] Invalid payload from user ${socket.user.id}`);
                    callback?.({ success: false, message: "Invalid payload" });
                    return;
                }
                const allowedRoom = socket.data.rooms?.find((room) => room.id === roomKey);
                if (!allowedRoom) {
                    console.error(`[RTC:RING:ACCEPT] Room ${roomKey} not allowed for user ${socket.user.id}`);
                    callback?.({ success: false, message: "Room not allowed" });
                    return;
                }
                const participantIds = allowedRoom.participantIds || [];
                if (!participantIds.map(String).includes(String(to))) {
                    console.error(`[RTC:RING:ACCEPT] Target ${to} not in room ${roomKey}`);
                    callback?.({ success: false, message: "Target not in room" });
                    return;
                }
                const toSocketSet = onlineUsers.get(String(to));
                if (toSocketSet && toSocketSet.size) {
                    console.log(`[RTC:RING:ACCEPT] Forwarding accept from ${socket.user.id} to ${to} in room ${roomKey} (${toSocketSet.size} socket(s))`);

                    const roomKeyStr = String(roomKey);
                    const set = activeCallParticipants.get(roomKeyStr) || new Set();
                    set.add(String(socket.user.id));
                    set.add(String(to));
                    activeCallParticipants.set(roomKeyStr, set);
                    const all = Array.from(set);
                    const peersForCaller = all.filter((id) => id !== String(socket.user.id) && id !== String(to));
                    for (const sid of toSocketSet) {
                        socket.to(sid).emit("rtc:ring:accept", {
                            from: socket.user.id,
                            roomKey,
                            peers: peersForCaller
                        });
                    }

                    for (const pid of all) {
                        if (String(pid) === String(to) || String(pid) === String(socket.user.id)) continue;
                        const pidSocketSet = onlineUsers.get(String(pid));
                        if (pidSocketSet && pidSocketSet.size) {
                            const peersForReceiver = [String(to), ...all.filter((id) => id !== String(pid) && id !== String(socket.user.id))];
                            for (const sid of pidSocketSet) {
                                socket.to(sid).emit("rtc:ring:accept", {
                                    from: socket.user.id,
                                    roomKey,
                                    peers: peersForReceiver,
                                });
                            }
                        }
                    }

                    const peersForAccepter = all.filter((id) => id !== String(socket.user.id) && id !== String(to));
                    
                    // Check if anyone is currently screen sharing in this room
                    const screenShareInfo = screenSharingState.get(roomKeyStr);
                    
                    socket.emit("rtc:ring:accept", {
                        from: to,
                        roomKey,
                        peers: peersForAccepter,
                        isAccepter: true,
                        screenSharing: screenShareInfo || null, // Send current screen sharing state
                    });

                    callback?.({ success: true });
                } else {
                    console.warn(`[RTC:RING:ACCEPT] Target user ${to} is not online`);
                    callback?.({ success: false, message: "Target user is not online" });
                }
            } catch (error) {
                console.error(`[RTC:RING:ACCEPT] Error:`, error);
                callback?.({ success: false, message: "Failed to forward ring accept" });
            }
        });

        socket.on("rtc:screen-share", (payload, callback) => {
            try {
                const { roomKey, isSharing } = payload || {};
                if (!roomKey) {
                    callback?.({ success: false, message: "Invalid payload" });
                    return;
                }
                const allowedRoom = socket.data.rooms?.find((room) => room.id === roomKey);
                if (!allowedRoom) {
                    callback?.({ success: false, message: "Room not allowed" });
                    return;
                }
                
                const roomKeyStr = String(roomKey);
                const userId = String(socket.user.id);
                
                if (isSharing) {
                    screenSharingState.set(roomKeyStr, { userId, isSharing: true });
                    console.log(`[RTC:SCREEN-SHARE] User ${userId} started screen sharing in room ${roomKey}`);
                } else {
                    const currentState = screenSharingState.get(roomKeyStr);
                    if (currentState && currentState.userId === userId) {
                        screenSharingState.delete(roomKeyStr);
                        console.log(`[RTC:SCREEN-SHARE] User ${userId} stopped screen sharing in room ${roomKey}`);
                    }
                }
                
                // Notify all participants in the call about screen sharing state change
                const participants = activeCallParticipants.get(roomKeyStr);
                if (participants) {
                    for (const participantId of participants) {
                        if (String(participantId) !== userId) {
                            const participantSockets = onlineUsers.get(String(participantId));
                            if (participantSockets && participantSockets.size) {
                                for (const sid of participantSockets) {
                                    socket.to(sid).emit("rtc:screen-share-update", {
                                        roomKey,
                                        userId,
                                        isSharing,
                                    });
                                }
                            }
                        }
                    }
                }
                
                callback?.({ success: true });
            } catch (error) {
                console.error(`[RTC:SCREEN-SHARE] Error:`, error);
                callback?.({ success: false, message: "Failed to update screen share state" });
            }
        });

        socket.on("rtc:ring:decline", (payload, callback) => {
            try {
                const { to, roomKey } = payload || {};
                if (!to || !roomKey) {
                    console.error(`[RTC:RING:DECLINE] Invalid payload from user ${socket.user.id}`);
                    callback?.({ success: false, message: "Invalid payload" });
                    return;
                }
                const allowedRoom = socket.data.rooms?.find((room) => room.id === roomKey);
                if (!allowedRoom) {
                    console.error(`[RTC:RING:DECLINE] Room ${roomKey} not allowed for user ${socket.user.id}`);
                    callback?.({ success: false, message: "Room not allowed" });
                    return;
                }
                const participantIds = allowedRoom.participantIds || [];
                if (!participantIds.map(String).includes(String(to))) {
                    console.error(`[RTC:RING:DECLINE] Target ${to} not in room ${roomKey}`);
                    callback?.({ success: false, message: "Target not in room" });
                    return;
                }
                const targetSet = onlineUsers.get(String(to));
                if (targetSet && targetSet.size) {
                    console.log(`[RTC:RING:DECLINE] Forwarding decline from ${socket.user.id} to ${to} in room ${roomKey} (${targetSet.size} socket(s))`);
                    for (const sid of targetSet) {
                        socket.to(sid).emit("rtc:ring:decline", { from: socket.user.id, roomKey });
                    }
                    callback?.({ success: true });
                } else {
                    console.warn(`[RTC:RING:DECLINE] Target user ${to} is not online`);
                    callback?.({ success: false, message: "Target user is not online" });
                }
            } catch (error) {
                console.error(`[RTC:RING:DECLINE] Error:`, error);
                callback?.({ success: false, message: "Failed to forward ring decline" });
            }
        });

    });

};

const broadcastOnlineStatus = (io, userId, isOnline) => {
    io.emit("chat:user-status", {
        userId,
        isOnline,
    });
};

const hydrateRoomsForSocket = async (socket, io) => {
    const payload = await buildUserRooms(socket.user.id);
    const onlineUsersList = getOnlineUsers();

    // Add online status to participants
    const roomsWithOnlineStatus = payload.rooms.map((room) => {
        if (room.participants) {
            const participantsWithStatus = room.participants.map((p) => ({
                ...p,
                isOnline: onlineUsersList.includes(String(p.id)),
            }));
            return {
                ...room,
                participants: participantsWithStatus,
            };
        }
        return room;
    });

    socket.data.rooms = roomsWithOnlineStatus;

    const roomKeys = roomsWithOnlineStatus.map((room) => room.id);
    roomKeys.forEach((roomKey) => {
        socket.join(roomKey);
        console.log(`User ${socket.user.id} joined room ${roomKey}`);
    });

    socket.emit("chat:rooms", roomsWithOnlineStatus);
    console.log(`Sent ${roomsWithOnlineStatus.length} rooms to user ${socket.user.id}`);
};

export const getOnlineUsers = () => {
    return Array.from(onlineUsers.keys()).map(String);
};
