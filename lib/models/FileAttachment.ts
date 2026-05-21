import mongoose, { Schema, Document } from "mongoose"

export interface IFileAttachment extends Document {
  filename: string
  mimeType: string
  size: number
  data: Buffer
  uploadedBy: string
  createdAt: Date
}

const FileAttachmentSchema = new Schema<IFileAttachment>(
  {
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    uploadedBy: { type: String, required: true },
  },
  { timestamps: true }
)

export const FileAttachment =
  mongoose.models.FileAttachment || mongoose.model<IFileAttachment>("FileAttachment", FileAttachmentSchema)
