import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Institution from "@/lib/models/Institution";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  
  const institutions = await Institution.find({
    $or: [
      { ownerId: session.user.id },
      { "members.userId": session.user.id }
    ],
    deletedAt: { $exists: false }
  }).sort({ createdAt: -1 });

  return NextResponse.json(institutions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  await dbConnect();

  const suffix = Math.random().toString(36).substring(2, 6);
  const slug = name.toLowerCase().replace(/ /g, "-") + "-" + suffix;

  const institution = await Institution.create({
    name,
    slug,
    ownerId: session.user.id,
    members: [{ userId: session.user.id, role: "owner" }],
    accentColor: "#" + Math.floor(Math.random()*16777215).toString(16) // Random initial accent
  });

  return NextResponse.json(institution);
}
