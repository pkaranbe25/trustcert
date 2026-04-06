import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import AuditLog from "@/lib/models/AuditLog";
import Institution from "@/lib/models/Institution";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "institution") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const institution = await Institution.findOne({ ownerId: (session.user as any).id });
    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }

    const logs = await AuditLog.find({ institutionId: institution._id })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(logs);

  } catch (error: any) {
    console.error("Audit API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
