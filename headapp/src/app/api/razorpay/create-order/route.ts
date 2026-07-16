import { NextRequest, NextResponse } from "next/server";
import "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import client from "@/lib/sitecore-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, addressId, cartItems } = body;

    // 1. Validation
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!addressId) {
      return NextResponse.json({ error: "addressId is required" }, { status: 400 });
    }
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: "cartItems is required and must not be empty" }, { status: 400 });
    }

    const db = getFirestore();

    // 2. Fetch the shipping address from Firestore
    const addressRef = db
      .collection("users")
      .doc(userId)
      .collection("addresses")
      .doc(addressId);
    
    const addressSnap = await addressRef.get();

    if (!addressSnap.exists) {
      return NextResponse.json({ error: "Shipping address not found" }, { status: 400 });
    }

    const address = addressSnap.data();

    // Fetch individual product details from Sitecore in parallel to avoid query complexity limits
    let recomputedSubtotal = 0;
    const cartSnapshot = [];

    try {
      const fetchPromises = cartItems.map(async (item) => {
        const productPathOrId = item.id || item.sku;
        if (!productPathOrId) {
          throw new Error("Item ID or SKU is missing");
        }

        const productQuery = `query Product($id: String!, $language: String!) {
          item(path: $id, language: $language) {
            id
            name
            title: field(name: "Title") { jsonValue }
            sku: field(name: "SKU") { jsonValue }
            price: field(name: "Price") { jsonValue }
            discountPrice: field(name: "DiscountPrice") { jsonValue }
            mainImage: field(name: "MainImage") { jsonValue }
          }
        }`;

        const data = await (client as any).graphQLClient.request(productQuery, {
          id: productPathOrId,
          language: "en",
        });

        const sitecoreItem = data?.item;
        if (!sitecoreItem) {
          throw new Error(`Product with ID/SKU ${productPathOrId} not found in Sitecore`);
        }

        const price = parseFloat(sitecoreItem.price?.jsonValue?.value || "0");
        const discountPrice = parseFloat(sitecoreItem.discountPrice?.jsonValue?.value || "0");
        const activePrice = price;
        const itemTotal = activePrice * Number(item.quantity || 1);

        return {
          id: sitecoreItem.id,
          sku: sitecoreItem.sku?.jsonValue?.value || item.sku || "",
          title: sitecoreItem.title?.jsonValue?.value || sitecoreItem.name,
          image: sitecoreItem.mainImage?.jsonValue?.value?.src || "",
          price,
          discountPrice,
          activePrice,
          quantity: Number(item.quantity || 1),
          selectedColor: item.selectedColor || "",
          selectedSize: item.selectedSize || "",
          itemTotal,
        };
      });

      const sitecoreProducts = await Promise.all(fetchPromises);

      for (const product of sitecoreProducts) {
        recomputedSubtotal += product.itemTotal;
        cartSnapshot.push(product);
      }
    } catch (err: any) {
      console.error("Error querying Sitecore products:", err);
      return NextResponse.json({ error: err.message || "Failed to load product details from Sitecore" }, { status: 400 });
    }

    if (recomputedSubtotal <= 0) {
      return NextResponse.json({ error: "Invalid order amount computed" }, { status: 400 });
    }

    // 4. Create order on Razorpay using Direct HTTP request
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server." },
        { status: 500 }
      );
    }

    const amountInPaise = Math.round(recomputedSubtotal * 100);

    const razorpayBody = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        userId,
        addressId,
        fullName: address?.fullName || "",
        phoneNumber: address?.phoneNumber || "",
        addressLine1: address?.addressLine1 || "",
        addressLine2: address?.addressLine2 || "",
        city: address?.city || "",
        state: address?.state || "",
        postalCode: address?.postalCode || "",
        country: address?.country || "",
      },
    };

    const authString = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(razorpayBody),
    });

    const rzpData = await rzpRes.json();

    if (!rzpRes.ok) {
      console.error("Razorpay order creation failed:", rzpData);
      return NextResponse.json(
        { error: rzpData.error?.description || "Razorpay API error" },
        { status: rzpRes.status }
      );
    }

    // 5. Store pending order in Firestore
    const orderDoc = {
      orderId: rzpData.id,
      userId,
      addressId,
      address: address || null,
      cart: cartSnapshot,
      amount: recomputedSubtotal,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await db.collection("orders").doc(rzpData.id).set(orderDoc);

    // 6. Send order details back to client
    return NextResponse.json({
      orderId: rzpData.id,
      amount: rzpData.amount,
      currency: rzpData.currency,
      keyId: keyId,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
