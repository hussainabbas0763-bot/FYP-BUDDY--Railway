import mongoose from "mongoose";

const chatDeliveryReceiptSchema = new mongoose.Schema(
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
        deliveredAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

chatDeliveryReceiptSchema.index({ messageId: 1, userId: 1 }, { unique: true });
chatDeliveryReceiptSchema.index({ roomKey: 1, userId: 1 });

export const ChatDeliveryReceipt = mongoose.model("ChatDeliveryReceipt", chatDeliveryReceiptSchema);

