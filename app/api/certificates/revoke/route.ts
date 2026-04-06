import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Certificate from "@/lib/models/Certificate";
import Institution from "@/lib/models/Institution";
import { logAction } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "institution") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { certId } = await req.json();

    if (!certId) {
      return NextResponse.json({ error: "Missing Certificate ID" }, { status: 400 });
    }

    await dbConnect();

    // 1. Verify access (must belong to this institution)
    const certificate = await Certificate.findOne({ certId }).populate("institutionId");
    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const institution = certificate.institutionId as any;
    if (institution.ownerId.toString() !== (session.user as any).id) {
       return NextResponse.json({ error: "Unauthorized access to this resource" }, { status: 403 });
    }

    // 2. Prepare Revocation XDR
    const { buildRevocationTransaction } = await import("@/lib/stellar");
    const xdr = await buildRevocationTransaction(institution.walletAddress, certId);

    return NextResponse.json({ 
       success: true, 
       xdr,
       message: "Sign this transaction to definitively nullify the ledger entry."
    });

  } catch (error: any) {
    console.error("Revocation API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "institution") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { certId, txHash } = await req.json();

    if (!certId) {
      return NextResponse.json({ error: "Missing Certificate ID" }, { status: 400 });
    }

    await dbConnect();

    // 1. Update internal registry
    const certificate = await Certificate.findOneAndUpdate(
       { certId },
       { 
         status: "revoked", 
         revocationDate: new Date(),
         revocationReason: "Administrative Action"
       },
       { new: true }
    );

    // 2. Record Audit Log
    const inst = await Institution.findOne({ ownerId: (session.user as any).id });
    if (inst) {
      logAction(
        inst._id.toString(),
        (session.user as any).id,
        "REVOKE_CERT",
        certId,
        { txHash }
      ).catch(err => console.error("Audit log failed:", err));
    }

    return NextResponse.json({ 
       success: true, 
       message: "Certificate effectively nullified in registry and ledger.",
       status: certificate.status
    });

  } catch (error: any) {
    console.error("Revocation PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
