"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SearchResults from "@/components/searchResults/SearchResults";
import { fetchSearchResults } from "@/lib/sitecoreSearch";
import {
  rankSearchItems,
  getItemLabel,
  SearchItem,
  highlightSearchTerm,
  stripHtml,
} from "@/lib/searchUtils";
import { useCart } from "@/lib/CartContext";

function UnifiedSearchComponent() {
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState("");
  const [blogs, setBlogs] = useState<SearchItem[]>([]);
  const [uuid, setUuid] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

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
      .catch((err) => console.error("Error loading products for unified search:", err));
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

  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextSuggestionRef = useRef(false);

  // Set visitor UUID from cookies or fallback on mount
  useEffect(() => {
    const cookieValue = document.cookie.match(/bx_guest_ref=([^;]+)/)?.[1];
    setUuid(
      cookieValue || `visitor-${Math.random().toString(36).slice(2, 11)}`,
    );
  }, []);

  // Sync keyword from URL query param `q` on mount and search params changes
  useEffect(() => {
    if (!searchParams) return;
    const q = searchParams.get("q");
    if (q) {
      setKeyword(q);
      setSearchTerm(q);
    }
  }, [searchParams]);

  // Click outside suggestions dropdown handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamic debounced search suggestions directly from the Sitecore Search API
  useEffect(() => {
    if (skipNextSuggestionRef.current) {
      skipNextSuggestionRef.current = false;
      return;
    }

    if (!uuid) return;

    if (keyword.trim().length < 3) {
      setBlogs([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        // Call the API with the typed keyword to fetch suggestions directly from Sitecore Search index
        const data = await fetchSearchResults("1003", keyword, uuid);
        const widget = data.widgets?.[0];
        const items: SearchItem[] = widget?.content || [];
        const ranked = rankSearchItems(items, keyword);
        setBlogs(ranked.slice(0, 6));
        setShowSuggestions(ranked.length > 0);
        setFocusedIndex(-1);
      } catch (err) {
        console.error("Error loading suggestions:", err);
        setBlogs([]);
        setShowSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, uuid]);

  const handleSelect = (blog: SearchItem) => {
    if (blog.url) {
      window.location.href = blog.url;
      setShowSuggestions(false);
      return;
    }
    const label = getItemLabel(blog);
    skipNextSuggestionRef.current = true;
    setKeyword(label);
    setSearchTerm(label);
    setBlogs([]);
    setShowSuggestions(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    skipNextSuggestionRef.current = true;
    setSearchTerm(keyword.trim());
    setBlogs([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || blogs.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1 < blogs.length ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (e.key === "Enter") {
      if (focusedIndex >= 0 && focusedIndex < blogs.length) {
        e.preventDefault();
        handleSelect(blogs[focusedIndex]);
      }
    }
  };

  return (
    <div className="search-experience" ref={containerRef}>
      <div className="search-shell">
        <div className="search-hero">
          <span className="search-eyebrow">Discover</span>
          <h2 className="search-heading">Explore Our Insights</h2>
          <p className="search-subheading">
            Search our comprehensive list of articles, tutorials, and blogs.
            Enjoy automatic typo tolerance, synonym recommendations, and instant
            filtering.
          </p>
        </div>

        <div className="search-input-panel">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-input-wrap">
              {/* Search icon */}
              <span className="search-input-icon" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="20"
                  height="20"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search blogs, articles, tutorials…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="search-input"
                aria-label="Search blogs input"
                aria-autocomplete="list"
                role="combobox"
                aria-expanded={showSuggestions && blogs.length > 0}
                aria-controls={
                  showSuggestions && blogs.length > 0
                    ? "suggestions-listbox"
                    : undefined
                }
                aria-activedescendant={
                  focusedIndex >= 0
                    ? `suggestion-item-${focusedIndex}`
                    : undefined
                }
              />
              <button type="submit" className="search-submit">
                Search
              </button>
            </div>
          </form>

          {loadingSuggestions && keyword.trim().length >= 2 && (
            <div className="search-suggestions-loading" aria-live="polite">
              <span className="search-suggestions-loading-dot" />
              <span className="search-suggestions-loading-dot" />
              <span className="search-suggestions-loading-dot" />
            </div>
          )}

          {showSuggestions && blogs.length > 0 && (
            <div
              id="suggestions-listbox"
              className="search-suggestions"
              role="listbox"
              aria-label="Search suggestions"
            >
              <span
                className="search-suggestions-header"
                role="presentation"
              >
                Recommended for you
              </span>
              {blogs.map((blog, idx) => {
                const title = getItemLabel(blog);
                const desc = (blog.description as string) || "";
                const cleanDesc = stripHtml(desc);

                // Highlight query terms in dropdown suggestions
                const highlightedTitle = highlightSearchTerm(title, keyword);
                const highlightedDesc = highlightSearchTerm(cleanDesc, keyword);

                const isProduct = blog.type?.toLowerCase() === "product";
                const product = isProduct ? findProduct(blog) : null;
                const priceFormatted = product ? `Rp ${product.price.toLocaleString("id-ID")}` : "";

                return (
                  <a
                    key={blog.id}
                    id={`suggestion-item-${idx}`}
                    href={blog.url || "#"}
                    className={`search-suggestion-card${idx === focusedIndex ? " is-focused" : ""} ${isProduct ? "flex items-center gap-4" : ""}`}
                    onClick={(e) => {
                      if (blog.url) {
                        setShowSuggestions(false);
                      } else {
                        e.preventDefault();
                        handleSelect(blog);
                      }
                    }}
                    role="option"
                    aria-selected={idx === focusedIndex}
                  >
                    {isProduct && product?.mainImage && (
                      <img
                        src={product.mainImage}
                        alt=""
                        className="w-12 h-12 object-cover rounded flex-shrink-0 bg-gray-50 border border-gray-100"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="search-suggestion-meta">
                        {blog.type && <span>{blog.type as string}</span>}
                        {blog.author && <span>by {blog.author as string}</span>}
                        {isProduct && product?.sku && <span className="text-[#B88E2F]">SKU: {product.sku}</span>}
                      </div>
                      <h5
                        className="search-suggestion-title truncate"
                        dangerouslySetInnerHTML={{ __html: highlightedTitle }}
                      />
                      {isProduct && product ? (
                        <div className="text-xs font-semibold text-gray-900 mt-1">
                          {priceFormatted}
                          {product.discountPrice > 0 && (
                            <span className="text-gray-400 line-through ml-2 font-normal">
                              Rp {product.discountPrice.toLocaleString("id-ID")}
                            </span>
                          )}
                        </div>
                      ) : (
                        cleanDesc && (
                          <p
                            className="search-suggestion-description"
                            dangerouslySetInnerHTML={{ __html: highlightedDesc }}
                          />
                        )
                      )}
                    </div>
                    {isProduct && product && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart({
                            id: product.id,
                            sku: product.sku,
                            title: product.title,
                            price: product.price,
                            discountPrice: product.discountPrice,
                            image: product.mainImage,
                          });
                          setShowSuggestions(false);
                        }}
                        className="flex-shrink-0 bg-[#B88E2F] hover:bg-[#a37924] text-white text-xs font-semibold px-2.5 py-1.5 rounded transition-colors"
                      >
                        Add to Cart
                      </button>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {searchTerm && <SearchResults rfkId="1001" keyword={searchTerm} />}
    </div>
  );
}

export default function UnifiedSearch() {
  return (
    <Suspense fallback={<div className="search-suggestions-loading" />}>
      <UnifiedSearchComponent />
    </Suspense>
  );
}
