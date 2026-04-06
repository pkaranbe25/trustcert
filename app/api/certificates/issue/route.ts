import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Certificate from "@/lib/models/Certificate";
import Institution from "@/lib/models/Institution";
import { sendIssuanceEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "institution") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { certificates, templateId, institutionId } = await req.json();

    if (!certificates || !Array.isArray(certificates) || !institutionId) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    await dbConnect();

    // Verify institution ownership
    const institution = await Institution.findOne({
      _id: institutionId,
      "members.userId": (session.user as any).id
    });

    if (!institution) {
      return NextResponse.json({ error: "Institution not found or access denied" }, { status: 403 });
    }

    const issuedCertificates = [];

    for (const certData of certificates) {
      const certId = `TC-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      const certHash = crypto.createHash("sha256").update(JSON.stringify(certData) + certId).digest("hex");

      const newCert = new Certificate({
        recipientName: certData.recipient_name,
        recipientEmail: certData.recipient_email,
        courseTitle: certData.course_name,
        issueDate: certData.issue_date || new Date(),
        certId,
        certHash,
        institutionId,
        issuerId: (session.user as any).id,
        templateId,
        status: "pending" // Initial state before ledger confirmation
      });

      await newCert.save();
      issuedCertificates.push(newCert);
    }

    return NextResponse.json({ 
      success: true, 
      certificates: issuedCertificates.map(c => ({
        id: c._id,
        certId: c.certId,
        hash: c.certHash
      }))
    });

  } catch (error: any) {
    console.error("Issuance API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
