import { NextRequest, NextResponse } from "next/server";
import { getGlobalSocialProofStats } from "@/lib/socialProofStore";

export async function POST(req: NextRequest) {
  try {
    const { skus } = await req.json();
    if (!Array.isArray(skus)) {
      return NextResponse.json({ error: "Invalid SKUs list" }, { status: 400 });
    }

    // Fetch the global rolling 24-hour social proof stats from Firestore
    const stats = await getGlobalSocialProofStats(skus);

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error("[social-proof API] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
