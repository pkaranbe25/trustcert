import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Institution from "@/lib/models/Institution";
import Invite from "@/lib/models/Invite";
import User from "@/lib/models/User";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  // Validate membership in this institution
  const institution = await Institution.findOne({
    _id: id,
    "members.userId": session.user.id
  });

  if (!institution) return NextResponse.json({ error: "Institution not found or access denied" }, { status: 404 });

  // Fetch full user details for each member
  const memberUserIds = institution.members.map((m: any) => m.userId);
  const users = await User.find({ _id: { $in: memberUserIds } });

  const membersWithDetails = institution.members.map((m: any) => {
    const user = users.find(u => u._id.toString() === m.userId.toString());
    return {
      userId: m.userId,
      role: m.role,
      addedAt: m.addedAt,
      name: user?.name || "Unknown User",
      email: user?.email || "No Email",
      image: user?.image
    };
  });

  // Also fetch pending invites
  const pendingInvites = await Invite.find({
    institutionId: id,
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  });

  return NextResponse.json({
    members: membersWithDetails,
    pendingInvites: pendingInvites.map(i => ({
      email: i.email,
      role: i.role,
      expiresAt: i.expiresAt,
      createdAt: i.createdAt
    }))
  });
}
