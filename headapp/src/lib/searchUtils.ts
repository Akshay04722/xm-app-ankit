export interface SearchItem {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  author?: string;
  type?: string;
  url?: string;
  image_url?: string;
  [key: string]: unknown;
}

export interface SearchFacetValue {
  id?: string;
  text: string;
  count: number;
}

export interface SearchFacet {
  name: string;
  value: SearchFacetValue[];
}

const searchableFields = ["title", "name", "description", "author", "type"] as const;

export function normalizeSearchTerm(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

export function getItemLabel(item: SearchItem): string {
  return item.title || item.name || "Untitled";
}

function tokenize(value: string): string[] {
  return value.split(/\s+/).filter(Boolean);
}

const synonyms: Record<string, string[]> = {
  "nextjs": ["next.js"],
  "next.js": ["nextjs"],
  "sxa": ["sitecore experience accelerator", "accelerator"],
  "xm": ["experience manager", "xm cloud", "cloud"],
  "xmc": ["xm cloud", "cloud"],
  "headless": ["decoupled", "jamstack"],
  "cms": ["content management system"]
};

function getLevenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  let prevRow = Array(s2.length + 1).fill(0).map((_, i) => i);
  const currRow = Array(s2.length + 1).fill(0);

  for (let i = 0; i < s1.length; i++) {
    currRow[0] = i + 1;
    for (let j = 0; j < s2.length; j++) {
      const cost = s1[i] === s2[j] ? 0 : 1;
      currRow[j + 1] = Math.min(
        currRow[j] + 1,
        prevRow[j + 1] + 1,
        prevRow[j] + cost
      );
    }
    prevRow = [...currRow];
  }
  return currRow[s2.length];
}

function isTypoMatch(word: string, token: string): boolean {
  if (token.length <= 3) return false;
  const maxDistance = token.length <= 5 ? 1 : 2;
  return getLevenshteinDistance(word, token) <= maxDistance;
}

function getStringField(item: SearchItem, field: (typeof searchableFields)[number]): string {
  const value = item[field];
  return typeof value === "string" ? value.toLowerCase() : "";
}

function scoreField(
  value: string,
  query: string,
  tokens: string[],
  weights: {
    exact: number;
    startsWith: number;
    contains: number;
    allTokens: number;
  }
): number {
  if (!value) {
    return 0;
  }

  // Exact match gets highest boost
  if (value === query) {
    return weights.exact;
  }

  // Starts with full query
  if (value.startsWith(query)) {
    return weights.startsWith;
  }

  // Contains full query as a phrase
  if (value.includes(query)) {
    return weights.contains;
  }

  const valueWords = value.split(/\s+/).map((w) => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")).filter(Boolean);
  let matchedCount = 0;
  let typoCount = 0;

  for (const token of tokens) {
    const equivalents = [token, ...(synonyms[token] || [])];
    let isMatched = false;
    let isTypo = false;

    for (const eq of equivalents) {
      if (value.includes(eq)) {
        isMatched = true;
        break;
      }
      const eqWords = eq.split(/\s+/).filter(Boolean);
      for (const eqWord of eqWords) {
        if (valueWords.some((word) => isTypoMatch(word, eqWord))) {
          isTypo = true;
          break;
        }
      }
      if (isTypo) break;
    }

    if (isMatched) {
      matchedCount++;
    } else if (isTypo) {
      typoCount++;
    }
  }

  const totalMatched = matchedCount + typoCount;
  if (totalMatched > 0) {
    const ratio = totalMatched / tokens.length;
    const baseScore = matchedCount === tokens.length
      ? weights.allTokens
      : weights.contains * ratio * 0.8;

    // Apply a penalty of 30% reduction per typo match
    const typoPenalty = Math.pow(0.7, typoCount);
    return Math.round(baseScore * typoPenalty);
  }

  return 0;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function highlightSearchTerm(text: string, query?: string): string {
  if (!text) return "";
  const escapedText = escapeHtml(text);
  if (!query) return escapedText;

  const normalizedQuery = normalizeSearchTerm(query);
  if (!normalizedQuery) return escapedText;

  const tokens = tokenize(normalizedQuery);
  if (tokens.length === 0) return escapedText;

  const allTerms = new Set<string>();
  tokens.forEach((t) => {
    const escapedT = escapeHtml(t);
    allTerms.add(escapedT);
    if (synonyms[t]) {
      synonyms[t].forEach((syn) => {
        const escapedSyn = escapeHtml(syn);
        allTerms.add(escapedSyn);
        escapedSyn.split(/\s+/).forEach((part) => allTerms.add(part));
      });
    }
  });

  const sortedTerms = Array.from(allTerms)
    .filter((t) => t.length > 1)
    .sort((a, b) => b.length - a.length);

  if (sortedTerms.length === 0) return escapedText;

  const escapedTerms = sortedTerms.map((t) => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
  const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");

  return escapedText.replace(regex, "<mark class=\"search-highlight\">$1</mark>");
}

export function filterItemsByFacets(
  items: SearchItem[],
  selectedFacets: Record<string, string[]>
): SearchItem[] {
  const activeFacets = Object.entries(selectedFacets).filter(([, values]) => values.length > 0);

  if (activeFacets.length === 0) {
    return items;
  }

  return items.filter((item) =>
    activeFacets.every(([facetName, values]) => {
      const rawValue = item[facetName];

      if (Array.isArray(rawValue)) {
        return rawValue.some((value) => values.includes(String(value)));
      }

      return values.includes(String(rawValue ?? ""));
    })
  );
}

export function rankSearchItems(
  items: SearchItem[],
  keyword?: string,
  clickCounts: Record<string, number> = {}
): SearchItem[] {
  const query = normalizeSearchTerm(keyword);

  if (!query) {
    return [...items].sort((a, b) => {
      const clickDelta = (clickCounts[b.id] || 0) - (clickCounts[a.id] || 0);
      if (clickDelta !== 0) {
        return clickDelta;
      }

      return getItemLabel(a).localeCompare(getItemLabel(b));
    });
  }

  const tokens = tokenize(query);

  return [...items]
    .map((item) => {
      const title = getStringField(item, "title") || getStringField(item, "name");
      const description = getStringField(item, "description");
      const author = getStringField(item, "author");
      const type = getStringField(item, "type");

      const relevanceScore =
        scoreField(title, query, tokens, { exact: 400, startsWith: 260, allTokens: 220, contains: 180 }) +
        scoreField(author, query, tokens, { exact: 180, startsWith: 120, allTokens: 90, contains: 60 }) +
        scoreField(type, query, tokens, { exact: 120, startsWith: 90, allTokens: 70, contains: 45 }) +
        scoreField(description, query, tokens, { exact: 80, startsWith: 40, allTokens: 30, contains: 20 }) +
        (clickCounts[item.id] || 0) * 25;

      return { item, relevanceScore };
    })
    .filter(({ relevanceScore }) => relevanceScore > 0)
    .sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }

      return getItemLabel(a.item).localeCompare(getItemLabel(b.item));
    })
    .map(({ item }) => item);
}

export function buildSuggestionList(items: SearchItem[], keyword?: string, limit = 6): SearchItem[] {
  return rankSearchItems(items, keyword).slice(0, limit);
}
