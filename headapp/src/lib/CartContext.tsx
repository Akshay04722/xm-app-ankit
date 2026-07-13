"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  id: string;
  sku: string;
  title: string;
  price: number;
  discountPrice?: number;
  image?: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (sku: string, color?: string, size?: string) => void;
  updateQuantity: (sku: string, quantity: number, color?: string, size?: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("furniro_cart");
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    }
    setLoaded(true);
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("furniro_cart", JSON.stringify(cartItems));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cartItems, loaded]);

  const addToCart = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    setCartItems((prev) => {
      // Find if item already exists in cart with same SKU, color, and size
      const existingIndex = prev.findIndex(
        (i) =>
          i.sku === item.sku &&
          i.selectedColor === item.selectedColor &&
          i.selectedSize === item.selectedSize
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      return [...prev, { ...item, quantity }];
    });
    // Open the cart drawer so user sees their item was added successfully
    setCartOpen(true);
  };

  const removeFromCart = (sku: string, color?: string, size?: string) => {
    setCartItems((prev) =>
      prev.filter(
        (i) => !(i.sku === sku && i.selectedColor === color && i.selectedSize === size)
      )
    );
  };

  const updateQuantity = (sku: string, quantity: number, color?: string, size?: string) => {
    if (quantity <= 0) {
      removeFromCart(sku, color, size);
      return;
    }

    setCartItems((prev) =>
      prev.map((i) =>
        i.sku === sku && i.selectedColor === color && i.selectedSize === size
          ? { ...i, quantity }
          : i
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cartItems.reduce((sum, item) => {
    const activePrice = item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.price;
    return sum + activePrice * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
