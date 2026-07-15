import { NextRequest, NextResponse } from "next/server";
import client from "@/lib/sitecore-client";
import "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skuParam = searchParams.get("sku");
    if (skuParam) {
      const db = getFirestore();
      const productSnap = await db.collection("products").doc(skuParam.trim()).get();
      // Default to 100 if the Firestore stock count is not initialized yet
      const stockCount = productSnap.exists ? (productSnap.data()?.stockCount ?? 100) : 100;
      return NextResponse.json({ success: true, sku: skuParam, stockCount });
    }

    const query = `query AllProducts($language: String!) {
      search(
        where: {
          AND: [
            { name: "_templates", value: "{7D33D96A-F36D-4DF9-9091-88DD28A680D5}" }
            { name: "_language", value: $language }
          ]
        }
        first: 100
      ) {
        results {
          id
          name
          title: field(name: "Title") { jsonValue }
          sku: field(name: "SKU") { jsonValue }
          price: field(name: "Price") { jsonValue }
          discountPrice: field(name: "DiscountPrice") { jsonValue }
          mainImage: field(name: "MainImage") { jsonValue }
          shortDescription: field(name: "ShortDescription") { jsonValue }
        }
      }
    }`;

    // Get the products from the preconfigured Sitecore GraphQL Client
    const data = await (client as any).graphQLClient.request(query, {
      language: "en",
    });

    const results = data?.search?.results || [];

    const products = results.map((item: any) => {
      const title = item.title?.jsonValue?.value || item.name;
      const sku = item.sku?.jsonValue?.value || "";
      const price = parseFloat(item.price?.jsonValue?.value || "0");
      const discountPrice = parseFloat(item.discountPrice?.jsonValue?.value || "0");
      const mainImage = item.mainImage?.jsonValue?.value?.src || "";
      const shortDescription = item.shortDescription?.jsonValue?.value || "";

      return {
        id: item.id,
        name: item.name,
        title,
        sku,
        price,
        discountPrice,
        mainImage,
        shortDescription,
      };
    });

    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    console.error("GET /api/products error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
