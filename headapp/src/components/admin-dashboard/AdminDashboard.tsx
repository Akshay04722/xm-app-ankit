"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ComponentProps } from 'lib/component-props';
import Link from 'next/link';
import styles from '../../assets/components/AdminDashboard/AdminDashboard.module.css';

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
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionUid, setActionUid] = useState<string | null>(null); // tracks user undergoing update/delete
  const [isAdmin, setIsAdmin] = useState(false);
  const [claimsLoading, setClaimsLoading] = useState(true);

  // Check admin claims when user changes
  useEffect(() => {
    if (user) {
      user.getIdTokenResult()
        .then((idTokenResult) => {
          const role = idTokenResult.claims.role;
          const adminClaim = idTokenResult.claims.isAdmin || role === 'admin';
          setIsAdmin(!!adminClaim);
        })
        .catch((err) => {
          console.error('Error checking admin claims:', err);
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
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(debouncedSearch)}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching users');
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
  const handleToggleAdmin = async (targetUid: string, currentIsAdmin: boolean) => {
    if (!user) return;
    try {
      setActionUid(targetUid);
      const idToken = await user.getIdToken();
      const nextIsAdmin = !currentIsAdmin;

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
          prev.map((u) => (u.uid === targetUid ? { ...u, isAdmin: nextIsAdmin, role: nextIsAdmin ? 'admin' : 'user' } : u))
        );
        setSuccess(`Custom claim updated for user. Role set to: ${nextIsAdmin ? 'admin' : 'user'}`);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || 'Failed to update custom claim');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating claim');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionUid(null);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (targetUid: string, targetEmail: string) => {
    if (!user) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete the user account for ${targetEmail}? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setActionUid(targetUid);
      const idToken = await user.getIdToken();

      const res = await fetch(`/api/admin/users?uid=${targetUid}`, {
        method: 'DELETE',
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
        setError(data.error || 'Failed to delete user');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting user');
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
          <svg viewBox="0 0 24 24" width="60" height="60" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        </div>
        <h2>Access Denied</h2>
        <p>This administrative dashboard is restricted to users with admin privileges only.</p>
        <Link href="/" className={styles.backHomeBtn}>
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Header section */}
      <div className={styles.dashboardHeader}>
        <div className={styles.titleSection}>
          <h1>Admin Users Console</h1>
          <p>Manage application users, set roles, and administer account security.</p>
        </div>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search email, name or UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Dynamic Alerts */}
      {success && <div className={`${styles.alert} ${styles.alertSuccess}`}>{success}</div>}
      {error && <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>}

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
                <th>Admin Role (Custom Claim)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#9f9f9f' }}>
                    No users matching your query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.uid}>
                    {/* User Profile */}
                    <td>
                      <div className={u.photoURL ? undefined : styles.userCell}>
                        <div className={styles.avatar}>
                          {u.displayName ? u.displayName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.userInfo}>
                          <span className={styles.displayName}>
                            {u.displayName || u.email.split('@')[0]}
                          </span>
                          <span className={styles.uidSub}>UID: {u.uid}</span>
                        </div>
                      </div>
                    </td>

                    {/* Created Time */}
                    <td>{u.metadata.creationTime ? new Date(u.metadata.creationTime).toLocaleDateString() : 'N/A'}</td>

                    {/* Last Login */}
                    <td>{u.metadata.lastSignInTime ? new Date(u.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}</td>

                    {/* Role / Custom Claim Switcher */}
                    <td>
                      <div className={styles.roleToggleWrapper}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            className={styles.checkboxInput}
                            checked={u.isAdmin}
                            disabled={actionUid === u.uid || u.email === user.email}
                            onChange={() => handleToggleAdmin(u.uid, u.isAdmin)}
                          />
                          <span>Is Admin</span>
                        </label>
                        <span className={`${styles.roleBadge} ${u.isAdmin ? styles.roleAdmin : styles.roleUser}`}>
                          {u.isAdmin ? 'Admin' : 'User'}
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
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
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
