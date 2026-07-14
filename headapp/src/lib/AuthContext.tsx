"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "@firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface UserProfile {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  photoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loadingProfile: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signOutUser: () => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  updateUserProfileContext: (profile: Partial<UserProfile>) => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoadingProfile(true);
        const profile = await fetchProfile(currentUser.uid);
        
        if (profile) {
          setUserProfile(profile);
        } else {
          // Fallback creation for existing users with no firestore record
          const email = currentUser.email || "";
          const prefix = email.split("@")[0] || "";
          const defaultFirstName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
          
          const initialProfile: UserProfile = {
            uid: currentUser.uid,
            email: email.trim().toLowerCase(),
            firstName: defaultFirstName,
            lastName: "User",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          try {
            await setDoc(doc(db, "users", currentUser.uid), initialProfile);
            setUserProfile(initialProfile);
          } catch (err) {
            console.error("Error writing fallback user profile:", err);
          }
        }
        setLoadingProfile(false);
      } else {
        setUserProfile(null);
        setLoadingProfile(false);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("profileCompletionPopupShown");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = (email: string, password: string): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async (): Promise<UserCredential> => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    
    // Check and create profile if not present
    if (cred.user) {
      const existingProfile = await fetchProfile(cred.user.uid);
      if (!existingProfile) {
        let firstName = "";
        let lastName = "";
        const displayName = cred.user.displayName;
        if (displayName) {
          const parts = displayName.trim().split(/\s+/);
          firstName = parts[0] || "";
          lastName = parts.slice(1).join(" ") || "";
        }
        
        const initialProfile: UserProfile = {
          uid: cred.user.uid,
          email: (cred.user.email || "").trim().toLowerCase(),
          firstName,
          lastName,
          photoUrl: cred.user.photoURL || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        try {
          await setDoc(doc(db, "users", cred.user.uid), initialProfile);
          setUserProfile(initialProfile);
        } catch (err) {
          console.error("Error creating Google user profile:", err);
        }
      } else {
        setUserProfile(existingProfile);
      }
    }
    return cred;
  };

  const signUp = async (email: string, password: string): Promise<UserCredential> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (cred.user) {
      const initialProfile: UserProfile = {
        uid: cred.user.uid,
        email: email.trim().toLowerCase(),
        firstName: "",
        lastName: "",
        phoneNumber: "",
        photoUrl: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      try {
        await setDoc(doc(db, "users", cred.user.uid), initialProfile);
        setUserProfile(initialProfile);
      } catch (err) {
        console.error("Error creating registration user profile:", err);
      }
    }
    return cred;
  };

  const signOutUser = (): Promise<void> => {
    return signOut(auth);
  };

  const sendResetEmail = (email: string): Promise<void> => {
    return sendPasswordResetEmail(auth, email);
  };

  const updateUserProfileContext = (updatedFields: Partial<UserProfile>) => {
    setUserProfile((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await fetchProfile(user.uid);
      if (profile) {
        setUserProfile(profile);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        loadingProfile,
        signIn,
        signInWithGoogle,
        signUp,
        signOutUser,
        sendResetEmail,
        updateUserProfileContext,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

