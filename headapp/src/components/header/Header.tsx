import React, { JSX } from 'react';
import {
  NextImage as ContentSdkImage,
  ImageField,
} from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from 'lib/component-props';

interface Fields {
  'Logo Image'?: ImageField;
  LogoImage?: ImageField;
}

type HeaderProps = ComponentProps & {
  fields: Fields;
};

// Inline SVG icons matching Figma icon set (28x28)
const AccountIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* mdi:account-alert-outline */}
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    <circle cx="12" cy="7" r="4" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="12" y1="19" x2="12.01" y2="19" />
  </svg>
);

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* akar-icons:search */}
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="22" y2="22" />
  </svg>
);

const HeartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* akar-icons:heart */}
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* ant-design:shopping-cart-outlined */}
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

// Furniro logo mark (simplified chair/furniture icon)
const LogoMark = () => (
  <svg
    width="50"
    height="32"
    viewBox="0 0 50 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="5" y="18" width="40" height="6" rx="2" fill="#B88E2F" />
    <rect x="5" y="4" width="40" height="12" rx="2" fill="#B88E2F" />
    <rect x="8" y="24" width="6" height="8" rx="1" fill="#B88E2F" />
    <rect x="36" y="24" width="6" height="8" rx="1" fill="#B88E2F" />
  </svg>
);

export const Default = (props: HeaderProps): JSX.Element => {
  const { fields, params } = props;
  const styles = `header ${params?.styles || ''}`.trim();
  const id = params?.RenderingIdentifier;

  const logoImage = fields?.['Logo Image'] || fields?.LogoImage;

  return (
    <header className={styles} id={id}>
      {/* Logo */}
      <a href="/" className="header__logo" aria-label="Furniro Home">
        {logoImage?.value?.src ? (
          <ContentSdkImage field={logoImage} alt="Furniro logo" />
        ) : (
          <LogoMark />
        )}
        <span className="header__logo-text">Furniro</span>
      </a>

      {/* Navigation */}
      <nav className="header__nav" aria-label="Main navigation">
        <a href="/" className="header__nav-link">
          Home
        </a>
        <a href="/shop" className="header__nav-link">
          Shop
        </a>
        <a href="/about" className="header__nav-link">
          About
        </a>
        <a href="/contact" className="header__nav-link">
          Contact
        </a>
      </nav>

      {/* Action Icons */}
      <div className="header__icons" role="group" aria-label="User actions">
        <button className="header__icon-btn" aria-label="Account">
          <AccountIcon />
        </button>
        <button className="header__icon-btn" aria-label="Search">
          <SearchIcon />
        </button>
        <button className="header__icon-btn" aria-label="Wishlist">
          <HeartIcon />
        </button>
        <button className="header__icon-btn" aria-label="Shopping cart">
          <CartIcon />
        </button>
      </div>
    </header>
  );
};
