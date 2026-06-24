import React from 'react';
import {
  NextImage as ContentSdkImage,
  RichText as ContentSdkRichText,
  ImageField,
  Field,
  LinkField,
} from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from '@/lib/component-props';
import { CompatibleLink } from '@/components/content-sdk/CompatibleLink';

interface Fields {
  PromoIcon?: ImageField;
  PromoText?: Field<string>;
  PromoLink?: LinkField;
  PromoText2?: Field<string>;
  PromoText3?: Field<string>;
  PromoIcon2?: ImageField;
}

type HeroPromoProps = ComponentProps & {
  fields?: Fields | { data?: { datasource?: Fields } };
};

const NoDataFallback = ({ componentName }: { componentName: string }) => (
  <div className="p-8 border-2 border-dashed border-gray-300 text-center text-gray-500 rounded-lg my-4 bg-gray-50">
    Missing datasource for component: <strong>{componentName}</strong>. Please associate a datasource item in Sitecore.
  </div>
);

export const Default = (props: HeroPromoProps): React.JSX.Element => {
  const { fields, params } = props;
  const { styles, RenderingIdentifier: id } = params || {};

  // Safely extract datasource fields regardless of layout service nesting
  const datasource = (fields as { data?: { datasource?: Fields } })?.data?.datasource || (fields as Fields);

  if (!datasource || (!datasource.PromoText && !datasource.PromoText2 && !datasource.PromoIcon)) {
    return <NoDataFallback componentName="HeroPromo" />;
  }

  const { PromoIcon, PromoText, PromoText2, PromoText3, PromoLink } = datasource;

  return (
    <section
      className={`relative w-full min-h-[600px] md:min-h-[716px] flex items-center justify-center lg:justify-end px-4 md:px-12 lg:px-24 py-16 overflow-hidden ${styles || ''}`}
      id={id}
    >
      {/* Background Image using ContentSdkImage absolute fill */}
      {PromoIcon && (
        <div className="absolute inset-0 w-full h-full z-0">
          <ContentSdkImage
            field={PromoIcon}
            className="w-full h-full object-cover object-center"
          />
        </div>
      )}

      {/* Hero Content Card */}
      <div className="relative z-10 w-full max-w-[643px] bg-[#FFF3E3] rounded-[10px] p-6 md:p-10 lg:p-[62px] shadow-lg flex flex-col gap-4 md:gap-6 transition-transform duration-500 hover:scale-[1.01]">
        {/* Tagline / Subtitle */}
        {PromoText3 && (
          <div className="field-promotext3">
            <ContentSdkRichText
              field={PromoText3}
              className="font-semibold text-sm md:text-base tracking-[0.1875em] text-[#333333] uppercase"
            />
          </div>
        )}

        {/* Title */}
        {PromoText && (
          <div className="field-promotext">
            <ContentSdkRichText
              field={PromoText}
              className="font-bold text-3xl md:text-4xl lg:text-[52px] lg:leading-[65px] text-[#B88E2F]"
            />
          </div>
        )}

        {/* Description */}
        {PromoText2 && (
          <div className="field-promotext2">
            <ContentSdkRichText
              field={PromoText2}
              className="font-medium text-base md:text-lg leading-relaxed text-[#333333]"
            />
          </div>
        )}

        {/* CTA Link / Button */}
        {PromoLink && (
          <div className="field-promolink mt-2">
            <CompatibleLink
              field={PromoLink}
              className="inline-block bg-[#B88E2F] hover:bg-[#a17c29] text-white font-bold text-sm md:text-base uppercase tracking-wider px-8 py-4 md:px-[72px] md:py-[25px] rounded-[4px] transition-all duration-300 self-start text-center"
            />
          </div>
        )}
      </div>
    </section>
  );
};
