// lib/RecentlyViewedProvider.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { getEngage } from "@/lib/cdp/engage";

export interface RecentlyViewedPost {
  id: string;
  title: string;
  date?: string;
  imageSrc?: string;
  href?: string;
  viewedAt: number;
}

interface RecentlyViewedContextValue {
  recentlyViewed: RecentlyViewedPost[];
  trackPostClick: (post: Omit<RecentlyViewedPost, "viewedAt">) => Promise<void>;
  guestRef: string | null;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(
  null,
);

export function CDPProvider({ children }: { children: ReactNode }) {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedPost[]>(
    [],
  );
  const [guestRef, setGuestRef] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const trackPage = async () => {
      // Small delay to allow Next.js to update document.title
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (cancelled) return;

      try {
        const engage = await getEngage();
        const response = await engage.pageView(
          {
            channel: "WEB",
            currency: "USD",
            page: pathname,
          },
          {
            url: window.location.href,
            pageTitle: document.title,
            path: pathname,
            timestamp: Date.now(),
          },
        );

        if (cancelled) return;
        const ref = await engage?.getGuestId();
        if (!ref) return;
        setGuestRef(ref);

        const res = await fetch(
          `/api/recently-viewed?guestRef=${encodeURIComponent(ref)}`,
          {
            cache: "no-store",
          },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.items)) {
          setRecentlyViewed(data.items);
        }
      } catch (err) {
        console.warn(
          "Failed to process page view and load recently viewed from CDP:",
          err,
        );
      }
    };

    trackPage();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const trackPostClick = useCallback(
    async (post: Omit<RecentlyViewedPost, "viewedAt">) => {
      const engage = await getEngage();
      let ref = await engage.getGuestId();
      if (!ref) return;

      setRecentlyViewed((prev) => {
        const deduped = prev.filter((p) => p.id !== post.id);
        return [{ ...post, viewedAt: Date.now() }, ...deduped].slice(0, 5);
      });

      try {
        const res = await fetch("/api/recently-viewed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestRef: ref, post }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items)) setRecentlyViewed(data.items);
        }
      } catch (err) {
        console.warn("Failed to persist recently viewed to CDP:", err);
      }
    },
    [guestRef],
  );

  return (
    <RecentlyViewedContext.Provider
      value={{ recentlyViewed, trackPostClick, guestRef }}
    >
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewedCdp() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) {
    throw new Error(
      "useRecentlyViewedCdp must be used within a RecentlyViewedProvider",
    );
  }
  return ctx;
}
