import mongoose from "mongoose";

const chatReadReceiptSchema = new mongoose.Schema(
    {
        messageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ChatMessage",
            required: true,
            index: true,
        },
        roomKey: {
            type: String,
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        readAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

chatReadReceiptSchema.index({ messageId: 1, userId: 1 }, { unique: true });
chatReadReceiptSchema.index({ roomKey: 1, userId: 1 });

export const ChatReadReceipt = mongoose.model("ChatReadReceipt", chatReadReceiptSchema);
