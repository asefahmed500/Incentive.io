import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    recipientRole: {
      type: String,
      required: true,
      enum: ["administrator", "admin", "salesManager", "salesExecutive", "accountant", "finance"],
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "SALE_SUBMITTED",
        "SALE_RESUBMITTED",
        "MANAGER_APPROVED",
        "MANAGER_REJECTED",
        "ACCOUNTANT_PROCESSED",
        "ACCOUNTANT_REJECTED",
        "FINANCE_APPROVED",
        "FINANCE_REJECTED",
        "NEW_TARGET",
        "COMMISSION_ELIGIBLE",
        "USER_CREATED",
      ],
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ recipientRole: 1, createdAt: -1 });

// Pre-find hook to filter out soft-deleted notifications
NotificationSchema.pre("find", function () {
  this.where({ deletedAt: null });
});

NotificationSchema.pre("findOne", function () {
  this.where({ deletedAt: null });
});

const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

export default Notification;
