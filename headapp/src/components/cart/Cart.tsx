"use client";

import React, { useState } from "react";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

export const Default = (props: any): React.JSX.Element => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, subtotal } = useCart();
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const formatPrice = (priceVal: number) => {
    if (!priceVal) return "₹0";
    return `₹${priceVal.toLocaleString("en-IN")}`;
  };

  const handleCheckout = () => {
    alert("Thank you for your purchase! Checkout is simulated for this demo.");
    clearCart();
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponApplied(true);
    alert(`Coupon "${couponCode}" applied successfully!`);
  };

  // If cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="font-poppins bg-white py-16 cart-page-root w-full min-w-full flex justify-center">
        {/* Empty State */}
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-[#F9F1E7] flex items-center justify-center mx-auto mb-6 text-[#B88E2F]">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 max-w-sm mx-auto mb-8 text-[13px]">
            Looks like you haven't added anything to your cart yet. Explore our beautiful range of products and find something you love!
          </p>
          <Link
            href="/shop"
            className="inline-block border border-[#B88E2F] bg-[#B88E2F] hover:bg-[#a37924] text-white px-8 py-3 text-[13px] font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer decoration-none shadow-xs hover:shadow-md"
          >
            Go to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="font-poppins bg-white pb-20 pt-8 cart-page-root w-full min-w-full flex-grow flex justify-center">
      {/* Main Cart Content */}
      <div className="container mx-auto px-4 mt-4">
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Cart Table Area */}
          <div className="w-full lg:w-2/3">
            {/* Desktop Table Headers */}
            <div className="hidden md:grid grid-cols-12 bg-[#F9F1E7] py-3.5 px-6 rounded-lg text-sm font-semibold uppercase tracking-wider text-gray-700 mb-6">
              <div className="col-span-6 flex gap-4">
                <span className="ml-24">Product</span>
              </div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            {/* Cart Items */}
            <div className="flex flex-col gap-5">
              {cartItems.map((item) => {
                const activePrice = item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price;
                return (
                  <div key={`${item.sku}-${item.selectedColor || ""}-${item.selectedSize || ""}`}>
                    {/* Desktop View */}
                    <div className="hidden md:grid grid-cols-12 items-center py-1.5 px-6 text-base text-gray-900 border-b border-gray-100 pb-5">
                      <div className="col-span-6 flex items-center gap-6">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.sku, item.selectedColor, item.selectedSize)}
                          className="text-[#B88E2F] hover:text-red-500 transition-colors cursor-pointer mr-2 flex items-center justify-center"
                          aria-label="Remove item"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <div className="w-[80px] h-[80px] bg-[#F9F1E7] rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-100">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <rect width="18" height="18" x="3" y="3" rx="2" />
                              <circle cx="9" cy="9" r="2" />
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 pr-4">
                          <span className="font-normal text-[16px] text-gray-500" title={item.title}>
                            {item.title}
                          </span>
                          <div className="text-[13px] text-gray-400 flex flex-wrap gap-x-2">
                            <span>SKU: {item.sku}</span>
                            {item.selectedColor && (
                              <span className="flex items-center gap-1">
                                Color: <span className="inline-block w-2 h-2 rounded-full border border-gray-200" style={{ backgroundColor: item.selectedColor }} />
                              </span>
                            )}
                            {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-2 text-center text-[16px] text-gray-600 font-normal">
                        {formatPrice(activePrice)}
                      </div>

                      <div className="col-span-2 flex justify-center">
                        <div className="flex items-center border border-gray-300 rounded-md bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.sku, item.quantity - 1, item.selectedColor, item.selectedSize)}
                            className="px-2 py-0.5 text-gray-500 hover:bg-gray-50 font-semibold active:scale-95 transition-all cursor-pointer text-[16px]"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-gray-900 text-sm font-medium select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.sku, item.quantity + 1, item.selectedColor, item.selectedSize)}
                            className="px-2 py-0.5 text-gray-500 hover:bg-gray-50 font-semibold active:scale-95 transition-all cursor-pointer text-[16px]"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2 text-right text-[16px] text-gray-900 font-medium">
                        {formatPrice(activePrice * item.quantity)}
                      </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden flex gap-4 p-4 border border-gray-150 rounded-xl relative bg-white shadow-xs">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.sku, item.selectedColor, item.selectedSize)}
                        className="absolute top-3 right-3 text-[#B88E2F] hover:text-red-500 transition-colors cursor-pointer"
                        aria-label="Remove item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <div className="w-[70px] h-[70px] bg-[#F9F1E7] rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-100">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col justify-between flex-1 py-0.5">
                        <div>
                          <div className="font-medium text-[#242424] text-base line-clamp-1 pr-6">{item.title}</div>
                          <div className="text-[13px] text-gray-400 mt-0.5 flex flex-wrap gap-x-2">
                            <span>SKU: {item.sku}</span>
                            {item.selectedColor && (
                              <span className="flex items-center gap-1">
                                Color: <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.selectedColor }} />
                              </span>
                            )}
                            {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-gray-300 rounded-md bg-white">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.sku, item.quantity - 1, item.selectedColor, item.selectedSize)}
                              className="px-2 py-0.5 text-gray-500 font-bold"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm text-gray-900 font-semibold">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.sku, item.quantity + 1, item.selectedColor, item.selectedSize)}
                              className="px-2 py-0.5 text-gray-500 font-bold"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right flex flex-col">
                            <span className="text-[11px] text-gray-400">Subtotal:</span>
                            <span className="text-sm font-semibold text-[#B88E2F]">{formatPrice(activePrice * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupon & Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-8 pt-6 border-t border-gray-100">
              <form onSubmit={handleApplyCoupon} className="flex gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={couponApplied}
                  className="border border-gray-300 rounded-lg px-3.5 py-2 text-[15px] w-full sm:w-44 focus:outline-none focus:border-[#B88E2F] disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={couponApplied}
                  className="border border-black hover:bg-black hover:text-white text-black font-normal px-5 py-2 rounded-lg text-[15px] transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-95 disabled:border-gray-300 disabled:text-gray-400 disabled:bg-transparent disabled:cursor-not-allowed"
                >
                  {couponApplied ? "Applied" : "Apply coupon"}
                </button>
              </form>
              <button
                type="button"
                className="border border-gray-300 text-gray-400 font-normal px-5 py-2 rounded-lg text-[15px] transition-all cursor-not-allowed w-full sm:w-auto bg-gray-50"
                disabled
              >
                Update cart
              </button>
            </div>
          </div>

          {/* Cart Totals Card */}
          <div className="bg-[#F9F1E7] rounded-none px-6 py-8 flex flex-col justify-between h-fit w-full lg:w-1/3 mt-8 lg:mt-0 shadow-xs border border-[#f4ebdf]">
            <div className="w-full">
              <div className="text-xl font-bold text-gray-900 text-center mb-6">Cart Totals</div>
              
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#ebdcca] px-2">
                <span className="text-base font-semibold text-gray-900">Subtotal</span>
                <span className="text-base text-gray-400 font-medium">{formatPrice(subtotal)}</span>
              </div>
              
              <div className="flex justify-between items-center mb-8 px-2">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-[#B88E2F]">{formatPrice(subtotal)}</span>
              </div>
            </div>
            
            <div className="w-full flex justify-center mt-2">
              {user ? (
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full bg-black hover:bg-[#B88E2F] border border-black hover:border-[#B88E2F] text-white py-3 px-6 rounded-xl text-base font-semibold transition-all duration-200 cursor-pointer text-center active:scale-98"
                >
                  Proceed to checkout
                </button>
              ) : (
                <Link
                  href="/sign-in?redirect=/cart"
                  className="w-full bg-black hover:bg-[#B88E2F] border border-black hover:border-[#B88E2F] text-white py-3 px-6 rounded-xl text-base font-semibold transition-all duration-200 cursor-pointer text-center active:scale-98 block decoration-none"
                >
                  Login to proceed to checkout
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
