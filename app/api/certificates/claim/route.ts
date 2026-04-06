import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Certificate from "@/lib/models/Certificate";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { certId, walletAddress } = await req.json();

    if (!certId || !walletAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    // 1. Find the certificate and user
    const certificate = await Certificate.findOne({ 
      certId, 
      recipientEmail: session.user?.email,
      status: "issued" 
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found or not issued to your email" }, { status: 404 });
    }

    // 2. Link the wallet
    certificate.linkedWallet = walletAddress;
    await certificate.save();

    // 3. Update user's primary wallet if not set
    const user = await User.findOne({ email: session.user?.email });
    if (user && !user.linkedWallet) {
      user.linkedWallet = walletAddress;
      await user.save();
    }

    return NextResponse.json({ 
       success: true, 
       message: "Certificate effectively linked to your public portfolio.",
       certId
    });

  } catch (error: any) {
    console.error("Claiming API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
