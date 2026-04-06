import dbConnect from "./db";
import AuditLog from "./models/AuditLog";
import Institution from "./models/Institution";

type AuditAction = "ISSUE_CERT" | "REVOKE_CERT" | "INVITE_MEMBER" | "REMOVE_MEMBER" | "CHANGE_SETTINGS" | "GENERATE_API_KEY";

export async function logAction(
  institutionId: string, 
  actorId: string, 
  action: AuditAction, 
  targetId?: string, 
  metadata?: any
) {
  try {
    await dbConnect();
    
    // We don't block the main thread for auditing, but we await to ensure it's saved in this serverless context
    await AuditLog.create({
      institutionId,
      actorId,
      action,
      targetId,
      metadata,
      timestamp: new Date()
    });

    console.log(`[AUDIT] ${action} by ${actorId} on ${targetId}`);
    return true;
  } catch (error) {
    console.error("Failed to record audit log:", error);
    return false;
  }
}
