import { NextRequest, NextResponse } from "next/server";
import client from "@/lib/sitecore-client";

export async function POST(req: NextRequest) {
  try {
    const { datasourceId, language, first } = await req.json();

    if (!datasourceId) {
      return NextResponse.json({ error: "Missing datasourceId" }, { status: 400 });
    }

    const cleanId = datasourceId.replace(/[{}]/g, "").toLowerCase();
    const firstCount = typeof first === "number" ? first : 20;

    const query = `query ShopProductsList($datasource: String!, $language: String!, $first: Int) {
      datasource: item(path: $datasource, language: $language) {
        products: children(includeTemplateIDs: ["{7D33D96A-F36D-4DF9-9091-88DD28A680D5}"], first: $first) {
          results {
            id
            name
            title: field(name: "ProductTitle") { jsonValue }
            sku: field(name: "SKU") { jsonValue }
            shortDescription: field(name: "ShortDescription") { jsonValue }
            price: field(name: "Price") { jsonValue }
            discountPrice: field(name: "DiscountPrice") { jsonValue }
            isNew: field(name: "IsNew") { jsonValue }
            mainImage: field(name: "MainImage") { jsonValue }
            availableSizes: field(name: "AvailableSizes") { jsonValue }
            availableColors: field(name: "AvailableColors") { jsonValue }
            category: field(name: "Category") { jsonValue }
            tags: field(name: "Tags") { jsonValue }
          }
        }
      }
    }`;

    const result = await (client as any).graphQLClient.request(query, {
      datasource: cleanId,
      language: language || "en",
      first: firstCount,
    });

    const results = result?.datasource?.products?.results || [];

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("[shop-products API] Error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
