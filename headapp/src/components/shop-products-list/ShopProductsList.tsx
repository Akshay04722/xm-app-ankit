"use client";

import React, { useEffect, useState, JSX } from "react";
import styles from "./ShopProductsList.module.css";
import { ComponentProps } from "@/lib/component-props";
import Link from "next/link";
import { usePathname } from "next/navigation";
import client from "@/lib/sitecore-client";
import { useCart } from "@/lib/CartContext";

interface ProductColor {
  name: string;
  hex: string;
}

interface Product {
  id: string;
  name: string;
  title: string;
  sku: string;
  shortDescription: string;
  price: number;
  discountPrice: number;
  isNew: boolean;
  mainImage: string;
  sizes: string[];
  colors: ProductColor[];
  category: string;
  tags: string[];
  galleryImages: string[];
}

interface ShopProductsListProps extends ComponentProps {
  fields: {
    items?: any[];
  };
}

const NoDataFallback = ({ componentName }: { componentName: string }) => (
  <div className="component-content text-center py-10 bg-slate-50 rounded-lg">
    <span className="text-gray-400 font-semibold">
      {componentName} (Empty Datasource)
    </span>
  </div>
);

interface ProductImageSliderProps {
  galleryImages: string[];
  title: string;
}

const ProductImageSlider: React.FC<ProductImageSliderProps> = ({
  galleryImages,
  title,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = React.useRef<any>(null);

  useEffect(() => {
    if (galleryImages.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [galleryImages]);

  if (galleryImages.length === 0) {
    return <div className={styles.noImage}>No Image</div>;
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Slider Track */}
      <div
        className="flex w-full h-full transition-transform duration-500 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {galleryImages.map((img, idx) => (
          <img
            key={img}
            src={img}
            alt={`${title} - image ${idx + 1}`}
            className={`${styles.productImg} w-full h-full object-cover shrink-0`}
          />
        ))}
      </div>

      {/* Slider Indicators */}
      {galleryImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-2 py-1 rounded-full backdrop-blur-xs">
          {galleryImages.map((_, idx) => (
            <span
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === idx ? "bg-white scale-110" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Default = (props: ShopProductsListProps): JSX.Element => {
  const { fields } = props;
  console.log("fields", fields);
  const pathname = usePathname();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Filter and Toolbar states
  const [sortBy, setSortBy] = useState("default");
  const [showCount, setShowCount] = useState(16);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true); // default open for premium look
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Compare products state
  const [compareProducts, setCompareProducts] = useState<Product[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const handleToggleCompare = (product: Product) => {
    setCompareProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        alert("You can compare up to 3 products at a time.");
        return prev;
      }
      return [...prev, product];
    });
  };

  const handleRemoveCompare = (productId: string) => {
    setCompareProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const clearCompare = () => {
    setCompareProducts([]);
  };

  // Filter criteria states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");

  // Facets
  const [categories, setCategories] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<ProductColor[]>([]);

  // Parse products from fields datasource when it mounts or fields change
  useEffect(() => {
    const results = fields?.items || [];

    const parsedProducts: Product[] = results.map((r: any) => {
      const f = r.fields || {};

      // Parse sizes — array of Size items; value lives at fields.Value.value
      const sizeNodes = f.AvailableSizes || [];
      const sizesList = sizeNodes.map(
        (node: any) =>
          node.fields?.Value?.value || node.displayName || node.name,
      );

      // Parse colors — array of Color items
      const colorNodes = f.AvailableColors || [];
      const colorsList = colorNodes.map((node: any) => ({
        name: node.fields?.Name?.value || node.displayName || node.name,
        hex: node.fields?.HexCode?.value || "#cccccc",
      }));

      // Parse category — array of Category items, take the first
      const categoryNodes = f.Category || [];
      const categoryName =
        categoryNodes[0]?.fields?.Name?.value ||
        categoryNodes[0]?.displayName ||
        "Uncategorized";

      // Parse tags — array of Tag items
      const tagNodes = f.Tags || [];
      const tagsList = tagNodes.map(
        (node: any) =>
          node.fields?.Name?.value || node.displayName || node.name,
      );

      // Parse gallery images
      const galleryRaw = f.GalleryImages?.value || "";
      const galleryImagesList: string[] = [];
      if (f.MainImage?.value) galleryImagesList.push(f.MainImage.value);
      if (galleryRaw) {
        galleryRaw.split(/[|,]/).forEach((url: string) => {
          const trimmed = url.trim();
          if (trimmed && !galleryImagesList.includes(trimmed)) {
            galleryImagesList.push(trimmed);
          }
        });
      }

      return {
        id: r.id,
        name: r.name,
        title: f.ProductTitle?.value || r.displayName || r.name,
        sku: f.SKU?.value || "",
        shortDescription: f.ShortDescription?.value || "",
        price: parseFloat(f.Price?.value ?? 0),
        discountPrice: parseFloat(f.DiscountPrice?.value ?? 0),
        isNew: f.IsNew?.value === true,
        mainImage: f.MainImage?.value || "",
        sizes: sizesList,
        colors: colorsList,
        category: categoryName,
        tags: tagsList,
        galleryImages: galleryImagesList,
      };
    });

    setProducts(parsedProducts);

    // Extract unique categories, sizes, and colors for filters
    const categorySet = new Set<string>();
    const sizeSet = new Set<string>();
    const colorMap = new Map<string, string>();

    parsedProducts.forEach((p) => {
      if (p.category) categorySet.add(p.category);
      p.sizes.forEach((s) => sizeSet.add(s));
      p.colors.forEach((c) => {
        if (c.name && !colorMap.has(c.name)) {
          colorMap.set(c.name, c.hex);
        }
      });
    });

    setCategories(Array.from(categorySet));
    setSizes(Array.from(sizeSet));
    setColors(
      Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex })),
    );
  }, [fields]);

  // Filter and sort effect
  useEffect(() => {
    let result = [...products];

    // Apply Search Query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.shortDescription.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query),
      );
    }

    // Apply Category Filter
    if (selectedCategory !== "all") {
      result = result.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    // Apply Size Filter
    if (selectedSize !== "all") {
      result = result.filter((p) =>
        p.sizes.some((s) => s.toLowerCase() === selectedSize.toLowerCase()),
      );
    }

    // Apply Color Filter
    if (selectedColor !== "all") {
      result = result.filter((p) =>
        p.colors.some(
          (c) => c.name.toLowerCase() === selectedColor.toLowerCase(),
        ),
      );
    }

    // Apply Price Range Filter
    if (selectedPriceRange !== "all") {
      if (selectedPriceRange === "under-1m") {
        result = result.filter((p) => p.price < 1000000);
      } else if (selectedPriceRange === "1m-3m") {
        result = result.filter((p) => p.price >= 1000000 && p.price <= 3000000);
      } else if (selectedPriceRange === "above-3m") {
        result = result.filter((p) => p.price > 3000000);
      }
    }

    // Apply Sorting
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredProducts(result);
    setCurrentPage(1); // reset to first page on filter change
  }, [
    products,
    searchQuery,
    sortBy,
    selectedCategory,
    selectedSize,
    selectedColor,
    selectedPriceRange,
  ]);

  if (!fields?.items) {
    return <NoDataFallback componentName="ShopProductsList" />;
  }

  // Helper to calculate facet item counts dynamically
  const getCategoryCount = (catName: string) => {
    return products.filter((p) => p.category === catName).length;
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedSize("all");
    setSelectedColor("all");
    setSelectedPriceRange("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "all" ||
    selectedSize !== "all" ||
    selectedColor !== "all" ||
    selectedPriceRange !== "all";

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / showCount) || 1;
  const startIndex = (currentPage - 1) * showCount;
  const endIndex = Math.min(startIndex + showCount, totalItems);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Price formatter (converts raw number to Indonesian Rupiah representation)
  const formatPrice = (priceVal: number) => {
    if (!priceVal) return "₹0";
    return `₹${priceVal.toLocaleString("en-IN")}`;
  };

  return (
    <div className={styles.shopContainer}>
      {/* Toolbar Filter / Search */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button
            className={styles.filterBtn}
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
          >
            {/* Filter Slider Icon */}
            <svg
              width="25"
              height="25"
              viewBox="0 0 25 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.125 6.25H11.4583"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.125 12.5H15.625"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.125 18.75H9.375"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="14.5833"
                cy="6.25"
                r="2.08333"
                stroke="black"
                strokeWidth="2"
              />
              <circle
                cx="18.75"
                cy="12.5"
                r="2.08333"
                stroke="black"
                strokeWidth="2"
              />
              <circle
                cx="12.5"
                cy="18.75"
                r="2.08333"
                stroke="black"
                strokeWidth="2"
              />
            </svg>
            <span>Filter</span>
          </button>

          {/* Grid View Toggle */}
          <button
            className={`${styles.viewIcon} ${viewMode === "grid" ? styles.viewIconActive : ""}`}
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="3"
                y="3"
                width="9"
                height="9"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="16"
                y="3"
                width="9"
                height="9"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="3"
                y="16"
                width="9"
                height="9"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="16"
                y="16"
                width="9"
                height="9"
                rx="1"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* List View Toggle */}
          <button
            className={`${styles.viewIcon} ${viewMode === "list" ? styles.viewIconActive : ""}`}
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>

          <div className={styles.separator} />

          <span className={styles.resultsText}>
            Showing {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of{" "}
            {totalItems} results
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.controlGroup}>
            <label htmlFor="show-count">Show</label>
            <input
              id="show-count"
              type="number"
              className={styles.showInput}
              value={showCount}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val > 0) setShowCount(val);
              }}
              min="1"
            />
          </div>

          <div className={styles.controlGroup}>
            <label htmlFor="sort-by">Short by</label>
            <select
              id="sort-by"
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Default</option>
              <option value="name">Name</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expanded Premium Facet Filter Panel */}
      {showFilters && (
        <div className={styles.filterPanel}>
          {/* Search bar */}
          <div className={styles.searchContainer}>
            <svg
              className={styles.searchIcon}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search products by title, description or SKU..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Facets Grid */}
          <div className={styles.filterGrid}>
            {/* Category Filter */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterTitle}>Category</h4>
              <div className={styles.categoryList}>
                <button
                  className={`${styles.categoryItem} ${selectedCategory === "all" ? styles.categoryItemActive : ""}`}
                  onClick={() => setSelectedCategory("all")}
                >
                  <span>All Categories</span>
                  <span className={styles.countBadge}>{products.length}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`${styles.categoryItem} ${selectedCategory.toLowerCase() === cat.toLowerCase() ? styles.categoryItemActive : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <span>{cat}</span>
                    <span className={styles.countBadge}>
                      {getCategoryCount(cat)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterTitle}>Sizes</h4>
              <div className={styles.sizeGrid}>
                <button
                  className={`${styles.sizeOption} ${selectedSize === "all" ? styles.sizeOptionActive : ""}`}
                  onClick={() => setSelectedSize("all")}
                >
                  All
                </button>
                {sizes.map((sz) => (
                  <button
                    key={sz}
                    className={`${styles.sizeOption} ${selectedSize.toLowerCase() === sz.toLowerCase() ? styles.sizeOptionActive : ""}`}
                    onClick={() => setSelectedSize(sz)}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Filter */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterTitle}>Colors</h4>
              <div className={styles.colorGrid}>
                <button
                  className={`${styles.colorOption} ${selectedColor === "all" ? styles.colorOptionActive : ""}`}
                  style={{ backgroundColor: "#f3f4f6" }}
                  onClick={() => setSelectedColor("all")}
                  title="All Colors"
                >
                  {selectedColor === "all" && (
                    <span
                      style={{
                        color: "#333",
                        fontSize: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      All
                    </span>
                  )}
                </button>
                {colors.map((col) => {
                  const isActive =
                    selectedColor.toLowerCase() === col.name.toLowerCase();
                  return (
                    <button
                      key={col.name}
                      className={`${styles.colorOption} ${isActive ? styles.colorOptionActive : ""}`}
                      style={{ backgroundColor: col.hex }}
                      onClick={() => setSelectedColor(col.name)}
                      title={col.name}
                    >
                      {isActive && (
                        <span
                          className={styles.colorCheckmark}
                          style={{
                            color:
                              col.hex.toLowerCase() === "#ffffff"
                                ? "#000"
                                : "#fff",
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Filter */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterTitle}>Price</h4>
              <div className={styles.priceList}>
                <button
                  className={`${styles.priceItem} ${selectedPriceRange === "all" ? styles.priceItemActive : ""}`}
                  onClick={() => setSelectedPriceRange("all")}
                >
                  All Prices
                </button>
                <button
                  className={`${styles.priceItem} ${selectedPriceRange === "under-1m" ? styles.priceItemActive : ""}`}
                  onClick={() => setSelectedPriceRange("under-1m")}
                >
                  Under ₹1,00,000
                </button>
                <button
                  className={`${styles.priceItem} ${selectedPriceRange === "1m-3m" ? styles.priceItemActive : ""}`}
                  onClick={() => setSelectedPriceRange("1m-3m")}
                >
                  ₹1,00,000 - ₹3,00,000
                </button>
                <button
                  className={`${styles.priceItem} ${selectedPriceRange === "above-3m" ? styles.priceItemActive : ""}`}
                  onClick={() => setSelectedPriceRange("above-3m")}
                >
                  Above ₹3,00,000
                </button>
              </div>
            </div>
          </div>

          {/* Active Tags / Reset */}
          {hasActiveFilters && (
            <div className={styles.activeTagsBar}>
              <div className={styles.tagsContainer}>
                {searchQuery !== "" && (
                  <div className={styles.activeTag}>
                    <span>Search: "{searchQuery}"</span>
                    <button
                      className={styles.removeTagBtn}
                      onClick={() => setSearchQuery("")}
                    >
                      ×
                    </button>
                  </div>
                )}
                {selectedCategory !== "all" && (
                  <div className={styles.activeTag}>
                    <span>Category: {selectedCategory}</span>
                    <button
                      className={styles.removeTagBtn}
                      onClick={() => setSelectedCategory("all")}
                    >
                      ×
                    </button>
                  </div>
                )}
                {selectedSize !== "all" && (
                  <div className={styles.activeTag}>
                    <span>Size: {selectedSize}</span>
                    <button
                      className={styles.removeTagBtn}
                      onClick={() => setSelectedSize("all")}
                    >
                      ×
                    </button>
                  </div>
                )}
                {selectedColor !== "all" && (
                  <div className={styles.activeTag}>
                    <span>Color: {selectedColor}</span>
                    <button
                      className={styles.removeTagBtn}
                      onClick={() => setSelectedColor("all")}
                    >
                      ×
                    </button>
                  </div>
                )}
                {selectedPriceRange !== "all" && (
                  <div className={styles.activeTag}>
                    <span>
                      Price:{" "}
                      {selectedPriceRange === "under-1m"
                        ? "Under ₹1L"
                        : selectedPriceRange === "1m-3m"
                          ? "₹1L - ₹3L"
                          : "Above ₹3L"}
                    </span>
                    <button
                      className={styles.removeTagBtn}
                      onClick={() => setSelectedPriceRange("all")}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <button className={styles.clearAllBtn} onClick={clearAllFilters}>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>No products found</h3>
          <p className={styles.emptyText}>
            Try adjusting your search criteria or resetting filters.
          </p>
        </div>
      )}

      {/* Products Grid / List */}
      {totalItems > 0 && (
        <div
          className={
            viewMode === "grid"
              ? styles.productsGrid
              : "flex flex-col max-w-[1240px] mx-auto gap-6 px-5"
          }
        >
          {currentProducts.map((product) => {
            const hasDiscount = product.discountPrice > product.price;
            const discountPercent = hasDiscount
              ? Math.round(
                  ((product.discountPrice - product.price) /
                    product.discountPrice) *
                    100,
                )
              : 0;

            if (viewMode === "list") {
              return (
                <article
                  key={product.id}
                  className="flex gap-6 bg-[#f4f5f7] p-4 rounded shadow-sm hover:shadow-md transition-shadow relative group"
                >
                  <div className="w-[180px] h-[180px] bg-gray-200 overflow-hidden relative shrink-0">
                    <ProductImageSlider
                      galleryImages={product.galleryImages}
                      title={product.title}
                    />
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 bg-[#e97171] text-white text-xs px-2 py-1 rounded font-semibold">
                        -{discountPercent}%
                      </span>
                    )}
                    {product.isNew && !hasDiscount && (
                      <span className="absolute top-2 left-2 bg-[#2ec1ac] text-white text-xs px-2 py-1 rounded font-semibold">
                        New
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col justify-between py-2 flex-grow">
                    <div>
                      <h4 className="text-xl font-bold text-[#3a3a3a]">
                        {product.title}
                      </h4>
                      <p className="text-sm text-[#898989] mt-1">
                        {product.shortDescription}
                      </p>
                      <div className="flex gap-2 items-center mt-3">
                        <span className="text-lg font-bold text-[#3a3a3a]">
                          {formatPrice(product.price)}
                        </span>
                        {hasDiscount && (
                          <span className="text-sm line-through text-[#b0b0b0]">
                            {formatPrice(product.discountPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 items-center">
                      <button className="h-10 px-6 bg-[#b88e2f] text-white font-semibold rounded hover:bg-[#a37924] transition-colors">
                        Add to cart
                      </button>
                      <Link
                        href={`${pathname}/${product.name}`}
                        className="h-10 px-6 border border-[#b88e2f] text-[#b88e2f] font-semibold rounded hover:bg-[#b88e2f] hover:text-white transition-colors flex items-center justify-center text-sm"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => handleToggleCompare(product)}
                        className={`h-10 px-6 font-semibold rounded transition-colors ${
                          compareProducts.some((p) => p.id === product.id)
                            ? "bg-[#b88e2f] text-white"
                            : "border border-gray-300 text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {compareProducts.some((p) => p.id === product.id)
                          ? "In Compare"
                          : "Compare"}
                      </button>
                      <span className="text-xs text-gray-500">
                        SKU: {product.sku}
                      </span>
                    </div>
                  </div>
                </article>
              );
            }

            return (
              <div key={product.id} className={styles.card}>
                {/* Image and Badges Container */}
                <div className={styles.imageContainer}>
                  <ProductImageSlider
                    galleryImages={product.galleryImages}
                    title={product.title}
                  />

                  {/* Badges */}
                  <div className={styles.badgeContainer}>
                    {hasDiscount && (
                      <div className={styles.discountBadge}>
                        -{discountPercent}%
                      </div>
                    )}
                    {product.isNew && !hasDiscount && (
                      <div className={styles.newBadge}>New</div>
                    )}
                  </div>
                </div>

                {/* Info Box */}
                <div className={styles.infoBox}>
                  <h3 className={styles.productTitle}>{product.title}</h3>
                  <p className={styles.productDesc}>
                    {product.shortDescription}
                  </p>
                  <div className={styles.priceContainer}>
                    <span className={styles.price}>
                      {formatPrice(product.price)}
                    </span>
                    {hasDiscount && (
                      <span className={styles.oldPrice}>
                        {formatPrice(product.discountPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className={styles.overlay}>
                  <Link
                    href={`${pathname}/products/${product.sku}--${product.title}`}
                    className={styles.viewDetailsBtn}
                  >
                    View Details
                  </Link>

                  <div className={styles.actionsContainer}>
                    <button className={styles.actionBtn}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
                      </svg>
                      <span>Share</span>
                    </button>
                    <button
                      className={styles.actionBtn}
                      style={
                        compareProducts.some((p) => p.id === product.id)
                          ? { color: "#b88e2f" }
                          : undefined
                      }
                      onClick={() => handleToggleCompare(product)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M16 3h5v5M8 21H3v-5M12 12V3M12 12h9M12 12v9M12 12H3" />
                      </svg>
                      <span>
                        {compareProducts.some((p) => p.id === product.id)
                          ? "In Compare"
                          : "Compare"}
                      </span>
                    </button>
                    <button className={styles.actionBtn}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span>Like</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                className={`${styles.pageBtn} ${isActive ? styles.activePageBtn : ""}`}
                onClick={() => {
                  setCurrentPage(pageNum);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                {pageNum}
              </button>
            );
          })}

          {currentPage < totalPages && (
            <button
              className={`${styles.pageBtn} ${styles.nextBtn}`}
              onClick={() => {
                setCurrentPage(currentPage + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Next
            </button>
          )}
        </div>
      )}

      {/* Comparison Drawer */}
      {compareProducts.length > 0 && (
        <div className={styles.compareDrawer}>
          <div className={styles.compareDrawerLeft}>
            <span className={styles.compareDrawerTitle}>
              Compare Products ({compareProducts.length}/3)
            </span>
            <div className={styles.comparePreviews}>
              {compareProducts.map((p) => (
                <div key={p.id} className={styles.comparePreviewCard}>
                  {p.mainImage && (
                    <img
                      src={p.mainImage}
                      alt={p.title}
                      className={styles.comparePreviewImage}
                    />
                  )}
                  <span className={styles.comparePreviewName}>{p.title}</span>
                  <button
                    className={styles.removePreviewBtn}
                    onClick={() => handleRemoveCompare(p.id)}
                    aria-label={`Remove ${p.title} from comparison`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.compareDrawerRight}>
            <button
              className={styles.compareNowBtn}
              onClick={() => setShowCompareModal(true)}
            >
              Compare Now
            </button>
            <button
              className={styles.compareDrawerClearBtn}
              onClick={clearCompare}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Comparison Modal Overlay */}
      {showCompareModal && (
        <div className={styles.compareModalOverlay}>
          <div className={styles.compareModal}>
            <div className={styles.compareModalHeader}>
              <h3 className={styles.compareModalTitle}>Product Comparison</h3>
              <button
                className={styles.closeModalBtn}
                onClick={() => setShowCompareModal(false)}
                aria-label="Close comparison modal"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.compareModalContent}>
              {(() => {
                const rowClass = `${styles.compareRow} ${
                  compareProducts.length === 3
                    ? styles.compareRow4Cols
                    : compareProducts.length === 2
                      ? styles.compareRow3Cols
                      : styles.compareRow2Cols
                }`;
                return (
                  <div className={styles.compareGrid}>
                    {/* 1. Header Row (Images, titles, remove btn) */}
                    <div className={rowClass}>
                      <div className={styles.compareCellHeader}>Product</div>
                      {compareProducts.map((p) => (
                        <div key={p.id} className={styles.compareCell}>
                          <div className={styles.compareProductHeaderCard}>
                            <button
                              className={styles.removeProductCompareBtn}
                              onClick={() => handleRemoveCompare(p.id)}
                              aria-label="Remove product"
                            >
                              ×
                            </button>
                            {p.mainImage ? (
                              <img
                                src={p.mainImage}
                                alt={p.title}
                                className={styles.compareCardImg}
                              />
                            ) : (
                              <div className="w-[120px] h-[120px] bg-gray-200 rounded flex items-center justify-center text-gray-400">
                                No Image
                              </div>
                            )}
                            <h4 className={styles.compareCardTitle}>
                              {p.title}
                            </h4>
                            <span className={styles.compareCardPrice}>
                              {formatPrice(p.price)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 2. SKU Row */}
                    <div className={rowClass}>
                      <div className={styles.compareCellHeader}>SKU</div>
                      {compareProducts.map((p) => (
                        <div key={p.id} className={styles.compareCell}>
                          {p.sku || "-"}
                        </div>
                      ))}
                    </div>

                    {/* 3. Category Row */}
                    <div className={rowClass}>
                      <div className={styles.compareCellHeader}>Category</div>
                      {compareProducts.map((p) => (
                        <div key={p.id} className={styles.compareCell}>
                          {p.category || "-"}
                        </div>
                      ))}
                    </div>

                    {/* 4. Description Row */}
                    <div className={rowClass}>
                      <div className={styles.compareCellHeader}>
                        Description
                      </div>
                      {compareProducts.map((p) => (
                        <div key={p.id} className={styles.compareCell}>
                          {p.shortDescription || "-"}
                        </div>
                      ))}
                    </div>

                    {/* 5. Sizes Row */}
                    <div className={rowClass}>
                      <div className={styles.compareCellHeader}>
                        Available Sizes
                      </div>
                      {compareProducts.map((p) => (
                        <div key={p.id} className={styles.compareCell}>
                          {p.sizes.length > 0 ? (
                            <ul className={styles.compareListValue}>
                              {p.sizes.map((s) => (
                                <li key={s} className={styles.compareTagValue}>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            "-"
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 6. Colors Row */}
                    <div className={rowClass}>
                      <div className={styles.compareCellHeader}>
                        Available Colors
                      </div>
                      {compareProducts.map((p) => (
                        <div key={p.id} className={styles.compareCell}>
                          {p.colors.length > 0 ? (
                            <ul className={styles.compareListValue}>
                              {p.colors.map((c) => (
                                <li
                                  key={c.name}
                                  className={styles.compareSwatchValue}
                                  style={{ backgroundColor: c.hex }}
                                  title={c.name}
                                />
                              ))}
                            </ul>
                          ) : (
                            "-"
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
