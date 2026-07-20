"use client";
import React, { JSX, useState, useEffect } from "react";
import {
  Text,
  Field,
  useSitecore,
} from "@sitecore-content-sdk/nextjs";
import { ComponentProps } from "lib/component-props";
import { usePathname } from "next/navigation";
import NextLink from "next/link";

interface ProductItem {
  id: string;
  name: string;
  title?: {
    jsonValue?: Field<string>;
  };
  sku?: {
    jsonValue?: Field<string>;
  };
  shortDescription?: {
    jsonValue?: Field<string>;
  };
  price?: {
    jsonValue?: Field<number | string>;
  };
  discountPrice?: {
    jsonValue?: Field<number | string>;
  };
  isNew?: {
    jsonValue?: Field<boolean | string>;
  };
  mainImage?: {
    jsonValue?: Field<string>;
  };
  galleryImages?: {
    jsonValue?: Field<string>;
  };
}

interface OurProductsFields {
  data?: {
    datasource?: {
      title?: {
        jsonValue?: Field<string>;
      };
    };
  };
}

type OurProductsProps = ComponentProps & {
  fields: OurProductsFields;
};

interface ProductImageSliderProps {
  galleryImages: string[];
  title: string;
}

const ProductImageSlider: React.FC<ProductImageSliderProps> = ({
  galleryImages,
  title,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (galleryImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [galleryImages]);

  if (galleryImages.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>;
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
            className="w-full h-full object-cover shrink-0"
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

const NoDataFallback = ({ componentName }: { componentName: string }) => (
  <div className="component-content text-center py-10 bg-slate-50 rounded-lg">
    <span className="text-gray-400 font-semibold">
      {componentName} (Empty Datasource)
    </span>
  </div>
);

export const Default = (props: OurProductsProps): JSX.Element => {
  const { fields, params } = props;
  const datasource = fields?.data?.datasource;
  const styles = `component our-products w-full ${params.styles || ""}`.trim();
  const id = params.RenderingIdentifier;

  const { page } = useSitecore();
  const pathname = usePathname();

  // State to manage hover state for product cards (desktop overlay)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Dynamic products states
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve current site and locale from URL path for the API call
  const pathSegments = pathname.split("/").filter(Boolean);
  const siteSegment = pathSegments[0] || "akshayxmc";
  const localeSegment = pathSegments[1] || "en";

  const shopLink = "/Shop";
  const datasourcePath = `/sitecore/content/akshay/${siteSegment}/Shop/Products`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch("/api/shop-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        datasourceId: datasourcePath,
        language: localeSegment,
        first: 12,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const results = (data.results || []) as ProductItem[];
        // Sort descending by SKU to get the latest products
        const sorted = results.sort((a, b) => {
          const aSku = a.sku?.jsonValue?.value || a.name || "";
          const bSku = b.sku?.jsonValue?.value || b.name || "";
          return bSku.localeCompare(aSku, undefined, { numeric: true, sensitivity: "base" });
        });
        // Slice top 8 products
        setProducts(sorted.slice(0, 8));
      })
      .catch((err) => {
        if (!active) return;
        console.error("Error loading products:", err);
        setError("Failed to load products");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [datasourcePath, localeSegment]);

  const formatPrice = (p: number | string | undefined) => {
    if (!p) return "₹0";
    const num = typeof p === "string" ? parseFloat(p) : p;
    if (isNaN(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  if (!datasource) {
    return <NoDataFallback componentName="OurProducts" />;
  }

  if (loading) {
    return (
      <section className={styles} id={id || undefined}>
        <div className="component-content max-w-[1240px] mx-auto px-4 py-12">
          {/* Section Header */}
          <div className="text-center mb-10">
            {datasource.title?.jsonValue?.value && (
              <Text
                tag="div"
                className="text-3xl font-bold text-[#3A3A3A] font-poppins text-center mb-8"
                field={datasource.title.jsonValue}
              />
            )}
          </div>

          {/* Skeleton Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-[32px] justify-items-center">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="w-full max-w-[285px] h-[446px] bg-[#F4F5F7] rounded-sm animate-pulse flex flex-col"
              >
                <div className="w-full h-[301px] bg-gray-200" />
                <div className="p-4 flex flex-col gap-2 flex-grow">
                  <div className="h-5 w-3/4 bg-gray-300 rounded" />
                  <div className="h-4 w-1/2 bg-gray-300 rounded" />
                  <div className="h-5 w-1/3 bg-gray-300 rounded mt-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || products.length === 0) {
    return (
      <section className={styles} id={id || undefined}>
        <div className="component-content max-w-[1240px] mx-auto px-4 py-12 text-center">
          {datasource.title?.jsonValue?.value && (
            <Text
              tag="div"
              className="text-3xl font-bold text-[#3A3A3A] font-poppins text-center mb-8"
              field={datasource.title.jsonValue}
            />
          )}
          <p className="text-gray-500 font-medium font-poppins">
            {error || "No products found."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles} id={id || undefined}>
      <div className="component-content max-w-[1240px] mx-auto px-4 py-12">
        {/* Section Header */}
        <div className="text-center mb-10">
          {datasource.title?.jsonValue?.value && (
            <Text
              tag="div"
              className="text-3xl font-bold text-[#3A3A3A] font-poppins text-center mb-8"
              field={datasource.title.jsonValue}
            />
          )}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-[32px] justify-items-center">
          {products.map((product, index) => {
            const titleVal = product.title?.jsonValue?.value || product.name || "";
            const descVal = product.shortDescription?.jsonValue?.value || "";
            const priceVal = parseFloat((product.price?.jsonValue?.value as any) ?? "0");
            const discountPriceVal = parseFloat((product.discountPrice?.jsonValue?.value as any) ?? "0");
            const mainImageField = product.mainImage?.jsonValue;

            const imageUrl = typeof mainImageField?.value === "string"
              ? mainImageField.value
              : (mainImageField?.value as any)?.src || "";

            const galleryRaw = product.galleryImages?.jsonValue?.value || "";
            const galleryImagesList: string[] = [];
            if (imageUrl) galleryImagesList.push(imageUrl);
            if (galleryRaw) {
              galleryRaw.split(/[|,]/).forEach((url: string) => {
                const trimmed = url.trim();
                if (trimmed && !galleryImagesList.includes(trimmed)) {
                  galleryImagesList.push(trimmed);
                }
              });
            }

            const isNewVal = product.isNew?.jsonValue?.value === true || product.isNew?.jsonValue?.value === "1";
            const hasDiscount = discountPriceVal > priceVal;
            const discountPercent = hasDiscount
              ? Math.round(((discountPriceVal - priceVal) / discountPriceVal) * 100)
              : 0;

            const productDetailHref = `${shopLink}/${product.sku?.jsonValue?.value || product.name}--${titleVal}`;

            return (
              <div
                key={product.id}
                className="relative w-full max-w-[285px] h-[446px] flex flex-col group overflow-hidden bg-[#F4F5F7] transition-all duration-300 shadow-sm hover:shadow-md"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Image and Badges Container */}
                <div className="relative w-full h-[301px] bg-gray-200 overflow-hidden">
                  <ProductImageSlider
                    galleryImages={galleryImagesList}
                    title={titleVal}
                  />

                  {/* Badges (Top-Right) */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                    {hasDiscount && (
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#E97171] text-white text-[12px] font-semibold font-poppins">
                        <span>-{discountPercent}%</span>
                      </div>
                    )}
                    {isNewVal && !hasDiscount && (
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2EC1AC] text-white text-[12px] font-semibold font-poppins">
                        <span>New</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description Box */}
                <div className="flex flex-col flex-grow p-4 bg-[#F4F5F7]">
                  {titleVal && (
                    <h3 className="text-base font-semibold text-[#3A3A3A] font-poppins truncate mb-1">
                      {titleVal}
                    </h3>
                  )}
                  {descVal && (
                    <p className="text-sm font-medium text-[#898989] font-poppins truncate mb-2">
                      {descVal}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-auto">
                    <span className="text-base font-semibold text-[#3A3A3A] font-poppins">
                      {formatPrice(priceVal)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm font-normal text-[#B0B0B0] font-poppins line-through">
                        {formatPrice(discountPriceVal)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover Overlay */}
                <div
                  className={`absolute inset-0 bg-[#3A3A3A]/72 flex flex-col items-center justify-center gap-4 p-4 transition-all duration-300 z-20 ${
                    hoveredIndex === index
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                  }`}
                >
                  {/* Details Button */}
                  <NextLink
                    href={productDetailHref}
                    className="w-[202px] h-[48px] flex items-center justify-center bg-white text-[#B88E2F] font-semibold text-[16px] font-poppins transition-colors duration-300 hover:bg-[#B88E2F] hover:text-white"
                  >
                    Details
                  </NextLink>

                  {/* Secondary Actions (Share, Compare, Like) */}
                  <div className="flex items-center gap-5 text-white font-semibold text-[12px] font-poppins mt-2">
                    {/* Share */}
                    <button className="flex items-center gap-1 hover:text-[#B88E2F] transition-colors duration-300">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
                      </svg>
                      <span>Share</span>
                    </button>
                    {/* Compare */}
                    <button className="flex items-center gap-1 hover:text-[#B88E2F] transition-colors duration-300">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M16 3h5v5M8 21H3v-5M12 12V3M12 12h9M12 12v9M12 12H3" />
                      </svg>
                      <span>Compare</span>
                    </button>
                    {/* Like */}
                    <button className="flex items-center gap-1 hover:text-[#B88E2F] transition-colors duration-300">
                      <svg
                        width="12"
                        height="12"
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

        {/* Section Footer (Show More CTA) */}
        <div className="flex justify-center mt-12">
          <NextLink
            href={shopLink}
            className="w-[245px] h-[48px] flex items-center justify-center border border-[#B88E2F] bg-white text-[#B88E2F] font-semibold text-[16px] font-poppins transition-all duration-300 hover:bg-[#B88E2F] hover:text-white"
          >
            Show More
          </NextLink>
        </div>
      </div>
    </section>
  );
};
