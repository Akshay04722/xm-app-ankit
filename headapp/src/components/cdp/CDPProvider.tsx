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

  // Tab title blinking when user goes to another site/tab
  useEffect(() => {
    let originalTitle = document.title;
    let titleInterval: NodeJS.Timeout | null = null;
    let isOriginal = true;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Save the current title (in case it changed due to routing)
        originalTitle = document.title;
        
        // Start blinking
        const promoText = "🛍️ Deals You'll Love, Prices You'll Appreciate.";
        
        if (titleInterval) clearInterval(titleInterval);
        
        titleInterval = setInterval(() => {
          document.title = isOriginal ? promoText : originalTitle;
          isOriginal = !isOriginal;
        }, 1500); // toggle every 1.5 seconds
      } else {
        // Clear blinking and restore original
        if (titleInterval) {
          clearInterval(titleInterval);
          titleInterval = null;
        }
        document.title = originalTitle;
        isOriginal = true;
      }
    };

    // Update original title when document title changes in visible state
    const mutationObserver = new MutationObserver(() => {
      if (!document.hidden) {
        originalTitle = document.title;
      }
    });

    mutationObserver.observe(document.querySelector("title") || document, {
      subtree: true,
      childList: true,
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      mutationObserver.disconnect();
      if (titleInterval) clearInterval(titleInterval);
    };
  }, []);

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
