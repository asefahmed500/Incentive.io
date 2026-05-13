import mongoose, { Schema, Document } from "mongoose";

export interface ITeam extends Document {
  name: string;
  managerId: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, unique: true },
    managerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

TeamSchema.index({ managerId: 1 });
TeamSchema.index({ members: 1 });
TeamSchema.index({ deletedAt: 1 });

TeamSchema.pre("find", function () {
  this.where({ deletedAt: null });
});
TeamSchema.pre("findOne", function () {
  this.where({ deletedAt: null });
});

export const Team = mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);