"use client";
import React, { useEffect, useState, JSX } from "react";
import { useRecentlyViewedCdp } from "@/components/cdp/CDPProvider";
import Link from "next/link";

interface Product {
  id: string;
  sku: string;
  title: string;
  price: number;
  discountPrice?: number;
  mainImage: string;
  shortDescription?: string;
}

export default function RecentlyViewedCdp(): JSX.Element | null {
  const { recentlyViewed } = useRecentlyViewedCdp();
  const [matchedProducts, setMatchedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (recentlyViewed.length === 0) {
      setMatchedProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Fetch details for each tracked SKU in parallel from the products API
    const fetchPromises = recentlyViewed.map((rv) =>
      fetch(`/api/products?sku=${encodeURIComponent(rv.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.product) {
            return data.product as Product;
          }
          return null;
        })
        .catch(() => null)
    );

    Promise.all(fetchPromises)
      .then((results) => {
        const validProducts = results.filter((p): p is Product => p !== null);
        setMatchedProducts(validProducts);
      })
      .catch((err) => console.warn("Failed to resolve recently viewed products details:", err))
      .finally(() => setLoading(false));
  }, [recentlyViewed]);

  // If there are no recently viewed items or we are loading, hide the section
  if (loading || matchedProducts.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const formatProductDetailUrl = (sku: string, title: string) => {
    const cleanTitle = title
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    return `/Shop/${sku}--${cleanTitle}`;
  };

  return (
    <section className="w-full bg-[#FAF5F0] py-[80px] border-t border-b border-[#E8E8E8] mt-[60px]">
      <div className="max-w-[1240px] mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-[40px]">
          <h2 className="text-[32px] font-bold text-[#3A3A3A] font-poppins mb-[10px]">
            Inspired by Your Browsing History
          </h2>
          <p className="text-[16px] text-[#898989] font-poppins font-light">
            Based on your recently viewed products in this session
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[30px] justify-center">
          {matchedProducts.map((product) => {
            const hasDiscount = product.discountPrice && product.discountPrice > 0;
            const detailUrl = formatProductDetailUrl(product.sku, product.title);

            return (
              <div
                key={product.sku}
                className="group relative flex flex-col bg-[#F4F5F7] overflow-hidden rounded-md transition-all duration-300 hover:shadow-lg"
              >
                {/* Image Section */}
                <div className="relative w-full h-[300px] overflow-hidden bg-gray-200">
                  <img
                    src={product.mainImage}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=400";
                    }}
                  />
                  
                  {/* Discount Badge */}
                  {hasDiscount && product.price > 0 && (
                    <div className="absolute top-[20px] right-[20px] bg-[#E97171] text-white text-[15px] font-medium w-[48px] h-[48px] rounded-full flex items-center justify-center">
                      -{Math.round(((product.price - (product.discountPrice || 0)) / product.price) * 100)}%
                    </div>
                  )}

                  {/* Dark overlay & Details CTA on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center z-10">
                    <Link
                      href={detailUrl}
                      className="px-[40px] py-[12px] bg-white text-[#B88E2F] font-poppins font-semibold text-[16px] rounded-sm transition-colors duration-300 hover:bg-[#B88E2F] hover:text-white"
                    >
                      Details
                    </Link>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col flex-grow p-[16px_16px_24px_16px] bg-[#F4F5F7] font-poppins">
                  <h3 className="text-[24px] font-semibold text-[#3A3A3A] mb-[8px] truncate">
                    {product.title}
                  </h3>
                  <p className="text-[14px] text-[#898989] mb-[8px] line-clamp-2 min-h-[40px] font-normal leading-[20px]">
                    {product.shortDescription || "Premium quality handcrafted furniture."}
                  </p>
                  <div className="flex items-center gap-[12px] mt-auto">
                    <span className="text-[20px] font-semibold text-[#3A3A3A]">
                      {hasDiscount ? formatPrice(product.discountPrice || 0) : formatPrice(product.price)}
                    </span>
                    {hasDiscount && (
                      <span className="text-[16px] text-[#B0B0B0] line-through font-normal">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
