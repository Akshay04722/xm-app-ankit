"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// Form styles using standard Tailwind CSS classes
export default function AddProductPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [claimsLoading, setClaimsLoading] = useState(true);

  // Form State
  const [sku, setSku] = useState("");
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [additionalInformation, setAdditionalInformation] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [galleryUrlsText, setGalleryUrlsText] = useState(""); // comma-separated
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [colorsText, setColorsText] = useState(""); // comma-separated
  const [category, setCategory] = useState("Sofas");
  const [tagsText, setTagsText] = useState(""); // comma-separated
  const [stockCount, setStockCount] = useState("10");

  // Status State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Available Sizes in Furniro
  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL"];

  // Verify Admin Claims
  useEffect(() => {
    if (user) {
      user
        .getIdTokenResult()
        .then((idTokenResult) => {
          const role = idTokenResult.claims.role;
          const adminClaim = idTokenResult.claims.isAdmin || role === "admin";
          setIsAdmin(!!adminClaim);
        })
        .catch((err) => {
          console.error("Error checking claims:", err);
          setIsAdmin(false);
        })
        .finally(() => {
          setClaimsLoading(false);
        });
    } else {
      setIsAdmin(false);
      setClaimsLoading(false);
    }
  }, [user]);

  // Handle Size Toggle
  const handleSizeToggle = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSuccess(null);

    // Basic Validation
    if (!sku.trim()) return setError("SKU is required.");
    if (!title.trim()) return setError("Title is required.");
    if (!price || isNaN(Number(price))) return setError("Valid price is required.");
    if (!stockCount || isNaN(Number(stockCount))) return setError("Valid stock count is required.");

    try {
      setSubmitting(true);
      const idToken = await user.getIdToken();

      // Process lists
      const galleryImageUrls = galleryUrlsText
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      const colors = colorsText
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        sku: sku.trim(),
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        longDescription: longDescription.trim(),
        additionalInformation: additionalInformation.trim(),
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : 0,
        isNew,
        mainImageUrl: mainImageUrl.trim(),
        galleryImageUrls,
        sizes: selectedSizes,
        colors,
        category,
        tags,
        stockCount: Number(stockCount)
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Product "${title}" was successfully saved in Firestore!`);
        // Reset form
        setSku("");
        setTitle("");
        setShortDescription("");
        setLongDescription("");
        setAdditionalInformation("");
        setPrice("");
        setDiscountPrice("");
        setIsNew(false);
        setMainImageUrl("");
        setGalleryUrlsText("");
        setSelectedSizes([]);
        setColorsText("");
        setCategory("Sofas");
        setTagsText("");
        setStockCount("10");
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(data.error || "Failed to create product.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || claimsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-600">
        <div className="w-12 h-12 border-4 border-[#B88E2F] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-lg">Verifying admin session...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
        <div className="w-16 h-16 text-red-500 mb-4">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600 max-w-md mb-6">
          This administrative page is restricted to accounts with admin privileges only.
        </p>
        <Link href="/" className="px-6 py-2 bg-[#B88E2F] text-white rounded font-semibold hover:bg-[#9E7824] transition duration-200">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-serif">Add New Product</h1>
            <p className="text-sm text-gray-500 mt-1">Create catalog products in your Firestore database</p>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 transition font-medium"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded text-green-700 font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="p-6 sm:p-8 space-y-8">
            {/* Section 1: Basic Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-6 font-serif">Basic Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Asgaard sofa"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#B88E2F] focus:ring-1 focus:ring-[#B88E2F]"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">SKU / Item ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. SS001"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#B88E2F] focus:ring-1 focus:ring-[#B88E2F]"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Short Card Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Stylish cafe chair"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#B88E2F] focus:ring-1 focus:ring-[#B88E2F]"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Pricing & Inventory */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-6 font-serif">Pricing & Inventory</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sale Price *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="E.g. 250000"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#B88E2F] focus:ring-1 focus:ring-[#B88E2F]"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Original / Old Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="E.g. 350000"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#B88E2F] focus:ring-1 focus:ring-[#B88E2F]"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Count *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="E.g. 15"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#B88E2F] focus:ring-1 focus:ring-[#B88E2F]"
                    value={stockCount}
                    onChange={(e) => setStockCount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Attributes & Options */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-6 font-serif">Attributes & Taxonomy</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#B88E2F] focus:ring-1 focus:ring-[#B88E2F] bg-white"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Sofas">Sofas</option>
                    <option value="Chairs">Chairs</option>
                    <option value="Tables">Tables</option>
                    <option value="Beds">Beds</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="E.g. Sofa, Chair, Home, Shop"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#B88E2F] focus:ring-1 focus:ring-[#B88E2F]"
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                  />
                </div>

                {/* Size Checkboxes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Available Sizes</label>
                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map((size) => {
                      const selected = selectedSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleSizeToggle(size)}
                          className={`w-10 h-10 flex items-center justify-center rounded font-semibold text-sm border transition ${
                            selected
                              ? "bg-[#B88E2F] border-[#B88E2F] text-white"
                              : "bg-[#FFF3E3] border-transparent text-[#B88E2F] hover:bg-orange-100"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Colors Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Available Colors (Comma-separated HEX/Names)</label>
                  <input
                    type="text"
                    placeholder="E.g. #816DFA, #000000, #B88E2F"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#B88E2F] focus:ring-1 focus:ring-[#B88E2F]"
                    value={colorsText}
                    onChange={(e) => setColorsText(e.target.value)}
                  />
                </div>

                {/* Checkbox badge toggle */}
                <div className="md:col-span-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isNew"
                    className="w-5 h-5 accent-[#B88E2F] rounded border-gray-300 focus:ring-[#B88E2F]"
                    checked={isNew}
                    onChange={(e) => setIsNew(e.target.checked)}
                  />
                  <label htmlFor="isNew" className="text-sm font-semibold text-gray-700 select-none">
                    Show "New" Product Badge on card
                  </label>
                </div>
              </div>
            </div>

            {/* Section 4: Detailed Specifications */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-6 font-serif">Descriptions & Specs (HTML allowed)</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Long Details Description</label>
                  <textarea
                    rows={4}
                    placeholder="Detailed paragraph for description tab..."
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#B88E2F] focus:ring-1 focus:ring-[#B88E2F]"
                    value={longDescription}
                    onChange={(e) => setLongDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Specifications / Information</label>
                  <textarea
                    rows={4}
                    placeholder="Technical specifications or dimensions..."
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#B88E2F] focus:ring-1 focus:ring-[#B88E2F]"
                    value={additionalInformation}
                    onChange={(e) => setAdditionalInformation(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Media Assets */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-6 font-serif">Media Assets</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Main Image CDN URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/images/main.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#B88E2F] focus:ring-1 focus:ring-[#B88E2F]"
                    value={mainImageUrl}
                    onChange={(e) => setMainImageUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gallery Image CDN URLs (Comma-separated)</label>
                  <textarea
                    rows={3}
                    placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#B88E2F] focus:ring-1 focus:ring-[#B88E2F]"
                    value={galleryUrlsText}
                    onChange={(e) => setGalleryUrlsText(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4 border-t border-gray-100">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 font-semibold"
              disabled={submitting}
              onClick={() => router.push("/admin")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-8 py-2 bg-[#B88E2F] text-white rounded font-semibold hover:bg-[#9E7824] transition flex items-center justify-center gap-2 ${
                submitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                "Save Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
