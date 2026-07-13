import { createSitemapRouteHandler } from '@sitecore-content-sdk/nextjs/route-handler';
import sites from '.sitecore/sites.json';
import client from 'lib/sitecore-client';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const { GET: originalGET } = createSitemapRouteHandler({
  client,
  sites,
});

export async function fetchProducts() {
  const query = `
    query AllProducts {
      search(
        where: {
          AND: [
            { name: "_templates", value: "{7D33D96A-F36D-4DF9-9091-88DD28A680D5}" }
            { name: "_language", value: "en" }
          ]
        }
        first: 100
      ) {
        results {
          sku: field(name: "SKU") { value }
          productTitle: field(name: "ProductTitle") { value }
        }
      }
    }
  `;

  try {
    const result = await (client as any).graphQLClient.request(query) as {
      search?: {
        results?: Array<{
          sku?: { value?: string };
          productTitle?: { value?: string };
        }>;
      };
    };
    const results = result?.search?.results || [];
    return results
      .map((item) => ({
        sku: item.sku?.value || '',
        title: item.productTitle?.value || '',
      }))
      .filter((item) => item.sku && item.title);
  } catch (err) {
    console.error('Failed to fetch products for sitemap:', err);
    return [];
  }
}

/**
 * API route for generating sitemap.xml
 *
 * This Next.js API route handler dynamically generates, intercepts, and serves the sitemap XML.
 * It replaces the internal Sitecore Cloud URLs with the current public hostname, and appends
 * dynamic product URLs.
 */
export async function GET(request: NextRequest) {
  const response = await originalGET(request);
  if (!response.ok) return response;

  const xmlText = await response.text();
  const actualHost = new URL(request.url).origin;
  
  // Find the first URL in <loc> to dynamically determine the wrong domain
  let sitecoreDomain = '';
  const locStart = xmlText.indexOf('<loc>');
  if (locStart !== -1) {
    const locEnd = xmlText.indexOf('</loc>', locStart);
    if (locEnd !== -1) {
      const firstUrl = xmlText.slice(locStart + 5, locEnd).trim();
      try {
        sitecoreDomain = new URL(firstUrl).origin;
      } catch (e) {
        console.error('Failed to parse URL from sitemap loc:', e);
      }
    }
  }

  // Replace the Sitecore internal domain dynamically if found
  const updatedXml = sitecoreDomain 
    ? xmlText.replaceAll(sitecoreDomain, actualHost)
    : xmlText;

  // Fetch dynamic products and append to sitemap
  const products = await fetchProducts();
  const lastmod = new Date().toISOString().split('T')[0];
  const productUrlsXml = products
    .map((p) => {
      const encodedTitle = encodeURIComponent(p.title);
      const url = `${actualHost}/shop/products/${p.sku}--${encodedTitle}`;
      return `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    })
    .join('\n');

  const finalXml = productUrlsXml
    ? updatedXml.replace('</urlset>', `${productUrlsXml}\n</urlset>`)
    : updatedXml;

  return new Response(finalXml, {
    status: response.status,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
