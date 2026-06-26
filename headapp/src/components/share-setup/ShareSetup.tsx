import React, { JSX } from 'react';
import {
  Text,
  Field,
  ImageField,
  NextImage as ContentSdkImage
} from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from 'lib/component-props';
import styles from '../../assets/components/ShareSetup/ShareSetup.module.css';

interface ShareSetupImageItem {
  image?: {
    jsonValue?: ImageField;
  };
}

interface ShareSetupFields {
  data?: {
    datasource?: {
      title?: {
        jsonValue?: Field<string>;
      };
      subtitle?: {
        jsonValue?: Field<string>;
      };
      images?: {
        results: ShareSetupImageItem[];
      };
    };
  };
}

type ShareSetupProps = ComponentProps & {
  fields: ShareSetupFields;
};

const ShareSetupFallback: React.FC<ComponentProps> = ({ params }) => (
  <section className={`component share-component ${params.styles || ''}`.trim()}>
    <div className="component-content text-center py-10 bg-slate-50 rounded-lg max-w-7xl mx-auto px-4">
      <span className="text-gray-400 font-semibold">Share your setup with #FuniroFurniture (No Datasource)</span>
    </div>
  </section>
);

export const Default = (props: ShareSetupProps): JSX.Element => {
  const { fields, params } = props;
  const datasource = fields?.data?.datasource;
  const containerClass = `${styles.shareContainer} ${params.styles || ''}`.trim();
  const id = params.RenderingIdentifier;

  if (!datasource) {
    return <ShareSetupFallback {...props} />;
  }

  const imageList = datasource.images?.results || [];
  const imageClasses = [
    'item36', // top left
    'item37', // bottom left
    'item38', // top inner left
    'item39', // bottom inner left
    'item40', // center
    'item43', // top inner right
    'item41', // bottom inner right
    'item44', // bottom outer right
    'item45'  // top outer right
  ];

  return (
    <section className={containerClass} id={id || undefined}>
      <div className="w-[100%] flex flex-col items-center relative">
        <div className={styles.shareHeader}>
          {datasource.title?.jsonValue?.value && (
            <Text
              tag="p"
              className={styles.shareTagline}
              field={datasource.title.jsonValue}
            />
          )}
          {datasource.subtitle?.jsonValue?.value && (
            <Text
              tag="h2"
              className={styles.shareTitle}
              field={datasource.subtitle.jsonValue}
            />
          )}
        </div>

        <div className={styles.galleryWrapper}>
          <div className={styles.galleryInner}>
            {imageClasses.map((className, index) => {
              const imageItem = imageList[index];
              const imageField = imageItem?.image?.jsonValue;
              const hasImage = !!imageField?.value?.src;

              if (!hasImage) return null;

              const resolvedItemClass = `${styles.galleryItem} ${styles[className] || ''}`.trim();

              return (
                <div key={index} className={resolvedItemClass}>
                  <ContentSdkImage
                    field={imageField}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 400px"
                    className="object-cover w-full h-full"
                    alt={((imageField?.value?.alt as string) || `Setup ${index + 1}`)}
                    unoptimized={true}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
