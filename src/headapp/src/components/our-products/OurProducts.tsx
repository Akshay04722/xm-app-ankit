'use client';

import React, { JSX, useState } from 'react';
import {
  NextImage as ContentSdkImage,
  Text,
  Field,
  ImageField,
  LinkField,
  Link,
} from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from 'lib/component-props';
import { CompatibleLink } from 'components/content-sdk/CompatibleLink';

interface ProductItem {
  title?: {
    jsonValue?: Field<string>;
  };
  subtitle?: {
    jsonValue?: Field<string>;
  };
  image?: {
    jsonValue?: ImageField;
  };
  price?: {
    jsonValue?: Field<string>;
  };
  oldPrice?: {
    jsonValue?: Field<string>;
  };
  discountTag?: {
    jsonValue?: Field<string>;
  };
  isNew?: {
    jsonValue?: Field<boolean | string>;
  };
  ctaLink?: {
    jsonValue?: LinkField;
  };
}

interface OurProductsFields {
  data?: {
    datasource?: {
      title?: {
        jsonValue?: Field<string>;
      };
      showMoreLink?: {
        jsonValue?: LinkField;
      };
      products?: {
        results: ProductItem[];
      };
    };
  };
}

type OurProductsProps = ComponentProps & {
  fields: OurProductsFields;
};

const NoDataFallback = ({ componentName }: { componentName: string }) => (
  <div className="component-content text-center py-10 bg-slate-50 rounded-lg">
    <span className="text-gray-400 font-semibold">{componentName} (Empty Datasource)</span>
  </div>
);

export const Default = (props: OurProductsProps): JSX.Element => {
  const { fields, params } = props;
  const datasource = fields?.data?.datasource;
  const styles = `component our-products w-full ${params.styles || ''}`.trim();
  const id = params.RenderingIdentifier;

  // State to manage hover state for product cards (desktop overlay)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!datasource) {
    return <NoDataFallback componentName="OurProducts" />;
  }

  const products = datasource.products?.results || [];

  return (
    <section className={styles} id={id || undefined}>
      <div className="component-content max-w-[1240px] mx-auto px-4 py-12">
        {/* Section Header */}
        <div className="text-center mb-10">
          {datasource.title?.jsonValue?.value && (
            <Text
              tag="h2"
              className="text-[40px] font-bold text-[#3A3A3A] font-poppins text-center mb-8"
              field={datasource.title.jsonValue}
            />
          )}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-[32px] justify-items-center">
          {products.map((product, index) => {
            const titleField = product.title?.jsonValue;
            const subtitleField = product.subtitle?.jsonValue;
            const imageField = product.image?.jsonValue;
            const priceField = product.price?.jsonValue;
            const oldPriceField = product.oldPrice?.jsonValue;
            const discountTagField = product.discountTag?.jsonValue;
            const isNewField = product.isNew?.jsonValue;
            const ctaField = product.ctaLink?.jsonValue;

            const hasImage = !!imageField?.value?.src;
            const isNewVal = isNewField?.value === true || isNewField?.value === '1';
            const hasDiscount = !!discountTagField?.value;

            return (
              <div
                key={index}
                className="relative w-full max-w-[285px] h-[446px] flex flex-col group overflow-hidden bg-[#F4F5F7] transition-all duration-300 shadow-sm hover:shadow-md"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Image and Badges Container */}
                <div className="relative w-full h-[301px] bg-gray-200 overflow-hidden">
                  {hasImage ? (
                    <ContentSdkImage
                      field={imageField}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      alt={titleField?.value || 'Product'}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}

                  {/* Badges (Top-Right) */}
                  <div className="absolute top-6 right-6 flex flex-col gap-2 z-10">
                    {hasDiscount && (
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#E97171] text-white text-[16px] font-medium font-poppins">
                        <Text field={discountTagField} />
                      </div>
                    )}
                    {isNewVal && !hasDiscount && (
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#2EC1AC] text-white text-[16px] font-medium font-poppins">
                        <span>New</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description Box */}
                <div className="flex flex-col flex-grow p-4 bg-[#F4F5F7]">
                  {titleField?.value && (
                    <Text
                      tag="h3"
                      className="text-[24px] font-semibold text-[#3A3A3A] font-poppins truncate mb-1"
                      field={titleField}
                    />
                  )}
                  {subtitleField?.value && (
                    <Text
                      tag="p"
                      className="text-[16px] font-medium text-[#898989] font-poppins truncate mb-2"
                      field={subtitleField}
                    />
                  )}
                  <div className="flex items-center gap-4 mt-auto">
                    {priceField?.value && (
                      <Text
                        tag="span"
                        className="text-[20px] font-semibold text-[#3A3A3A] font-poppins"
                        field={priceField}
                      />
                    )}
                    {oldPriceField?.value && (
                      <Text
                        tag="span"
                        className="text-[16px] font-normal text-[#B0B0B0] font-poppins line-through"
                        field={oldPriceField}
                      />
                    )}
                  </div>
                </div>

                {/* Hover Overlay */}
                <div
                  className={`absolute inset-0 bg-[#3A3A3A]/72 flex flex-col items-center justify-center gap-6 p-4 transition-all duration-300 z-20 ${
                    hoveredIndex === index ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  {/* CTA button (Add to cart) */}
                  {ctaField?.value?.href ? (
                    <Link
                      field={ctaField}
                      className="w-[202px] h-[48px] flex items-center justify-center bg-white text-[#B88E2F] font-semibold text-[16px] font-poppins transition-colors duration-300 hover:bg-[#B88E2F] hover:text-white"
                    >
                      {ctaField.value.text || 'Add to cart'}
                    </Link>
                  ) : (
                    <button className="w-[202px] h-[48px] flex items-center justify-center bg-white text-[#B88E2F] font-semibold text-[16px] font-poppins transition-colors duration-300 hover:bg-[#B88E2F] hover:text-white">
                      Add to cart
                    </button>
                  )}

                  {/* Secondary Actions (Share, Compare, Like) */}
                  <div className="flex items-center gap-5 text-white font-semibold text-[16px] font-poppins">
                    {/* Share */}
                    <button className="flex items-center gap-1 hover:text-[#B88E2F] transition-colors duration-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/>
                      </svg>
                      <span>Share</span>
                    </button>
                    {/* Compare */}
                    <button className="flex items-center gap-1 hover:text-[#B88E2F] transition-colors duration-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 3h5v5M8 21H3v-5M12 12V3M12 12h9M12 12v9M12 12H3"/>
                      </svg>
                      <span>Compare</span>
                    </button>
                    {/* Like */}
                    <button className="flex items-center gap-1 hover:text-[#B88E2F] transition-colors duration-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
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
          {datasource.showMoreLink?.jsonValue?.value?.href ? (
            <CompatibleLink
              field={datasource.showMoreLink.jsonValue}
              className="w-[245px] h-[48px] flex items-center justify-center border border-[#B88E2F] bg-white text-[#B88E2F] font-semibold text-[16px] font-poppins transition-all duration-300 hover:bg-[#B88E2F] hover:text-white"
            >
              {datasource.showMoreLink.jsonValue?.value?.text || 'Show More'}
            </CompatibleLink>
          ) : (
            <button className="w-[245px] h-[48px] flex items-center justify-center border border-[#B88E2F] bg-white text-[#B88E2F] font-semibold text-[16px] font-poppins transition-all duration-300 hover:bg-[#B88E2F] hover:text-white">
              Show More
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
