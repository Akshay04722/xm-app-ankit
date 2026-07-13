import { NextRequest, NextResponse } from "next/server";

const EDGE_CONTEXT_ID = process.env.SITECORE_EDGE_CONTEXT_ID || process.env.NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID;
const EDGE_URL = `https://edge.sitecorecloud.io/api/graphql/v1`;

export async function POST(req: NextRequest) {
  try {
    const { datasourceId, language } = await req.json();

    if (!datasourceId) {
      return NextResponse.json({ error: "Missing datasourceId" }, { status: 400 });
    }

    const cleanId = datasourceId.replace(/[{}]/g, "").toLowerCase();

    const query = `query ShopProductsList($datasource: String!, $language: String!) {
      datasource: item(path: $datasource, language: $language) {
        products: children(includeTemplateIDs: ["{7D33D96A-F36D-4DF9-9091-88DD28A680D5}"], first: 100) {
          results {
            id
            name
            title: field(name: "Title") { jsonValue }
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

    const response = await fetch(EDGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        sc_apikey: EDGE_CONTEXT_ID || "",
      },
      body: JSON.stringify({
        query,
        variables: { datasource: cleanId, language: language || "en" },
      }),
    });

    const json = await response.json();
    const results = json?.data?.datasource?.products?.results || [];

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("[shop-products API] Error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
