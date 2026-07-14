import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  setDoc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { UserProfile } from "@/lib/AuthContext";

export interface Address {
  addressId: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  addressType: "Home" | "Work" | "Other";
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Helper to mark other addresses as not default
const unsetDefaults = async (uid: string, excludeAddressId?: string): Promise<void> => {
  try {
    const colRef = collection(db, "users", uid, "addresses");
    const q = query(colRef, where("isDefault", "==", true));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.forEach((docSnap) => {
      if (docSnap.id !== excludeAddressId) {
        batch.update(docSnap.ref, {
          isDefault: false,
          updatedAt: new Date().toISOString(),
        });
      }
    });
    
    await batch.commit();
  } catch (error) {
    console.error("Error unsetting default addresses:", error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const getAddresses = async (uid: string): Promise<Address[]> => {
  const colRef = collection(db, "users", uid, "addresses");
  const querySnapshot = await getDocs(colRef);
  const addresses: Address[] = [];
  querySnapshot.forEach((docSnap) => {
    addresses.push({
      addressId: docSnap.id,
      ...docSnap.data(),
    } as Address);
  });
  return addresses.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
  });
};

export const addAddress = async (
  uid: string,
  address: Omit<Address, "addressId" | "createdAt" | "updatedAt">
): Promise<string> => {
  const colRef = collection(db, "users", uid, "addresses");
  const newDocRef = doc(colRef);
  const timestamp = new Date().toISOString();
  
  if (address.isDefault) {
    await unsetDefaults(uid, newDocRef.id);
  }

  const addressData = {
    ...address,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await setDoc(newDocRef, addressData);
  return newDocRef.id;
};

export const updateAddress = async (
  uid: string,
  addressId: string,
  address: Partial<Address>
): Promise<void> => {
  const docRef = doc(db, "users", uid, "addresses", addressId);
  const timestamp = new Date().toISOString();

  if (address.isDefault) {
    await unsetDefaults(uid, addressId);
  }

  const addressData = {
    ...address,
    updatedAt: timestamp,
  };

  await updateDoc(docRef, addressData);
};

export const setDefaultAddress = async (uid: string, addressId: string): Promise<void> => {
  await unsetDefaults(uid, addressId);
  const docRef = doc(db, "users", uid, "addresses", addressId);
  await updateDoc(docRef, {
    isDefault: true,
    updatedAt: new Date().toISOString(),
  });
};

export const checkProfileCompletion = async (
  uid: string,
  profile: UserProfile | null
): Promise<boolean> => {
  if (!profile) return false;
  if (!profile.firstName?.trim() || !profile.lastName?.trim() || !profile.phoneNumber?.trim()) {
    return false;
  }
  const addresses = await getAddresses(uid);
  return addresses.length > 0;
};
