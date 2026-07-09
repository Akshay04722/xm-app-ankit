"use client";

import React, { JSX, useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import styles from '../../assets/components/Register/Register.module.css';
import { ComponentProps } from 'lib/component-props';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RegisterProps extends ComponentProps {
  fields?: {
    data?: {
      datasource?: {
        title?: {
          jsonValue?: {
            value: string;
          };
        };
        subtitle?: {
          jsonValue?: {
            value: string;
          };
        };
      };
    };
  };
}

export const Default = (props: RegisterProps): JSX.Element => {
  const { fields, params } = props;
  const datasource = fields?.data?.datasource;
  const id = params?.RenderingIdentifier;

  const { user, signUp, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if already signed in
  useEffect(() => {
    if (user && !success && !loading) {
      router.push('/');
    }
  }, [user, success, loading, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic Client Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setFormLoading(true);

    try {
      await signUp(email, password);
      setSuccess("Account created successfully!");
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/');
      }, 1500);

      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      console.error("Registration failed:", err);
      // Map Firebase auth errors
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError("This email address is already in use.");
          break;
        case 'auth/invalid-email':
          setError("Invalid email address format.");
          break;
        case 'auth/operation-not-allowed':
          setError("Email/Password accounts are not enabled.");
          break;
        case 'auth/weak-password':
          setError("The password is too weak. Please use a stronger password.");
          break;
        default:
          setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.registerContainer} id={id || undefined}>
        <div className={styles.registerCard}>
          <p className="text-center text-gray-500">Loading session...</p>
        </div>
      </section>
    );
  }

  const titleText = datasource?.title?.jsonValue?.value || "Create Account";
  const subtitleText = datasource?.subtitle?.jsonValue?.value || "Register a new account to get started";

  return (
    <section className={styles.registerContainer} id={id || undefined}>
      <div className={styles.registerCard}>
        <div>
          <div className={styles.registerHeader}>
            <h2 className={styles.registerTitle}>{titleText}</h2>
            <p className={styles.registerSubtitle}>{subtitleText}</p>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.successMessage}>{success}</div>}

          <form onSubmit={handleRegister}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className={styles.formInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={formLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={styles.formInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                disabled={formLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className={styles.formInput}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={formLoading}
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className={styles.registerButton}
            >
              {formLoading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className={styles.loginLinkContainer}>
            Already have an account?
            <Link href="/sign-in" className={styles.loginLink}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
