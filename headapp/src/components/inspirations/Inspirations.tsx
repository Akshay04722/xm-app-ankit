'use client';

import React, { JSX, useState } from 'react';
import {
  NextImage as ContentSdkImage,
  Text,
  Field,
  ImageField,
  LinkField,
  Link,
  RichText,
} from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from 'lib/component-props';
import { CompatibleLink } from 'components/content-sdk/CompatibleLink';

interface InspirationSlideItem {
  image?: {
    jsonValue?: ImageField;
  };
  slideNumber?: {
    jsonValue?: Field<string>;
  };
  category?: {
    jsonValue?: Field<string>;
  };
  title?: {
    jsonValue?: Field<string>;
  };
  link?: {
    jsonValue?: LinkField;
  };
}

interface InspirationsFields {
  data?: {
    datasource?: {
      title?: {
        jsonValue?: Field<string>;
      };
      description?: {
        jsonValue?: Field<string>;
      };
      exploreMoreLink?: {
        jsonValue?: LinkField;
      };
      slides?: {
        results: InspirationSlideItem[];
      };
    };
  };
}

type InspirationsProps = ComponentProps & {
  fields: InspirationsFields;
};

const NoDataFallback = ({ componentName }: { componentName: string }) => (
  <div className="component-content text-center py-10 bg-slate-50 rounded-lg">
    <span className="text-gray-400 font-semibold">{componentName} (Empty Datasource)</span>
  </div>
);

