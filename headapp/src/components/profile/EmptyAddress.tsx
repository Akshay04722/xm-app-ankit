import { useTranslations } from "next-intl";
import React from "react";

interface EmptyAddressProps {
  onAddClick: () => void;
}

export default function EmptyAddress({ onAddClick }: EmptyAddressProps) {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white border border-dashed border-gray-200 rounded-2xl shadow-sm text-center">
      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-8 h-8 text-amber-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
          />
        </svg>
      </div>
      <h4 className="text-lg font-semibold text-gray-900 mb-1">{t('EmptyAddress-NoAddressesSaved')}</h4>
      <p className="text-sm text-gray-500 max-w-sm mb-5">
        {t('EmptyAddress-YouHaventAddedAny')}
      </p>
      <button
        onClick={onAddClick}
        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-xl shadow-sm hover:shadow transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
      >
        {t('Global-AddAddress')}
      </button>
    </div>
  );
}
