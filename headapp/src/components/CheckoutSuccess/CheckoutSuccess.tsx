"use client";

import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./CheckoutSuccess.module.css";

export default function CheckoutSuccess(): React.JSX.Element {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setOrderId(params.get("orderId"));
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <svg
            className={styles.successIcon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className={styles.title}>{t('CheckoutSuccess-PaymentSuccessful')}</h1>
        <p className={styles.subtitle}>
          {t('CheckoutSuccess-ThankYouForYour')}
        </p>

        {orderId && (
          <div className={styles.orderIdBox}>
            <span className={styles.label}>{t('CheckoutSuccess-OrderId')}</span>
            <span className={styles.value}>{orderId}</span>
          </div>
        )}

        <div className={styles.btnGroup}>
          <Link href="/profile?tab=orders" className={styles.btnPrimary}>
            {t('CheckoutSuccess-ViewOrders')}
          </Link>
          <Link href="/shop" className={styles.btnSecondary}>
            {t('Global-ContinueShopping')}
          </Link>
        </div>
      </div>
    </div>
  );
}
