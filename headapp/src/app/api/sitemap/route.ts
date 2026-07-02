import { createSitemapRouteHandler } from '@sitecore-content-sdk/nextjs/route-handler';
import sites from '.sitecore/sites.json';
import client from 'lib/sitecore-client';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const { GET: originalGET } = createSitemapRouteHandler({
  client,
  sites,
});

/**
 * API route for generating sitemap.xml
 *
 * This Next.js API route handler dynamically generates, intercepts, and serves the sitemap XML.
 * It replaces the internal Sitecore Cloud URLs with the current public hostname.
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

  return new Response(updatedXml, {
    status: response.status,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
