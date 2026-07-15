import { NextRequest, NextResponse } from "next/server";
import "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify Authorization Token
    if (!adminAuth) {
      return NextResponse.json({ error: "Firebase Admin SDK not initialized" }, { status: 500 });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing authorization token" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const db = getFirestore();

    // 2. Fetch all orders for this user
    const ordersSnap = await db
      .collection("orders")
      .where("userId", "==", userId)
      .get();

    const ordersList: any[] = [];
    ordersSnap.forEach((doc) => {
      ordersList.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // 3. Sort in-memory to avoid Firestore composite index errors
    ordersList.sort((a: any, b: any) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return NextResponse.json({
      success: true,
      orders: ordersList,
      keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    });
  } catch (error: any) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const db = getFirestore();
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (orderSnap.exists) {
      const orderData = orderSnap.data();
      // Only delete if the order is still pending to prevent deleting success/cancelled orders
      if (orderData?.status === "pending") {
        await orderRef.delete();
        return NextResponse.json({ success: true, message: "Pending order deleted successfully" });
      }
    }

    return NextResponse.json({ success: true, message: "No pending order found to delete" });
  } catch (error: any) {
    console.error("DELETE /api/orders error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
