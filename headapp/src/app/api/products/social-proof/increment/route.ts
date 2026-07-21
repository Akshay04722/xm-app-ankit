import { NextRequest, NextResponse } from "next/server";
import { recordSocialProofEvent } from "@/lib/socialProofStore";

export async function POST(req: NextRequest) {
  try {
    const { sku, action } = await req.json();
    if (!sku || !action) {
      return NextResponse.json({ error: "sku and action are required" }, { status: 400 });
    }

    if (action !== "view" && action !== "add" && action !== "purchase") {
      return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
    }

    // Record the event globally in Firestore
    await recordSocialProofEvent(sku, action);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[social-proof increment API] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
