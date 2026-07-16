import { NextRequest, NextResponse } from "next/server";
import "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const db = getFirestore();
    const reviewsSnap = await db
      .collection("reviews")
      .where("productId", "==", productId.trim())
      .get();

    const reviewsList: any[] = [];
    reviewsSnap.forEach((doc) => {
      reviewsList.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort in-memory to avoid Firestore composite index errors
    reviewsList.sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return NextResponse.json({ success: true, reviews: reviewsList });
  } catch (error: any) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!adminAuth) {
      return NextResponse.json({ error: "Firebase Admin SDK not initialized" }, { status: 500 });
    }

    // 1. Verify Authorization Header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // 2. Parse request body
    const body = await req.json();
    const { productId, rating, comment } = body;

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be a number between 1 and 5" }, { status: 400 });
    }
    if (!comment || !comment.trim()) {
      return NextResponse.json({ error: "comment is required" }, { status: 400 });
    }

    const db = getFirestore();

    // 3. Fetch user profile to get their name
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    
    let userName = "Anonymous User";
    if (userSnap.exists) {
      const profile = userSnap.data();
      const firstName = profile?.firstName?.trim() || "";
      const lastName = profile?.lastName?.trim() || "";
      if (firstName || lastName) {
        userName = `${firstName} ${lastName}`.trim();
      } else if (profile?.email) {
        userName = profile.email.split("@")[0];
      }
    } else if (decodedToken.name) {
      userName = decodedToken.name;
    } else if (decodedToken.email) {
      userName = decodedToken.email.split("@")[0];
    }

    // 4. Check if user already reviewed this product, update if exists, otherwise create
    const existingReviewsSnap = await db
      .collection("reviews")
      .where("productId", "==", productId.trim())
      .where("userId", "==", userId)
      .get();

    const newReview = {
      productId: productId.trim(),
      userId,
      userName,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    let reviewId = "";
    if (!existingReviewsSnap.empty) {
      const doc = existingReviewsSnap.docs[0];
      reviewId = doc.id;
      await doc.ref.update(newReview);
    } else {
      const reviewRef = await db.collection("reviews").add(newReview);
      reviewId = reviewRef.id;
    }

    return NextResponse.json({
      success: true,
      review: {
        id: reviewId,
        ...newReview,
      },
    });
  } catch (error: any) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
