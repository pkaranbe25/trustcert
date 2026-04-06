import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Certificate from "@/lib/models/Certificate";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch ALL certificates matching this student's email
    // This includes both those linked to a wallet and those just issued to the email
    const certificates = await Certificate.find({
      recipientEmail: session.user?.email,
      status: "issued"
    }).sort({ issueDate: -1 });

    return NextResponse.json(certificates);
  } catch (error: any) {
    console.error("Student Certificates API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
