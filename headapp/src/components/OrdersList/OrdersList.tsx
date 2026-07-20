"use client";

import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import styles from "./OrdersList.module.css";

interface OrderItem {
  sku: string;
  title: string;
  image?: string;
  price: number;
  discountPrice?: number;
  activePrice: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  itemTotal: number;
}

interface OrderAddress {
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  addressType: string;
}

interface Order {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  status: "pending" | "success" | "failed" | "cancelled" | "returned";
  createdAt: string;
  updatedAt?: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  address?: OrderAddress;
  cart?: OrderItem[];
  cancelReason?: string;
  cancelledAt?: string;
  addressId?: string;
  returnReason?: string;
  returnComment?: string;
  returnedAt?: string;
  refund?: {
    refundId: string;
    status: string;
    amount: number;
    createdAt: string;
  };
}

interface OrdersListProps {
  embedded?: boolean;
}

export default function OrdersList({ embedded = false }: OrdersListProps): React.JSX.Element {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  
  const [returningOrderId, setReturningOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState<string>("Wrong size/fit");
  const [returnComment, setReturnComment] = useState<string>("");
  const [returnLoading, setReturnLoading] = useState<boolean>(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [keyId, setKeyId] = useState<string | null>(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCompletePayment = async (order: Order) => {
    if (!user) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      const resScript = await loadRazorpayScript();
      if (!resScript) {
        throw new Error("Razorpay SDK failed to load. Are you online?");
      }

      const options = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(order.amount * 100),
        currency: "INR",
        name: "Furniro",
        description: "Complete Order Payment",
        order_id: order.id,
        prefill: {
          name: order.address?.fullName || "",
          contact: order.address?.phoneNumber || "",
          email: user.email || "",
        },
        theme: {
          color: "#b88e2f",
        },
        handler: async (response: any) => {
          setCancelLoading(true);
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: user.uid,
                addressId: order.addressId || "",
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                cartItems: order.cart,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || verifyData.error) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            setOrders((prev) =>
              prev.map((o) =>
                o.id === order.id
                  ? {
                      ...o,
                      status: "success" as any,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      updatedAt: new Date().toISOString(),
                    }
                  : o
              )
            );

            setSelectedOrder((prev) =>
              prev && prev.id === order.id
                ? {
                    ...prev,
                    status: "success" as any,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    updatedAt: new Date().toISOString(),
                  }
                : prev
            );
          } catch (err: any) {
            console.error("Verification error:", err);
            setCancelError(err.message || "Payment verification failed.");
          } finally {
            setCancelLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setCancelLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Payment trigger error:", err);
      setCancelError(err.message || "Could not launch payment gate.");
      setCancelLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!cancelReason.trim() || !user) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          reason: cancelReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to cancel order");
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "cancelled" as any,
                cancelReason: cancelReason,
                cancelledAt: new Date().toISOString(),
              }
            : o
        )
      );

      setSelectedOrder((prev) =>
        prev && prev.id === orderId
          ? {
              ...prev,
              status: "cancelled" as any,
              cancelReason: cancelReason,
              cancelledAt: new Date().toISOString(),
            }
          : prev
      );

      setCancellingOrderId(null);
      setCancelReason("");
    } catch (err: any) {
      console.error(err);
      setCancelError(err.message || "Failed to cancel order.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReturnOrder = async (orderId: string) => {
    if (!returnReason.trim() || !user) return;
    setReturnLoading(true);
    setReturnError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/orders/return", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          reason: returnReason,
          comment: returnComment,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to return order");
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "returned" as any,
                returnReason: returnReason,
                returnComment: returnComment,
                returnedAt: new Date().toISOString(),
              }
            : o
        )
      );

      setSelectedOrder((prev) =>
        prev && prev.id === orderId
          ? {
              ...prev,
              status: "returned" as any,
              returnReason: returnReason,
              returnComment: returnComment,
              returnedAt: new Date().toISOString(),
            }
          : prev
      );

      setReturningOrderId(null);
      setReturnReason("Wrong size/fit");
      setReturnComment("");
    } catch (err: any) {
      console.error(err);
      setReturnError(err.message || "Failed to return order.");
    } finally {
      setReturnLoading(false);
    }
  };

  useEffect(() => {
    async function fetchOrders() {

      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to load orders");
        }
        setOrders(data.orders || []);
        setKeyId(data.keyId || null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load orders.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user]);

  const handleDownloadInvoice = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download/print the invoice.");
      return;
    }

    const itemsHtml = order.cart
      ?.map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${item.title}</strong><br/>
          <small style="color: #666;">SKU: ${item.sku} ${item.selectedColor ? `| Color: ${item.selectedColor}` : ""} ${item.selectedSize ? `| Size: ${item.selectedSize}` : ""}</small>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.activePrice.toLocaleString("en-IN")}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.itemTotal.toLocaleString("en-IN")}</td>
      </tr>
    `
      )
      .join("");

    const invoiceContent = `
      <html>
        <head>
          <title>Invoice - ${order.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #3A3A3A; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #B88E2F; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #B88E2F; }
            .invoice-title { font-size: 24px; text-transform: uppercase; color: #333; text-align: right; }
            .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .meta-block h4 { margin: 0 0 10px 0; color: #B88E2F; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .meta-block p { margin: 4px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background-color: #FAF4EB; color: #B88E2F; padding: 12px; text-align: left; font-weight: 600; }
            .total-table { width: 300px; margin-left: auto; font-size: 16px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .total-row-final { font-size: 20px; font-weight: bold; color: #B88E2F; border-top: 2px solid #B88E2F; padding-top: 10px; }
            .footer { text-align: center; margin-top: 80px; font-size: 12px; color: #898989; border-top: 1px solid #eee; padding-top: 20px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; display: flex; gap: 10px;">
            <button onclick="window.print()" style="padding: 10px 20px; background-color: #B88E2F; color: white; border: none; font-weight: bold; cursor: pointer; border-radius: 4px;">Print / Save as PDF</button>
            <button onclick="window.close()" style="padding: 10px 20px; background-color: #FAF4EB; color: #B88E2F; border: 1px solid #B88E2F; font-weight: bold; cursor: pointer; border-radius: 4px;">Close Window</button>
          </div>
          <div class="header">
            <div>
              <div class="logo">Furniro.</div>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #898989;">Premium Home & Living Spaces</p>
            </div>
            <div>
              <div class="invoice-title">Tax Invoice</div>
              <p style="margin: 5px 0 0 0; font-size: 14px; text-align: right;"><strong>Order ID:</strong> ${order.id}</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; text-align: right;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
            </div>
          </div>
          <div class="meta-grid">
            <div class="meta-block">
              <h4>Billed To:</h4>
              <p><strong>Name:</strong> ${order.address?.fullName || "Guest Customer"}</p>
              <p><strong>Address:</strong> ${order.address?.addressLine1 || ""}</p>
              ${order.address?.addressLine2 ? `<p>${order.address.addressLine2}</p>` : ""}
              <p>${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.postalCode || ""}</p>
              <p><strong>Country:</strong> ${order.address?.country || ""}</p>
              <p><strong>Phone:</strong> ${order.address?.phoneNumber || ""}</p>
            </div>
            <div class="meta-block">
              <h4>Payment Details:</h4>
              <p><strong>Status:</strong> Successful</p>
              <p><strong>Payment ID:</strong> ${order.razorpay_payment_id || "N/A"}</p>
              <p><strong>Order ID:</strong> ${order.razorpay_order_id || "N/A"}</p>
              <p><strong>Delivery Method:</strong> Free Standard Shipping</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Item Details</th>
                <th style="width: 10%; text-align: center;">Qty</th>
                <th style="width: 20%; text-align: right;">Unit Price</th>
                <th style="width: 20%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total-table">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${order.amount.toLocaleString("en-IN")}</span>
            </div>
            <div class="total-row">
              <span>Shipping:</span>
              <span style="color: green; font-weight: bold;">FREE</span>
            </div>
            <div class="total-row total-row-final">
              <span>Total Paid:</span>
              <span>₹${order.amount.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for shopping with Furniro! If you have any questions about this invoice, please contact support.</p>
            <p>&copy; 2026 Furniro Ltd. All rights reserved.</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceContent);
    printWindow.document.close();
  };

  const formatPrice = (priceVal: number) => {
    return `₹${priceVal.toLocaleString("en-IN")}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className={embedded ? "" : styles.container}>
        <div className={styles.emptyState}>
          <h2>{t('OrdersList-PleaseLoginToView')}</h2>
          <p>{t('OrdersList-YouMustBeLogged')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={embedded ? "" : styles.container}>
        <div className={styles.loader}>{t('OrdersList-LoadingYourOrderHistory')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={embedded ? "" : styles.container}>
        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : styles.container}>
      {!embedded && (
        <>
          <h1 className={styles.title}>{t('Global-MyOrders')}</h1>
          <p className={styles.subtitle}>{t('OrdersList-TrackAndViewDetails')}</p>
        </>
      )}

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <svg
            className={styles.emptyIcon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <h2>{t('OrdersList-NoOrdersFound')}</h2>
          <p>{t('OrdersList-YouHaventPlacedAny')}</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.ordersTable}>
            <thead>
              <tr>
                <th>{t('Global-OrderId')}</th>
                <th>{t('Global-Date')}</th>
                <th>{t('Global-Amount')}</th>
                <th>{t('Global-Status')}</th>
                <th>{t('Global-Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className={styles.orderIdCell}>{order.id}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td className={styles.priceCell}>{formatPrice(order.amount)}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        order.status === "success"
                          ? styles.statusSuccess
                          : order.status === "pending"
                          ? styles.statusPending
                          : order.status === "cancelled"
                          ? styles.statusFailed
                          : order.status === "returned"
                          ? styles.statusReturned
                          : styles.statusFailed
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {order.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => handleCompletePayment(order)}
                        className={styles.btnPayNow}
                      >
                        {t('OrdersList-PayNow')}
                      </button>
                    )}
                    {order.status === "success" && (
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(order)}
                        className={styles.btnDetails}
                        style={{ marginRight: "8px", backgroundColor: "#B88E2F", color: "white", border: "1px solid #B88E2F" }}
                      >
                        {t('OrdersList-Invoice')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className={styles.btnDetails}
                    >
                      {t('Global-ViewDetails')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Popup Details */}
      {selectedOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalOverlayBg} onClick={() => setSelectedOrder(null)} />
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3>{t('OrdersList-OrderDetails')}</h3>
              <button
                type="button"
                className={styles.btnClose}
                onClick={() => setSelectedOrder(null)}
                aria-label={t('Global-Close')}
              >
                {t('Global-Times')}
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.metaSection}>
                <div>
                  <p className={styles.metaLabel}>{t('Global-OrderId')}</p>
                  <p className={styles.metaVal}>{selectedOrder.id}</p>
                </div>
                <div>
                  <p className={styles.metaLabel}>{t('OrdersList-DatePlaced')}</p>
                  <p className={styles.metaVal}>{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className={styles.metaLabel}>{t('Global-Status')}</p>
                  <span
                    className={`${styles.statusBadge} ${
                      selectedOrder.status === "success"
                        ? styles.statusSuccess
                        : selectedOrder.status === "pending"
                        ? styles.statusPending
                        : selectedOrder.status === "cancelled"
                        ? styles.statusFailed
                        : styles.statusFailed
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {selectedOrder.status === "cancelled" ? (
                <div className={styles.cancelledInfoBox}>
                  <p><strong>{t('OrdersList-ThisOrderHasBeen')}</strong></p>
                  {selectedOrder.cancelReason && (
                    <p><strong>{t('Global-Reason')}</strong> {selectedOrder.cancelReason}</p>
                  )}
                  {selectedOrder.refund && (
                    <p style={{ marginTop: "8px", fontSize: "13px", color: "#666" }}>
                      <strong>{t('OrdersList-RefundStatus')}</strong> {selectedOrder.refund.status} {t('OrdersList-Id')} {selectedOrder.refund.refundId})
                    </p>
                  )}
                </div>
              ) : selectedOrder.status === "returned" ? (
                <div className={styles.returnedInfoBox}>
                  <p><strong>{t('OrdersList-ThisOrderHasBeen1')}</strong></p>
                  <p><strong>{t('Global-Reason')}</strong> {selectedOrder.returnReason}</p>
                  {selectedOrder.returnComment && (
                    <p><strong>{t('Global-Comments')}</strong> {selectedOrder.returnComment}</p>
                  )}
                  {selectedOrder.refund && (
                    <p style={{ marginTop: "8px", fontSize: "13px", color: "#666" }}>
                      <strong>{t('OrdersList-RefundStatus')}</strong> {selectedOrder.refund.status} {t('OrdersList-Id')} {selectedOrder.refund.refundId})
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {cancellingOrderId === selectedOrder.id ? (
                    <div className={styles.cancelForm}>
                      <h5>{t('OrdersList-CancelOrder')}</h5>
                      <textarea
                        placeholder={t('OrdersList-PleaseEnterAReason')}
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className={styles.cancelTextarea}
                      />
                      {cancelError && <p style={{ color: "#9b1c1c", fontSize: "12px", marginBottom: "8px" }}>{cancelError}</p>}
                      <div className={styles.cancelBtnGroup}>
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(selectedOrder.id)}
                          disabled={cancelLoading || !cancelReason.trim()}
                          className={styles.btnConfirmCancel}
                        >
                          {cancelLoading ? t('OrdersList-Processing') : t('OrdersList-ConfirmCancel')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCancellingOrderId(null);
                            setCancelReason("");
                            setCancelError(null);
                          }}
                          className={styles.btnCancelBack}
                        >
                          {t('OrdersList-Back')}
                        </button>
                      </div>
                    </div>
                  ) : returningOrderId === selectedOrder.id ? (
                    <div className={styles.returnForm}>
                      <h5>{t('OrdersList-ReturnOrder')}</h5>
                      <div className={styles.formGroup}>
                        <label>{t('OrdersList-ReasonForReturn')}</label>
                        <select
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          className={styles.returnSelect}
                        >
                          <option value={t('OrdersList-WrongSizefit')}>Wrong size/fit</option>
                          <option value={t('OrdersList-DamagedOrDefectiveItem')}>Damaged or defective item</option>
                          <option value={t('OrdersList-ItemNotAsDescribed')}>Item not as described</option>
                          <option value={t('OrdersList-ChangedMyMind')}>Changed my mind</option>
                          <option value={t('OrdersList-Other')}>Other</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>{t('OrdersList-AdditionalComments')}</label>
                        <textarea
                          placeholder={t('OrdersList-PleaseWriteAdditionalDeta')}
                          value={returnComment}
                          onChange={(e) => setReturnComment(e.target.value)}
                          className={styles.returnTextarea}
                        />
                      </div>
                      <div className={styles.instructionsBox}>
                        <h6>{t('OrdersList-ReturnInstructions')}</h6>
                        <ul>
                          <li>{t('OrdersList-KeepTheItemsUnused')}</li>
                          <li>{t('OrdersList-PackTheItemsSecurely')}</li>
                          <li>{t('OrdersList-APickupAgentWill')}</li>
                          <li>{t('OrdersList-OncePickupIsVerified')}</li>
                        </ul>
                      </div>
                      {returnError && <p className={styles.errorText}>{returnError}</p>}
                      <div className={styles.cancelBtnGroup}>
                        <button
                          type="button"
                          onClick={() => handleReturnOrder(selectedOrder.id)}
                          disabled={returnLoading}
                          className={styles.btnConfirmReturn}
                        >
                          {returnLoading ? t('OrdersList-Processing') : t('OrdersList-ConfirmReturn')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReturningOrderId(null);
                            setReturnReason("Wrong size/fit");
                            setReturnComment("");
                            setReturnError(null);
                          }}
                          className={styles.btnCancelBack}
                        >
                          {t('OrdersList-Back')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: "16px", display: "flex", gap: "10px" }}>
                      {selectedOrder.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => handleCompletePayment(selectedOrder)}
                          className={styles.btnPayNow}
                          disabled={cancelLoading || returnLoading}
                        >
                          {cancelLoading ? t('OrdersList-Processing') : t('OrdersList-PayNow')}
                        </button>
                      )}
                      {selectedOrder.status === "success" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(selectedOrder)}
                            className={styles.btnReturn}
                            style={{ backgroundColor: "#B88E2F", color: "white", border: "1px solid #B88E2F" }}
                          >
                            {t('OrdersList-DownloadInvoice')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setReturningOrderId(selectedOrder.id)}
                            className={styles.btnReturn}
                            disabled={cancelLoading || returnLoading}
                          >
                            {t('OrdersList-ReturnOrder')}
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setCancellingOrderId(selectedOrder.id)}
                        className={styles.btnCancel}
                        disabled={cancelLoading || returnLoading}
                      >
                        {t('OrdersList-CancelOrder')}
                      </button>
                    </div>
                  )}
                </>
              )}

              {selectedOrder.razorpay_payment_id && (
                <div className={styles.paymentInfo}>
                  <div className={styles.paymentInfoRow}>
                    <strong>{t('OrdersList-RazorpayPaymentId')}</strong>
                    <span>{selectedOrder.razorpay_payment_id}</span>
                  </div>
                  <div className={styles.paymentInfoRow}>
                    <strong>{t('OrdersList-RazorpayOrderId')}</strong>
                    <span>{selectedOrder.razorpay_order_id}</span>
                  </div>
                </div>
              )}

              {/* Items Section */}
              <div className={styles.modalItemsSection}>
                <h4>{t('Global-ItemsPurchased')}</h4>
                <div className={styles.itemsList}>
                  {selectedOrder.cart && selectedOrder.cart.map((item, idx) => (
                    <div key={`${item.sku}-${idx}`} className={styles.itemRow}>
                      <div className={styles.itemImgCol}>
                        {item.image ? (
                          <img src={item.image} alt={item.title} className={styles.itemImg} />
                        ) : (
                          <div className={styles.itemImgPlaceholder} />
                        )}
                      </div>
                      <div className={styles.itemInfoCol}>
                        <div className={styles.itemTitle}>{item.title}</div>
                        <div className={styles.itemMeta}>
                          {t('Global-Sku1')} {item.sku}
                          {item.selectedColor && ` | Color: ${item.selectedColor}`}
                          {item.selectedSize && ` | Size: ${item.selectedSize}`}
                        </div>
                        <div className={styles.itemQtyPrice}>
                          {item.quantity} x {formatPrice(item.activePrice)}
                        </div>
                      </div>
                      <div className={styles.itemTotalCol}>
                        {formatPrice(item.itemTotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Address & Total Section */}
              <div className={styles.footerSection}>
                {selectedOrder.address && (
                  <div className={styles.shippingCol}>
                    <h4>{t('Global-DeliveryAddress')}</h4>
                    <p className={styles.addrName}>{selectedOrder.address.fullName}</p>
                    <p className={styles.addrLine}>{selectedOrder.address.addressLine1}</p>
                    {selectedOrder.address.addressLine2 && (
                      <p className={styles.addrLine}>{selectedOrder.address.addressLine2}</p>
                    )}
                    <p className={styles.addrLine}>
                      {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.postalCode}
                    </p>
                    <p className={styles.addrLine}>{selectedOrder.address.country}</p>
                    <p className={styles.addrPhone}>{t('Global-Phone')} {selectedOrder.address.phoneNumber}</p>
                  </div>
                )}

                <div className={styles.totalCol}>
                  <div className={styles.totalRow}>
                    <span>{t('Global-Subtotal')}</span>
                    <span>{formatPrice(selectedOrder.amount)}</span>
                  </div>
                  <div className={styles.totalRow}>
                    <span>{t('Global-Shipping')}</span>
                    <span className={styles.freeShipping}>{t('Global-Free')}</span>
                  </div>
                  <div className={`${styles.totalRow} ${styles.totalRowFinal}`}>
                    <span>{t('Global-TotalPaid')}</span>
                    <span>{formatPrice(selectedOrder.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
