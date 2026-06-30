import React, { JSX } from 'react';
import {
  NextImage as ContentSdkImage,
  Text,
  Field,
  ImageField,
  LinkField,
} from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from 'lib/component-props';
import { CompatibleLink } from 'components/content-sdk/CompatibleLink';

interface CategoryItem {
  nameField?: {
    jsonValue?: Field<string>;
  };
  image?: {
    jsonValue?: ImageField;
  };
  link?: {
    jsonValue?: LinkField;
  };
}

interface BrowseTheRangeFields {
  data?: {
    datasource?: {
      title?: {
        jsonValue?: Field<string>;
      };
      subtitle?: {
        jsonValue?: Field<string>;
      };
      categories?: {
        results: CategoryItem[];
      };
    };
  };
}

type BrowseTheRangeProps = ComponentProps & {
  fields: BrowseTheRangeFields;
};

const BrowseTheRangeDefault: React.FC<ComponentProps> = ({ params }) => (
  <section className={`component browse-the-range w-full ${params.styles || ''}`.trim()}>
    <div className="component-content text-center py-10 bg-slate-50 rounded-lg">
      <span className="text-gray-400 font-semibold">Browse The Range (Empty Datasource)</span>
    </div>
  </section>
);

export const Default = (props: BrowseTheRangeProps): JSX.Element => {
  const { fields, params } = props;
  const datasource = fields?.data?.datasource;
  const styles = `component browse-the-range w-full ${params.styles || ''}`.trim();
  const id = params.RenderingIdentifier;

  if (!datasource) {
    return <BrowseTheRangeDefault {...props} />;
  }

  const categories = datasource.categories?.results || [];  
  return (
    <section className={styles} id={id || undefined}>
      <div className="component-content max-w-[1240px] mx-auto px-4 py-12">
        {/* Section Header */}
        <div className="text-center mb-12">
          {datasource.title?.jsonValue?.value && (
            <Text
              tag="h2"
              className="text-[32px] font-bold text-[#333333] mb-2 font-poppins text-center"
              field={datasource.title.jsonValue}
            />
          )}
          {datasource.subtitle?.jsonValue?.value && (
            <Text
              tag="p"
              className="text-[20px] font-normal text-[#666666] font-poppins ml-auto mr-auto text-center"
              field={datasource.subtitle.jsonValue}
            />
          )}
        </div>

        {/* Grid of Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[20px] justify-items-center">
          {categories.map((category, index) => {
            const imageField = category.image?.jsonValue;
            const linkField = category.link?.jsonValue;
            const nameField = category.nameField?.jsonValue;

            const hasImage = !!imageField?.value?.src;
            const hasLink = !!linkField?.value?.href;

            const cardContent = (
              <div className="group flex flex-col items-center cursor-pointer w-full max-w-[381px] transition-all duration-300">
                {/* Image Wrapper */}
                <div className="relative w-full h-[480px] overflow-hidden rounded-[10px] bg-gray-100 shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                  {hasImage ? (
                    <ContentSdkImage
                      field={imageField}
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 380px"
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  {/* Subtle glass overlay on hover */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>

                {/* Title */}
                {nameField?.value && (
                  <Text
                    tag="h3"
                    className="mt-[30px] text-[24px] font-semibold text-[#333333] font-poppins text-center transition-colors duration-300 group-hover:text-[#b88e2f]"
                    field={nameField}
                  />
                )}
              </div>
            );

            return (
              <div key={index} className="w-full flex justify-center">
                {hasLink ? (
                  <CompatibleLink field={linkField as LinkField} className="w-full flex justify-center no-underline">
                    {cardContent}
                  </CompatibleLink>
                ) : (
                  cardContent
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
