"use client";

import React, { useState, useEffect, JSX } from "react";
import styles from "./ProductDetails.module.css";
import { ComponentProps } from "@/lib/component-props";
import { useSitecore } from "@sitecore-content-sdk/nextjs";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { useRecentlyViewedCdp } from "@/components/cdp/CDPProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ProductDetailsProps extends ComponentProps {
  fields: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Helper: format price
// ---------------------------------------------------------------------------
function formatPrice(raw: string | undefined): string {
  if (!raw) return "₹0";
  const num = parseFloat(raw);
  if (isNaN(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN")}`;
}

// ---------------------------------------------------------------------------
// Helper: strip HTML tags for plain text display
// ---------------------------------------------------------------------------
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------
const NoDataFallback = ({ componentName }: { componentName: string }) => (
  <div className="component-content text-center py-10 bg-slate-50 rounded-lg">
    <span className="text-gray-400 font-semibold">
      {componentName} (Empty Datasource)
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const Default = (props: ProductDetailsProps): JSX.Element => {
  const { page } = useSitecore();
  const route = page?.layout?.sitecore?.route;
  const routeFields = route?.fields as Record<string, any> | undefined;
  const { addToCart } = useCart();
  const { trackPostClick } = useRecentlyViewedCdp();

  const sku = routeFields?.SKU?.value || "";

  useEffect(() => {
    if (sku && routeFields) {
      const titleVal = routeFields.ProductTitle?.value || route?.name || "";
      const imageVal = routeFields.MainImage?.value || "";
      
      trackPostClick({
        id: sku,
        title: titleVal,
        imageSrc: imageVal,
        href: window.location.pathname,
      }).catch((err) => console.warn("Failed to track product view in CDP:", err));
    }
  }, [sku, routeFields, trackPostClick, route?.name]);

  // ---------- State ----------
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "description" | "additional" | "reviews"
  >("description");
  const [activeThumb, setActiveThumb] = useState(0);
  const [stockCount, setStockCount] = useState<number | null>(null);

  const { user, userProfile } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
  
  // Form state
  const [formRating, setFormRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [formComment, setFormComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEditingExisting, setIsEditingExisting] = useState<boolean>(false);

  useEffect(() => {
    if (sku) {
      setLoadingReviews(true);
      fetch(`/api/reviews?productId=${encodeURIComponent(sku.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.reviews)) {
            setReviews(data.reviews);
          }
        })
        .catch((err) => {
          console.error("Error fetching reviews:", err);
        })
        .finally(() => {
          setLoadingReviews(false);
        });
    }
  }, [sku]);

  useEffect(() => {
    if (sku) {
      fetch(`/api/products?sku=${encodeURIComponent(sku)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && typeof data.stockCount === "number") {
            setStockCount(data.stockCount);
          }
        })
        .catch((err) => console.error("Error fetching stock:", err));
    }
  }, [sku]);

  // ---------- Helpers for Reviews ----------
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getRatingCount = (stars: number) => {
    return reviews.filter((r) => r.rating === stars).length;
  };
  
  const getRatingPercentage = (stars: number) => {
    if (reviews.length === 0) return 0;
    return Math.round((getRatingCount(stars) / reviews.length) * 100);
  };

  const averageRating = reviews.length > 0 
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 4.5; // default fallback if there are no reviews yet

  const renderStars = (rating: number) => {
    const stars = [];
    const floor = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.4 && rating % 1 <= 0.8;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= floor) {
        stars.push(<span key={i} className={styles.starFilled}>★</span>);
      } else if (i === floor + 1 && hasHalf) {
        stars.push(<span key={i} className={styles.starFilled} style={{ opacity: 0.6 }}>★</span>);
      } else {
        stars.push(<span key={i} className={styles.starEmpty}>★</span>);
      }
    }
    return stars;
  };

  const existingUserReview = reviews.find((r) => r.userId === user?.uid);

  const handleEditClick = () => {
    if (existingUserReview) {
      setFormRating(existingUserReview.rating);
      setFormComment(existingUserReview.comment);
      setIsEditingExisting(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingExisting(false);
    setFormRating(5);
    setFormComment("");
    setSubmitError(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formComment.trim()) {
      setSubmitError("Please write a comment.");
      return;
    }
    
    setSubmittingReview(true);
    setSubmitError(null);
    
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: sku.trim(),
          rating: formRating,
          comment: formComment.trim(),
        }),
      });
      
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to submit review.");
      }
      
      setReviews((prev) => {
        const index = prev.findIndex((r) => r.id === data.review.id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = data.review;
          updated.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          return updated;
        }
        return [data.review, ...prev];
      });

      setIsEditingExisting(false);
      setFormComment("");
      setFormRating(5);
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setSubmitError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // ---------- Guard ----------
  if (!routeFields) {
    return <NoDataFallback componentName="ProductDetails" />;
  }

  // ---------- Extract fields from route (context item) ----------
  const title = routeFields.ProductTitle?.value || route?.name || "";

  const shortDesc = stripHtml(routeFields.ShortDescription?.value || "");
  const longDesc = stripHtml(routeFields.LongDescription?.value || "");
  const additionalInfo = stripHtml(
    routeFields.AdditionalInformation?.value || "",
  );
  const price = routeFields.Price?.value?.toString() || "0";
  const discountPrice = routeFields.DiscountPrice?.value?.toString();
  const mainImage = routeFields.MainImage?.value || "";
  const galleryRaw = routeFields.GalleryImages?.value || "";

  // Build gallery array: main image + gallery pipe/comma-separated URLs
  const galleryImages: string[] = [];
  if (mainImage) galleryImages.push(mainImage);
  if (galleryRaw) {
    galleryRaw.split(/[|,]/).forEach((url: string) => {
      const trimmed = url.trim();
      if (trimmed && !galleryImages.includes(trimmed))
        galleryImages.push(trimmed);
    });
  }

  // Sizes — from multilist value (resolved items)
  const sizes: string[] = [];
  const sizeField = routeFields.AvailableSizes;
  if (Array.isArray(sizeField)) {
    sizeField.forEach((s: any) =>
      sizes.push(s.fields?.Title?.value || s.displayName || s.name),
    );
  } else if (typeof sizeField?.value === "string" && sizeField.value) {
    sizeField.value.split("|").forEach((s: string) => {
      if (s.trim()) sizes.push(s.trim());
    });
  }

  // Colors — from multilist value (resolved items)
  const colors: { name: string; hex: string }[] = [];
  const colorField = routeFields.AvailableColors;
  if (Array.isArray(colorField)) {
    colorField.forEach((c: any) =>
      colors.push({
        name: c.displayName || c.name,
        hex: c.fields?.HexCode?.value || "#816DFA",
      }),
    );
  } else if (typeof colorField?.value === "string" && colorField.value) {
    colorField.value.split("|").forEach((c: string) => {
      if (c.trim()) colors.push({ name: c.trim(), hex: "#816DFA" });
    });
  }

  // Category
  const categories: string[] = [];
  const catField = routeFields.Category;
  if (Array.isArray(catField)) {
    catField.forEach((c: any) => categories.push(c.displayName || c.name));
  } else if (typeof catField?.value === "string" && catField.value) {
    catField.value.split("|").forEach((c: string) => {
      if (c.trim()) categories.push(c.trim());
    });
  }

  // Tags
  const tags: string[] = [];
  const tagField = routeFields.Tags;
  if (Array.isArray(tagField)) {
    tagField.forEach((t: any) => tags.push(t.displayName || t.name));
  } else if (typeof tagField?.value === "string" && tagField.value) {
    tagField.value.split("|").forEach((t: string) => {
      if (t.trim()) tags.push(t.trim());
    });
  }

  // Decide price display
  const hasDiscount =
    discountPrice && parseInt(discountPrice, 10) > parseInt(price, 10);
  console.log(galleryImages);
  return (
    <div className={styles.container}>
      {/* =================== TOP SECTION =================== */}
      <div className={styles.topSection}>
        {/* --- Gallery --- */}
        <div className={styles.gallery}>
          {/* Thumbnail strip */}
          <div className={styles.thumbnailStrip}>
            {galleryImages.map((img, i) => (
              <button
                key={i}
                className={`${styles.thumbnail} ${activeThumb === i ? styles.thumbnailActive : ""}`}
                onClick={() => setActiveThumb(i)}
              >
                <img src={img} alt={`${title} thumbnail ${i + 1}`} />
              </button>
            ))}
          </div>

          {/* Main image */}
          <div className={styles.mainImageWrap}>
            {galleryImages[activeThumb] ? (
              <img src={galleryImages[activeThumb]} alt={title} />
            ) : (
              <span style={{ color: "#9f9f9f" }}>No Image</span>
            )}
          </div>
        </div>

        {/* --- Info column --- */}
        <div className={styles.info}>
          <h1 className={styles.productTitle}>{title}</h1>
          <p className={styles.price}>
            {formatPrice(price)}
            {hasDiscount && (
              <span
                style={{
                  textDecoration: "line-through",
                  marginLeft: 12,
                  fontSize: 16,
                  color: "#b0b0b0",
                }}
              >
                {formatPrice(discountPrice)}
              </span>
            )}
          </p>

          {/* Rating row */}
          <div className={styles.ratingRow}>
            <div className={styles.stars}>
              {renderStars(reviews.length > 0 ? averageRating : 0)}
            </div>
            <div className={styles.ratingDivider} />
            <span className={styles.reviewCount}>
              {reviews.length} Customer {reviews.length === 1 ? "Review" : "Reviews"}
            </span>
          </div>

          {/* Short description */}
          <p className={styles.shortDescription}>{shortDesc || longDesc}</p>

          {/* Size selector */}
          {sizes.length > 0 && (
            <>
              <div className={styles.selectorLabel}>Size</div>
              <div className={styles.sizeOptions}>
                {sizes.map((s) => (
                  <button
                    key={s}
                    className={`${styles.sizePill} ${selectedSize === s ? styles.sizePillActive : ""}`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Color selector */}
          {colors.length > 0 && (
            <>
              <div className={styles.selectorLabel}>Color</div>
              <div className={styles.colorOptions}>
                {colors.map((c) => (
                  <button
                    key={c.name}
                    className={`${styles.colorSwatch} ${selectedColor === c.name ? styles.colorSwatchActive : ""}`}
                    style={{ background: c.hex }}
                    onClick={() => setSelectedColor(c.name)}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </>
          )}

          {/* Stock Alert Messages */}
          {stockCount === 0 && (
            <div className={styles.outOfStockAlert}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span>This product is currently out of stock.</span>
            </div>
          )}

          {stockCount !== null && stockCount > 0 && stockCount <= 5 && (
            <div className={styles.lowStockAlert}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <span>Hurry! Only {stockCount} items left in stock - order soon.</span>
            </div>
          )}

          {/* Quantity + Add to Cart + Compare */}
          <div className={styles.actionRow}>
            <div className={styles.quantityStepper}>
              <button
                className={styles.stepperBtn}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={stockCount === 0}
              >
                −
              </button>
              <span className={styles.stepperValue}>{stockCount === 0 ? 0 : quantity}</span>
              <button
                className={styles.stepperBtn}
                onClick={() => setQuantity((q) => (stockCount !== null && q >= stockCount ? q : q + 1))}
                disabled={stockCount === 0 || (stockCount !== null && quantity >= stockCount)}
              >
                +
              </button>
            </div>

            <button
              className={`${styles.addToCartBtn} ${stockCount === 0 ? styles.disabledBtn : ""}`}
              onClick={() => {
                if (stockCount === 0) return;
                addToCart({
                  id: route?.itemId || sku,
                  sku,
                  title,
                  price: parseFloat(price),
                  discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
                  image: mainImage,
                  selectedColor: selectedColor || undefined,
                  selectedSize: selectedSize || undefined,
                }, quantity);
              }}
              disabled={stockCount === 0}
            >
              {stockCount === 0 ? "Out of Stock" : "Add To Cart"}
            </button>

            <button className={styles.compareBtn}>
              <span style={{ fontSize: 23 }}>+</span> Compare
            </button>
          </div>

          {/* Divider */}
          <div className={styles.metaDivider} />

          {/* Metadata */}
          <div className={styles.metaTable}>
            <span className={styles.metaLabel}>SKU</span>
            <span className={styles.metaColon}>:</span>
            <span className={styles.metaValue}>{sku}</span>

            <span className={styles.metaLabel}>Category</span>
            <span className={styles.metaColon}>:</span>
            <span className={styles.metaValue}>
              {categories.join(", ") || "—"}
            </span>

            <span className={styles.metaLabel}>Tags</span>
            <span className={styles.metaColon}>:</span>
            <span className={styles.metaValue}>{tags.join(", ") || "—"}</span>

            <span className={styles.metaLabel}>Share</span>
            <span className={styles.metaColon}>:</span>
            <span className={styles.metaValue}>
              <span className={styles.shareIcons}>
                {/* Facebook */}
                <svg
                  className={styles.shareIcon}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
                {/* LinkedIn */}
                <svg
                  className={styles.shareIcon}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
                {/* Twitter */}
                <svg
                  className={styles.shareIcon}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                </svg>
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* =================== TAB SECTION =================== */}
      <div className={styles.tabSection}>
        <div className={styles.tabHeaders}>
          <button
            className={`${styles.tabBtn} ${activeTab === "description" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("description")}
          >
            Description
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "additional" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("additional")}
          >
            Additional Information
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "reviews" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews [{reviews.length}]
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === "description" && (
            <>
              <div className={styles.tabText}>
                <p>{longDesc || shortDesc || "No description available."}</p>
              </div>

              {/* Two product images */}
              {galleryImages.length > 0 && (
                <div className={styles.tabImages}>
                  <div className={styles.tabImageWrap}>
                    <img src={galleryImages[0]} alt={`${title} view 1`} />
                  </div>
                  <div className={styles.tabImageWrap}>
                    <img
                      src={galleryImages[galleryImages.length > 1 ? 1 : 0]}
                      alt={`${title} view 2`}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "additional" && (
            <div className={styles.tabText}>
              {additionalInfo ? (
                <p>{additionalInfo}</p>
              ) : (
                <table className={styles.additionalInfoTable}>
                  <tbody>
                    <tr>
                      <td>SKU</td>
                      <td>{sku}</td>
                    </tr>
                    <tr>
                      <td>Category</td>
                      <td>{categories.join(", ") || "—"}</td>
                    </tr>
                    {sizes.length > 0 && (
                      <tr>
                        <td>Available Sizes</td>
                        <td>{sizes.join(", ")}</td>
                      </tr>
                    )}
                    {colors.length > 0 && (
                      <tr>
                        <td>Available Colors</td>
                        <td>{colors.map((c) => c.name).join(", ")}</td>
                      </tr>
                    )}
                    <tr>
                      <td>Tags</td>
                      <td>{tags.join(", ") || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className={styles.reviewsContainer}>
              {/* Summary Dashboard */}
              <div className={styles.reviewsSummary}>
                <div className={styles.summaryScore}>
                  <p className={styles.scoreNumber}>{reviews.length > 0 ? averageRating : "0.0"}</p>
                  <div className={styles.summaryStars}>
                    {renderStars(reviews.length > 0 ? averageRating : 0)}
                  </div>
                  <p className={styles.scoreLabel}>
                    Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                  </p>
                </div>
                
                <div className={styles.ratingBars}>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const percent = getRatingPercentage(stars);
                    return (
                      <div key={stars} className={styles.ratingBarRow}>
                        <span className={styles.barLabel}>{stars} Star</span>
                        <div className={styles.barTrack}>
                          <div className={styles.barFill} style={{ width: `${percent}%` }} />
                        </div>
                        <span className={styles.barPercent}>{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review Form or Existing Review Display */}
              {user ? (
                existingUserReview && !isEditingExisting ? (
                  <div className={styles.addReviewForm} style={{ border: "1px solid #ebdcca", backgroundColor: "#fdfbf7" }}>
                    <h4 className={styles.formTitle}>Your Review</h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <div style={{ display: "flex", gap: "2px" }}>
                        {renderStars(existingUserReview.rating)}
                      </div>
                      <span style={{ fontSize: "12px", color: "#9f9f9f" }}>
                        Submitted on {new Date(existingUserReview.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.6", margin: "0 0 20px", textAlign: "left" }}>
                      {existingUserReview.comment}
                    </p>
                    <button
                      type="button"
                      onClick={handleEditClick}
                      className={styles.submitBtn}
                      style={{ background: "#242424" }}
                    >
                      Edit Review
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className={styles.addReviewForm}>
                    <h4 className={styles.formTitle}>
                      {isEditingExisting ? "Edit Your Review" : "Write a Review"}
                    </h4>
                    
                    <div className={styles.ratingSelector}>
                      <span className={styles.ratingSelectorLabel}>Your Rating:</span>
                      <div className={styles.starButtons}>
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isHighlighted = (hoverRating !== null ? star <= hoverRating : star <= formRating);
                          return (
                            <button
                              key={star}
                              type="button"
                              className={`${styles.starBtn} ${isHighlighted ? styles.starBtnActive : ""}`}
                              onClick={() => setFormRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(null)}
                              aria-label={`Rate ${star} stars`}
                            >
                              ★
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className={styles.textareaGroup}>
                      <label htmlFor="reviewComment">Your Feedback:</label>
                      <textarea
                        id="reviewComment"
                        placeholder="Share your thoughts about this product..."
                        value={formComment}
                        onChange={(e) => setFormComment(e.target.value)}
                        required
                        className={styles.formTextarea}
                      />
                    </div>

                    {submitError && (
                      <p style={{ color: "#9b1c1c", fontSize: "14px", marginBottom: "16px", textAlign: "left" }}>
                        {submitError}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        type="submit"
                        disabled={submittingReview || !formComment.trim()}
                        className={styles.submitBtn}
                      >
                        {submittingReview ? "Submitting..." : isEditingExisting ? "Update Review" : "Submit Review"}
                      </button>
                      
                      {isEditingExisting && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className={styles.submitBtn}
                          style={{ backgroundColor: "transparent", color: "#666", border: "1px solid #d9d9d9" }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )
              ) : (
                <div className={styles.signinCallout}>
                  <p>You must be signed in to submit a review.</p>
                  <Link
                    href={`/sign-in?redirect=${typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : ""}`}
                    className={styles.signinLink}
                  >
                    Sign In
                  </Link>
                </div>
              )}

              {/* Reviews List */}
              <div className={styles.reviewsList}>
                {loadingReviews ? (
                  <p style={{ textAlign: "center", color: "#9f9f9f" }}>Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#9f9f9f", margin: "20px 0" }}>
                    No reviews yet. Be the first to review this product!
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className={styles.reviewCard}>
                      <div className={styles.avatar}>
                        {getInitials(rev.userName)}
                      </div>
                      <div className={styles.reviewContent}>
                        <div className={styles.reviewHeader}>
                          <div>
                            <h5 className={styles.reviewerName}>{rev.userName}</h5>
                            <div style={{ display: "flex", gap: "2px", marginTop: "4px" }}>
                              {renderStars(rev.rating)}
                            </div>
                          </div>
                          <span className={styles.reviewDate}>
                            {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }) : "-"}
                          </span>
                        </div>
                        <p className={styles.reviewText}>{rev.comment}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
