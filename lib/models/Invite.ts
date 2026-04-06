import mongoose, { Schema, model, models } from "mongoose";

const InviteSchema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    institutionId: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: "admin" },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
    },
    usedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Invite = models.Invite || model("Invite", InviteSchema);
export default Invite;
