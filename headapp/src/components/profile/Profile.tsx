"use client";

import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { ComponentProps } from "lib/component-props";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import ProfileHeader from "./ProfileHeader";
import ProfileInfoCard from "./ProfileInfoCard";
import AddressList from "./AddressList";
import AddressDialog from "./AddressDialog";
import { Address } from "@/services/profileService";
import Link from "next/link";
import OrdersList from "../OrdersList/OrdersList";

interface ProfileProps extends ComponentProps {}

export const Default = (props: ProfileProps): React.JSX.Element => {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);

  const { user, loading: authLoading } = useAuth();
  const {
    profile,
    addresses,
    loading: profileLoading,
    saving,
    error,
    success,
    updatePersonalInfo,
    addNewAddress,
    editAddress,
    makeAddressDefault,
    setError,
    setSuccess,
  } = useProfile();

  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "orders">("details");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "orders") {
        setActiveTab("orders");
      }
    }
  }, []);

  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setIsAddressDialogOpen(true);
  };

  const handleOpenEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsAddressDialogOpen(true);
  };

  const handleAddressSubmit = async (
    addressData: Omit<Address, "addressId" | "createdAt" | "updatedAt">
  ): Promise<boolean> => {
    if (editingAddress) {
      return await editAddress(editingAddress.addressId, addressData);
    } else {
      return await addNewAddress(addressData);
    }
  };

  const isLoading = authLoading || (user && profileLoading);

  // Unauthenticated State
  if (!authLoading && !user) {
    return (
      <div className="container py-16 flex flex-col items-center justify-center min-h-[60vh] text-center w-full mx-auto">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto border border-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-10 h-10 text-red-600 mx-auto"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">{t('Profile-AccessRestricted')}</h3>
        <p className="text-base text-gray-500 max-w-md mb-8 text-center mx-auto">
          {t('Profile-PleaseSignInTo')}
        </p>
        <Link
          href="/sign-in"
          className="px-8 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-base rounded-xl transition shadow-xs mx-auto inline-block"
        >
          {t('Global-SignIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12 space-y-8 min-h-[70vh]">
      
      {/* Toast Notifications */}
      {success && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl z-50 flex items-center gap-2.5 animate-slide-in-right font-medium text-base">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-2 hover:opacity-85 text-white/90 text-lg">
            {t('Global-Times')}
          </button>
        </div>
      )}

      {error && (
        <div className="fixed bottom-5 right-5 bg-red-600 text-white px-5 py-3 rounded-2xl shadow-xl z-50 flex items-center gap-2.5 animate-slide-in-right font-medium text-base">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:opacity-85 text-white/90 text-lg">
            {t('Global-Times')}
          </button>
        </div>
      )}

      {isLoading ? (
        // Loading Spinner Centered
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center w-full py-16 mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mb-4 mx-auto"></div>
          <p className="text-base text-gray-500 font-medium">{t('Profile-LoadingProfileDetails')}</p>
        </div>
      ) : (
        // Rendered Dashboard
        <>
          <ProfileHeader profile={profile} />

          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-150 mb-8 gap-8 font-poppins">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`pb-3 text-[17px] font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "details"
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-gray-400 hover:text-gray-900"
              }`}
            >
              {t('Profile-ProfileDetailsAddresses')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`pb-3 text-[17px] font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "orders"
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-gray-400 hover:text-gray-900"
              }`}
            >
              {t('Global-MyOrders')}
            </button>
          </div>

          {activeTab === "details" ? (
            <div className="row g-4 items-start">
              {/* Left Side: Personal Info Form */}
              <div className="col-12 col-md-5 col-lg-5">
                <ProfileInfoCard profile={profile} onSave={updatePersonalInfo} saving={saving} />
              </div>

              {/* Right Side: Address Management */}
              <div className="col-12 col-md-7 col-lg-7">
                <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xs">
                  <AddressList
                    addresses={addresses}
                    onEditClick={handleOpenEditAddress}
                    onMakeDefaultClick={makeAddressDefault}
                    onAddClick={handleOpenAddAddress}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xs">
              <OrdersList embedded={true} />
            </div>
          )}

          {/* Add/Edit Dialog modal */}
          <AddressDialog
            isOpen={isAddressDialogOpen}
            onClose={() => setIsAddressDialogOpen(false)}
            onSubmit={handleAddressSubmit}
            address={editingAddress}
            saving={saving}
          />
        </>
      )}
    </div>
  );
};

export default Default;
