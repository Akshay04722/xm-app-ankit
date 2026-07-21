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
        { error: "Razorpay key secret is not configured on the server" },
        { status: 500 }
      );
    }

    // 2. Signature verification
    const generated_signature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const db = getFirestore();

    // 3. Prevent duplicate order processing
    const orderRef = db.collection("orders").doc(razorpay_order_id);
    const orderSnap = await orderRef.get();

    let shouldDecrementStock = false;
    let itemsToDecrement = [];

    if (orderSnap.exists) {
      const existingOrder = orderSnap.data();
      if (existingOrder?.status !== "success") {
        shouldDecrementStock = true;
        itemsToDecrement = existingOrder?.cart || cartItems || [];
        
        await orderRef.update({
          status: "success",
          razorpay_payment_id,
          razorpay_signature,
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
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

    // 4. Atomic stock reduction and social proof purchase event recording
    if (shouldDecrementStock && Array.isArray(itemsToDecrement) && itemsToDecrement.length > 0) {
      const batch = db.batch();
      for (const item of itemsToDecrement) {
        if (item.sku) {
          // Firestore update (safe set merge)
          const productRef = db.collection("products").doc(item.sku.trim());
          batch.set(productRef, {
            stockCount: FieldValue.increment(-Number(item.quantity || 1)),
            updatedAt: new Date().toISOString(),
          }, { merge: true });

          // Record purchase event for social proof
          const eventRef = db.collection("socialProofEvents").doc();
          batch.set(eventRef, {
            sku: item.sku.trim(),
            action: "purchase",
            timestamp: new Date(),
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
