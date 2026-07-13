"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { ComponentProps } from "lib/component-props";
import Link from "next/link";
import styles from "../../assets/components/AdminDashboard/AdminDashboard.module.css";

interface UserRecord {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isAdmin: boolean;
  role: string;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
}

interface ProductRecord {
  sku: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  additionalInformation: string;
  price: number;
  discountPrice: number;
  isNew: boolean;
  mainImageUrl: string;
  galleryImageUrls: string[];
  sizes: string[];
  colors: string[];
  category: string;
  tags: string[];
  stockCount: number;
  updatedAt: string;
}

export const Default: React.FC<ComponentProps> = () => {
  const { user, loading: authLoading } = useAuth();
  
  // Dashboard view toggle
  const [activeConsole, setActiveConsole] = useState<"users" | "products">("products");

  // Users State
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [actionUid, setActionUid] = useState<string | null>(null);

  // Products State
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);

  // Product Form Fields State
  const [formSku, setFormSku] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDiscountPrice, setFormDiscountPrice] = useState("");
  const [formShortDesc, setFormShortDesc] = useState("");
  const [formLongDesc, setFormLongDesc] = useState("");
  const [formAdditionalInfo, setFormAdditionalInfo] = useState("");
  const [formMainImage, setFormMainImage] = useState("");
  const [formGalleryImages, setFormGalleryImages] = useState("");
  const [formSizes, setFormSizes] = useState<string[]>([]);
  const [formColors, setFormColors] = useState<string[]>([]);
  const [formCategory, setFormCategory] = useState("Dining Chairs");
  const [formTags, setFormTags] = useState("");
  const [formStockCount, setFormStockCount] = useState("50");
  const [productActionLoading, setProductActionLoading] = useState(false);

  // Shared state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL", "Queen", "King", "Double", "Standard", "One Size"];
  const availableColors = ["Red", "Blue", "Green", "Gray", "Beige", "Brown", "Black", "White", "Navy", "Maroon", "Saddlebrown", "Lavender", "Pink", "Silver"];
  const categoriesList = [
    "Dining Chairs", "Lounge Chairs", "Sofas and Sectionals", "Bistro Sets", "Nightstands",
    "Coffee Tables", "Bar Stools", "Dining Tables", "Accents and Mirrors", "Wardrobes",
    "Bed Frames", "Bookcases", "Kitchenware", "Clocks", "Garden Hammocks"
  ];

  // Check admin claims when user changes
  useEffect(() => {
    if (user) {
      user
        .getIdTokenResult()
        .then((idTokenResult) => {
          const role = idTokenResult.claims.role;
          const adminClaim = idTokenResult.claims.isAdmin || role === "admin";
          setIsAdmin(!!adminClaim);
        })
        .catch((err) => {
          console.error("Error checking admin claims:", err);
          setIsAdmin(false);
        })
        .finally(() => {
          setClaimsLoading(false);
        });
    } else {
      setIsAdmin(false);
      setClaimsLoading(false);
    }
  }, [user]);

  // Debounce user search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUserSearch(userSearch);
    }, 500);
    return () => clearTimeout(handler);
  }, [userSearch]);

  // Fetch users
  const fetchUsers = async () => {
    if (!user) return;
    try {
      setUsersLoading(true);
      const idToken = await user.getIdToken();
      const res = await fetch(
        `/api/admin/users?search=${encodeURIComponent(debouncedUserSearch)}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        },
      );
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch users");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching users");
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    if (!user) return;
    try {
      setProductsLoading(true);
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/products", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch products");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching products");
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      if (activeConsole === "users") {
        fetchUsers();
      } else {
        fetchProducts();
      }
    }
  }, [isAdmin, activeConsole, debouncedUserSearch]);

  // Sync Products handler
  const handleSyncProducts = async () => {
    if (!user) return;
    try {
      setSyncing(true);
      setError(null);
      setSuccess(null);
      const idToken = await user.getIdToken();
      
      const pathname = typeof window !== "undefined" ? window.location.pathname : "";
      const segments = pathname.split("/").filter(Boolean);
      const knownSites = ["ankitxmc", "akshayxmc", "krunalxmc"];
      const defaultSite = process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME || "akshayxmc";
      const siteName = segments.find(s => knownSites.includes(s.toLowerCase())) || defaultSite;
      
      const res = await fetch(`/api/admin/sync?site=${siteName}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      
      const data = await res.json();
      if (res.ok) {
        setSuccess("Firestore products successfully synced and published in Sitecore!");
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || "Failed to sync products to Sitecore.");
        setTimeout(() => setError(null), 5000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during synchronization.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSyncing(false);
    }
  };

  // Toggle admin claim for user
  const handleToggleAdmin = async (targetUid: string, currentIsAdmin: boolean) => {
    if (!user) return;
    try {
      setActionUid(targetUid);
      const idToken = await user.getIdToken();
      const nextIsAdmin = !currentIsAdmin;

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          targetUid,
          isAdmin: nextIsAdmin,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === targetUid
              ? {
                  ...u,
                  isAdmin: nextIsAdmin,
                  role: nextIsAdmin ? "admin" : "user",
                }
              : u,
          ),
        );
        setSuccess(`Custom claim updated. Role set to: ${nextIsAdmin ? "admin" : "user"}`);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || "Failed to update custom claim");
        setTimeout(() => setError(null), 5000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while updating claim");
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionUid(null);
    }
  };

  // Delete user
  const handleDeleteUser = async (targetUid: string, targetEmail: string) => {
    if (!user) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete the user account for ${targetEmail}? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    try {
      setActionUid(targetUid);
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/admin/users?uid=${targetUid}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.uid !== targetUid));
        setSuccess(`User ${targetEmail} was successfully deleted.`);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || "Failed to delete user");
        setTimeout(() => setError(null), 5000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting user");
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionUid(null);
    }
  };

  // Product Modals Openers
  const handleOpenAddModal = () => {
    setSelectedProduct(null);
    setFormSku("");
    setFormTitle("");
    setFormPrice("");
    setFormDiscountPrice("");
    setFormShortDesc("");
    setFormLongDesc("");
    setFormAdditionalInfo("");
    setFormMainImage("");
    setFormGalleryImages("");
    setFormSizes([]);
    setFormColors([]);
    setFormCategory("Dining Chairs");
    setFormTags("");
    setFormStockCount("50");
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: ProductRecord) => {
    setSelectedProduct(product);
    setFormSku(product.sku);
    setFormTitle(product.title);
    setFormPrice(String(product.price));
    setFormDiscountPrice(product.discountPrice ? String(product.discountPrice) : "");
    setFormShortDesc(product.shortDescription || "");
    setFormLongDesc(product.longDescription || "");
    setFormAdditionalInfo(product.additionalInformation || "");
    setFormMainImage(product.mainImageUrl || "");
    setFormGalleryImages(Array.isArray(product.galleryImageUrls) ? product.galleryImageUrls.join(", ") : "");
    setFormSizes(Array.isArray(product.sizes) ? product.sizes : []);
    setFormColors(Array.isArray(product.colors) ? product.colors : []);
    setFormCategory(product.category || "Dining Chairs");
    setFormTags(Array.isArray(product.tags) ? product.tags.join(", ") : "");
    setFormStockCount(product.stockCount !== undefined ? String(product.stockCount) : "50");
    setIsProductModalOpen(true);
  };

  // Product Save/Update
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formSku.trim() || !formTitle.trim() || !formPrice.trim() || !formStockCount.trim()) {
      alert("SKU, Title, Price, and Stock Count are required fields.");
      return;
    }

    try {
      setProductActionLoading(true);
      const idToken = await user.getIdToken();
      
      const payload = {
        sku: formSku.trim(),
        title: formTitle.trim(),
        price: Number(formPrice),
        discountPrice: formDiscountPrice ? Number(formDiscountPrice) : 0,
        shortDescription: formShortDesc.trim(),
        longDescription: formLongDesc.trim(),
        additionalInformation: formAdditionalInfo.trim(),
        mainImageUrl: formMainImage.trim(),
        galleryImageUrls: formGalleryImages ? formGalleryImages.split(",").map(s => s.trim()).filter(Boolean) : [],
        sizes: formSizes,
        colors: formColors,
        category: formCategory,
        tags: formTags ? formTags.split(",").map(t => t.trim()).filter(Boolean) : [],
        stockCount: Number(formStockCount),
        isNew: selectedProduct ? selectedProduct.isNew : true
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Product ${formSku} saved successfully in Firebase.`);
        fetchProducts();
        setIsProductModalOpen(false);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        alert(data.error || "Failed to save product.");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred while saving the product.");
    } finally {
      setProductActionLoading(false);
    }
  };

  // Product Delete
  const handleDeleteProduct = async (sku: string, title: string) => {
    if (!user) return;
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete product "${title}" (SKU: ${sku}) from Firebase?`);
    if (!confirmDelete) return;

    try {
      setProductsLoading(true);
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/admin/products?sku=${sku}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Product ${sku} was deleted successfully.`);
        setProducts(prev => prev.filter(p => p.sku !== sku));
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || "Failed to delete product.");
        setTimeout(() => setError(null), 5000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting product.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSizeCheckboxChange = (size: string, checked: boolean) => {
    if (checked) {
      setFormSizes(prev => [...prev, size]);
    } else {
      setFormSizes(prev => prev.filter(s => s !== size));
    }
  };

  const handleColorCheckboxChange = (color: string, checked: boolean) => {
    if (checked) {
      setFormColors(prev => [...prev, color]);
    } else {
      setFormColors(prev => prev.filter(c => c !== color));
    }
  };

  if (authLoading || claimsLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Verifying admin session...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className={styles.deniedContainer}>
        <div className={styles.deniedIcon}>
          <div className={styles.deniedIconWrapper}>
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
        <h2>Access Denied</h2>
        <p>This administrative dashboard is restricted to users with admin privileges only.</p>
        <Link href="/" className={styles.backHomeBtn}>Return Home</Link>
      </div>
    );
  }

  // Filter products in memory
  const filteredProducts = products.filter(p => {
    const searchLower = productSearch.toLowerCase();
    return (
      (p.sku && p.sku.toLowerCase().includes(searchLower)) ||
      (p.title && p.title.toLowerCase().includes(searchLower)) ||
      (p.category && p.category.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className={styles.dashboardContainer}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <Link href="/admin">Admin</Link>
        <span className={styles.breadcrumbsSep}>/</span>
        <span className={styles.breadcrumbsMuted}>
          {activeConsole === "users" ? "Users Console" : "Products Console"}
        </span>
      </div>

      {/* Header section */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerTop}>
          <div className={styles.titleSection}>
            <h1>Furniro Admin Dashboard</h1>
            <p>Manage application users, product catalog listings, sync data, and manage stock counts.</p>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={handleSyncProducts}
              disabled={syncing}
              style={{
                backgroundColor: '#B88E2F',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'opacity 0.2s ease',
                opacity: syncing ? 0.7 : 1
              }}
            >
              {syncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
                  Syncing...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.41-3.59-8-8-8zm-8 8c0 1.57.46 3.03 1.24 4.26L6.7 17.7C5.25 16.03 4 13.88 4 12c0-4.41 3.59-8 8-8v3l4-4-4-4v3c-4.41 0-8 3.59-8 8z" />
                  </svg>
                  Sync Products to Sitecore
                </>
              )}
            </button>
            {activeConsole === "products" && (
              <button
                onClick={handleOpenAddModal}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#B88E2F',
                  border: '1px solid #B88E2F',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                Add Product
              </button>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className={styles.tabSelector}>
          <button
            className={`${styles.tabSelectorBtn} ${activeConsole === "products" ? styles.tabSelectorBtnActive : ""}`}
            onClick={() => setActiveConsole("products")}
          >
            Products Console
          </button>
          <button
            className={`${styles.tabSelectorBtn} ${activeConsole === "users" ? styles.tabSelectorBtnActive : ""}`}
            onClick={() => setActiveConsole("users")}
          >
            Users Console
          </button>
        </div>

        <div className={styles.headerControls}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            {activeConsole === "users" ? (
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search email, name or UID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            ) : (
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search products by title, category, SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      {activeConsole === "users" ? (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIconWrapper}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>{users.length}</span>
              <span className={styles.metricLabel}>Total Users</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIconWrapper}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>{users.filter((u) => u.isAdmin).length}</span>
              <span className={styles.metricLabel}>Administrators</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={`${styles.metricIconWrapper} ${styles.statusGreen}`}>
              <span className={styles.pulseDot}></span>
            </div>
            <div className={styles.metricContent}>
              <span className={styles.statusIndicator}>Online</span>
              <span className={styles.metricLabel}>Auth Status</span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIconWrapper}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>{products.length}</span>
              <span className={styles.metricLabel}>Total Products</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIconWrapper}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>
                {new Set(products.map(p => p.category).filter(Boolean)).size}
              </span>
              <span className={styles.metricLabel}>Categories</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIconWrapper}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>
                {products.reduce((acc, p) => acc + (p.stockCount || 0), 0)}
              </span>
              <span className={styles.metricLabel}>Total Items Stock</span>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Alerts */}
      {success && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Table section */}
      {activeConsole === "users" ? (
        usersLoading && users.length === 0 ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Fetching user accounts...</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Created At</th>
                  <th>Last Login</th>
                  <th>Role Switcher</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#9f9f9f" }}>
                      No users matching your query.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.uid}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.avatar}>
                            {u.displayName
                              ? u.displayName.charAt(0).toUpperCase()
                              : u.email.charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.userInfo}>
                            <span className={styles.displayName}>
                              {u.displayName || u.email.split("@")[0]}
                            </span>
                            <span className={styles.uidSub}>UID: {u.uid}</span>
                          </div>
                        </div>
                      </td>
                      <td>{u.metadata.creationTime ? new Date(u.metadata.creationTime).toLocaleDateString() : "N/A"}</td>
                      <td>{u.metadata.lastSignInTime ? new Date(u.metadata.lastSignInTime).toLocaleDateString() : "N/A"}</td>
                      <td>
                        <div className={styles.roleToggleWrapper}>
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={u.isAdmin}
                              disabled={actionUid === u.uid || u.email === user.email}
                              onChange={() => handleToggleAdmin(u.uid, u.isAdmin)}
                            />
                            <span className={styles.slider}></span>
                          </label>
                          <span className={`${styles.roleBadge} ${u.isAdmin ? styles.roleAdmin : styles.roleUser}`}>
                            {u.isAdmin ? "Admin" : "User"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteUser(u.uid, u.email)}
                          disabled={actionUid === u.uid || u.email === user.email}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      ) : (
        productsLoading && products.length === 0 ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Fetching product catalog...</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#9f9f9f" }}>
                      No products found in catalog.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.sku}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.productImageCell}>
                            {p.mainImageUrl ? (
                              <img src={p.mainImageUrl} alt={p.title} />
                            ) : (
                              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ccc" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className={styles.userInfo}>
                            <span className={styles.displayName}>{p.title}</span>
                            <span className={styles.uidSub}>{p.shortDescription?.substring(0, 50)}...</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace", fontWeight: "700" }}>{p.sku}</td>
                      <td>
                        <div>
                          <span style={{ fontWeight: 700 }}>Rs. {p.price}</span>
                          {p.discountPrice > p.price && (
                            <span style={{ textDecoration: "line-through", color: "#b0b0b0", marginLeft: 8, fontSize: 12 }}>
                              Rs. {p.discountPrice}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: p.stockCount < 10 ? '#dc2626' : 'inherit' }}>
                          {p.stockCount} items
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className={styles.editBtn}
                            onClick={() => handleOpenEditModal(p)}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteProduct(p.sku, p.title)}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Form Modal for Creating/Editing Product */}
      {isProductModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{selectedProduct ? "Edit Product Details" : "Add Product to Catalog"}</h2>
              <button className={styles.closeBtn} onClick={() => setIsProductModalOpen(false)}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveProduct}>
              <div className={styles.formGrid}>
                {/* SKU */}
                <div className={styles.formGroup}>
                  <label htmlFor="sku">Product SKU *</label>
                  <input
                    id="sku"
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. 11, SS001"
                    value={formSku}
                    disabled={!!selectedProduct}
                    onChange={(e) => setFormSku(e.target.value)}
                    required
                  />
                </div>

                {/* Title */}
                <div className={styles.formGroup}>
                  <label htmlFor="title">Product Title *</label>
                  <input
                    id="title"
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Lolito Sofa"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Price */}
                <div className={styles.formGroup}>
                  <label htmlFor="price">Sale Price (in Rs.) *</label>
                  <input
                    id="price"
                    type="number"
                    className={styles.formInput}
                    placeholder="e.g. 2500"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                  />
                </div>

                {/* Discount / Strike-through Price */}
                <div className={styles.formGroup}>
                  <label htmlFor="discountPrice">Original Price (Strike-through)</label>
                  <input
                    id="discountPrice"
                    type="number"
                    className={styles.formInput}
                    placeholder="e.g. 3500 (leave 0 or empty if no discount)"
                    value={formDiscountPrice}
                    onChange={(e) => setFormDiscountPrice(e.target.value)}
                  />
                </div>

                {/* Category */}
                <div className={styles.formGroup}>
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    className={styles.formSelect}
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Stock Count */}
                <div className={styles.formGroup}>
                  <label htmlFor="stock">Stock Count *</label>
                  <input
                    id="stock"
                    type="number"
                    className={styles.formInput}
                    placeholder="e.g. 50"
                    value={formStockCount}
                    onChange={(e) => setFormStockCount(e.target.value)}
                    required
                  />
                </div>

                {/* Main Image URL */}
                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label htmlFor="mainImage">Main Image URL</label>
                  <input
                    id="mainImage"
                    type="text"
                    className={styles.formInput}
                    placeholder="https://example.com/image.jpg"
                    value={formMainImage}
                    onChange={(e) => setFormMainImage(e.target.value)}
                  />
                </div>

                {/* Gallery Images URLs */}
                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label htmlFor="galleryImages">Gallery Images (Comma-separated URLs)</label>
                  <input
                    id="galleryImages"
                    type="text"
                    className={styles.formInput}
                    placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                    value={formGalleryImages}
                    onChange={(e) => setFormGalleryImages(e.target.value)}
                  />
                </div>

                {/* Short Description */}
                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label htmlFor="shortDesc">Short Description</label>
                  <textarea
                    id="shortDesc"
                    rows={2}
                    className={styles.formTextarea}
                    placeholder="Brief description of the product..."
                    value={formShortDesc}
                    onChange={(e) => setFormShortDesc(e.target.value)}
                  />
                </div>

                {/* Long Description */}
                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label htmlFor="longDesc">Detailed Description</label>
                  <textarea
                    id="longDesc"
                    rows={3}
                    className={styles.formTextarea}
                    placeholder="Detailed information and specs..."
                    value={formLongDesc}
                    onChange={(e) => setFormLongDesc(e.target.value)}
                  />
                </div>

                {/* Sizes checkboxes */}
                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label>Available Sizes</label>
                  <div className={styles.checkboxGroup}>
                    {availableSizes.map((size) => (
                      <label key={size} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formSizes.includes(size)}
                          onChange={(e) => handleSizeCheckboxChange(size, e.target.checked)}
                        />
                        {size}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Colors checkboxes */}
                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label>Available Colors</label>
                  <div className={styles.checkboxGroup}>
                    {availableColors.map((color) => (
                      <label key={color} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formColors.includes(color)}
                          onChange={(e) => handleColorCheckboxChange(color, e.target.checked)}
                        />
                        {color}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label htmlFor="tags">Tags (Comma-separated)</label>
                  <input
                    id="tags"
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Sofa, Living Room, Comfort"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsProductModalOpen(false)}
                  disabled={productActionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={productActionLoading}
                >
                  {productActionLoading ? "Saving Product..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
