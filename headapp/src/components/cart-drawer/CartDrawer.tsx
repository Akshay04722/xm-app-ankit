"use client";

import React, { useRef, useEffect } from "react";
import { useCart, CartItem } from "@/lib/CartContext";

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    setCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    totalItems,
  } = useCart();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        isCartOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        setCartOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isCartOpen, setCartOpen]);

  // Prevent background scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const formatPrice = (priceVal: number) => {
    if (!priceVal) return "Rp 0";
    return `Rp ${priceVal.toLocaleString("id-ID")}`;
  };

  const handleCheckout = () => {
    alert("Thank you for your purchase! Checkout is simulated for this demo.");
    clearCart();
    setCartOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-poppins">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        aria-hidden="true"
        onClick={() => setCartOpen(false)}
      />

      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div
            ref={drawerRef}
            className="pointer-events-auto w-screen max-w-md transform bg-white shadow-2xl border-l border-gray-150 transition duration-300 ease-in-out"
          >
            <div className="flex h-full flex-col bg-white">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-250 px-6 py-5 bg-gradient-to-r from-[#f9f1e7]/30 to-transparent">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-lg font-bold text-gray-900">Shopping Cart</h2>
                  <span className="text-xs font-bold text-[#B88E2F] bg-[#f9f1e7] px-2 py-0.5 rounded-full">
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </span>
                </div>
                <button
                  type="button"
                  className="rounded-full text-gray-400 hover:text-[#B88E2F] hover:bg-[#f9f1e7] p-2 transition-all duration-200"
                  onClick={() => setCartOpen(false)}
                >
                  <span className="sr-only">Close panel</span>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.2"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {cartItems.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#f9f1e7] flex items-center justify-center mb-4 text-[#B88E2F]">
                      <svg
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Your cart is empty</h3>
                    <p className="mt-1 text-xs text-gray-500 max-w-[240px]">
                      Add products from the store or search to get started.
                    </p>
                    <button
                      onClick={() => setCartOpen(false)}
                      className="mt-6 inline-flex items-center justify-center border border-transparent bg-[#B88E2F] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-[#a37924] transition-all rounded-lg active:scale-95 cursor-pointer"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <ul role="list" className="flex flex-col gap-4">
                    {cartItems.map((item) => {
                      const activePrice = item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price;
                      return (
                        <li 
                          key={`${item.sku}-${item.selectedColor || ""}-${item.selectedSize || ""}`} 
                          className="flex p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 hover:shadow-xs transition-all duration-200"
                        >
                          {/* Image */}
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50 border border-gray-150 flex items-center justify-center">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-cover object-center"
                              />
                            ) : (
                              <svg
                                className="h-6 w-6 text-gray-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              >
                                <rect width="18" height="18" x="3" y="3" rx="2" />
                                <circle cx="9" cy="9" r="2" />
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                              </svg>
                            )}
                          </div>

                          {/* Details */}
                          <div className="ml-3.5 flex flex-1 flex-col justify-between">
                            <div>
                              <div className="flex justify-between text-sm font-bold text-gray-900 gap-2">
                                <h3 className="truncate max-w-[170px]" title={item.title}>
                                  {item.title}
                                </h3>
                                <p className="text-sm font-extrabold text-[#B88E2F]">
                                  {formatPrice(activePrice * item.quantity)}
                                </p>
                              </div>
                              <div className="mt-0.5 flex flex-wrap gap-x-3 text-[10px] text-gray-400">
                                <span>SKU: {item.sku}</span>
                                {item.selectedColor && (
                                  <span className="flex items-center gap-1">
                                    Color: <span className="inline-block w-2.5 h-2.5 rounded-full border border-gray-200" style={{ backgroundColor: item.selectedColor }} />
                                  </span>
                                )}
                                {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                              </div>
                            </div>

                            {/* Stepper + Remove */}
                            <div className="flex items-center justify-between text-xs mt-2">
                              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-150 px-1.5 py-1 rounded-full">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.sku, item.quantity - 1, item.selectedColor, item.selectedSize)}
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-gray-500 hover:text-[#B88E2F] hover:bg-white transition-all font-semibold active:scale-90"
                                >
                                  −
                                </button>
                                <span className="w-5 text-center text-gray-900 text-[11px] font-extrabold select-none">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.sku, item.quantity + 1, item.selectedColor, item.selectedSize)}
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-gray-500 hover:text-[#B88E2F] hover:bg-white transition-all font-semibold active:scale-90"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFromCart(item.sku, item.selectedColor, item.selectedSize)}
                                className="font-semibold text-gray-400 hover:text-[#E97171] flex items-center gap-1 transition-colors"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                <span className="text-[10px]">Remove</span>
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {cartItems.length > 0 && (
                <div className="border-t border-gray-200 px-6 py-6 bg-gray-50/50">
                  <div className="flex justify-between text-sm font-bold text-gray-900 mb-2">
                    <span>Subtotal</span>
                    <span className="text-[#B88E2F] text-lg font-extrabold">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-5">
                    Shipping and taxes calculated at checkout.
                  </p>
                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      onClick={clearCart}
                      className="flex items-center justify-center border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleCheckout}
                      className="flex items-center justify-center gap-1.5 border border-transparent bg-[#B88E2F] hover:bg-[#a37924] text-white px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      Checkout
                    </button>
                  </div>
                  <div className="mt-4 flex justify-center text-center text-xs text-gray-500">
                    <button
                      type="button"
                      className="font-bold text-[#B88E2F] hover:text-[#a37924] transition-colors"
                      onClick={() => setCartOpen(false)}
                    >
                      Continue Shopping &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
