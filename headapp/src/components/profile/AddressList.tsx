import { useTranslations } from "next-intl";
import React from "react";
import { Address } from "@/services/profileService";
import AddressCard from "./AddressCard";
import EmptyAddress from "./EmptyAddress";

interface AddressListProps {
  addresses: Address[];
  onEditClick: (address: Address) => void;
  onMakeDefaultClick: (addressId: string) => void;
  onAddClick: () => void;
  disabled?: boolean;
}

export default function AddressList({
  addresses,
  onEditClick,
  onMakeDefaultClick,
  onAddClick,
  disabled = false,
}: AddressListProps) {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);

  if (addresses.length === 0) {
    return <EmptyAddress onAddClick={onAddClick} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{t('AddressList-SavedAddresses')}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{t('AddressList-ManageYourShippingAnd')}</p>
        </div>
        <button
          onClick={onAddClick}
          disabled={disabled}
          className="px-4 py-2 border border-amber-600/30 hover:border-amber-600 hover:bg-amber-50 text-amber-600 font-semibold text-sm rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('Global-AddAddress')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((address) => (
          <AddressCard
            key={address.addressId}
            address={address}
            onEditClick={onEditClick}
            onMakeDefaultClick={onMakeDefaultClick}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
