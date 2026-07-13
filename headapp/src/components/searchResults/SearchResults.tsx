"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { getCookie, setCookie } from "@/lib/cookies";
import { fetchSearchResults } from "@/lib/sitecoreSearch";
import {
  filterItemsByFacets,
  getItemLabel,
  rankSearchItems,
  SearchFacet,
  SearchItem,
  highlightSearchTerm,
  stripHtml,
  stripHtmlExceptHighlight,
} from "@/lib/searchUtils";
import { useCart } from "@/lib/CartContext";

// Each unique keyword+facet combination triggers a fresh API call.
// There is no local cache or keepPreviousData — every search hits the network.
// Client-side ranking (rankSearchItems) is applied as a post-API scoring step.
const FETCH_DEBOUNCE_MS = 400;

function SearchResultsComponent({
  rfkId,
  keyword,
}: {
  rfkId: string;
  keyword?: string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [results, setResults] = useState<SearchItem[]>([]);
  const [facets, setFacets] = useState<SearchFacet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFacets, setSelectedFacets] = useState<
    Record<string, string[]>
  >({});

  const [products, setProducts] = useState<any[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.error("Error loading products for search results page:", err));
  }, []);

  const findProduct = (item: SearchItem) => {
    const match = item.url?.match(/products\/([A-Za-z0-9-]+)--/);
    const sku = match ? match[1] : "";
    if (sku) {
      const prod = products.find((p) => p.sku?.toLowerCase() === sku.toLowerCase());
      if (prod) return prod;
    }
    const cleanTitle = (item.title || item.name || "").toLowerCase().trim();
    return products.find(
      (p) =>
        p.title?.toLowerCase().trim() === cleanTitle ||
        p.name?.toLowerCase().trim() === cleanTitle
    );
  };

  const [uuid] = useState<string>(() => {
    const cookieValue = getCookie("bx_guest_ref");
    return cookieValue || `visitor-${Math.random().toString(36).slice(2, 11)}`;
  });

  // Debounce timer ref — cancelled on unmount or when deps change
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getClickCounts = (): Record<string, number> => {
    try {
      const cookie = getCookie("click_counts");
      return cookie ? JSON.parse(cookie) : {};
    } catch {
      return {};
    }
  };

  const saveClickCounts = (counts: Record<string, number>) => {
    setCookie("click_counts", JSON.stringify(counts), 7);
  };

  const publishEvent = async (event: unknown) => {
    const endpoint =
      "https://discover.sitecorecloud.io/event/128591118-1164436/v4/publish";
    const apiKey = "01-69b141fb-5eaec29094dc20b453087d784b7bf4283555fe18";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      const data = await res.json();
    } catch (err) {
      console.error("Error publishing event:", err);
    }
  };

  // 1️⃣ Load initial facets from URL query params once searchParams is available
  useEffect(() => {
    if (!searchParams) return;
    const urlFacets: Record<string, string[]> = {};
    let hasFacets = false;

    searchParams.forEach((value, key) => {
      if (key.startsWith("f_")) {
        hasFacets = true;
        const facetName = key.substring(2);
        if (!urlFacets[facetName]) {
          urlFacets[facetName] = [];
        }
        urlFacets[facetName].push(value);
      }
    });

    if (hasFacets) {
      setSelectedFacets(urlFacets);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Helper to update URL query params shallowly
  const updateUrlQuery = (
    keywordVal: string | undefined,
    facetsVal: Record<string, string[]>,
  ) => {
    const params = new URLSearchParams();
    if (keywordVal) {
      params.set("q", keywordVal);
    }

    Object.entries(facetsVal).forEach(([facetName, values]) => {
      values.forEach((value) => {
        params.append(`f_${facetName}`, value);
      });
    });

    const newSearch = params.toString();
    const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname;
    window.history.replaceState(
      { ...window.history.state, as: newUrl, url: newUrl },
      "",
      newUrl,
    );
  };

  // 2️⃣ Sync state to URL whenever selectedFacets or keyword changes
  useEffect(() => {
    updateUrlQuery(keyword, selectedFacets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, selectedFacets]);

  // 3️⃣ Non-cached fetch: every keyword + facet change triggers a fresh API call.
  // The keyphrase is passed to the Sitecore Discover API so results are
  // server-filtered/ranked. Client-side rankSearchItems is applied as an
  // additional scoring pass on the returned items.
  // keepPreviousData is NOT used — each unique keyword/facet set fetches fresh.
  useEffect(() => {
    // Clear any pending debounce from the previous render cycle
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        // Pass the keyword directly to the API — fresh network call every time.
        const data = await fetchSearchResults(
          rfkId,
          keyword || undefined,
          uuid,
        );
        const widget = data.widgets?.[0];
        const apiItems: SearchItem[] = widget?.content || [];
        const apiFacets: SearchFacet[] = widget?.facet || [];

        // Apply client-side facet filter + relevance ranking on API results
        const facetFiltered = filterItemsByFacets(apiItems, selectedFacets);
        const ranked = rankSearchItems(
          facetFiltered,
          keyword,
          getClickCounts(),
        );

        setResults(ranked);
        setFacets(apiFacets);
      } catch (err) {
        console.error("Error fetching search results:", err);
        setResults([]);
        setFacets([]);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }, FETCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
    // Each unique keyword + selectedFacets + rfkId triggers a fresh fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfkId, uuid, keyword, selectedFacets]);

  const toggleFacetValue = (facetName: string, facetValue: string) => {
    setSelectedFacets((prev) => {
      const current = prev[facetName] || [];
      const updated = current.includes(facetValue)
        ? current.filter((value) => value !== facetValue)
        : [...current, facetValue];

      return { ...prev, [facetName]: updated };
    });
  };

  const clearAllFilters = () => {
    setSelectedFacets({});
  };

  const handleResultClick = async (item: SearchItem) => {
    await publishEvent({
      name: "entity_page",
      action: "click",
      client_time_ms: Date.now(),
      user_id: uuid,
      value: {
        context: {
          locale: { country: "us", language: "en" },
          page: { uri: window.location.href },
        },
        entities: [
          {
            id: item.id,
            uri: item.url,
            entity_type: "content",
          },
        ],
      },
    });

    const counts = getClickCounts();
    counts[item.id] = (counts[item.id] || 0) + 1;
    saveClickCounts(counts);

    if (item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  };

  const hasActiveFilters = Object.values(selectedFacets).some(
    (vals) => vals.length > 0,
  );

  return (
    <div className="search-results-shell">
      <div className="search-results-toolbar">
        <h3 className="search-results-title" aria-live="polite" role="status">
          {loading
            ? "Searching…"
            : error
              ? "Search error"
              : results.length > 0
                ? `Showing ${results.length} result${results.length === 1 ? "" : "s"}`
                : keyword
                  ? "No results"
                  : ""}
        </h3>
        {hasActiveFilters && (
          <button className="search-clear-filters" onClick={clearAllFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="search-active-filters">
          {Object.entries(selectedFacets).map(([facetName, values]) =>
            values.map((val) => (
              <button
                key={`${facetName}-${val}`}
                className="search-active-filter"
                onClick={() => toggleFacetValue(facetName, val)}
              >
                {facetName}: {val} &times;
              </button>
            )),
          )}
        </div>
      )}

      <div className="search-results-layout">
        {/* Left Column: Facets panel */}
        <aside className="search-facets-panel" aria-label="Search filters">
          <div className="search-panel-header">
            <span className="search-panel-kicker">Filter Results</span>
            <h4 className="search-panel-title">Facets</h4>
          </div>
          <div className="search-facet-groups">
            {facets.map((facet) => (
              <div key={facet.name} className="search-facet-group">
                <h5 className="search-facet-group-title">{facet.name}</h5>
                <div className="search-facet-options">
                  {facet.value.map((value) => {
                    const isSelected =
                      selectedFacets[facet.name]?.includes(value.text) || false;

                    return (
                      <button
                        key={value.id || `${facet.name}-${value.text}`}
                        className={`search-facet-chip${isSelected ? " is-selected" : ""}`}
                        onClick={() => toggleFacetValue(facet.name, value.text)}
                        aria-pressed={isSelected}
                      >
                        {value.text} <strong>({value.count})</strong>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {!loading && facets.length === 0 && (
              <p className="search-facet-empty">No filters available.</p>
            )}
          </div>
        </aside>

        {/* Right Column: Results panel */}
        <div className="search-results-panel">
          {error ? (
            <div className="search-error-state">
              <span className="search-error-kicker">Oops!</span>
              <h4 className="search-error-title">Something went wrong</h4>
              <p className="search-error-copy">{error}</p>
            </div>
          ) : loading ? (
            <div className="search-results-grid">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="search-result-card search-result-card-skeleton"
                  aria-hidden="true"
                >
                  <div className="search-result-skeleton search-result-skeleton-image" />
                  <div className="search-result-skeleton search-result-skeleton-tag" />
                  <div className="search-result-skeleton search-result-skeleton-title" />
                  <div className="search-result-skeleton search-result-skeleton-copy" />
                  <div className="search-result-skeleton search-result-skeleton-copy short" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty-state">
              <span className="search-empty-kicker">No Match Found</span>
              <h4 className="search-empty-title">
                {"We couldn't find what you're looking for"}
              </h4>
              <p className="search-empty-copy">
                {
                  "Try checking your spelling, expanding your search term, or clearing some of your filters."
                }
              </p>
              {hasActiveFilters && (
                <button
                  className="search-clear-filters search-clear-filters--spaced"
                  onClick={clearAllFilters}
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="search-results-grid">
              {results.map((item) => {
                const label = getItemLabel(item);
                const description =
                  (item.description as string) || "No description.";
                const cleanDescription =
                  description !== "No description."
                    ? stripHtml(description)
                    : description;

                // Prefer native API highlight fragments if available;
                // otherwise fall back to client-side highlightSearchTerm().
                const nativeHighlights = item.highlight as
                  | Record<string, string>
                  | undefined;
                const highlightedTitle =
                  nativeHighlights?.title ||
                  nativeHighlights?.name ||
                  highlightSearchTerm(label, keyword);
                const highlightedDesc = nativeHighlights?.description
                  ? stripHtmlExceptHighlight(nativeHighlights.description)
                  : highlightSearchTerm(cleanDescription, keyword);

                const isProduct = item.type?.toLowerCase() === "product";
                const product = isProduct ? findProduct(item) : null;
                const priceFormatted = product ? `Rp ${product.price.toLocaleString("id-ID")}` : "";
                const discountPriceFormatted = product && product.discountPrice > 0 ? `Rp ${product.discountPrice.toLocaleString("id-ID")}` : "";
                const detailUrl = item.url ? item.url.replace(/^https?:\/\/[^\/]+/, "") : "#";

                return (
                  <article key={item.id} className="search-result-card">
                    {isProduct && product?.mainImage ? (
                      <img
                        src={product.mainImage}
                        alt=""
                        className="search-result-image animate-fade-in"
                      />
                    ) : item.image_url ? (
                      <img
                        src={item.image_url as string}
                        alt=""
                        className="search-result-image"
                      />
                    ) : (
                      <div className="search-result-image search-result-image-placeholder">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          aria-hidden="true"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="m21 15-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                    <div className="search-result-body">
                      <div className="search-result-tags">
                        {item.type && (
                          <span className="search-result-tag">
                            {item.type as string}
                          </span>
                        )}
                        {isProduct && product?.sku && (
                          <span className="search-result-tag search-result-tag--subtle">
                            SKU: {product.sku}
                          </span>
                        )}
                        {item.author && (
                          <span className="search-result-tag search-result-tag--subtle">
                            {item.author as string}
                          </span>
                        )}
                      </div>
                      <h4
                        className="search-result-title"
                        dangerouslySetInnerHTML={{ __html: highlightedTitle }}
                      />
                      <p
                        className="search-result-description"
                        dangerouslySetInnerHTML={{ __html: highlightedDesc }}
                      />
                      {isProduct && product && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-base font-bold text-gray-900">
                            {priceFormatted}
                          </span>
                          {product.discountPrice > 0 && (
                            <span className="text-sm line-through text-gray-400 font-normal">
                              {discountPriceFormatted}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="search-result-footer">
                        {isProduct && product ? (
                          <div className="flex gap-2 w-full mt-2">
                            <button
                              onClick={() => {
                                handleResultClick(item);
                                addToCart({
                                  id: product.id,
                                  sku: product.sku,
                                  title: product.title,
                                  price: product.price,
                                  discountPrice: product.discountPrice,
                                  image: product.mainImage,
                                });
                              }}
                              className="flex-1 bg-[#B88E2F] hover:bg-[#a37924] text-white text-xs font-semibold py-2 px-3 rounded text-center transition-colors cursor-pointer"
                            >
                              Add to Cart
                            </button>
                            <a
                              href={detailUrl}
                              className="flex-1 border border-[#B88E2F] text-[#B88E2F] hover:bg-[#B88E2F] hover:text-white text-xs font-semibold py-2 px-3 rounded text-center transition-colors flex items-center justify-center decoration-none"
                            >
                              Details
                            </a>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleResultClick(item)}
                            className="search-result-cta"
                            aria-label={`Read more about ${label}`}
                          >
                            Read More
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchResults(props: {
  rfkId: string;
  keyword?: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="search-results-layout">
          <aside className="search-sidebar">
            <div className="search-sidebar-title">Filters</div>
            <div
              className="search-skeleton-facet"
              style={{ height: "40px", marginBottom: "1rem" }}
            />
            <div className="search-skeleton-facet" style={{ height: "40px" }} />
          </aside>
          <main className="search-main-panel">
            <div className="search-results-header">
              <div
                className="search-skeleton-line"
                style={{ width: "150px", height: "24px" }}
              />
            </div>
            <div className="search-results-grid">
              <div className="search-skeleton-card" />
              <div className="search-skeleton-card" />
              <div className="search-skeleton-card" />
            </div>
          </main>
        </div>
      }
    >
      <SearchResultsComponent {...props} />
    </Suspense>
  );
}
