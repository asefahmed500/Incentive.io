import mongoose, { Schema, Document } from "mongoose"

export interface IFileAttachment extends Document {
  filename: string
  mimeType: string
  size: number
  data: Buffer
  uploadedBy: string
  deletedAt?: Date
  createdAt: Date
}

const FileAttachmentSchema = new Schema<IFileAttachment>(
  {
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    uploadedBy: { type: String, required: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
)

FileAttachmentSchema.pre("find", function () {
  this.where({ deletedAt: null });
});
FileAttachmentSchema.pre("findOne", function () {
  this.where({ deletedAt: null });
});
FileAttachmentSchema.pre("countDocuments", function () {
  this.where({ deletedAt: null });
});

export const FileAttachment =
  mongoose.models.FileAttachment || mongoose.model<IFileAttachment>("FileAttachment", FileAttachmentSchema)
