import mongoose, { Schema, model, models } from "mongoose";

const CertificateSchema = new Schema(
  {
    recipientName: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    courseTitle: { type: String, required: true },
    grade: { type: String },
    issueDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    
    status: { 
      type: String, 
      enum: ["pending", "issued", "revoked"], 
      default: "pending" 
    },
    
    // Blockchain data
    txHash: { type: String, unique: true, sparse: true },
    certId: { type: String, unique: true, required: true },
    certHash: { type: String, required: true },
    
    // Relationships
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
    issuerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    
    // Rendering & Template
    templateId: { type: String, default: "academic-classic" },
    metadata: {
      type: Map,
      of: String,
      default: {}
    },
    
    // Privacy & Visibility
    visibility: { 
      type: String, 
      enum: ["public", "private"], 
      default: "public" 
    },
    
    // Notification state
    emailSent: { type: Boolean, default: false },
    lastEmailSentAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for faster lookup
CertificateSchema.index({ recipientEmail: 1 });
CertificateSchema.index({ certId: 1 });
CertificateSchema.index({ status: 1 });
CertificateSchema.index({ recipientName: "text" }); // For fast analytics searching

const Certificate = models.Certificate || model("Certificate", CertificateSchema);
export default Certificate;
