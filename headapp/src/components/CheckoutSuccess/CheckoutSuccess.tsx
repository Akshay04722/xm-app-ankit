"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./CheckoutSuccess.module.css";

export default function CheckoutSuccess(): React.JSX.Element {
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

        <h1 className={styles.title}>Payment Successful!</h1>
        <p className={styles.subtitle}>
          Thank you for your purchase. Your order has been placed successfully.
        </p>

        {orderId && (
          <div className={styles.orderIdBox}>
            <span className={styles.label}>Order ID:</span>
            <span className={styles.value}>{orderId}</span>
          </div>
        )}

        <div className={styles.btnGroup}>
          <Link href="/profile?tab=orders" className={styles.btnPrimary}>
            View Orders
          </Link>
          <Link href="/shop" className={styles.btnSecondary}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
