"use client";

import React, { JSX, useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import styles from '../../assets/components/SignIn/SignIn.module.css';
import { ComponentProps } from 'lib/component-props';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SignInProps extends ComponentProps {
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

export const Default = (props: SignInProps): JSX.Element => {
  const { fields, params } = props;
  const datasource = fields?.data?.datasource;
  const id = params?.RenderingIdentifier;

  const { user, signIn, signInWithGoogle, signOutUser, sendResetEmail, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFormLoading(true);

    try {
      // First check if the email exists in the system
      const checkRes = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const checkData = await checkRes.json();

      if (!checkRes.ok) {
        setError(checkData.error || 'Failed to verify email. Please try again.');
        return;
      }

      if (!checkData.exists) {
        setError('No account found with this email address. Please check and try again.');
        return;
      }

      // Email exists, proceed with sending reset email
      await sendResetEmail(email);
      setSuccess("Password reset email sent! Please check your inbox.");
      setEmail('');
    } catch (err: any) {
      console.error("Password reset failed:", err);
      switch (err.code) {
        case 'auth/invalid-email':
          setError("Invalid email address format.");
          break;
        case 'auth/user-not-found':
          setError("No account found with this email address.");
          break;
        default:
          setError(err.message || "Failed to send reset email. Please try again.");
      }
    } finally {
      setFormLoading(false);
    }
  };



  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFormLoading(true);

    try {
      await signIn(email, password);
      setSuccess("Successfully signed in!");
      setEmail('');
      setPassword('');

      setTimeout(() => {
        router.push('/');
      }, 1500);

      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      // Map Firebase error codes to friendly messages
      switch (err.code) {
        case 'auth/invalid-email':
          setError("Invalid email address format.");
          break;
        case 'auth/user-disabled':
          setError("This user account has been disabled.");
          break;
        case 'auth/user-not-found':
          setError("No user found with this email.");
          break;
        case 'auth/wrong-password':
          setError("Incorrect password. Please try again.");
          break;
        case 'auth/invalid-credential':
          setError("Invalid email or password.");
          break;
        default:
          setError(err.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setFormLoading(true);

    try {
      await signInWithGoogle();
      setSuccess("Successfully signed in with Google!");

      setTimeout(() => {
        router.push('/');
      }, 1500);

      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      console.error("Google sign-in failed:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in popup was closed before completing.");
      } else {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setSuccess(null);
    } catch (err) {
      console.error("Sign-out failed:", err);
    }
  };

  if (loading) {
    return (
      <section className={styles.signInContainer} id={id || undefined}>
        <div className={styles.signInCard}>
          <p className="text-center text-gray-500">Loading session...</p>
        </div>
      </section>
    );
  }

  const titleText = datasource?.title?.jsonValue?.value || "Sign In";
  const subtitleText = datasource?.subtitle?.jsonValue?.value || "Please sign in to your account";

  return (
    <section className={styles.signInContainer} id={id || undefined}>
      <div className={styles.signInCard}>
        {user ? (
          <div className={styles.sessionState}>
            <div className={styles.signInHeader}>
              <h2 className={styles.signInTitle}>Welcome Back!</h2>
              <p className={styles.signInSubtitle}>You are currently signed in.</p>
            </div>
            <div className={styles.successMessage}>
              Signed in as <span className={styles.sessionEmail}>{user.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className={styles.signOutButton}
            >
              Sign Out
            </button>
          </div>
        ) : isForgotPassword ? (
          <div>
            <div className={styles.signInHeader}>
              <h2 className={styles.signInTitle}>Reset Password</h2>
              <p className={styles.signInSubtitle}>Enter your email to receive a password reset link</p>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div className={styles.successMessage}>{success}</div>}

            <form onSubmit={handleResetPassword}>
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

              <button
                type="submit"
                disabled={formLoading}
                className={styles.signInButton}
              >
                {formLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className={styles.backToSignInContainer}>
              Remembered your password?
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setSuccess(null);
                }}
                className={styles.backToSignInButton}
              >
                Sign In
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className={styles.signInHeader}>
              <h2 className={styles.signInTitle}>{titleText}</h2>
              <p className={styles.signInSubtitle}>{subtitleText}</p>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div className={styles.successMessage}>{success}</div>}

            <form onSubmit={handleSignIn}>
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
                <div className={styles.passwordLabelContainer}>
                  <label className={styles.formLabel} htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                      setSuccess(null);
                    }}
                    className={styles.forgotPasswordLink}
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  className={styles.formInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={formLoading}
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className={styles.signInButton}
              >
                {formLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className={styles.divider}>
              <span className={styles.dividerText}>or</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={formLoading}
              className={styles.googleButton}
            >
              <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            <div className={styles.registerLinkContainer}>
              Don't have an account?
              <Link href="/register" className={styles.registerLink}>
                Create one
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
