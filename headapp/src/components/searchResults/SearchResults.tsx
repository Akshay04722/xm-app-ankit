"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getCookie, setCookie } from "@/lib/cookies";
import { fetchSearchResults } from "@/lib/sitecoreSearch";
import {
  filterItemsByFacets,
  getItemLabel,
  rankSearchItems,
  SearchFacet,
  SearchItem,
  highlightSearchTerm,
} from "@/lib/searchUtils";

export default function SearchResults({
  rfkId,
  keyword,
}: {
  rfkId: string;
  keyword?: string;
}) {
  const router = useRouter();
  const [results, setResults] = useState<SearchItem[]>([]);
  const [rawResults, setRawResults] = useState<SearchItem[]>([]);
  const [facets, setFacets] = useState<SearchFacet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFacets, setSelectedFacets] = useState<
    Record<string, string[]>
  >({});

  const [uuid] = useState<string>(() => {
    const cookieValue = getCookie("bx_guest_ref");
    return cookieValue || `visitor-${Math.random().toString(36).slice(2, 11)}`;
  });

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
      console.log("Event published:", data);
    } catch (err) {
      console.error("Error publishing event:", err);
    }
  };

  // 1️⃣ Load initial facets from URL query params once on mount
  useEffect(() => {
    if (!router.isReady) return;
    const query = router.query;
    const urlFacets: Record<string, string[]> = {};
    let hasFacets = false;

    Object.keys(query).forEach((key) => {
      if (key.startsWith("f_")) {
        hasFacets = true;
        const facetName = key.substring(2);
        const val = query[key];
        if (Array.isArray(val)) {
          urlFacets[facetName] = val;
        } else if (typeof val === "string") {
          urlFacets[facetName] = [val];
        }
      }
    });

    if (hasFacets) {
      setSelectedFacets(urlFacets);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // Helper to update router query params shallowly
  const updateUrlQuery = (
    keywordVal: string | undefined,
    facetsVal: Record<string, string[]>,
  ) => {
    if (!router.isReady) return;

    const newQuery: Record<string, string | string[]> = {};
    if (keywordVal) {
      newQuery.q = keywordVal;
    }

    Object.entries(facetsVal).forEach(([facetName, values]) => {
      if (values.length > 0) {
        newQuery[`f_${facetName}`] = values;
      }
    });

    router.replace(
      {
        pathname: router.pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true },
    );
  };

  // 2️⃣ Sync state to URL whenever selectedFacets or keyword changes
  useEffect(() => {
    if (!router.isReady) return;
    updateUrlQuery(keyword, selectedFacets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, selectedFacets, router.isReady]);

  // 3️⃣ Fetch from API only when rfkId or uuid changes (Caching raw results to support partial matches client-side)
  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        // Query the API with undefined keyword to retrieve full content catalog,
        // allowing prefix/substring client-side searches (e.g., 'abou' matching 'about')
        const data = await fetchSearchResults(rfkId, undefined, uuid);
        const widget = data.widgets?.[0];
        const rawItems: SearchItem[] = widget?.content || [];
        setRawResults(rawItems);
        setFacets(widget?.facet || []);
      } catch (err) {
        console.error("Error fetching search results:", err);
        setRawResults([]);
        setFacets([]);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [rfkId, uuid]);

  // 4️⃣ Client-side filtering & ranking (Fires instantly on facet/rawResults changes)
  useEffect(() => {
    const facetFilteredResults = filterItemsByFacets(
      rawResults,
      selectedFacets,
    );
    const rankedResults = rankSearchItems(
      facetFilteredResults,
      keyword,
      getClickCounts(),
    );
    setResults(rankedResults);
  }, [rawResults, selectedFacets, keyword]);

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

  return (
    <div className="search-results-shell">
      <div className="search-results-toolbar">
        <h3 className="search-results-title" aria-live="polite" role="status">
          {loading
            ? "Searching..."
            : results.length > 0
              ? `Showing ${results.length} results`
              : "No results"}
        </h3>
        {Object.values(selectedFacets).some((vals) => vals.length > 0) && (
          <button className="search-clear-filters" onClick={clearAllFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {Object.values(selectedFacets).some((vals) => vals.length > 0) && (
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
                        className={`search-facet-chip ${isSelected ? "is-selected" : ""}`}
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
            {facets.length === 0 && (
              <p className="search-facet-empty">No filters available.</p>
            )}
          </div>
        </aside>

        {/* Right Column: Results panel */}
        <div className="search-results-panel">
          {loading ? (
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
              {Object.values(selectedFacets).some(
                (vals) => vals.length > 0,
              ) && (
                <button
                  className="search-clear-filters"
                  style={{ marginTop: "1.5rem" }}
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
                const description = item.description || "No description.";

                const highlightedTitle = highlightSearchTerm(label, keyword);
                const highlightedDesc = highlightSearchTerm(
                  description as string,
                  keyword,
                );

                return (
                  <article key={item.id} className="search-result-card">
                    {item.image_url ? (
                      <img
                        src={item.image_url as string}
                        alt=""
                        className="search-result-image"
                      />
                    ) : (
                      <div className="search-result-image search-result-image-placeholder">
                        Content
                      </div>
                    )}
                    <div className="search-result-body">
                      <div className="search-result-tags">
                        {item.type && (
                          <span className="search-result-tag">
                            {item.type as string}
                          </span>
                        )}
                        {item.author && (
                          <span className="search-result-tag subtle">
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
                      <div className="search-result-footer">
                        <button
                          onClick={() => handleResultClick(item)}
                          className="search-result-cta"
                          aria-label={`Read more about ${label}`}
                        >
                          Read More
                        </button>
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
