"use client";

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
          <h2>Please Login to View Orders</h2>
          <p>You must be logged in to view your purchase history.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={embedded ? "" : styles.container}>
        <div className={styles.loader}>Loading your order history...</div>
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
          <h1 className={styles.title}>My Orders</h1>
          <p className={styles.subtitle}>Track and view details of all your previous purchases.</p>
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
          <h2>No Orders Found</h2>
          <p>You haven't placed any orders yet. Visit our shop to make your first purchase!</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.ordersTable}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
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
                        Pay Now
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className={styles.btnDetails}
                    >
                      View Details
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
              <h3>Order Details</h3>
              <button
                type="button"
                className={styles.btnClose}
                onClick={() => setSelectedOrder(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.metaSection}>
                <div>
                  <p className={styles.metaLabel}>Order ID</p>
                  <p className={styles.metaVal}>{selectedOrder.id}</p>
                </div>
                <div>
                  <p className={styles.metaLabel}>Date Placed</p>
                  <p className={styles.metaVal}>{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className={styles.metaLabel}>Status</p>
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
                  <p><strong>This order has been cancelled.</strong></p>
                  {selectedOrder.cancelReason && (
                    <p><strong>Reason:</strong> {selectedOrder.cancelReason}</p>
                  )}
                  {selectedOrder.refund && (
                    <p style={{ marginTop: "8px", fontSize: "13px", color: "#666" }}>
                      <strong>Refund Status:</strong> {selectedOrder.refund.status} (ID: {selectedOrder.refund.refundId})
                    </p>
                  )}
                </div>
              ) : selectedOrder.status === "returned" ? (
                <div className={styles.returnedInfoBox}>
                  <p><strong>This order has been returned.</strong></p>
                  <p><strong>Reason:</strong> {selectedOrder.returnReason}</p>
                  {selectedOrder.returnComment && (
                    <p><strong>Comments:</strong> {selectedOrder.returnComment}</p>
                  )}
                  {selectedOrder.refund && (
                    <p style={{ marginTop: "8px", fontSize: "13px", color: "#666" }}>
                      <strong>Refund Status:</strong> {selectedOrder.refund.status} (ID: {selectedOrder.refund.refundId})
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {cancellingOrderId === selectedOrder.id ? (
                    <div className={styles.cancelForm}>
                      <h5>Cancel Order</h5>
                      <textarea
                        placeholder="Please enter a reason for cancellation..."
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
                          {cancelLoading ? "Processing..." : "Confirm Cancel"}
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
                          Back
                        </button>
                      </div>
                    </div>
                  ) : returningOrderId === selectedOrder.id ? (
                    <div className={styles.returnForm}>
                      <h5>Return Order</h5>
                      <div className={styles.formGroup}>
                        <label>Reason for Return:</label>
                        <select
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          className={styles.returnSelect}
                        >
                          <option value="Wrong size/fit">Wrong size/fit</option>
                          <option value="Damaged or defective item">Damaged or defective item</option>
                          <option value="Item not as described">Item not as described</option>
                          <option value="Changed my mind">Changed my mind</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Additional Comments:</label>
                        <textarea
                          placeholder="Please write additional details here..."
                          value={returnComment}
                          onChange={(e) => setReturnComment(e.target.value)}
                          className={styles.returnTextarea}
                        />
                      </div>
                      <div className={styles.instructionsBox}>
                        <h6>Return Instructions:</h6>
                        <ul>
                          <li>Keep the items unused, unwashed and with all original tags attached.</li>
                          <li>Pack the items securely in their original packaging.</li>
                          <li>A pickup agent will be assigned to collect the items in 2-3 business days.</li>
                          <li>Once pick-up is verified, your refund will be processed back to your original payment method.</li>
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
                          {returnLoading ? "Processing..." : "Confirm Return"}
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
                          Back
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
                          {cancelLoading ? "Processing..." : "Pay Now"}
                        </button>
                      )}
                      {selectedOrder.status === "success" && (
                        <button
                          type="button"
                          onClick={() => setReturningOrderId(selectedOrder.id)}
                          className={styles.btnReturn}
                          disabled={cancelLoading || returnLoading}
                        >
                          Return Order
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setCancellingOrderId(selectedOrder.id)}
                        className={styles.btnCancel}
                        disabled={cancelLoading || returnLoading}
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </>
              )}

              {selectedOrder.razorpay_payment_id && (
                <div className={styles.paymentInfo}>
                  <div className={styles.paymentInfoRow}>
                    <strong>Razorpay Payment ID:</strong>
                    <span>{selectedOrder.razorpay_payment_id}</span>
                  </div>
                  <div className={styles.paymentInfoRow}>
                    <strong>Razorpay Order ID:</strong>
                    <span>{selectedOrder.razorpay_order_id}</span>
                  </div>
                </div>
              )}

              {/* Items Section */}
              <div className={styles.modalItemsSection}>
                <h4>Items Purchased</h4>
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
                          SKU: {item.sku}
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
                    <h4>Delivery Address</h4>
                    <p className={styles.addrName}>{selectedOrder.address.fullName}</p>
                    <p className={styles.addrLine}>{selectedOrder.address.addressLine1}</p>
                    {selectedOrder.address.addressLine2 && (
                      <p className={styles.addrLine}>{selectedOrder.address.addressLine2}</p>
                    )}
                    <p className={styles.addrLine}>
                      {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.postalCode}
                    </p>
                    <p className={styles.addrLine}>{selectedOrder.address.country}</p>
                    <p className={styles.addrPhone}>Phone: {selectedOrder.address.phoneNumber}</p>
                  </div>
                )}

                <div className={styles.totalCol}>
                  <div className={styles.totalRow}>
                    <span>Subtotal</span>
                    <span>{formatPrice(selectedOrder.amount)}</span>
                  </div>
                  <div className={styles.totalRow}>
                    <span>Shipping</span>
                    <span className={styles.freeShipping}>FREE</span>
                  </div>
                  <div className={`${styles.totalRow} ${styles.totalRowFinal}`}>
                    <span>Total Paid</span>
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
