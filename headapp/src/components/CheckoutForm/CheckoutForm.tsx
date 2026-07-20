"use client";

import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import AddressDialog from "@/components/profile/AddressDialog";
import { Address } from "@/services/profileService";
import { Text, RichText } from "@sitecore-content-sdk/nextjs";
import Link from "next/link";
import styles from "./CheckoutForm.module.css";

interface CheckoutFormProps {
  fields?: {
    data?: {
      datasource?: {
        pageTitle?: { jsonValue?: { value?: string } };
        orderSummaryText?: { jsonValue?: { value?: string } };
        successRedirectUrl?: { jsonValue?: { value?: string } };
      };
    };
  };
}

export default function CheckoutForm(
  props: CheckoutFormProps,
): React.JSX.Element {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);
  const { fields } = props;
  const { datasource } = fields?.data || {};

  // Sitecore Fields
  const sitecoreTitle = datasource?.pageTitle?.jsonValue;
  const sitecoreSummaryText = datasource?.orderSummaryText?.jsonValue;
  const successRedirect =
    datasource?.successRedirectUrl?.jsonValue?.value || "/profile";

  // Contexts and Hooks
  const { cartItems, subtotal, clearCart } = useCart();
  const { user, userProfile } = useAuth();
  const { addresses, loading: loadingAddresses, addNewAddress } = useProfile();

  // State
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddressDialogOpen, setIsAddressDialogOpen] =
    useState<boolean>(false);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set default address on load
  useEffect(() => {
    if (addresses.length > 0) {
      const defaultAddr = addresses.find((addr) => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.addressId);
      } else {
        setSelectedAddressId(addresses[0].addressId);
      }
    }
  }, [addresses]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const formatPrice = (priceVal: number) => {
    return `₹${priceVal.toLocaleString("en-IN")}`;
  };

  const handleAddNewAddress = async (
    addressData: Omit<Address, "addressId" | "createdAt" | "updatedAt">,
  ): Promise<boolean> => {
    const success = await addNewAddress(addressData);
    if (success) {
      setIsAddressDialogOpen(false);
    }
    return success;
  };

  const handlePayment = async () => {
    if (!user) {
      setErrorMessage("Please sign in to proceed with checkout.");
      return;
    }

    if (!selectedAddressId) {
      setErrorMessage("Please select a shipping address.");
      return;
    }

    setPaymentLoading(true);
    setErrorMessage(null);

    try {
      // 1. Create order on server side
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          addressId: selectedAddressId,
          cartItems: cartItems.map((item) => ({
            id: item.id,
            sku: item.sku,
            quantity: item.quantity,
            selectedColor: item.selectedColor || "",
            selectedSize: item.selectedSize || "",
          })),
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || orderData.error) {
        throw new Error(orderData.error || "Failed to initiate payment.");
      }

      const { orderId, amount, currency, keyId } = orderData;

      // 2. Configure and open Razorpay Payment Modal
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "Furniro",
        description: "Order Checkout Payment",
        order_id: orderId,
        prefill: {
          name: `${userProfile?.firstName || ""} ${userProfile?.lastName || ""}`.trim(),
          email: user.email || "",
          contact: userProfile?.phoneNumber || "",
        },
        theme: {
          color: "#b88e2f",
        },
        handler: async (response: any) => {
          setPaymentLoading(true);
          try {
            // 3. Verify payment signature on the server
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: user.uid,
                addressId: selectedAddressId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                cartItems: cartItems,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || verifyData.error) {
              throw new Error(
                verifyData.error || "Payment verification failed.",
              );
            }

            // 4. Success handling
            clearCart();
            window.location.href = `/checkout/success?orderId=${response.razorpay_order_id}`;
          } catch (err: any) {
            console.error("Verification error:", err);
            window.location.href = `/checkout/error?error=${encodeURIComponent(err.message || "Payment verification failed")}`;
          }
        },
        modal: {
          ondismiss: async () => {
            setPaymentLoading(false);
            try {
              await fetch("/api/orders", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
              });
              window.location.href =
                "/checkout/error?error=Payment cancelled by user";
            } catch (err) {
              console.error("Failed to delete pending order on dismiss:", err);
            }
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Order creation error:", err);
      setErrorMessage(err.message || "Could not complete payment process.");
      setPaymentLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.authWrapper}>
          <h2>{t('CheckoutForm-PleaseLoginToCheckout')}</h2>
          <p>
            You need to be signed in to select a shipping address and complete
            your purchase.
          </p>
          <Link
            href="/sign-in?redirect=/checkout"
            className={styles.btnPrimary}
          >
            {t('Global-SignIn')}
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyCartWrapper}>
          <h2>{t('Global-YourCartIsEmpty')}</h2>
          <p>
            {t('CheckoutForm-PleaseAddSomeItems')}
          </p>
          <Link href="/shop" className={styles.btnPrimary}>
            {t('Global-BackToShop')}
          </Link>
        </div>
      </div>
    );
  }

  const selectedAddress = addresses.find(
    (addr) => addr.addressId === selectedAddressId,
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {sitecoreTitle?.value ? <Text field={sitecoreTitle} /> : t('Global-Checkout')}
        </h1>
        <div className={styles.subtitle}>
          {sitecoreSummaryText?.value ? (
            <RichText field={sitecoreSummaryText} />
          ) : (
            "Complete your order by choosing a delivery address and making a payment."
          )}
        </div>
      </div>

      {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}

      <div className={styles.checkoutLayout}>
        {/* Left Column: Shipping Address */}
        <div className={styles.shippingSection}>
          <div className={styles.sectionHeader}>
            <h2>{t('CheckoutForm-SelectDeliveryAddress')}</h2>
            <button
              type="button"
              onClick={() => setIsAddressDialogOpen(true)}
              className={styles.btnAddAddress}
            >
              {t('CheckoutForm-AddAddress')}
            </button>
          </div>

          {loadingAddresses ? (
            <div className={styles.loader}>{t('CheckoutForm-LoadingYourSavedAddresses')}</div>
          ) : addresses.length === 0 ? (
            <div className={styles.noAddressCard}>
              <p>
                No saved addresses found. Please add a shipping address to
                proceed.
              </p>
              <button
                type="button"
                onClick={() => setIsAddressDialogOpen(true)}
                className={styles.btnPrimary}
              >
                {t('CheckoutForm-AddShippingAddress')}
              </button>
            </div>
          ) : (
            <div className={styles.addressList}>
              {addresses.map((addr) => (
                <div
                  key={addr.addressId}
                  className={`${styles.addressCard} ${
                    selectedAddressId === addr.addressId
                      ? styles.addressCardSelected
                      : ""
                  }`}
                  onClick={() => setSelectedAddressId(addr.addressId)}
                >
                  <div className={styles.addressCardHeader}>
                    <span className={styles.addressName}>{addr.fullName}</span>
                    <span className={styles.addressTag}>
                      {addr.addressType}
                    </span>
                    {addr.isDefault && (
                      <span className={styles.defaultBadge}>{t('Global-Default')}</span>
                    )}
                  </div>
                  <div className={styles.addressDetails}>
                    <p>{addr.addressLine1}</p>
                    {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                    {addr.landmark && <p>{t('Global-Landmark')} {addr.landmark}</p>}
                    <p>
                      {addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                    <p>{addr.country}</p>
                    <p className={styles.addressPhone}>
                      {t('Global-Phone')} {addr.phoneNumber}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <div className={styles.summarySection}>
          <h2>{t('CheckoutForm-OrderSummary')}</h2>
          <div className={styles.summaryItems}>
            {cartItems.map((item) => {
              const activePrice = item.price;
              return (
                <div
                  key={`${item.sku}-${item.selectedColor || ""}-${item.selectedSize || ""}`}
                  className={styles.summaryItem}
                >
                  <div className={styles.itemImageWrapper}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className={styles.itemImage}
                      />
                    ) : (
                      <div className={styles.imagePlaceholder} />
                    )}
                  </div>
                  <div className={styles.itemDetails}>
                    <div className={styles.itemTitle}>{item.title}</div>
                    <div className={styles.itemMeta}>
                      {t('CheckoutForm-Qty')} {item.quantity}
                      {item.selectedColor && ` | Color: ${item.selectedColor}`}
                      {item.selectedSize && ` | Size: ${item.selectedSize}`}
                    </div>
                  </div>
                  <div className={styles.itemPrice}>
                    {formatPrice(activePrice * item.quantity)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.summaryTotals}>
            <div className={styles.totalsRow}>
              <span>{t('Global-Subtotal')}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className={styles.totalsRow}>
              <span>{t('Global-Shipping')}</span>
              <span className={styles.freeShipping}>{t('Global-Free')}</span>
            </div>
            <div className={`${styles.totalsRow} ${styles.totalsRowTotal}`}>
              <span>{t('CheckoutForm-TotalAmount')}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>

          {selectedAddress && (
            <div className={styles.selectedAddressPreview}>
              <h3>{t('CheckoutForm-DeliverTo')}</h3>
              <p>
                <strong>{selectedAddress.fullName}</strong> (
                {selectedAddress.addressType})
              </p>
              <p>
                {selectedAddress.addressLine1}, {selectedAddress.city} -{" "}
                {selectedAddress.postalCode}
              </p>
            </div>
          )}

          <button
            type="button"
            disabled={paymentLoading || !selectedAddressId}
            onClick={handlePayment}
            className={styles.btnPay}
          >
            {paymentLoading ? t('CheckoutForm-ProcessingPayment') : t('CheckoutForm-PayWithRazorpay')}
          </button>
        </div>
      </div>

      {/* Reusable Address Dialog */}
      <AddressDialog
        isOpen={isAddressDialogOpen}
        onClose={() => setIsAddressDialogOpen(false)}
        onSubmit={handleAddNewAddress}
        saving={false}
      />
    </div>
  );
}
