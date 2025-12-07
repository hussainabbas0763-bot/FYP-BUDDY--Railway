export const formatChatMessage = (messageDoc, readReceipts = [], deliveryReceipts = []) => {
    if (!messageDoc) return null;

    const senderDoc =
        typeof messageDoc.sender === "object"
            ? messageDoc.sender
            : { _id: messageDoc.sender };

    const messageId = messageDoc._id?.toString();
    const readBy = readReceipts
        .filter((rr) => rr.messageId?.toString() === messageId)
        .map((rr) => rr.userId?.toString());
    
    const deliveredTo = deliveryReceipts
        .filter((dr) => dr.messageId?.toString() === messageId)
        .map((dr) => dr.userId?.toString());

    const contactDoc = messageDoc.contactData?.userId && typeof messageDoc.contactData.userId === "object"
        ? messageDoc.contactData.userId
        : null;

    const deletedBy = Array.isArray(messageDoc.deletedBy)
        ? messageDoc.deletedBy.map((id) => id?.toString())
        : [];

    return {
        id: messageId,
        roomKey: messageDoc.roomKey,
        text: messageDoc.isDeleted ? "This message was deleted" : (messageDoc.text || ""),
        messageType: messageDoc.messageType || "text",
        attachments: messageDoc.isDeleted ? [] : (messageDoc.attachments || []),
        contactData: messageDoc.isDeleted ? null : (messageDoc.contactData ? {
            userId: contactDoc?._id?.toString() || messageDoc.contactData.userId?.toString(),
            username: messageDoc.contactData.username || contactDoc?.username,
            email: messageDoc.contactData.email || contactDoc?.email,
            phone: messageDoc.contactData.phone || contactDoc?.phone,
            profilePic: contactDoc?.profilePic || "",
        } : null),
        sender: {
            id: senderDoc._id?.toString(),
            username: senderDoc.username || "Unknown",
            profilePic: senderDoc.profilePic || "",
            role: senderDoc.role || "student",
        },
        timestamp: messageDoc.createdAt,
        readBy: readBy || [],
        deliveredTo: deliveredTo || [],
        isDeleted: messageDoc.isDeleted || false,
        deletedBy: deletedBy,
        isEncrypted: messageDoc.isEncrypted || false,
        meta: messageDoc.meta || null,
    };
};
