"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, UserProfile } from "@/lib/AuthContext";
import {
  Address,
  getAddresses,
  updateUserProfile,
  addAddress,
  updateAddress,
  setDefaultAddress,
} from "@/services/profileService";

export function useProfile() {
  const { user, userProfile, updateUserProfileContext } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAddressesList = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await getAddresses(user.uid);
      setAddresses(data);
    } catch (err: any) {
      console.error("Error fetching addresses:", err);
      setError(err.message || "Failed to load addresses.");
    }
  }, [user]);

  // Load addresses on initialization
  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchAddressesList().finally(() => setLoading(false));
    } else {
      setAddresses([]);
      setLoading(false);
    }
  }, [user, fetchAddressesList]);

  const updatePersonalInfo = async (
    firstName: string,
    lastName: string,
    phoneNumber: string
  ) => {
    if (!user) {
      setError("User is not authenticated.");
      return false;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updateData: Partial<UserProfile> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
      };
      await updateUserProfile(user.uid, updateData);
      
      // Update AuthContext immediately
      updateUserProfileContext(updateData);
      
      setSuccess("Profile information updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err: any) {
      console.error("Error updating personal info:", err);
      setError(err.message || "Failed to update profile. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const addNewAddress = async (
    addressData: Omit<Address, "addressId" | "createdAt" | "updatedAt">
  ) => {
    if (!user) {
      setError("User is not authenticated.");
      return false;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await addAddress(user.uid, addressData);
      await fetchAddressesList();
      setSuccess("New address added successfully!");
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err: any) {
      console.error("Error adding address:", err);
      setError(err.message || "Failed to add address.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const editAddress = async (
    addressId: string,
    addressData: Partial<Address>
  ) => {
    if (!user) {
      setError("User is not authenticated.");
      return false;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateAddress(user.uid, addressId, addressData);
      await fetchAddressesList();
      setSuccess("Address updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err: any) {
      console.error("Error editing address:", err);
      setError(err.message || "Failed to update address.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const makeAddressDefault = async (addressId: string) => {
    if (!user) {
      setError("User is not authenticated.");
      return false;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await setDefaultAddress(user.uid, addressId);
      await fetchAddressesList();
      setSuccess("Default address updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err: any) {
      console.error("Error setting default address:", err);
      setError(err.message || "Failed to set default address.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    profile: userProfile,
    addresses,
    loading,
    saving,
    error,
    success,
    updatePersonalInfo,
    addNewAddress,
    editAddress,
    makeAddressDefault,
    refreshAddresses: fetchAddressesList,
    setError,
    setSuccess,
  };
}
