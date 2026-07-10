"use client";

import React, { JSX, useState, useEffect } from "react";
import {
  NextImage as ContentSdkImage,
  Link as ContentSdkLink,
  ImageField,
  LinkField,
} from "@sitecore-content-sdk/nextjs";
import { ComponentProps } from "lib/component-props";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import popoverStyles from "../../assets/components/HeaderPopover.module.css";

interface NavigationLinkItem {
  id: string;
  fields: {
    link?: LinkField;
    Link?: LinkField;
    label?: {
      value?: string;
    };
    Label?: {
      value?: string;
    };
  };
}

interface Fields {
  "Logo Image"?: ImageField;
  LogoImage?: ImageField;
  "Navigation Links"?: NavigationLinkItem[];
  NavigationLinks?: NavigationLinkItem[];
  "CTA Label"?: {
    value?: string;
  };
  CtaLabel?: {
    value?: string;
  };
  "CTA Link"?: LinkField;
  CtaLink?: LinkField;
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
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
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

const getAvatarLetter = (email: string) => {
  if (!email) return "A";
  return email.charAt(0).toUpperCase();
};

const getAvatarColor = (email: string) => {
  if (!email) return "#0f9d58";
  const colors = [
    "#0f9d58",
    "#4285f4",
    "#db4437",
    "#f4b400",
    "#b88e2f",
    "#673ab7",
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getGreetingName = (email: string) => {
  if (!email) return "User";
  const prefix = email.split("@")[0];
  const clean = prefix.split(/[._\d-]+/)[0];
  if (!clean) return "User";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

export const Default = (props: HeaderProps): JSX.Element => {
  const { fields, params } = props;
  const { user, signOutUser } = useAuth();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      user
        .getIdTokenResult()
        .then((idTokenResult) => {
          const role = idTokenResult.claims.role;
          const isUserAdmin = idTokenResult.claims.isAdmin || role === "admin";
          setIsAdmin(!!isUserAdmin);
        })
        .catch((err) => {
          console.error("Error getting user claims:", err);
          setIsAdmin(false);
        });
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const renderPopover = () => {
    if (user) {
      const email = user.email || "";
      const letter = getAvatarLetter(email);
      const color = getAvatarColor(email);
      const greetingName = getGreetingName(email);

      return (
        <div className={popoverStyles.accountPopover}>
          {/* Close Button */}
          <button
            className={popoverStyles.closeButton}
            onClick={() => setIsPopupOpen(false)}
            aria-label="Close Account Menu"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>

          {/* Email Address */}
          <div className={popoverStyles.headerEmail}>{email}</div>

          {/* Center Avatar */}
          <div className={popoverStyles.avatarContainer}>
            <div
              className={popoverStyles.avatarCircle}
              style={{ "--avatar-bg": color } as React.CSSProperties}
            >
              {letter}
            </div>
            {/* Camera Overlay Icon */}
            <div
              className={popoverStyles.cameraOverlay}
              title="Change Profile Picture"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
              >
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
              </svg>
            </div>
          </div>

          {/* Greeting */}
          <h3 className={popoverStyles.greeting}>Hi, {greetingName}!</h3>

          {/* Manage Account Pill Button */}
          <Link
            href="/sign-in"
            className={popoverStyles.manageButton}
            onClick={() => setIsPopupOpen(false)}
            style={isAdmin ? { marginBottom: "16px" } : undefined}
          >
            Manage your Account
          </Link>

          {/* Admin Dashboard Pill Button (Visible only to owners/admins) */}
          {isAdmin && (
            <Link
              href="/admin"
              className={popoverStyles.adminDashboardButton}
              onClick={() => setIsPopupOpen(false)}
            >
              Admin Dashboard
            </Link>
          )}

          {/* Sign Out Button */}
          <div className={popoverStyles.signOutButtonContainer}>
            <button
              className={popoverStyles.signOutBtn}
              onClick={() => {
                setIsPopupOpen(false);
                handleSignOut();
              }}
            >
              {/* Exit/Sign Out Icon */}
              <svg
                className={popoverStyles.exitIcon}
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>

          {/* Footer Policy Links */}
          <div className={popoverStyles.popoverFooter}>
            <a href="#" className={popoverStyles.footerLink}>
              Privacy Policy
            </a>
            <span className={popoverStyles.footerDot}>•</span>
            <a href="#" className={popoverStyles.footerLink}>
              Terms of Service
            </a>
          </div>
        </div>
      );
    } else {
      return (
        <div className={popoverStyles.accountPopover}>
          {/* Close Button */}
          <button
            className={popoverStyles.closeButton}
            onClick={() => setIsPopupOpen(false)}
            aria-label="Close Account Menu"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>

          <div className={popoverStyles.loggedOutCard}>
            <h3 className={popoverStyles.loggedOutTitle}>
              You are not signed in
            </h3>
            <p className={popoverStyles.loggedOutText}>
              Please sign in to access your account profile.
            </p>
            <Link
              href="/sign-in"
              className={popoverStyles.signInBtn}
              onClick={() => setIsPopupOpen(false)}
            >
              Sign In
            </Link>
          </div>
        </div>
      );
    }
  };

  const styles = `header ${params?.styles || ""}`.trim();
  const id = params?.RenderingIdentifier;

  const logoImage = fields?.["Logo Image"] || fields?.LogoImage;

  const dataSourcePath = props.rendering?.dataSource || "";
  const getSiteNameFromPath = (path: string) => {
    const parts = path.split("/");
    if (parts[1] === "sitecore" && parts[2] === "content") {
      return parts[3];
    }
    return "";
  };
  const siteName = "Furnio";

  const navigationLinksField =
    fields?.["Navigation Links"] || fields?.NavigationLinks;
  const navigationLinks = Array.isArray(navigationLinksField)
    ? navigationLinksField
    : [
        {
          id: "default-home",
          fields: {
            link: { value: { href: "/" } },
            label: { value: "Home" },
          },
        },
        {
          id: "default-shop",
          fields: {
            link: { value: { href: "/shop" } },
            label: { value: "Shop" },
          },
        },
        {
          id: "default-about",
          fields: {
            link: { value: { href: "/About" } },
            label: { value: "About" },
          },
        },
        {
          id: "default-contact",
          fields: {
            link: { value: { href: "/contact" } },
            label: { value: "Contact" },
          },
        },
      ];

  const ctaLinkField = fields?.["CTA Link"] ||
    fields?.CtaLink || {
      value: {
        href: "/",
        text: "Get Started",
      },
    };
  const ctaLabelText =
    fields?.["CTA Label"]?.value ||
    fields?.CtaLabel?.value ||
    ctaLinkField.value?.text ||
    ctaLinkField.value?.title ||
    "";

  return (
    <header className={styles} id={id}>
      {/* Logo */}
      <a href="/" className="header__logo" aria-label="Furniro Home">
        {logoImage?.value?.src ? (
          <ContentSdkImage field={logoImage} alt="Logo" />
        ) : (
          <>
            <LogoMark />
            <span className="header__logo-text">{siteName}</span>
          </>
        )}
      </a>

      {/* Navigation */}
      <nav className="header__nav" aria-label="Main navigation">
        {navigationLinks.map((item) => {
          const linkField = item?.fields?.link || item?.fields?.Link;
          if (!linkField?.value?.href) return null;
          const labelText =
            item?.fields?.label?.value ||
            item?.fields?.Label?.value ||
            linkField?.value?.text ||
            linkField?.value?.title ||
            "Link";
          return (
            <ContentSdkLink
              key={item.id}
              field={linkField}
              className="header__nav-link"
            >
              {labelText}
            </ContentSdkLink>
          );
        })}
      </nav>

      {/* Action Icons */}
      <div className="header__icons" role="group" aria-label="User actions">
        {/* Account Dropdown Trigger and Popup */}
        <div className={popoverStyles.popoverWrapper}>
          {user ? (
            <button
              className={popoverStyles.headerAvatarCircle}
              onClick={() => setIsPopupOpen(!isPopupOpen)}
              aria-label="Account Menu"
              style={
                {
                  "--avatar-bg": getAvatarColor(user.email || "A"),
                } as React.CSSProperties
              }
            >
              {getAvatarLetter(user.email || "A")}
            </button>
          ) : (
            <button
              className="header__icon-btn"
              onClick={() => setIsPopupOpen(!isPopupOpen)}
              aria-label="Account Menu"
            >
              <AccountIcon />
            </button>
          )}

          {isPopupOpen && renderPopover()}
        </div>
        <a href="/Search" className="header__icon-btn" aria-label="Search">
          <SearchIcon />
        </a>
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
