"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import SearchResults from "@/components/searchResults/SearchResults";
import { fetchSearchResults } from "@/lib/sitecoreSearch";
import {
  buildSuggestionList,
  getItemLabel,
  SearchItem,
  highlightSearchTerm,
} from "@/lib/searchUtils";

export default function UnifiedSearch() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [blogs, setBlogs] = useState<SearchItem[]>([]);
  const [rawSuggestions, setRawSuggestions] = useState<SearchItem[]>([]);
  const [uuid, setUuid] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextSuggestionRef = useRef(false);

  // Set visitor UUID from cookies or fallback on mount
  useEffect(() => {
    const cookieValue = document.cookie.match(/bx_guest_ref=([^;]+)/)?.[1];
    setUuid(
      cookieValue || `visitor-${Math.random().toString(36).slice(2, 11)}`,
    );
  }, []);

  // Sync keyword from URL query param `q` on mount and router changes
  useEffect(() => {
    if (!router.isReady) return;
    if (typeof router.query.q === "string") {
      setKeyword(router.query.q);
      setSearchTerm(router.query.q);
    }
  }, [router.isReady, router.query.q]);

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

  // Load suggestions catalog once on mount / uuid change
  useEffect(() => {
    if (!uuid) return;
    const loadRawSuggestions = async () => {
      try {
        setLoadingSuggestions(true);
        const data = await fetchSearchResults("1003", undefined, uuid);
        const widget = data.widgets?.[0];
        const items: SearchItem[] = widget?.content || [];
        setRawSuggestions(items);
      } catch (err) {
        console.error("Error loading suggestion catalog:", err);
        setRawSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    loadRawSuggestions();
  }, [uuid]);

  // Client-side instant suggestion filtering (works with partial keywords >= 3 chars)
  useEffect(() => {
    if (skipNextSuggestionRef.current) {
      skipNextSuggestionRef.current = false;
      return;
    }

    if (keyword.trim().length < 3) {
      setBlogs([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = buildSuggestionList(rawSuggestions, keyword, 6);
    setBlogs(filtered);
    setShowSuggestions(filtered.length > 0);
    setFocusedIndex(-1);
  }, [keyword, rawSuggestions]);

  const handleSelect = (blog: SearchItem) => {
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
              <span className="search-input-icon">Blogs</span>
              <input
                type="text"
                placeholder="Search blogs..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="search-input"
                aria-label="Search blogs input"
                aria-autocomplete="list"
              />
              <button type="submit" className="search-submit">
                Search
              </button>
            </div>
          </form>

          {loadingSuggestions && keyword.trim().length >= 2 && (
            <div style={{ padding: "10px", color: "#657892" }}>
              Loading suggestions...
            </div>
          )}

          {showSuggestions && blogs.length > 0 && (
            <div
              className="search-suggestions"
              role="listbox"
              aria-label="Search suggestions"
            >
              <span className="search-suggestions-header">
                Recommended for you
              </span>
              {blogs.map((blog, idx) => {
                const title = getItemLabel(blog);
                const desc = (blog.description as string) || "";

                // Highlight queries in dropdown suggestions
                const highlightedTitle = highlightSearchTerm(title, keyword);
                const highlightedDesc = highlightSearchTerm(desc, keyword);

                return (
                  <button
                    key={blog.id}
                    type="button"
                    className="search-suggestion-card"
                    style={{
                      width: "100%",
                      border: "none",
                      background:
                        idx === focusedIndex ? "#f0f5ff" : "transparent",
                      textAlign: "left",
                      display: "block",
                      outline: "none",
                    }}
                    onClick={() => handleSelect(blog)}
                    role="option"
                    aria-selected={idx === focusedIndex}
                  >
                    <div className="search-suggestion-meta">
                      {blog.type && <span>{blog.type as string}</span>}
                      {blog.author && <span>by {blog.author as string}</span>}
                    </div>
                    <h5
                      className="search-suggestion-title"
                      dangerouslySetInnerHTML={{ __html: highlightedTitle }}
                    />
                    {desc && (
                      <p
                        className="search-suggestion-description"
                        dangerouslySetInnerHTML={{ __html: highlightedDesc }}
                      />
                    )}
                  </button>
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
