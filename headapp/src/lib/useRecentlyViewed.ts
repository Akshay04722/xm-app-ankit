'use client';

import { useCallback, useEffect, useState } from 'react';

export interface RecentlyViewedPost {
  id: string;
  title: string;
  date?: string;
  imageSrc?: string;
  href?: string;
  viewedAt: number;
}

/**
 * Fetches/persists "recently viewed" purely from Sitecore CDP guest data —
 * no localStorage. Dedupe + cap-to-5 happens server-side (see /api/recently-viewed
 * and src/lib/cdpGuestApi.ts), since that's where the CDP credentials live.
 */
export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/recently-viewed', { method: 'GET' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setItems(data?.items ?? []);
      })
      .catch((err) => {
        console.warn('Failed to load recently viewed from CDP:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const trackPostClick = useCallback((post: Omit<RecentlyViewedPost, 'viewedAt'>) => {
    fetch('/api/recently-viewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.items) setItems(data.items);
      })
      .catch((err) => {
        // Never let tracking failures break the click
        console.warn('Failed to record view in CDP:', err);
      });
  }, []);

  return { recentlyViewed: items, loading, trackPostClick };
}