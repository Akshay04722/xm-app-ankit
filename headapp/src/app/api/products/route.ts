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

      // Query product details from Sitecore for the specific SKU
      const query = `query ProductSearch($sku: String!, $language: String!) {
        search(
          where: {
            AND: [
              { name: "_templates", value: "{7D33D96A-F36D-4DF9-9091-88DD28A680D5}" }
              { name: "SKU", value: $sku }
              { name: "_language", value: $language }
            ]
          }
        ) {
          results {
            id
            name
            title: field(name: "ProductTitle") { jsonValue }
            sku: field(name: "SKU") { jsonValue }
            price: field(name: "Price") { jsonValue }
            discountPrice: field(name: "DiscountPrice") { jsonValue }
            mainImage: field(name: "MainImage") { jsonValue }
            shortDescription: field(name: "ShortDescription") { jsonValue }
          }
        }
      }`;

      const data = await (client as any).graphQLClient.request(query, {
        sku: skuParam.trim(),
        language: "en",
      });

      const result = data?.search?.results?.[0];
      if (result) {
        const title = result.title?.jsonValue?.value || result.name;
        const sku = result.sku?.jsonValue?.value || "";
        const price = parseFloat(result.price?.jsonValue?.value || "0");
        const discountPrice = parseFloat(result.discountPrice?.jsonValue?.value || "0");
        const mainImage = result.mainImage?.jsonValue?.value?.src || result.mainImage?.jsonValue?.value || "";
        const shortDescription = result.shortDescription?.jsonValue?.value || "";

        return NextResponse.json({
          success: true,
          product: {
            id: result.id,
            name: result.name,
            title,
            sku,
            price,
            discountPrice,
            mainImage,
            shortDescription,
            stockCount,
          }
        });
      }

      return NextResponse.json({ success: true, sku: skuParam, stockCount, product: null });
    }

    const query = `query AllProducts($language: String!) {
      search(
        where: {
          AND: [
            { name: "_templates", value: "{7D33D96A-F36D-4DF9-9091-88DD28A680D5}" }
            { name: "_language", value: $language }
          ]
        }
        first: 30
      ) {
        results {
          id
          name
          title: field(name: "ProductTitle") { jsonValue }
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
      const mainImage = item.mainImage?.jsonValue?.value?.src || item.mainImage?.jsonValue?.value || "";
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