export const Default = (props: InspirationsProps): JSX.Element => {
  const { fields, params } = props;
  const datasource = fields?.data?.datasource;
  const styles = `component inspirations w-full bg-[#FCF8F3] overflow-hidden ${params.styles || ''}`.trim();
  const id = params.RenderingIdentifier;

  const [activeIndex, setActiveIndex] = useState<number>(0);

  if (!datasource) {
    return <NoDataFallback componentName="Inspirations" />;
  }

  const titleField = datasource.title?.jsonValue;
  const descriptionField = datasource.description?.jsonValue;
  const exploreMoreField = datasource.exploreMoreLink?.jsonValue;
  const slides = datasource.slides?.results || [];

  const handleNextSlide = () => {
    if (slides.length > 0) {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }
  };

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
  };

  // Split title by \n or newline character to support br tags
  const renderTitle = (titleVal: string) => {
    const parts = titleVal.split(/\\n|\n/);
    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {part}
        {index < parts.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <section className={styles} id={id || undefined} role="region" aria-roledescription="carousel" aria-label="Inspirations">
      <div className="max-w-[1440px] mx-auto py-11 lg:py-[44px] pl-4 lg:pl-[100px] pr-4 lg:pr-0 flex flex-col lg:flex-row items-center gap-10 lg:gap-[64px]">
        {/* Left Side: Title, Description, and CTA */}
        <div className="w-full lg:max-w-[422px] flex-shrink-0 flex flex-col items-start text-left">
          {titleField?.value ? (
            <h2 className="text-[32px] md:text-[40px] font-bold text-[#3A3A3A] font-poppins leading-[1.2] mb-2">
              {renderTitle(titleField.value)}
            </h2>
          ) : null}

          {descriptionField?.value ? (
            <div className="text-[16px] font-medium text-[#616161] font-poppins leading-[1.5] mb-9">
              <RichText field={descriptionField} />
            </div>
          ) : null}

          {exploreMoreField?.value?.href ? (
            <CompatibleLink
              field={exploreMoreField}
              className="w-[176px] h-[48px] flex items-center justify-center bg-[#B88E2F] text-white font-semibold text-[16px] font-poppins transition-all duration-300 hover:bg-[#a67a24]"
            >
              {exploreMoreField.value.text || 'Explore More'}
            </CompatibleLink>
          ) : (
            <button className="w-[176px] h-[48px] flex items-center justify-center bg-[#B88E2F] text-white font-semibold text-[16px] font-poppins transition-all duration-300 hover:bg-[#a67a24]">
              Explore More
            </button>
          )}
        </div>

        {/* Right Side: Slider */}
        <div className="w-full flex-grow overflow-hidden relative flex flex-col gap-10">
          <div className="relative w-full flex items-start">
            {/* Slides Row */}
            <div
              className="flex items-end gap-6 transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${activeIndex * (372 + 24)}px)`,
              }}
            >
              {slides.map((slide, index) => {
                const isActive = index === activeIndex;
                const slideImageField = slide.image?.jsonValue;
                const slideNumField = slide.slideNumber?.jsonValue;
                const slideCategoryField = slide.category?.jsonValue;
                const slideTitleField = slide.title?.jsonValue;
                const slideLinkField = slide.link?.jsonValue;

                return (
                  <div
                    key={index}
                    className={`relative flex-shrink-0 transition-all duration-500 ease-in-out overflow-hidden ${
                      isActive ? 'w-[404px] h-[582px]' : 'w-[372px] h-[486px]'
                    }`}
                    aria-hidden={!isActive}
                  >
                    {/* Slide Image */}
                    {slideImageField?.value?.src ? (
                      <ContentSdkImage
                        field={slideImageField}
                        className="object-cover w-full h-full"
                        alt={slideTitleField?.value || 'Slide Image'}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}

                    {/* Active Slide Detail Overlay Box */}
                    {isActive && (
                      <div className="absolute bottom-6 left-6 flex items-end">
                        {/* Detail Box */}
                        <div className="w-[217px] h-[130px] p-8 bg-white/72 backdrop-blur-[1.5px] flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-2 text-[#616161] font-poppins font-medium text-[16px]">
                            {slideNumField?.value && <Text field={slideNumField} />}
                            <span className="w-[27px] h-[1px] bg-[#616161]" />
                            {slideCategoryField?.value && <Text field={slideCategoryField} />}
                          </div>
                          {slideTitleField?.value && (
                            <Text
                              tag="h3"
                              className="text-[28px] font-semibold text-[#3A3A3A] font-poppins leading-[1.2] truncate"
                              field={slideTitleField}
                            />
                          )}
                        </div>

                        {/* CTA Arrow Button */}
                        {slideLinkField?.value?.href ? (
                          <Link
                            field={slideLinkField}
                            className="w-12 h-12 flex items-center justify-center bg-[#B88E2F] text-white transition-all duration-300 hover:bg-[#a67a24]"
                            aria-label={`Explore details for ${slideTitleField?.value || 'slide'}`}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </Link>
                        ) : (
                          <button
                            className="w-12 h-12 flex items-center justify-center bg-[#B88E2F] text-white transition-all duration-300 hover:bg-[#a67a24]"
                            aria-label={`Explore details for ${slideTitleField?.value || 'slide'}`}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Slider Navigation Next Button (Figma right arrow #1148:168) */}
            {slides.length > 1 && (
              <button
                onClick={handleNextSlide}
                className="absolute left-[380px] top-[267px] w-12 h-12 rounded-full bg-white text-[#B88E2F] flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-[#B88E2F] hover:text-white z-30"
                style={{
                  transform: `translateX(-${activeIndex * 0}px)`, // Keep fixed relative to viewport/active slide if desired, or absolute on slider container
                }}
                aria-label="Next slide"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
          </div>

          {/* Dots Indicator (Figma #1147:161) */}
          {slides.length > 0 && (
            <div className="flex items-center gap-[20px] pl-[428px] md:pl-[428px]">
              {slides.map((_, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className="focus:outline-none flex items-center justify-center"
                    aria-label={`Go to slide ${index + 1}`}
                    aria-pressed={isActive}
                  >
                    {isActive ? (
                      /* Active dot outer border + active center dot */
                      <div className="w-[27px] h-[27px] rounded-full border border-[#B88E2F] flex items-center justify-center">
                        <div className="w-[11px] h-[11px] rounded-full bg-[#B88E2F]" />
                      </div>
                    ) : (
                      /* Inactive dot */
                      <div className="w-[11px] h-[11px] rounded-full bg-[#D8D8D8] transition-colors duration-300 hover:bg-[#B88E2F]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
