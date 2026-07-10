// SERVER-ONLY. Never import this from a client component.
// Uses Sitecore CDP Guest REST API (v2.1) Basic Auth: username = Client Key, password = API Token.
// Docs: https://api-docs.sitecore.com/cdp/guest-rest-api

const CDP_BASE_URL = process.env.SITECORE_CDP_BASE_URL; // e.g. https://api-engage-eu.sitecorecloud.io
const CDP_CLIENT_KEY = process.env.SITECORE_CDP_CLIENT_KEY;
const CDP_API_TOKEN = process.env.SITECORE_CDP_API_TOKEN;
const EXTENSION_NAME = 'ext'; // reuse the primary extension slot unless another source already owns it
const RECENTLY_VIEWED_KEY = 'recentlyViewed'; // must be alphanumeric/camelCase per CDP key rules
const MAX_ITEMS = 5;

export interface RecentlyViewedPost {
  id: string;
  title: string;
  date?: string;
  imageSrc?: string;
  href?: string;
  viewedAt: number;
}

function authHeader() {
  if (!CDP_CLIENT_KEY || !CDP_API_TOKEN) {
    throw new Error('CDP credentials missing: set SITECORE_CDP_CLIENT_KEY and SITECORE_CDP_API_TOKEN');
  }
  const token = Buffer.from(`${CDP_CLIENT_KEY}:${CDP_API_TOKEN}`).toString('base64');
  return `Basic ${token}`;
}

function assertBaseUrl() {
  if (!CDP_BASE_URL) {
    throw new Error('CDP base URL missing: set SITECORE_CDP_BASE_URL (e.g. https://api-engage-eu.sitecorecloud.io)');
  }
}

/**
 * Reads the guest's recently-viewed list from their CDP extension data.
 * Returns [] if the guest, extension, or key doesn't exist yet (CDP 404s on missing resources).
 */
export async function getRecentlyViewed(guestRef: string): Promise<RecentlyViewedPost[]> {
  assertBaseUrl();
  const res = await fetch(`${CDP_BASE_URL}/v2.1/guests/${guestRef}/extensions/${EXTENSION_NAME}`, {
    method: 'GET',
    headers: { Authorization: authHeader(), Accept: 'application/json' },
    cache: 'no-store',
  });


  if (res.status === 404) return [];
  if (!res.ok) {
    console.warn('CDP getRecentlyViewed failed:', res.status, await res.text());
    return [];
  }

  const data = await res.json();
  const raw = data?.[RECENTLY_VIEWED_KEY];
  if (!raw || typeof raw !== 'string') return [];

  try {
    const parsed = JSON.parse(raw) as RecentlyViewedPost[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Adds a post to the guest's recently-viewed list (dedupe by id, cap at MAX_ITEMS, most recent first),
 * then persists it back to CDP as a JSON string extension field.
 */
export async function addRecentlyViewed(
  guestRef: string,
  post: Omit<RecentlyViewedPost, 'viewedAt'>
): Promise<RecentlyViewedPost[]> {
  assertBaseUrl();

  const existing = await getRecentlyViewed(guestRef);
  const entry: RecentlyViewedPost = { ...post, viewedAt: Date.now() };
  const deduped = existing.filter((p) => p.id !== entry.id);
  const next = [entry, ...deduped].slice(0, MAX_ITEMS);
  const res = await fetchWithRetry(`${CDP_BASE_URL}/v2.1/guests/${guestRef}/extensions/${EXTENSION_NAME}`, {
    method: 'PATCH',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: EXTENSION_NAME,
      [RECENTLY_VIEWED_KEY]: JSON.stringify(next),
    }),
  });
  if (!res.ok) {
    // If the extension doesn't exist yet for this guest, CDP may require POST instead of PATCH on first write
    if (res.status === 404) {
      const createRes = await fetchWithRetry(`${CDP_BASE_URL}/v2.1/guests/${guestRef}/extensions`, {
        method: 'POST',
        headers: {
          Authorization: authHeader(),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: EXTENSION_NAME,
          [RECENTLY_VIEWED_KEY]: JSON.stringify(next),
        }),
      });
      if (!createRes.ok) {
        if (createRes.status === 409) {
          // If it was created concurrently, retry the PATCH request once more
          const retryPatchRes = await fetch(`${CDP_BASE_URL}/v2.1/guests/${guestRef}/extensions/${EXTENSION_NAME}`, {
            method: 'PATCH',
            headers: {
              Authorization: authHeader(),
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              name: EXTENSION_NAME,
              [RECENTLY_VIEWED_KEY]: JSON.stringify(next),
            }),
          });
          if (!retryPatchRes.ok) {
            console.warn('CDP retry PATCH after 409 failed:', retryPatchRes.status, await retryPatchRes.text());
          }
        } else {
          console.warn('CDP create extension failed:', createRes.status, await createRes.text());
        }
      }
    } else {
      console.warn('CDP addRecentlyViewed PATCH failed:', res.status, await res.text());
    }
  }

  return next;
}
async function fetchWithRetry(url: string, options: RequestInit, retries = 2, delayMs = 800): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 404 && retries > 0) {
    await new Promise((r) => setTimeout(r, delayMs));
    return fetchWithRetry(url, options, retries - 1, delayMs);
  }
  return res;
}