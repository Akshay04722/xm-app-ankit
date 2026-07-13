import { isDesignLibraryPreviewData } from "@sitecore-content-sdk/nextjs/editing";
import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import { SiteInfo } from "@sitecore-content-sdk/nextjs";
import sites from ".sitecore/sites.json";
import { routing } from "src/i18n/routing";
import scConfig from "sitecore.config";
import client from "src/lib/sitecore-client";
import Layout, { RouteFields } from "src/Layout";
import components from ".sitecore/component-map";
import Providers from "src/Providers";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getBaseUrl } from "src/lib/utils";
import { stripHtml } from "src/lib/searchUtils";

/**
 * Resolve product detail URLs: Shop/{SKU}--{Title} → Shop/Products/{SKU}
 * This allows clean product URLs like /Shop/SS001--Syltherine to map
 * to the Sitecore content item at /Shop/Products/SS001
 */
function resolveProductPath(path: string[]): string[] {
  if (
    path.length >= 2 &&
    path[0]?.toLowerCase() === "shop" &&
    path[path.length - 1]?.includes("--")
  ) {
    const sku = path[path.length - 1].split("--")[0];
    return ["Shop", "Products", sku];
  }
  return path;
}

async function fetchPage(resolvedPath: string[], site: string, locale: string) {
  let page = await client.getPage(resolvedPath, { site, locale });
  if (
    !page &&
    resolvedPath.length === 3 &&
    resolvedPath[0] === "Shop" &&
    resolvedPath[1] === "Products"
  ) {
    const sku = resolvedPath[2];
    try {
      const query = `
        query ProductSearch($sku: String!, $language: String!) {
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
              rendered
            }
          }
        }
      `;
      const result = (await (client as any).graphQLClient.request(query, {
        sku,
        language: locale,
      })) as { search?: { results?: any[] } };
      const rendered = result?.search?.results?.[0]?.rendered;
      if (rendered?.sitecore) {
        page = {
          layout: rendered,
          locale,
          mode: "normal",
        } as any;
      }
    } catch (err) {
      console.error(
        "Failed to resolve product page via GraphQL fallback:",
        err,
      );
    }
  }
  return page;
}

type PageProps = {
  params: Promise<{
    site: string;
    locale: string;
    path?: string[];
    [key: string]: string | string[] | undefined;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { site, locale, path } = await params;
  const draft = await draftMode();
  const baseUrl = getBaseUrl();

  // Set site and locale to be available in src/i18n/request.ts for fetching the dictionary
  setRequestLocale(`${site}_${locale}`);

  // Fetch the page data from Sitecore
  let page;
  if (draft.isEnabled) {
    const editingParams = await searchParams;
    if (isDesignLibraryPreviewData(editingParams)) {
      page = await client.getDesignLibraryData(editingParams);
    } else {
      page = await client.getPreview(editingParams);
    }
  } else {
    const resolvedPath = resolveProductPath(path ?? []);
    page = await fetchPage(resolvedPath, site, locale);
  }

  // If the page is not found, return a 404
  if (!page) {
    notFound();
  }

  // Fetch the component data from Sitecore (Likely will be deprecated)
  const componentProps = await client.getComponentData(
    page.layout,
    {},
    components,
  );

  return (
    <NextIntlClientProvider>
      <Providers page={page} componentProps={componentProps}>
        <Layout page={page} baseUrl={baseUrl || undefined} />
      </Providers>
    </NextIntlClientProvider>
  );
}

// This function gets called at build and export time to determine
// pages for SSG ("paths", as tokenized array).
export const generateStaticParams = async () => {
  if (process.env.NODE_ENV !== "development" && scConfig.generateStaticPaths) {
    // Filter sites to only include the sites this starter is designed to serve.
    // This prevents cross-site build errors when multiple starters share the same XM Cloud instance.
    const defaultSite = scConfig.defaultSite;
    const allowedSites = defaultSite
      ? sites
          .filter((site: SiteInfo) => site.name === defaultSite)
          .map((site: SiteInfo) => site.name)
      : sites.map((site: SiteInfo) => site.name);

    return await client.getAppRouterStaticParams(
      allowedSites,
      routing.locales.slice(),
    );
  }
  return [];
};

// Metadata fields for the page.
export const generateMetadata = async ({ params }: PageProps) => {
  const baseUrl = getBaseUrl();

  const { path, site, locale } = await params;

  // Canonical URL: base URL + content path only (no site/locale segments)
  const pathSegment = path?.length ? `/${path.join("/")}` : "";
  const canonicalUrl = baseUrl ? `${baseUrl}${pathSegment}` : undefined;

  // The same call as for rendering the page. Should be cached by default react behavior
  const resolvedPath = resolveProductPath(path ?? []);
  const page = await fetchPage(resolvedPath, site, locale);
  const fields = page?.layout.sitecore.route?.fields as RouteFields;
  const itemId = page?.layout.sitecore.route?.itemId || "";
  const templateName = page?.layout.sitecore.route?.templateName || "";

  // Parse keywords from comma-separated string to array
  const keywordsString = fields?.metadataKeywords?.value?.toString() || "";
  const keywords = keywordsString
    ? keywordsString.split(",").map((k: string) => k.trim())
    : [];

  const title =
    fields?.ProductTitle?.value?.toString() ||
    fields?.metadataTitle?.value?.toString() ||
    fields?.pageTitle?.value?.toString() ||
    fields?.Title?.value?.toString() ||
    fields?.ogTitle?.value?.toString() ||
    "Page";

  const rawDescription =
    fields?.Content?.value?.toString() ||
    fields?.LongDescription?.value?.toString() ||
    fields?.metadataDescription?.value?.toString() ||
    fields?.ogDescription?.value?.toString() ||
    fields?.pageSummary?.value?.toString() ||
    "Sitecore Next.js Skate Park Example";
  console.log("Layout fields", fields);
  const description = stripHtml(rawDescription);

  return {
    title,
    description,
    keywords,
    other: {
      "sitecore-item-id": itemId,
      "sitecore-item-template": templateName,
    },
    ...(canonicalUrl && {
      alternates: {
        canonical: canonicalUrl,
      },
    }),
    openGraph: {
      title: fields?.ogTitle?.value?.toString() || title,
      description: fields?.ogDescription?.value?.toString() || description,
      url: canonicalUrl,
      type: "website",
      images:
        fields?.MainImage?.value ||
        fields?.ogImage?.value?.src ||
        fields?.thumbnailImage?.value?.src,
    },
  };
};
