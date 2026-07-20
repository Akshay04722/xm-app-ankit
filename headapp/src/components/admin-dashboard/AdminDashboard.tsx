"use client";

import { useTranslations } from "next-intl";
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

interface OrderRecord {
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

export const Default: React.FC<ComponentProps> = () => {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);
  const { user, loading: authLoading } = useAuth();
  
  // Dashboard view toggle
  const [activeConsole, setActiveConsole] = useState<"users" | "products" | "orders">("products");

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

  // Orders State
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [orderActionLoading, setOrderActionLoading] = useState(false);

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

  // Fetch orders
  const fetchOrders = async () => {
    if (!user) return;
    try {
      setOrdersLoading(true);
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/orders", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch orders");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!user) return;
    try {
      setOrderActionLoading(true);
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Order status updated to ${newStatus} successfully.`);
        fetchOrders(); // Refresh order list
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        }
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || "Failed to update order status");
        setTimeout(() => setError(null), 5000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while updating order status");
      setTimeout(() => setError(null), 5000);
    } finally {
      setOrderActionLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      if (activeConsole === "users") {
        fetchUsers();
      } else if (activeConsole === "products") {
        fetchProducts();
      } else if (activeConsole === "orders") {
        fetchOrders();
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
        <p>{t('AdminDashboard-VerifyingAdminSession')}</p>
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
        <h2>{t('AdminDashboard-AccessDenied')}</h2>
        <p>{t('AdminDashboard-ThisAdministrativeDashboa')}</p>
        <Link href="/" className={styles.backHomeBtn}>{t('AdminDashboard-ReturnHome')}</Link>
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

  // Filter orders in memory
  const filteredOrders = orders.filter(o => {
    if (!o) return false;
    const searchLower = (orderSearch || "").toLowerCase();
    const matchesSearch = 
      (o.id && typeof o.id === 'string' && o.id.toLowerCase().includes(searchLower)) ||
      (o.userId && typeof o.userId === 'string' && o.userId.toLowerCase().includes(searchLower)) ||
      (o.address?.fullName && typeof o.address.fullName === 'string' && o.address.fullName.toLowerCase().includes(searchLower)) ||
      (o.address?.phoneNumber && typeof o.address.phoneNumber === 'string' && o.address.phoneNumber.toLowerCase().includes(searchLower));
    
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return !!(matchesSearch && matchesStatus);
  });

  return (
    <div className={styles.dashboardContainer}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <Link href="/admin">{t('AdminDashboard-Admin')}</Link>
        <span className={styles.breadcrumbsSep}>/</span>
        <span className={styles.breadcrumbsMuted}>
          {activeConsole === "users" ? t('AdminDashboard-UsersConsole') : activeConsole === "products" ? "Products Console" : "Orders Console"}
        </span>
      </div>

      {/* Header section */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerTop}>
          <div className={styles.titleSection}>
            <h1>{t('AdminDashboard-FurniroAdminDashboard')}</h1>
            <p>{t('AdminDashboard-ManageApplicationUsersPro')}</p>
          </div>
          <div className={styles.headerActions}>
            {activeConsole === "products" && (
              <>
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
                      {t('AdminDashboard-Syncing')}
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.41-3.59-8-8-8zm-8 8c0 1.57.46 3.03 1.24 4.26L6.7 17.7C5.25 16.03 4 13.88 4 12c0-4.41 3.59-8 8-8v3l4-4-4-4v3c-4.41 0-8 3.59-8 8z" />
                      </svg>
                      {t('AdminDashboard-SyncProductsToSitecore')}
                    </>
                  )}
                </button>
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
                  {t('AdminDashboard-AddProduct')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className={styles.tabSelector}>
          <button
            className={`${styles.tabSelectorBtn} ${activeConsole === "products" ? styles.tabSelectorBtnActive : ""}`}
            onClick={() => setActiveConsole("products")}
          >
            {t('AdminDashboard-ProductsConsole')}
          </button>
          <button
            className={`${styles.tabSelectorBtn} ${activeConsole === "users" ? styles.tabSelectorBtnActive : ""}`}
            onClick={() => setActiveConsole("users")}
          >
            {t('AdminDashboard-UsersConsole')}
          </button>
          <button
            className={`${styles.tabSelectorBtn} ${activeConsole === "orders" ? styles.tabSelectorBtnActive : ""}`}
            onClick={() => setActiveConsole("orders")}
          >
            {t('AdminDashboard-OrdersConsole')}
          </button>
        </div>

        <div className={styles.headerControls}>
          {activeConsole !== "orders" ? (
            <div className={styles.searchWrapper}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              {activeConsole === "users" ? (
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder={t('AdminDashboard-SearchEmailNameOr')}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder={t('AdminDashboard-SearchProductsByTitle')}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '16px', width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className={styles.searchWrapper} style={{ flex: 1, minWidth: '240px' }}>
                <svg className={styles.searchIcon} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder={t('AdminDashboard-SearchByOrderId')}
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="adminStatusFilterSelect" style={{ fontSize: '13px', fontWeight: 600, color: '#898989' }}>{t('AdminDashboard-Status')}</label>
                <select
                  id="adminStatusFilterSelect"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.formSelect}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: '#ffffff',
                    color: '#3a3a3a',
                    cursor: 'pointer',
                    outline: 'none',
                    margin: 0,
                    width: 'auto'
                  }}
                >
                  <option value="all">{t('AdminDashboard-AllStatuses')}</option>
                  <option value="pending">{t('AdminDashboard-Pending')}</option>
                  <option value="success">{t('AdminDashboard-Success')}</option>
                  <option value="failed">{t('AdminDashboard-Failed')}</option>
                  <option value="cancelled">{t('AdminDashboard-Cancelled')}</option>
                  <option value="returned">{t('AdminDashboard-Returned')}</option>
                </select>
              </div>
            </div>
          )}
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
              <span className={styles.metricLabel}>{t('AdminDashboard-TotalUsers')}</span>
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
              <span className={styles.metricLabel}>{t('AdminDashboard-Administrators')}</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={`${styles.metricIconWrapper} ${styles.statusGreen}`}>
              <span className={styles.pulseDot}></span>
            </div>
            <div className={styles.metricContent}>
              <span className={styles.statusIndicator}>{t('Global-Online')}</span>
              <span className={styles.metricLabel}>{t('AdminDashboard-AuthStatus')}</span>
            </div>
          </div>
        </div>
      ) : activeConsole === "products" ? (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIconWrapper}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>{products.length}</span>
              <span className={styles.metricLabel}>{t('AdminDashboard-TotalProducts')}</span>
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
              <span className={styles.metricLabel}>{t('Global-Categories')}</span>
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
              <span className={styles.metricLabel}>{t('AdminDashboard-TotalItemsStock')}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIconWrapper}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>{orders.filter(Boolean).length}</span>
              <span className={styles.metricLabel}>{t('AdminDashboard-TotalOrders')}</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIconWrapper}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>
                {t('AdminDashboard-Rs')} {orders.filter(o => o && o.status === "success").reduce((acc, o) => acc + (o.amount || 0), 0).toLocaleString("en-IN")}
              </span>
              <span className={styles.metricLabel}>{t('AdminDashboard-TotalRevenue')}</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIconWrapper}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>
                {orders.filter(o => o && o.status === "pending").length}
              </span>
              <span className={styles.metricLabel}>{t('AdminDashboard-PendingPayments')}</span>
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
            <p>{t('AdminDashboard-FetchingUserAccounts')}</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>{t('AdminDashboard-UserProfile')}</th>
                  <th>{t('AdminDashboard-CreatedAt')}</th>
                  <th>{t('AdminDashboard-LastLogin')}</th>
                  <th>{t('AdminDashboard-RoleSwitcher')}</th>
                  <th>{t('Global-Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#9f9f9f" }}>
                      {t('AdminDashboard-NoUsersMatchingYour')}
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
                            <span className={styles.uidSub}>{t('AdminDashboard-Uid')} {u.uid}</span>
                          </div>
                        </div>
                      </td>
                      <td>{u.metadata.creationTime ? new Date(u.metadata.creationTime).toLocaleDateString() : t('AdminDashboard-Na')}</td>
                      <td>{u.metadata.lastSignInTime ? new Date(u.metadata.lastSignInTime).toLocaleDateString() : t('AdminDashboard-Na')}</td>
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
                            {u.isAdmin ? t('AdminDashboard-Admin') : t('AdminDashboard-User')}
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
                          {t('AdminDashboard-Delete')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      ) : activeConsole === "products" ? (
        productsLoading && products.length === 0 ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>{t('AdminDashboard-FetchingProductCatalog')}</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>{t('Global-Product')}</th>
                  <th>{t('Global-Sku')}</th>
                  <th>{t('Global-Price')}</th>
                  <th>{t('Global-Category')}</th>
                  <th>{t('AdminDashboard-Stock')}</th>
                  <th>{t('Global-Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#9f9f9f" }}>
                      {t('AdminDashboard-NoProductsFoundIn')}
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
                          <span style={{ fontWeight: 700 }}>{t('AdminDashboard-Rs')} {p.price}</span>
                          {p.discountPrice > p.price && (
                            <span style={{ textDecoration: "line-through", color: "#b0b0b0", marginLeft: 8, fontSize: 12 }}>
                              {t('AdminDashboard-Rs')} {p.discountPrice}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: p.stockCount < 10 ? '#dc2626' : 'inherit' }}>
                          {p.stockCount} {t('Global-Items')}
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
                            {t('Global-Edit')}
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteProduct(p.sku, p.title)}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {t('AdminDashboard-Delete')}
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
      ) : (
        ordersLoading && orders.length === 0 ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>{t('AdminDashboard-FetchingOrderHistory')}</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>{t('Global-OrderId')}</th>
                  <th>{t('Global-Customer')}</th>
                  <th>{t('Global-Date')}</th>
                  <th>{t('Global-Amount')}</th>
                  <th>{t('Global-Status')}</th>
                  <th>{t('Global-Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#9f9f9f" }}>
                      {t('AdminDashboard-NoOrdersFoundMatching')}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: "monospace", fontWeight: "700" }}>{o.id}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{o.address?.fullName || "N/A"}</span>
                          <span style={{ fontSize: '12px', color: '#898989' }}>{o.address?.phoneNumber || "N/A"}</span>
                        </div>
                      </td>
                      <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", { year: 'numeric', month: 'short', day: 'numeric' }) : t('AdminDashboard-Na')}</td>
                      <td style={{ fontWeight: 700 }}>
                        {t('AdminDashboard-Rs')} {o.amount?.toLocaleString("en-IN")}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles['status' + (o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : 'Pending')]}`}>
                          {o.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.editBtn}
                          onClick={() => {
                            setSelectedOrder(o);
                            setSelectedStatus(o.status || 'pending');
                            setIsOrderModalOpen(true);
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          </svg>
                          {t('Global-ViewDetails')}
                        </button>
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
              <h2>{selectedProduct ? t('AdminDashboard-EditProductDetails') : t('AdminDashboard-AddProductToCatalog')}</h2>
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
                  <label htmlFor="sku">{t('AdminDashboard-ProductSku')}</label>
                  <input
                    id="sku"
                    type="text"
                    className={styles.formInput}
                    placeholder={t('AdminDashboard-Eg11Ss001')}
                    value={formSku}
                    disabled={!!selectedProduct}
                    onChange={(e) => setFormSku(e.target.value)}
                    required
                  />
                </div>

                {/* Title */}
                <div className={styles.formGroup}>
                  <label htmlFor="title">{t('AdminDashboard-ProductTitle')}</label>
                  <input
                    id="title"
                    type="text"
                    className={styles.formInput}
                    placeholder={t('AdminDashboard-EgLolitoSofa')}
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Price */}
                <div className={styles.formGroup}>
                  <label htmlFor="price">{t('AdminDashboard-SalePriceInRs')}</label>
                  <input
                    id="price"
                    type="number"
                    className={styles.formInput}
                    placeholder={t('AdminDashboard-Eg2500')}
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                  />
                </div>

                {/* Discount / Strike-through Price */}
                <div className={styles.formGroup}>
                  <label htmlFor="discountPrice">{t('AdminDashboard-OriginalPriceStrikethroug')}</label>
                  <input
                    id="discountPrice"
                    type="number"
                    className={styles.formInput}
                    placeholder={t('AdminDashboard-Eg3500Leave0')}
                    value={formDiscountPrice}
                    onChange={(e) => setFormDiscountPrice(e.target.value)}
                  />
                </div>

                {/* Category */}
                <div className={styles.formGroup}>
                  <label htmlFor="category">{t('AdminDashboard-Category')}</label>
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
                  <label htmlFor="stock">{t('AdminDashboard-StockCount')}</label>
                  <input
                    id="stock"
                    type="number"
                    className={styles.formInput}
                    placeholder={t('AdminDashboard-Eg50')}
                    value={formStockCount}
                    onChange={(e) => setFormStockCount(e.target.value)}
                    required
                  />
                </div>

                {/* Main Image URL */}
                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label htmlFor="mainImage">{t('AdminDashboard-MainImageUrl')}</label>
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
                  <label htmlFor="galleryImages">{t('AdminDashboard-GalleryImagesCommaseparat')}</label>
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
                  <label htmlFor="shortDesc">{t('AdminDashboard-ShortDescription')}</label>
                  <textarea
                    id="shortDesc"
                    rows={2}
                    className={styles.formTextarea}
                    placeholder={t('AdminDashboard-BriefDescriptionOfThe')}
                    value={formShortDesc}
                    onChange={(e) => setFormShortDesc(e.target.value)}
                  />
                </div>

                {/* Long Description */}
                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label htmlFor="longDesc">{t('AdminDashboard-DetailedDescription')}</label>
                  <textarea
                    id="longDesc"
                    rows={3}
                    className={styles.formTextarea}
                    placeholder={t('AdminDashboard-DetailedInformationAndSpe')}
                    value={formLongDesc}
                    onChange={(e) => setFormLongDesc(e.target.value)}
                  />
                </div>

                {/* Sizes checkboxes */}
                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label>{t('Global-AvailableSizes')}</label>
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
                  <label>{t('Global-AvailableColors')}</label>
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
                  <label htmlFor="tags">{t('AdminDashboard-TagsCommaseparated')}</label>
                  <input
                    id="tags"
                    type="text"
                    className={styles.formInput}
                    placeholder={t('AdminDashboard-EgSofaLivingRoom')}
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
                  {t('Global-Cancel')}
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={productActionLoading}
                >
                  {productActionLoading ? t('AdminDashboard-SavingProduct') : t('AdminDashboard-SaveProduct')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Popup Details for Admin Orders */}
      {isOrderModalOpen && selectedOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '950px' }}>
            <div className={styles.modalHeader}>
              <h2>{t('AdminDashboard-OrderDetails')} {selectedOrder.id}</h2>
              <button className={styles.closeBtn} onClick={() => { setIsOrderModalOpen(false); setSelectedOrder(null); }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={styles.orderModalBody} style={{ padding: '20px 0 0 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '24px' }}>
                {/* Left Side: Items & Delivery Address */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Items list */}
                  <div style={{ border: '1px solid #f6f3eb', borderRadius: '12px', padding: '20px', backgroundColor: '#ffffff' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', borderBottom: '1px solid #f6f3eb', paddingBottom: '10px' }}>{t('Global-ItemsPurchased')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {selectedOrder.cart && selectedOrder.cart.map((item, idx) => (
                        <div key={`${item.sku}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: idx < (selectedOrder.cart?.length || 0) - 1 ? '1px solid #fcfbf9' : 'none', paddingBottom: idx < (selectedOrder.cart?.length || 0) - 1 ? '16px' : '0' }}>
                          <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fcfbf9', border: '1px solid #f6f3eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.image ? (
                              <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', backgroundColor: '#f3f1eb' }} />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a1a' }}>{item.title}</div>
                            <div style={{ fontSize: '12px', color: '#898989', marginTop: '4px' }}>
                              {t('Global-Sku1')} {item.sku}
                              {item.selectedColor && ` | Color: ${item.selectedColor}`}
                              {item.selectedSize && ` | Size: ${item.selectedSize}`}
                            </div>
                            <div style={{ fontSize: '13px', color: '#3a3a3a', marginTop: '4px' }}>
                              {item.quantity} {t('AdminDashboard-XRs')} {item.activePrice?.toLocaleString("en-IN")}
                            </div>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a' }}>
                            {t('AdminDashboard-Rs')} {item.itemTotal?.toLocaleString("en-IN")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  {selectedOrder.address && (
                    <div style={{ border: '1px solid #f6f3eb', borderRadius: '12px', padding: '20px', backgroundColor: '#ffffff' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', borderBottom: '1px solid #f6f3eb', paddingBottom: '10px' }}>{t('Global-DeliveryAddress')}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#898989', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>{t('AdminDashboard-CustomerName')}</p>
                          <p style={{ fontSize: '14px', margin: 0, fontWeight: 600, color: '#3a3a3a' }}>{selectedOrder.address.fullName}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#898989', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>{t('AdminDashboard-PhoneNumber')}</p>
                          <p style={{ fontSize: '14px', margin: 0, fontWeight: 600, color: '#3a3a3a' }}>{selectedOrder.address.phoneNumber}</p>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#898989', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>{t('Global-Address')}</p>
                          <p style={{ fontSize: '14px', margin: 0, color: '#3a3a3a', lineHeight: '1.5' }}>
                            {selectedOrder.address.addressLine1}
                            {selectedOrder.address.addressLine2 ? `, ${selectedOrder.address.addressLine2}` : ""}
                            {selectedOrder.address.landmark ? ` (Landmark: ${selectedOrder.address.landmark})` : ""}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#898989', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>{t('AdminDashboard-City')}</p>
                          <p style={{ fontSize: '14px', margin: 0, color: '#3a3a3a' }}>{selectedOrder.address.city}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#898989', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>{t('AdminDashboard-State')}</p>
                          <p style={{ fontSize: '14px', margin: 0, color: '#3a3a3a' }}>{selectedOrder.address.state}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#898989', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>{t('AdminDashboard-PostalCode')}</p>
                          <p style={{ fontSize: '14px', margin: 0, color: '#3a3a3a' }}>{selectedOrder.address.postalCode}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#898989', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>{t('AdminDashboard-Country')}</p>
                          <p style={{ fontSize: '14px', margin: 0, color: '#3a3a3a' }}>{selectedOrder.address.country}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Details */}
                  <div style={{ border: '1px solid #f6f3eb', borderRadius: '12px', padding: '20px', backgroundColor: '#ffffff' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', borderBottom: '1px solid #f6f3eb', paddingBottom: '10px' }}>{t('AdminDashboard-PaymentSystemLogs')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#898989', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>{t('AdminDashboard-RazorpayOrderId')}</p>
                        <p style={{ fontSize: '13px', margin: 0, fontFamily: 'monospace', color: '#3a3a3a' }}>{selectedOrder.razorpay_order_id || selectedOrder.orderId}</p>
                      </div>
                      {selectedOrder.razorpay_payment_id && (
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#898989', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>{t('AdminDashboard-RazorpayPaymentId')}</p>
                          <p style={{ fontSize: '13px', margin: 0, fontFamily: 'monospace', color: '#3a3a3a' }}>{selectedOrder.razorpay_payment_id}</p>
                        </div>
                      )}
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#898989', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>{t('AdminDashboard-CreatedDate')}</p>
                        <p style={{ fontSize: '13px', margin: 0, color: '#3a3a3a' }}>
                          {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString("en-IN") : t('AdminDashboard-Na')}
                        </p>
                      </div>
                      {selectedOrder.updatedAt && (
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#898989', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>{t('AdminDashboard-LastUpdated')}</p>
                          <p style={{ fontSize: '13px', margin: 0, color: '#3a3a3a' }}>
                            {new Date(selectedOrder.updatedAt).toLocaleString("en-IN")}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedOrder.status === 'cancelled' && (
                      <div style={{ borderLeft: '4px solid #ff5c5c', backgroundColor: '#fff5f5', padding: '12px 16px', borderRadius: '4px', marginTop: '16px' }}>
                        <p style={{ color: '#c53030', fontWeight: 700, margin: '0 0 4px 0', fontSize: '14px' }}>{t('AdminDashboard-CancellationInfo')}</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#3a3a3a' }}><strong>{t('Global-Reason')}</strong> {selectedOrder.cancelReason || 'No reason provided'}</p>
                        {selectedOrder.cancelledAt && (
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#742a2a' }}>
                            <strong>{t('AdminDashboard-CancelledAt')}</strong> {new Date(selectedOrder.cancelledAt).toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    )}

                    {selectedOrder.status === 'returned' && (
                      <div style={{ borderLeft: '4px solid #5c5c8a', backgroundColor: '#f5f5fa', padding: '12px 16px', borderRadius: '4px', marginTop: '16px' }}>
                        <p style={{ color: '#4a4a74', fontWeight: 700, margin: '0 0 4px 0', fontSize: '14px' }}>{t('AdminDashboard-ReturnInfo')}</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#3a3a3a' }}><strong>{t('Global-Reason')}</strong> {selectedOrder.returnReason || 'No reason provided'}</p>
                        {selectedOrder.returnComment && (
                          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#3a3a3a' }}><strong>{t('Global-Comments')}</strong> {selectedOrder.returnComment}</p>
                        )}
                        {selectedOrder.returnedAt && (
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#3b3b5c' }}>
                            <strong>{t('AdminDashboard-ReturnedAt')}</strong> {new Date(selectedOrder.returnedAt).toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    )}

                    {selectedOrder.refund && (
                      <div style={{ borderLeft: '4px solid #2ec1ac', backgroundColor: '#e6f7f0', padding: '12px 16px', borderRadius: '4px', marginTop: '16px' }}>
                        <p style={{ color: '#1a8475', fontWeight: 700, margin: '0 0 4px 0', fontSize: '14px' }}>{t('AdminDashboard-RefundExecuted')}</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#3a3a3a' }}><strong>{t('AdminDashboard-RefundId')}</strong> {selectedOrder.refund.refundId}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#3a3a3a' }}><strong>{t('AdminDashboard-Amount')}</strong> {t('AdminDashboard-Rs')} {selectedOrder.refund.amount?.toLocaleString("en-IN")}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#3a3a3a' }}><strong>{t('AdminDashboard-Status')}</strong> {selectedOrder.refund.status}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Status Update & Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Status management */}
                  <div style={{ border: '1px solid #f6f3eb', borderRadius: '12px', padding: '20px', backgroundColor: '#ffffff' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', borderBottom: '1px solid #f6f3eb', paddingBottom: '10px' }}>{t('AdminDashboard-OrderStatus')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#898989', marginBottom: '8px', display: 'block' }}>
                          {t('AdminDashboard-CurrentStatus')}
                        </label>
                        <span className={`${styles.statusBadge} ${styles['status' + (selectedOrder.status ? selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1) : 'Pending')]}`}>
                          {selectedOrder.status || 'pending'}
                        </span>
                      </div>

                      <div style={{ borderTop: '1px solid #f6f3eb', paddingTop: '16px' }}>
                        <label htmlFor="adminOrderStatusSelect" style={{ fontSize: '13px', fontWeight: 600, color: '#3a3a3a', marginBottom: '8px', display: 'block' }}>
                          {t('AdminDashboard-UpdateStatusTo')}
                        </label>
                        <select
                          id="adminOrderStatusSelect"
                          value={selectedStatus || selectedOrder.status || 'pending'}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className={styles.formSelect}
                          style={{ width: '100%', marginBottom: '12px', padding: '8px', fontSize: '14px', borderRadius: '6px' }}
                          disabled={orderActionLoading}
                        >
                          <option value="pending">{t('AdminDashboard-Pending')}</option>
                          <option value="success">{t('AdminDashboard-Success')}</option>
                          <option value="failed">{t('AdminDashboard-Failed')}</option>
                          <option value="cancelled">{t('AdminDashboard-Cancelled')}</option>
                          <option value="returned">{t('AdminDashboard-Returned')}</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, selectedStatus || selectedOrder.status)}
                          className={styles.submitBtn}
                          style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: 600 }}
                          disabled={orderActionLoading || (selectedStatus === selectedOrder.status)}
                        >
                          {orderActionLoading ? t('AdminDashboard-UpdatingStatus') : t('AdminDashboard-SaveStatus')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Summary card */}
                  <div style={{ border: '1px solid #ecdcb9', borderRadius: '12px', padding: '20px', backgroundColor: '#fdfbf7' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', borderBottom: '1px solid #f6f3eb', paddingBottom: '10px', color: '#1a1a1a' }}>{t('AdminDashboard-AmountDetails')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#3a3a3a' }}>
                        <span>{t('Global-Subtotal')}</span>
                        <span>{t('AdminDashboard-Rs')} {selectedOrder.amount?.toLocaleString("en-IN")}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#3a3a3a' }}>
                        <span>{t('Global-Shipping')}</span>
                        <span style={{ color: '#2ec1ac', fontWeight: 'bold' }}>{t('Global-Free')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, borderTop: '1px dashed #e2d1bc', paddingTop: '12px', color: '#1a1a1a' }}>
                        <span>{t('Global-TotalPaid')}</span>
                        <span>{t('AdminDashboard-Rs')} {selectedOrder.amount?.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
