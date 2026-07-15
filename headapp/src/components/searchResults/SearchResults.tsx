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

  const getProductImage = (item: SearchItem, prod: any) => {
    return (
      (item.image_url as string) ||
      (item.imageUrl as string) ||
      (item.image as string) ||
      prod?.mainImage ||
      ""
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

  const [activeTab, setActiveTab] = useState<"products" | "blogs">("products");

  const productCount = results.filter((item) => item.type?.toLowerCase() === "product").length;
  const blogCount = results.filter((item) => item.type?.toLowerCase() !== "product").length;

  const filteredResults = results.filter((item) => {
    const isProd = item.type?.toLowerCase() === "product";
    return activeTab === "products" ? isProd : !isProd;
  });

  useEffect(() => {
    const pCount = results.filter((item) => item.type?.toLowerCase() === "product").length;
    const bCount = results.filter((item) => item.type?.toLowerCase() !== "product").length;
    if (pCount === 0 && bCount > 0) {
      setActiveTab("blogs");
    } else {
      setActiveTab("products");
    }
  }, [results]);

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
            {facets
              .filter((f) => f.name?.toLowerCase() !== "type")
              .map((facet) => (
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
            {!loading && facets.filter((f) => f.name?.toLowerCase() !== "type").length === 0 && (
              <p className="search-facet-empty">No filters available.</p>
            )}
          </div>
        </aside>

        {/* Right Column: Results panel */}
        <div className="search-results-panel">
          {/* Tabs */}
          {results.length > 0 && (
            <div className="flex gap-2 mb-6 bg-[#f9f1e7]/40 p-1.5 rounded-xl border border-[#B88E2F]/20 w-fit font-poppins">
              <button
                onClick={() => setActiveTab("products")}
                className={`px-5 py-2.5 text-sm font-bold transition-all duration-200 rounded-lg uppercase tracking-wider cursor-pointer ${
                  activeTab === "products"
                    ? "bg-[#B88E2F] text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Products ({productCount})
              </button>
              <button
                onClick={() => setActiveTab("blogs")}
                className={`px-5 py-2.5 text-sm font-bold transition-all duration-200 rounded-lg uppercase tracking-wider cursor-pointer ${
                  activeTab === "blogs"
                    ? "bg-[#B88E2F] text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Blogs & Pages ({blogCount})
              </button>
            </div>
          )}

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
          ) : filteredResults.length === 0 ? (
            <div className="search-empty-state">
              <span className="search-empty-kicker">No Match Found</span>
              <h4 className="search-empty-title">
                {activeTab === "products" ? "No products found in this category" : "No articles found in this category"}
              </h4>
              <p className="search-empty-copy">
                Try switching tabs to view other results.
              </p>
            </div>
          ) : (
            <div className="search-results-grid">
              {filteredResults.map((item) => {
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
                const priceFormatted = product ? `₹${product.price.toLocaleString("en-IN")}` : "";
                const discountPriceFormatted = product && product.discountPrice > 0 ? `₹${product.discountPrice.toLocaleString("en-IN")}` : "";
                const detailUrl = item.url ? item.url.replace(/^https?:\/\/[^\/]+/, "") : "#";
                const productImage = getProductImage(item, product);
                const discountPercent = product && product.discountPrice > 0 ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

                return (
                  <article key={item.id} className="search-result-card group flex flex-col justify-between h-full bg-white rounded-xl border border-gray-150 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
                    <div className="relative overflow-hidden aspect-video bg-gray-50 flex items-center justify-center">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt=""
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg
                            className="h-10 w-10 opacity-40"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="m21 15-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Badges overlay */}
                      {isProduct && discountPercent > 0 && (
                        <div className="absolute top-3 right-3 w-10 h-10 bg-[#E97171] text-white rounded-full flex items-center justify-center font-bold text-xs shadow-xs z-10 font-poppins">
                          -{discountPercent}%
                        </div>
                      )}
                      {isProduct && product?.isNew && discountPercent === 0 && (
                        <div className="absolute top-3 right-3 w-10 h-10 bg-[#2EC1AC] text-white rounded-full flex items-center justify-center font-bold text-xs shadow-xs z-10 font-poppins">
                          New
                        </div>
                      )}
                    </div>

                    <div className="search-result-body flex flex-col flex-grow p-4 gap-3">
                      <div className="flex items-center flex-wrap gap-1.5">
                        {item.type && (
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${isProduct ? "bg-[#f9f1e7] text-[#B88E2F] border border-[#B88E2F]/20" : "bg-gray-100 text-gray-600"}`}>
                            {item.type as string}
                          </span>
                        )}
                        {isProduct && (product?.sku || (item.sku as string)) && (
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                            SKU: {product?.sku || (item.sku as string)}
                          </span>
                        )}
                        {item.author && !isProduct && (
                          <span className="text-[11px] text-gray-400">
                            by {item.author as string}
                          </span>
                        )}
                      </div>

                      <h4
                        className="text-lg font-bold text-gray-900 group-hover:text-[#B88E2F] transition-colors duration-150 line-clamp-2 leading-snug"
                        dangerouslySetInnerHTML={{ __html: highlightedTitle }}
                      />
                      <p
                        className="text-sm text-gray-600 line-clamp-3 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: highlightedDesc }}
                      />

                      {isProduct && (product || item.price) && (
                        <div className="mt-auto pt-3 border-t border-gray-100 flex items-baseline justify-between">
                          <div className="flex flex-col">
                            <span className="text-[#B88E2F] text-xl font-extrabold">
                              {priceFormatted || (item.price ? `₹${parseFloat(item.price as string).toLocaleString("en-IN")}` : "Price N/A")}
                            </span>
                            {product && product.discountPrice > 0 && (
                              <span className="text-sm text-gray-400 line-through">
                                ₹{product.discountPrice.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="search-result-footer mt-2">
                        {isProduct && (product || item.sku || item.id) ? (
                          <div className="w-full">
                            <a
                              href={detailUrl}
                              className="w-full border border-[#B88E2F] text-[#B88E2F] hover:bg-[#B88E2F] hover:text-white text-sm font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-center decoration-none cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
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
