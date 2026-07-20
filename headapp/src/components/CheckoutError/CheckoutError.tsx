"use client";

import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./CheckoutError.module.css";

export default function CheckoutError(): React.JSX.Element {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);
  const [errorReason, setErrorReason] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setErrorReason(params.get("error"));
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <svg
            className={styles.errorIcon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className={styles.title}>{t('CheckoutError-PaymentFailed')}</h1>
        <p className={styles.subtitle}>
          {t('CheckoutError-UnfortunatelyWeCouldNot')}
        </p>

        {errorReason && (
          <div className={styles.errorBox}>
            <span className={styles.label}>{t('Global-Reason')}</span>
            <span className={styles.value}>{errorReason}</span>
          </div>
        )}

        <div className={styles.btnGroup}>
          <Link href="/checkout" className={styles.btnPrimary}>
            {t('CheckoutError-RetryCheckout')}
          </Link>
          <Link href="/shop" className={styles.btnSecondary}>
            {t('Global-BackToShop')}
          </Link>
        </div>
      </div>
    </div>
  );
}
