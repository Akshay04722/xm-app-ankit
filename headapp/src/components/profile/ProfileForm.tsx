"use client";

import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { UserProfile } from "@/lib/AuthContext";

interface ProfileFormProps {
  profile: UserProfile | null;
  onSave: (firstName: string, lastName: string, phoneNumber: string) => Promise<boolean>;
  saving?: boolean;
}

export default function ProfileForm({
  profile,
  onSave,
  saving = false,
}: ProfileFormProps) {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setPhoneNumber(profile.phoneNumber || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else {
      // Allow only digits, strip any formatted chars, then verify exactly 10 digits
      const digits = phoneNumber.replace(/\D/g, "");
      if (digits.length !== 10) {
        errors.phoneNumber = "Phone number must be exactly 10 digits";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSave(firstName, lastName, phoneNumber);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div className="space-y-1">
          <label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
            {t('ProfileForm-FirstName')}
          </label>
          <input
            id="firstName"
            type="text"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${
              validationErrors.firstName ? "border-red-500" : "border-gray-200"
            }`}
            placeholder={t('ProfileForm-John')}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={saving}
          />
          {validationErrors.firstName && (
            <p className="text-xs font-semibold text-red-500">{validationErrors.firstName}</p>
          )}
        </div>

        {/* Last Name */}
        <div className="space-y-1">
          <label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
            {t('ProfileForm-LastName')}
          </label>
          <input
            id="lastName"
            type="text"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${
              validationErrors.lastName ? "border-red-500" : "border-gray-200"
            }`}
            placeholder={t('ProfileForm-Doe')}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={saving}
          />
          {validationErrors.lastName && (
            <p className="text-xs font-semibold text-red-500">{validationErrors.lastName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone Number */}
        <div className="space-y-1">
          <label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700">
            {t('ProfileForm-PhoneNumber')}
          </label>
          <input
            id="phoneNumber"
            type="tel"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${
              validationErrors.phoneNumber ? "border-red-500" : "border-gray-200"
            }`}
            placeholder={t('Global-Eg5556667777')}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={saving}
          />
          {validationErrors.phoneNumber && (
            <p className="text-xs font-semibold text-red-500">{validationErrors.phoneNumber}</p>
          )}
        </div>

        {/* Email (Read-only) */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-semibold text-gray-700">
            {t('ProfileForm-EmailAddressReadonly')}
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed select-none focus:outline-none"
              value={email}
              readOnly
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-75"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t('ProfileForm-SavingChanges')}
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}
