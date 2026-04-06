import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Certificate from "@/lib/models/Certificate";
import VerificationLog from "@/lib/models/VerificationLog";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const certId = searchParams.get("certId");

    if (!certId) {
      return NextResponse.json({ error: "Missing Certificate ID" }, { status: 400 });
    }

    await dbConnect();

    const certificate = await Certificate.findOne({ certId }).populate("institutionId");

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Record the verification hit for analytics (fire and forget)
    try {
      const headerList = await headers();
      const ip = headerList.get("x-forwarded-for") || "0.0.0.0";
      const userAgent = headerList.get("user-agent") || "Unknown";

      VerificationLog.create({
        certId,
        institutionId: certificate.institutionId,
        metadata: {
          ip,
          userAgent,
          location: "UNKNOWN" // Placeholder for geolocation service integration
        }
      });
    } catch (logErr) {
      console.error("Failed to log verification hit:", logErr);
    }

    return NextResponse.json(certificate);
  } catch (error) {
    console.error("Verification API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
