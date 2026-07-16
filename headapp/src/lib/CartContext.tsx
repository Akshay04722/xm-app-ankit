"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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
  updateQuantity: (
    sku: string,
    quantity: number,
    color?: string,
    size?: string,
  ) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast message after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

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
          i.selectedSize === item.selectedSize,
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
    setToastMessage(`"${item.title}" added to cart successfully!`);
  };

  const removeFromCart = (sku: string, color?: string, size?: string) => {
    setCartItems((prev) =>
      prev.filter(
        (i) =>
          !(
            i.sku === sku &&
            i.selectedColor === color &&
            i.selectedSize === size
          ),
      ),
    );
  };

  const updateQuantity = (
    sku: string,
    quantity: number,
    color?: string,
    size?: string,
  ) => {
    if (quantity <= 0) {
      removeFromCart(sku, color, size);
      return;
    }

    setCartItems((prev) =>
      prev.map((i) =>
        i.sku === sku && i.selectedColor === color && i.selectedSize === size
          ? { ...i, quantity }
          : i,
      ),
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalItems = cartItems.length;

  const subtotal = cartItems.reduce((sum, item) => {
    const activePrice = item.price;
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
      {toastMessage && (
        <div
          style={{
            backgroundColor: "#b88e2f",
            zIndex: 99999,
            right: "20px",
            top: "20px",
          }}
          className="fixed text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 font-medium text-base animate-slide-in"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            style={{ width: "20px", height: "20px" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-80 text-white/90 text-lg cursor-pointer"
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              padding: 0,
            }}
          >
            &times;
          </button>
        </div>
      )}
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
