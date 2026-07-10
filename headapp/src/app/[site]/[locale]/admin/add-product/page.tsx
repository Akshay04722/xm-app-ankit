"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

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

  // Helper: Format Price to Rupiah/Standard representation
  const formatPrice = (val: string | number) => {
    if (!val) return "Rp 0";
    const num = Number(val);
    if (isNaN(num)) return val.toString();
    return "Rp " + num.toLocaleString("id-ID");
  };

  // Helper: Parse comma separated values
  const parseCommaList = (text: string) => {
    return text
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  // Calculate discount percentage
  const salePriceNum = Number(price);
  const oldPriceNum = Number(discountPrice);
  const discountPercent =
    oldPriceNum > salePriceNum && salePriceNum > 0
      ? Math.round(((oldPriceNum - salePriceNum) / oldPriceNum) * 100)
      : 0;

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
      const galleryImageUrls = parseCommaList(galleryUrlsText);
      const colors = parseCommaList(colorsText);
      const tags = parseCommaList(tagsText);

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-600">
        <div className="w-12 h-12 border-4 border-[#B88E2F] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-semibold text-lg animate-pulse">Verifying admin session...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center px-4">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-slate-500 max-w-md mb-8">
          This administrative area is restricted to authorized accounts with administrator credentials.
        </p>
        <Link href="/" className="px-8 py-3 bg-[#B88E2F] text-white rounded-lg font-semibold shadow-md hover:bg-[#9E7824] hover:shadow-lg transition duration-200">
          Return Home
        </Link>
      </div>
    );
  }

  // Pre-calculated lists for live previews
  const parsedColors = parseCommaList(colorsText);
  const parsedTags = parseCommaList(tagsText);
  const parsedGalleryUrls = parseCommaList(galleryUrlsText);

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10 pb-6 border-b border-amber-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#B88E2F] uppercase tracking-wider mb-2">
              <Link href="/admin" className="hover:underline">Admin</Link>
              <span>/</span>
              <span className="text-slate-400">Add Product</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add New Product</h1>
            <p className="text-slate-500 mt-1">Populate and publish a new item to your storefront catalog.</p>
          </div>
          <Link
            href="/admin"
            className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition duration-150 font-medium text-sm"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-medium flex items-center gap-3 shadow-sm animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-medium flex items-center gap-3 shadow-sm animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span>{error}</span>
          </div>
        )}

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form - Left Column */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* Card 1: Basic Details */}
            <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-6 sm:p-8 transition duration-300 hover:shadow-md">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-6">
                <div className="p-2 bg-amber-50 text-[#B88E2F] rounded-lg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Basic Details</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Asgaard sofa"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#B88E2F] focus:ring-4 focus:ring-[#B88E2F]/10 transition duration-150"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">SKU / Item ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. SS001"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#B88E2F] focus:ring-4 focus:ring-[#B88E2F]/10 transition duration-150"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Short Card Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Stylish cafe chair"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#B88E2F] focus:ring-4 focus:ring-[#B88E2F]/10 transition duration-150"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Pricing & Inventory */}
            <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-6 sm:p-8 transition duration-300 hover:shadow-md">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-6">
                <div className="p-2 bg-amber-50 text-[#B88E2F] rounded-lg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Pricing & Inventory</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sale Price (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="E.g. 250000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#B88E2F] focus:ring-4 focus:ring-[#B88E2F]/10 transition duration-150"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Original / Old Price (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="E.g. 350000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#B88E2F] focus:ring-4 focus:ring-[#B88E2F]/10 transition duration-150"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Stock Count *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="E.g. 15"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#B88E2F] focus:ring-4 focus:ring-[#B88E2F]/10 transition duration-150"
                    value={stockCount}
                    onChange={(e) => setStockCount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Attributes & Taxonomy */}
            <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-6 sm:p-8 transition duration-300 hover:shadow-md">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-6">
                <div className="p-2 bg-amber-50 text-[#B88E2F] rounded-lg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Taxonomy & Attributes</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-[#B88E2F] focus:ring-4 focus:ring-[#B88E2F]/10 transition duration-150 bg-white cursor-pointer"
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="E.g. Sofa, Chair, Home, Shop"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#B88E2F] focus:ring-4 focus:ring-[#B88E2F]/10 transition duration-150"
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                  />
                  {parsedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {parsedTags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center text-xs font-medium bg-[#FFF3E3] text-[#B88E2F] px-2 py-0.5 rounded border border-[#B88E2F]/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Size Toggles */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Available Sizes</label>
                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map((size) => {
                      const selected = selectedSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleSizeToggle(size)}
                          className={`w-11 h-11 flex items-center justify-center rounded-lg font-bold text-sm border transition-all duration-150 ${
                            selected
                              ? "bg-[#B88E2F] border-[#B88E2F] text-white shadow-sm scale-105"
                              : "bg-[#FFF3E3]/40 border-transparent text-[#B88E2F] hover:bg-[#FFF3E3] hover:border-[#B88E2F]/20"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Colors Input & Previews */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Available Colors (Comma-separated HEX/Names)</label>
                  <input
                    type="text"
                    placeholder="E.g. #816DFA, #000000, #B88E2F"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#B88E2F] focus:ring-4 focus:ring-[#B88E2F]/10 transition duration-150"
                    value={colorsText}
                    onChange={(e) => setColorsText(e.target.value)}
                  />
                  {parsedColors.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mt-3 items-center">
                      <span className="text-xs text-slate-400 font-medium">Color Preview:</span>
                      {parsedColors.map((color, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-2 py-1 rounded-full shadow-2xs">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 inline-block shadow-3xs"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs font-mono text-slate-600">{color}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Toggle badge option */}
                <div className="md:col-span-2 flex items-center gap-3 pt-2">
                  <div className="relative flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="isNew"
                      className="w-5 h-5 accent-[#B88E2F] rounded border-slate-350 focus:ring-[#B88E2F]"
                      checked={isNew}
                      onChange={(e) => setIsNew(e.target.checked)}
                    />
                    <label htmlFor="isNew" className="ml-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
                      Show &quot;New&quot; Product Badge on Card
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Descriptions & Specs */}
            <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-6 sm:p-8 transition duration-300 hover:shadow-md">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-6">
                <div className="p-2 bg-amber-50 text-[#B88E2F] rounded-lg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Descriptions & Specifications</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Long Details Description</label>
                  <textarea
                    rows={4}
                    placeholder="Detailed paragraph for description tab..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#B88E2F] focus:ring-4 focus:ring-[#B88E2F]/10 transition duration-150 resize-y"
                    value={longDescription}
                    onChange={(e) => setLongDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Additional Specifications / Technical Details</label>
                  <textarea
                    rows={4}
                    placeholder="Dimensions, materials, capacity, or technical features..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#B88E2F] focus:ring-4 focus:ring-[#B88E2F]/10 transition duration-150 resize-y"
                    value={additionalInformation}
                    onChange={(e) => setAdditionalInformation(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Card 5: Media Assets */}
            <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-6 sm:p-8 transition duration-300 hover:shadow-md">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-6">
                <div className="p-2 bg-amber-50 text-[#B88E2F] rounded-lg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Media Assets</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Image CDN URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/images/main.jpg"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#B88E2F] focus:ring-4 focus:ring-[#B88E2F]/10 transition duration-150"
                    value={mainImageUrl}
                    onChange={(e) => setMainImageUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gallery Image CDN URLs (Comma-separated)</label>
                  <textarea
                    rows={3}
                    placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#B88E2F] focus:ring-4 focus:ring-[#B88E2F]/10 transition duration-150 resize-y"
                    value={galleryUrlsText}
                    onChange={(e) => setGalleryUrlsText(e.target.value)}
                  />
                  {parsedGalleryUrls.length > 0 && (
                    <div className="mt-4">
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gallery Preview ({parsedGalleryUrls.length})</span>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {parsedGalleryUrls.map((url, idx) => (
                          <div key={idx} className="relative w-full aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-100 group shadow-3xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Gallery thumbnail ${idx + 1}`}
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                // Fallback for invalid image url
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Form Actions for Desktop, Normal on Mobile */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100 bg-[#FDFBF7] pb-8">
              <button
                type="button"
                className="px-6 py-3 border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 font-semibold shadow-xs transition duration-150 cursor-pointer"
                disabled={submitting}
                onClick={() => router.push("/admin")}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-8 py-3 bg-[#B88E2F] text-white rounded-xl font-bold shadow-md hover:bg-[#9E7824] hover:shadow-lg transition duration-200 flex items-center justify-center gap-2.5 cursor-pointer ${
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

          {/* Sticky Side Panel (Live Preview) - Right Column */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6 space-y-6">
            
            {/* Live Product Card Container */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-50">
                <h3 className="text-lg font-bold text-slate-800">Live Preview</h3>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              
              <p className="text-xs text-slate-400 mb-6 text-center italic">Hover card to see action overlay as it appears on the live store.</p>

              {/* High Fidelity Card Replica */}
              <div className="relative w-full max-w-[285px] mx-auto h-[446px] flex flex-col group overflow-hidden bg-[#F4F5F7] transition-all duration-300 shadow-sm hover:shadow-md border border-slate-150">
                
                {/* Image and Badges */}
                <div className="relative w-full h-[301px] bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {mainImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mainImageUrl}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      alt={title || "Product Preview"}
                      onError={(e) => {
                        // Fallback icon on error
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback Display if mainImageUrl is empty or fails */}
                  {(!mainImageUrl) && (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-slate-350">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">No Image Uploaded</span>
                    </div>
                  )}

                  {/* Badges Container */}
                  <div className="absolute top-6 right-6 flex flex-col gap-2 z-10">
                    {discountPercent > 0 && (
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#E97171] text-white text-[15px] font-semibold font-poppins">
                        <span>-{discountPercent}%</span>
                      </div>
                    )}
                    {isNew && discountPercent === 0 && (
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#2EC1AC] text-white text-[15px] font-semibold font-poppins">
                        <span>New</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description Box */}
                <div className="flex flex-col flex-grow p-4 bg-[#F4F5F7]">
                  <h3 className="text-[22px] font-bold text-[#3A3A3A] font-poppins truncate mb-1 leading-snug">
                    {title.trim() || "Product Title"}
                  </h3>
                  <p className="text-[14px] font-medium text-[#898989] font-poppins truncate mb-2.5">
                    {shortDescription.trim() || "Short product description"}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-auto">
                    <span className="text-[18px] font-bold text-[#3A3A3A] font-poppins">
                      {formatPrice(price)}
                    </span>
                    {discountPercent > 0 && (
                      <span className="text-[14px] font-normal text-[#B0B0B0] font-poppins line-through">
                        {formatPrice(discountPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Storefront Hover Overlay Simulation */}
                <div className="absolute inset-0 bg-[#3A3A3A]/80 flex flex-col items-center justify-center gap-5 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-none group-hover:pointer-events-auto">
                  
                  {/* CTA button (Add to cart) */}
                  <button className="w-[180px] h-[44px] flex items-center justify-center bg-white text-[#B88E2F] font-bold text-[14px] font-poppins transition-colors duration-250 hover:bg-[#B88E2F] hover:text-white shadow-sm">
                    Add to cart
                  </button>

                  {/* Secondary Actions (Share, Compare, Like) */}
                  <div className="flex items-center gap-4 text-white font-semibold text-[13px] font-poppins">
                    {/* Share */}
                    <div className="flex items-center gap-1 cursor-pointer hover:text-[#B88E2F] transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
                      </svg>
                      <span>Share</span>
                    </div>
                    {/* Like */}
                    <div className="flex items-center gap-1 cursor-pointer hover:text-[#B88E2F] transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span>Like</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Catalog Info Summary Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Publishing Status</h4>
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">SKU Code:</span>
                  <span className="font-mono font-bold text-slate-700">{sku || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Category:</span>
                  <span className="font-bold text-[#B88E2F]">{category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Stock Status:</span>
                  {stockCount && !isNaN(Number(stockCount)) && Number(stockCount) > 0 ? (
                    <span className="font-bold text-emerald-600">In Stock ({stockCount})</span>
                  ) : (
                    <span className="font-bold text-rose-500">Out of Stock / Invalid</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Sizes:</span>
                  <span className="font-bold text-slate-700">
                    {selectedSizes.length > 0 ? selectedSizes.join(", ") : "None selected"}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

