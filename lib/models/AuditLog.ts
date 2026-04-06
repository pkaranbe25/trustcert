import mongoose, { Schema, model, models } from "mongoose";

const AuditLogSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
    actorId: { type: String, required: true }, // User ID or "SYSTEM"
    action: { 
      type: String, 
      enum: ["ISSUE_CERT", "REVOKE_CERT", "INVITE_MEMBER", "REMOVE_MEMBER", "CHANGE_SETTINGS", "GENERATE_API_KEY"], 
      required: true 
    },
    targetId: { type: String }, // e.g. certId or memberEmail
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const AuditLog = models.AuditLog || model("AuditLog", AuditLogSchema);
export default AuditLog;
