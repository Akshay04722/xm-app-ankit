import "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

// Threshold Configurations (configurable via environment variables)
const TRENDING_THRESHOLD = Number(process.env.SOCIAL_PROOF_TRENDING_THRESHOLD) || 5;
const MOST_VIEWED_THRESHOLD = Number(process.env.SOCIAL_PROOF_MOST_VIEWED_THRESHOLD) || 100;
const IN_DEMAND_THRESHOLD = Number(process.env.SOCIAL_PROOF_IN_DEMAND_THRESHOLD) || 40;

export interface SocialProofStats {
  views: number;
  cartAdds: number;
  sales: number;
}

/**
 * Records a social proof event in Firestore.
 */
export async function recordSocialProofEvent(sku: string, action: "view" | "add" | "purchase") {
  try {
    const db = getFirestore();
    const cleanSku = sku.trim();
    await db.collection("socialProofEvents").add({
      sku: cleanSku,
      action,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error(`Failed to record social proof event (${action}) for SKU ${sku}:`, error);
  }
}

/**
 * Fetches aggregated social proof stats for a list of SKUs for the rolling last 24 hours.
 */
export async function getGlobalSocialProofStats(skus: string[]): Promise<Record<string, { tagType: "trending" | "demand" | "views" | null; tagText: string }>> {
  const result: Record<string, { tagType: "trending" | "demand" | "views" | null; tagText: string }> = {};
  
  // Initialize result structure
  skus.forEach((sku) => {
    result[sku] = { tagType: null, tagText: "" };
  });

  if (skus.length === 0) return result;

  try {
    const db = getFirestore();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Query events from last 24 hours
    const querySnapshot = await db
      .collection("socialProofEvents")
      .where("timestamp", ">=", cutoff)
      .get();

    // Map counts by SKU and action
    const counts: Record<string, { views: number; cartAdds: number; sales: number }> = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const sku = data.sku;
      const action = data.action;

      if (!sku) return;

      if (!counts[sku]) {
        counts[sku] = { views: 0, cartAdds: 0, sales: 0 };
      }

      // Handle both Firestore Timestamp objects and raw ISO strings/dates
      if (action === "view") {
        counts[sku].views++;
      } else if (action === "add") {
        counts[sku].cartAdds++;
      } else if (action === "purchase") {
        counts[sku].sales++;
      }
    });

    // Populate the tags based on hierarchy and counts
    // Populate the tags based on priority hierarchy and thresholds
    skus.forEach((sku) => {
      const item = counts[sku] || { views: 0, cartAdds: 0, sales: 0 };
      let tagType: "trending" | "demand" | "views" | null = null;
      let tagText = "";

      // Priority Order: Trending -> Most Viewed -> In Demand
      if (item.sales >= TRENDING_THRESHOLD) {
        tagType = "trending";
        tagText = `Trending! ${item.sales} sold in the last day`;
      } else if (item.views >= MOST_VIEWED_THRESHOLD) {
        tagType = "views";
        tagText = `Most Viewed! ${item.views} views in the last day`;
      } else if (item.cartAdds >= IN_DEMAND_THRESHOLD) {
        tagType = "demand";
        tagText = `In Demand! ${item.cartAdds} times added to cart`;
      }

      result[sku] = { tagType, tagText };
    });

  } catch (error) {
    console.error("Failed to query global social proof stats:", error);
  }

  return result;
}
