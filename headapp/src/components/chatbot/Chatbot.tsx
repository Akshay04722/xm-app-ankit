"use client";
import React, { useState, useEffect, useRef, JSX } from "react";
import styles from "./Chatbot.module.css";
import Link from "next/link";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  products?: Array<{
    id: string;
    sku: string;
    title: string;
    price: number;
    discountPrice?: number;
    mainImage: string;
  }>;
}

interface Product {
  id: string;
  sku: string;
  title: string;
  price: number;
  discountPrice?: number;
  mainImage: string;
  shortDescription?: string;
}

export default function Chatbot(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hi there! 👋 I am your Furniro Assistant. How can I help you today? Ask me about shipping, returns, payment options, or ask to recommend products!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Fetch products on load to facilitate instant semantic recommendations
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.warn("Chatbot failed to fetch products for recommendations:", err));
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const formatProductDetailUrl = (sku: string, title: string) => {
    // Generate clean product link formats matching: http://localhost:3000/Shop/SS010--Basso
    const cleanTitle = title
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    return `/Shop/${sku}--${cleanTitle}`;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userText = inputVal.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: userText,
      timestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    // Dynamic products list reload/retry if empty
    let currentProducts = products;
    if (products.length === 0) {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
          currentProducts = data.products;
        }
      } catch (err) {
        console.warn("Retrying fetch of products in chatbot failed:", err);
      }
    }

    // Simulate thinking delay
    setTimeout(() => {
      setIsTyping(false);
      const botResponse = generateResponse(userText, currentProducts);
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const generateResponse = (input: string, activeProducts: Product[]): Message => {
    const text = input.toLowerCase();
    const botMsgTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const baseMsg = {
      id: Math.random().toString(),
      sender: "bot" as const,
      timestamp: botMsgTimestamp,
    };

    // 1. Shipping & Delivery
    if (text.includes("ship") || text.includes("deliver") || text.includes("postage")) {
      return {
        ...baseMsg,
        text: "We offer Free Shipping on all orders over ₹150,000! For smaller orders, standard shipping is calculated at checkout. Deliveries generally take 3-5 business days depending on your location.",
      };
    }

    // 2. Returns & Refunds
    if (text.includes("return") || text.includes("refund") || text.includes("cancel")) {
      return {
        ...baseMsg,
        text: "You can return any purchased furniture within 30 days of delivery! The item must be in its original packaging and condition. To initiate a return, you can do so in your Profile page, or drop us a line using our Contact page.",
      };
    }

    // 3. Payment Methods
    if (text.includes("pay") || text.includes("card") || text.includes("upi") || text.includes("razorpay")) {
      return {
        ...baseMsg,
        text: "We support Credit Cards, Debit Cards, Netbanking, and UPI payments securely through Razorpay. You will find all payment choices at the bottom of the Checkout page.",
      };
    }

    // 4. Order Status / History
    if (text.includes("order") || text.includes("track") || text.includes("status")) {
      return {
        ...baseMsg,
        text: "You can track and view all of your past orders by going to the 'My Profile' dashboard (click the Account icon in the top right header). If you have an order ID, you can also contact support for updates.",
      };
    }

    // 5. Product Recommendation / Searches
    const recommendKeywords = [
      "recommend", "show", "find", "buy", "chair", "sofa", "table", 
      "bed", "product", "price", "furniture", "lamp", "light", 
      "clock", "wardrobe", "bookcase", "desk", "cabinet", "hammock"
    ];
    const matchesKeyword = recommendKeywords.some(keyword => text.includes(keyword));
    
    if (matchesKeyword && activeProducts.length > 0) {
      // Find matching products
      let filtered = activeProducts;
      
      if (text.includes("chair")) {
        filtered = activeProducts.filter(p => p.title.toLowerCase().includes("chair") || p.shortDescription?.toLowerCase().includes("chair"));
      } else if (text.includes("sofa")) {
        filtered = activeProducts.filter(p => p.title.toLowerCase().includes("sofa") || p.shortDescription?.toLowerCase().includes("sofa"));
      } else if (text.includes("table")) {
        filtered = activeProducts.filter(p => p.title.toLowerCase().includes("table") || p.shortDescription?.toLowerCase().includes("table"));
      } else if (text.includes("lamp") || text.includes("light")) {
        filtered = activeProducts.filter(p => p.title.toLowerCase().includes("lamp") || p.title.toLowerCase().includes("light") || p.title.toLowerCase().includes("chandelier"));
      } else if (text.includes("clock")) {
        filtered = activeProducts.filter(p => p.title.toLowerCase().includes("clock"));
      } else if (text.includes("wardrobe") || text.includes("cabinet")) {
        filtered = activeProducts.filter(p => p.title.toLowerCase().includes("wardrobe") || p.title.toLowerCase().includes("cabinet"));
      } else if (text.includes("bookcase")) {
        filtered = activeProducts.filter(p => p.title.toLowerCase().includes("bookcase"));
      } else if (text.includes("hammock")) {
        filtered = activeProducts.filter(p => p.title.toLowerCase().includes("hammock"));
      } else if (text.includes("bed")) {
        filtered = activeProducts.filter(p => p.title.toLowerCase().includes("bed"));
      } else {
        // Specific name search (like Basso)
        const matchedSpecific = activeProducts.filter(p => text.includes(p.title.toLowerCase()) || text.includes(p.sku.toLowerCase()));
        if (matchedSpecific.length > 0) {
          filtered = matchedSpecific;
        }
      }

      // Pick top 2 matches
      const finalMatches = filtered.slice(0, 2);

      if (finalMatches.length > 0) {
        return {
          ...baseMsg,
          text: `Here are some products I recommend based on your query:`,
          products: finalMatches.map(p => ({
            id: p.id,
            sku: p.sku,
            title: p.title,
            price: p.price,
            discountPrice: p.discountPrice,
            mainImage: p.mainImage,
          })),
        };
      }
    }

    // 6. Greetings & Help Fallbacks
    if (text.includes("hello") || text.includes("hi") || text.includes("hey") || text.includes("greeting")) {
      return {
        ...baseMsg,
        text: "Hello! Hope you are having a wonderful day. How can I help you find furniture or answer your questions today?",
      };
    }

    if (text.includes("thank")) {
      return {
        ...baseMsg,
        text: "You're very welcome! If you need anything else, feel free to ask. Happy shopping!",
      };
    }

    // 7. General Fallback
    return {
      ...baseMsg,
      text: "I'm not sure I completely understand. Could you please rephrase? You can ask about shipping, returns, payment options, or search for products (e.g. 'show chairs').",
    };
  };

  return (
    <div className={styles.chatbotContainer}>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${styles.chatButton} ${isOpen ? styles.chatButtonActive : ""}`}
        aria-label="Toggle Shopping Assistant Chatbot"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.avatar}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <div className={styles.headerText}>
              <span className={styles.title}>Furniro Assistant</span>
              <span className={styles.subtitle}>
                <span className={styles.onlineIndicator} /> Online
              </span>
            </div>
          </div>

          {/* Messages Body */}
          <div ref={bodyRef} className={styles.chatBody}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.messageRow} ${
                  msg.sender === "user" ? styles.userRow : styles.botRow
                }`}
              >
                <div
                  className={`${styles.bubble} ${
                    msg.sender === "user" ? styles.userBubble : styles.botBubble
                  }`}
                >
                  {msg.text}

                  {/* Render Product Recommendations */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {msg.products.map((prod) => (
                        <div key={prod.id} className={styles.productRecommendation}>
                          <img
                            src={prod.mainImage}
                            alt={prod.title}
                            className={styles.prodImage}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=300";
                            }}
                          />
                          <div className={styles.prodInfo}>
                            <h5 className={styles.prodTitle}>{prod.title}</h5>
                            <span className={styles.prodPrice}>
                              ₹{prod.price.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <Link
                            href={formatProductDetailUrl(prod.sku, prod.title)}
                            className={styles.prodLink}
                            onClick={() => setIsOpen(false)}
                          >
                            Details
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className={styles.timestamp}>{msg.timestamp}</span>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className={`${styles.messageRow} ${styles.botRow}`}>
                <div className={`${styles.bubble} ${styles.botBubble} ${styles.typingIndicator}`}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            )}
          </div>

          {/* Footer Input Form */}
          <form onSubmit={handleSend} className={styles.chatFooter}>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask a question..."
              className={styles.input}
            />
            <button type="submit" className={styles.sendButton} aria-label="Send message">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
