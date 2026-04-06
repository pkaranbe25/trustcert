import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Certificate from "@/lib/models/Certificate";
import VerificationLog from "@/lib/models/VerificationLog";
import Institution from "@/lib/models/Institution";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, subDays } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "institution") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Find the institution managed by this user
    const institution = await Institution.findOne({ ownerId: (session.user as any).id });
    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }

    const institutionId = institution._id;

    // 1. Basic Stats
    const totalIssued = await Certificate.countDocuments({ institutionId, status: "issued" });
    const totalRevoked = await Certificate.countDocuments({ institutionId, status: "revoked" });
    const totalHits = await VerificationLog.countDocuments({ institutionId });

    // 2. Line Chart: Verification Hits over the last 14 days
    const endDate = new Date();
    const startDate = subDays(endDate, 13);
    
    const hits = await VerificationLog.aggregate([
      {
        $match: {
          institutionId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days
    const dayInterval = eachDayOfInterval({ start: startDate, end: endDate });
    const chartData = dayInterval.map(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const found = hits.find(h => h._id === dateStr);
      return {
        date: format(day, "MMM dd"),
        hits: found ? found.count : 0
      };
    });

    // 3. Pie Chart: Distribution by Template Type
    const templateDist = await Certificate.aggregate([
      { $match: { institutionId } },
      { $group: { _id: "$templateId", value: { $sum: 1 } } },
      { $project: { name: "$_id", value: 1, _id: 0 } }
    ]);

    // 4. Top Courses (Limited to 5)
    const topCourses = await Certificate.aggregate([
      { $match: { institutionId, status: "issued" } },
      { $group: { _id: "$courseTitle", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    return NextResponse.json({
      stats: {
        totalIssued,
        totalRevoked,
        totalHits,
        activeStudents: await Certificate.distinct("recipientEmail", { institutionId }).then(emails => emails.length)
      },
      charts: {
        hitsOverTime: chartData,
        templateDistribution: templateDist.length > 0 ? templateDist : [{ name: "Standard", value: totalIssued }],
        topCourses
      }
    });

  } catch (error: any) {
    console.error("Analytics API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
