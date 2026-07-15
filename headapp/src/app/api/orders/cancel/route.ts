import { NextRequest, NextResponse } from "next/server";
import "@/lib/firebaseAdmin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
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

    // 2. Parse request body
    const body = await req.json();
    const { orderId, reason } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: "Reason for cancellation is required" }, { status: 400 });
    }

    const db = getFirestore();

    // 3. Fetch order details from Firestore
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderSnap.data();

    // 4. Permission check: verify that this order belongs to the authenticated user
    if (orderData?.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized: Access denied" }, { status: 403 });
    }

    // 5. Check if already cancelled
    if (orderData?.status === "cancelled") {
      return NextResponse.json({ error: "Order is already cancelled" }, { status: 400 });
    }

    const previousStatus = orderData?.status;

    // 6. Update order status to cancelled
    await orderRef.update({
      status: "cancelled",
      cancelReason: reason.trim(),
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 7. If the order was successful, revert/restore the stock counts in Firestore
    if (previousStatus === "success" && Array.isArray(orderData?.cart) && orderData.cart.length > 0) {
      const batch = db.batch();
      for (const item of orderData.cart) {
        if (item.sku) {
          const productRef = db.collection("products").doc(item.sku.trim());
          batch.update(productRef, {
            stockCount: FieldValue.increment(Number(item.quantity || 1)),
          });
        }
      }
      await batch.commit();
    }

    return NextResponse.json({ success: true, orderId });
  } catch (error: any) {
    console.error("POST /api/orders/cancel error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
