import React from 'react';
import {
  NextImage as ContentSdkImage,
  Text as ContentSdkText,
  ImageField,
  Field,
  LinkField,
} from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from '@/lib/component-props';
import { CompatibleLink } from '@/components/content-sdk/CompatibleLink';
import styles from '../../assets/components/ShopBanner/ShopBanner.module.css';
import logoImage from '../../assets/components/ShopBanner/Meubel_House_Logo.png';

interface Fields {
  PromoIcon?: ImageField;
  PromoText?: Field<string>;
  PromoLink?: LinkField;
  PromoText2?: Field<string>;
  PromoIcon2?: ImageField;
}

type ShopBannerProps = ComponentProps & {
  fields?: Fields | { data?: { datasource?: Fields } };
};

const NoDataFallback = ({ componentName }: { componentName: string }) => (
  <div className="p-8 border-2 border-dashed border-gray-300 text-center text-gray-500 rounded-lg my-4 bg-gray-50">
    Missing datasource for component: <strong>{componentName}</strong>. Please associate a datasource item in Sitecore.
  </div>
);

export const Default = (props: ShopBannerProps): React.JSX.Element => {
  const { fields, params } = props;
  const { RenderingIdentifier: id, styles: paramsStyles } = params || {};

  // Safely extract datasource fields regardless of layout service nesting
  const datasource = (fields as { data?: { datasource?: Fields } })?.data?.datasource || (fields as Fields);

  if (!datasource || (!datasource.PromoText && !datasource.PromoText2 && !datasource.PromoIcon)) {
    return <NoDataFallback componentName="ShopBanner" />;
  }

  const { PromoIcon, PromoText, PromoText2, PromoLink, PromoIcon2 } = datasource;
  const containerClass = `${styles.banner} ${paramsStyles || ''}`.trim();

  return (
    <section className={containerClass} id={id} data-testid="shop-banner">
      {/* Background Image Banner */}
      {PromoIcon && (
        <div className={styles.bannerBackground}>
          <ContentSdkImage
            field={PromoIcon}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      )}

      {/* Content Container */}
      <div className={styles.contentContainer}>
        {/* Optional Logo */}
        {PromoIcon2 && !!(PromoIcon2.value?.src || PromoIcon2.value?.mediaid) && (
          <div className={styles.logoContainer}>
            {PromoIcon2.value?.src?.includes('wireframe') || !PromoIcon2.value?.src ? (
              <img
                src={logoImage.src}
                alt={(PromoIcon2.value?.alt as string) || 'Logo'}
                width={77}
                height={77}
              />
            ) : (
              <ContentSdkImage
                field={PromoIcon2}
                className="w-full h-full object-contain"
              />
            )}
          </div>
        )}

        {/* Title */}
        {PromoText && (
          <ContentSdkText
            tag="h1"
            field={PromoText}
            className={styles.title}
          />
        )}

        {/* Breadcrumb Navigation */}
        <div className={styles.breadcrumb}>
          {PromoLink && (
            <CompatibleLink
              field={PromoLink}
              className={styles.breadcrumbLink}
            />
          )}

          {/* Chevron Separator */}
          {(PromoLink && PromoText2) && (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.breadcrumbSeparator}
              aria-hidden="true"
            >
              <path
                d="M8.33333 5L13.3333 10L8.33333 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {/* Active Breadcrumb Item */}
          {PromoText2 && (
            <ContentSdkText
              tag="span"
              field={PromoText2}
              className={styles.breadcrumbActive}
            />
          )}
        </div>
      </div>
    </section>
  );
};
