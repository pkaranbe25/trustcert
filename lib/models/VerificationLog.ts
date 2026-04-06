import mongoose from "mongoose";

const VerificationLogSchema = new mongoose.Schema({
  certId: { 
    type: String, 
    required: true,
    index: true 
  },
  institutionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Institution", 
    required: true,
    index: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  metadata: {
    ip: String,
    userAgent: String,
    location: String // e.g. "US", "IN" (truncated for privacy)
  }
});

export default mongoose.models.VerificationLog || mongoose.model("VerificationLog", VerificationLogSchema);
