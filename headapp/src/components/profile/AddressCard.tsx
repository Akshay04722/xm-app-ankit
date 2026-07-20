import { useTranslations } from "next-intl";
import React from "react";
import { Address } from "@/services/profileService";

interface AddressCardProps {
  address: Address;
  onEditClick: (address: Address) => void;
  onMakeDefaultClick: (addressId: string) => void;
  disabled?: boolean;
}

export default function AddressCard({
  address,
  onEditClick,
  onMakeDefaultClick,
  disabled = false,
}: AddressCardProps) {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);

  const {
    addressId,
    fullName,
    phoneNumber,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    country,
    postalCode,
    addressType,
    isDefault,
  } = address;

  return (
    <div className={`relative p-6 rounded-2xl bg-white border border-gray-100 hover:border-amber-200 transition duration-300 shadow-xs hover:shadow-md flex flex-col justify-between h-full group ${isDefault ? 'ring-2 ring-amber-500/80 bg-amber-50/10' : ''}`}>
      <div>
        <div className="flex items-start justify-between mb-3 gap-2">
          <div>
            <h4 className="font-semibold text-base text-gray-900 leading-tight">{fullName}</h4>
            <span className="text-sm text-gray-500 mt-0.5 inline-block">{phoneNumber}</span>
          </div>
          
          <div className="flex flex-wrap gap-1 items-center justify-end">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                addressType === "Home"
                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                  : addressType === "Work"
                  ? "bg-purple-50 text-purple-700 border border-purple-100"
                  : "bg-gray-100 text-gray-700 border border-gray-200"
              }`}
            >
              {addressType}
            </span>
            {isDefault && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {t('Global-Default')}
              </span>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600 leading-relaxed mb-6 space-y-0.5">
          <p>{addressLine1}</p>
          {addressLine2 && <p>{addressLine2}</p>}
          {landmark && <p className="text-sm text-gray-500 italic">{t('Global-Landmark')} {landmark}</p>}
          <p>
            {city}, {state} {postalCode}
          </p>
          <p className="text-sm text-gray-400 font-medium tracking-wide uppercase mt-1">
            {country}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-gray-50 pt-4 mt-auto">
        <button
          onClick={() => onEditClick(address)}
          disabled={disabled}
          className="text-sm font-semibold text-gray-700 hover:text-amber-600 transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-3.5 h-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.013a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
            />
          </svg>
          {t('Global-Edit')}
        </button>

        {!isDefault && (
          <button
            onClick={() => onMakeDefaultClick(addressId)}
            disabled={disabled}
            className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition flex items-center gap-1 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('AddressCard-MarkAsDefault')}
          </button>
        )}
      </div>
    </div>
  );
}
