import mongoose, { Schema, Document } from "mongoose"

export interface IBackup extends Document {
  filename: string
  data: Record<string, unknown>
  size: number
  createdAt: Date
}

const BackupSchema = new Schema<IBackup>(
  {
    filename: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
    size: { type: Number, required: true },
  },
  { timestamps: true }
)

BackupSchema.index({ createdAt: -1 })

export const Backup = mongoose.models.Backup || mongoose.model<IBackup>("Backup", BackupSchema)
