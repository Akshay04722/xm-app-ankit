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
    const { orderId, reason, comment } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: "Reason for return is required" }, { status: 400 });
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

    // 5. Check if already returned/cancelled
    if (orderData?.status === "returned") {
      return NextResponse.json({ error: "Order has already been returned" }, { status: 400 });
    }
    if (orderData?.status === "cancelled") {
      return NextResponse.json({ error: "Cannot return a cancelled order" }, { status: 400 });
    }

    const previousStatus = orderData?.status;
    const paymentId = orderData?.razorpay_payment_id;
    let refundDetails = null;

    // 6. If the order was successful, trigger a Razorpay refund
    if (previousStatus === "success" && paymentId) {
      const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (keyId && keySecret) {
        try {
          const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
          const refundRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify({
              notes: {
                reason: `Return: ${reason.trim()}`,
                comment: (comment || "").trim(),
                orderId: orderId,
              },
            }),
          });

          const refundData = await refundRes.json();
          if (refundRes.ok) {
            console.log("Razorpay refund success for return:", refundData);
            refundDetails = {
              refundId: refundData.id,
              status: refundData.status,
              amount: refundData.amount / 100, // convert paise to Rupees
              createdAt: new Date().toISOString(),
            };
          } else {
            console.error("Razorpay refund API error details for return:", refundData);
          }
        } catch (refundErr) {
          console.error("Failed calling Razorpay refund API for return:", refundErr);
        }
      } else {
        console.error("Missing Razorpay credentials; skipping API refund call.");
      }
    }

    // 7. Update order status to returned
    await orderRef.update({
      status: "returned",
      returnReason: reason.trim(),
      returnComment: (comment || "").trim(),
      returnedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(refundDetails ? { refund: refundDetails } : {}),
    });

    // 8. Revert/restore the stock counts in Firestore
    if (previousStatus === "success" && Array.isArray(orderData?.cart) && orderData.cart.length > 0) {
      const batch = db.batch();
      for (const item of orderData.cart) {
        if (item.sku) {
          // Firestore restore (safe set merge)
          const productRef = db.collection("products").doc(item.sku.trim());
          batch.set(productRef, {
            stockCount: FieldValue.increment(Number(item.quantity || 1)),
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      }
      await batch.commit();
    }

    return NextResponse.json({ success: true, orderId });
  } catch (error: any) {
    console.error("POST /api/orders/return error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
