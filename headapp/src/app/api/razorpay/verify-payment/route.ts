import { NextRequest, NextResponse } from "next/server";
import "@/lib/firebaseAdmin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      addressId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      cartItems,
    } = body;

    // 1. Validation
    if (!userId || !addressId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required verification fields" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server." },
        { status: 500 }
      );
    }

    // 2. Verify Razorpay Signature locally
    const signData = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(signData)
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      console.error("Razorpay signature verification failed.", {
        expected: expectedSignature,
        received: razorpay_signature,
      });
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const db = getFirestore();

    // 3. Update order document and decrement stock count
    const orderRef = db.collection("orders").doc(razorpay_order_id);
    const orderSnap = await orderRef.get();

    let shouldDecrementStock = false;
    let itemsToDecrement = [];

    if (orderSnap.exists) {
      const orderData = orderSnap.data();
      if (orderData?.status === "success") {
        // Already processed, avoid duplicate stock decrement
        return NextResponse.json({ success: true, orderId: razorpay_order_id });
      }
      shouldDecrementStock = true;
      itemsToDecrement = orderData?.cart || [];

      // Update existing pending order
      await orderRef.update({
        status: "success",
        razorpay_payment_id,
        razorpay_signature,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Fallback: create the full order document if it doesn't exist yet
      const addressSnap = await db
        .collection("users")
        .doc(userId)
        .collection("addresses")
        .doc(addressId)
        .get();

      const addressSnapshot = addressSnap.exists ? addressSnap.data() : null;
      shouldDecrementStock = true;
      itemsToDecrement = cartItems || [];

      const orderDoc = {
        orderId: razorpay_order_id,
        userId,
        addressId,
        address: addressSnapshot,
        cart: cartItems,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        status: "success",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await orderRef.set(orderDoc);
    }

    // 4. Atomic stock reduction in Firestore
    if (shouldDecrementStock && Array.isArray(itemsToDecrement) && itemsToDecrement.length > 0) {
      const batch = db.batch();
      for (const item of itemsToDecrement) {
        if (item.sku) {
          const productRef = db.collection("products").doc(item.sku.trim());
          batch.update(productRef, {
            stockCount: FieldValue.increment(-Number(item.quantity || 1)),
          });
        }
      }
      await batch.commit();
    }

    return NextResponse.json({ success: true, orderId: razorpay_order_id });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
