import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required." }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ linkedWallet: walletAddress });

    if (!user) {
      return NextResponse.json({ error: "No account linked to this wallet" }, { status: 404 });
    }

    // Return user data for client-side signIn
    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      linkedWallet: user.linkedWallet,
      avatarColor: user.avatarColor,
      rememberMe: user.rememberMe,
    });

  } catch (error: any) {
    console.error("Wallet login error:", error);
    return NextResponse.json({ error: "Failed to verify wallet." }, { status: 500 });
  }
}
