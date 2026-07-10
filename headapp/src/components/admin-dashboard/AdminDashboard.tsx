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

export const Default: React.FC<ComponentProps> = () => {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionUid, setActionUid] = useState<string | null>(null); // tracks user undergoing update/delete
  const [isAdmin, setIsAdmin] = useState(false);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

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

  // Sync Products handler
  const handleSyncProducts = async () => {
    if (!user) return;
    try {
      setSyncing(true);
      setError(null);
      setSuccess(null);
      const idToken = await user.getIdToken();
      
      // Determine siteName dynamically from the path, falling back to NEXT_PUBLIC_DEFAULT_SITE_NAME
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


  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch users
  const fetchUsers = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const idToken = await user.getIdToken();
      const res = await fetch(
        `/api/admin/users?search=${encodeURIComponent(debouncedSearch)}`,
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, debouncedSearch]);

  // Handle Toggle Claim
  const handleToggleAdmin = async (
    targetUid: string,
    currentIsAdmin: boolean,
  ) => {
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
        setSuccess(
          `Custom claim updated for user. Role set to: ${nextIsAdmin ? "admin" : "user"}`,
        );
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

  // Handle Delete User
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
        <p>
          This administrative dashboard is restricted to users with admin
          privileges only.
        </p>
        <Link href="/" className={styles.backHomeBtn}>
          Return Home
        </Link>
      </div>
    );
  }

  // Compute metrics
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.isAdmin).length;

  return (
    <div className={styles.dashboardContainer}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <Link href="/admin">Admin</Link>
        <span className={styles.breadcrumbsSep}>/</span>
        <span className={styles.breadcrumbsMuted}>Users Console</span>
      </div>

      {/* Header section */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerTop}>
          <div className={styles.titleSection}>
            <h1>Admin Users Console</h1>
            <p>
              Manage application users, set roles, and administer account
              security.
            </p>
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
                  Sync Products
                </>
              )}
            </button>
            <Link
              href="/admin/add-product"
              style={{
                backgroundColor: '#ffffff',
                color: '#B88E2F',
                border: '1px solid #B88E2F',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fdfaf5'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Add Product
            </Link>
          </div>
        </div>

        <div className={styles.headerControls}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search email, name or UID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIconWrapper}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue}>{totalUsers}</span>
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
            <span className={styles.metricValue}>{adminCount}</span>
            <span className={styles.metricLabel}>Administrators</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIconWrapper} ${styles.statusGreen}`}>
            <span className={styles.pulseDot}></span>
          </div>
          <div className={styles.metricContent}>
            <span className={styles.statusIndicator}>
              Online
            </span>
            <span className={styles.metricLabel}>Database Status</span>
          </div>
        </div>
      </div>

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
      {loading && users.length === 0 ? (
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
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#9f9f9f",
                    }}
                  >
                    No users matching your query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.uid}>
                    {/* User Profile */}
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

                    {/* Created Time */}
                    <td>
                      {u.metadata.creationTime
                        ? new Date(u.metadata.creationTime).toLocaleDateString()
                        : "N/A"}
                    </td>

                    {/* Last Login */}
                    <td>
                      {u.metadata.lastSignInTime
                        ? new Date(
                            u.metadata.lastSignInTime,
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>

                    {/* Role / Custom Claim Switcher */}
                    <td>
                      <div className={styles.roleToggleWrapper}>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={u.isAdmin}
                            disabled={
                              actionUid === u.uid || u.email === user.email
                            }
                            onChange={() => handleToggleAdmin(u.uid, u.isAdmin)}
                          />
                          <span className={styles.slider}></span>
                        </label>
                        <span
                          className={`${styles.roleBadge} ${u.isAdmin ? styles.roleAdmin : styles.roleUser}`}
                        >
                          {u.isAdmin ? "Admin" : "User"}
                        </span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteUser(u.uid, u.email)}
                        disabled={actionUid === u.uid || u.email === user.email}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
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
      )}
    </div>
  );
};
