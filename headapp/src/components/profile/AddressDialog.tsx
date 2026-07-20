"use client";

import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { Address } from "@/services/profileService";
// @ts-ignore
import countriesDataRaw from "@/lib/countriesData";

interface StateData {
  id: number;
  name: string;
  state_code: string;
}

interface CountryData {
  name: string;
  iso2: string;
  emoji: string;
  states: StateData[];
}

const countriesData = countriesDataRaw as CountryData[];

interface AddressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (addressData: Omit<Address, "addressId" | "createdAt" | "updatedAt">) => Promise<boolean>;
  address?: Address | null;
  saving?: boolean;
}

export default function AddressDialog({
  isOpen,
  onClose,
  onSubmit,
  address = null,
  saving = false,
}: AddressDialogProps) {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("United States");
  const [postalCode, setPostalCode] = useState("");
  const [addressType, setAddressType] = useState<"Home" | "Work" | "Other">("Home");
  const [isDefault, setIsDefault] = useState(false);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const selectedCountryObj = countriesData.find(
    (c) => c.name.toLowerCase() === country.toLowerCase()
  );
  const statesList = selectedCountryObj ? selectedCountryObj.states : [];

  useEffect(() => {
    if (address) {
      setFullName(address.fullName || "");
      setPhoneNumber(address.phoneNumber || "");
      setAddressLine1(address.addressLine1 || "");
      setAddressLine2(address.addressLine2 || "");
      setLandmark(address.landmark || "");
      setCity(address.city || "");
      setPostalCode(address.postalCode || "");
      setAddressType(address.addressType || "Home");
      setIsDefault(address.isDefault || false);

      const initialCountry = address.country || "United States";
      const matchedCountry = countriesData.find(
        (c) =>
          c.name.toLowerCase() === initialCountry.toLowerCase() ||
          c.iso2.toLowerCase() === initialCountry.toLowerCase()
      );

      if (matchedCountry) {
        setCountry(matchedCountry.name);
        const initialState = address.state || "";
        const matchedState = matchedCountry.states.find(
          (s) =>
            s.name.toLowerCase() === initialState.toLowerCase() ||
            s.state_code.toLowerCase() === initialState.toLowerCase()
        );
        setState(matchedState ? matchedState.name : initialState);
      } else {
        setCountry(initialCountry);
        setState(address.state || "");
      }
    } else {
      setFullName("");
      setPhoneNumber("");
      setAddressLine1("");
      setAddressLine2("");
      setLandmark("");
      setCity("");
      setState("");
      setCountry("United States");
      setPostalCode("");
      setAddressType("Home");
      setIsDefault(false);
    }
    setValidationErrors({});
  }, [address, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!fullName.trim()) errors.fullName = "Full name is required";
    
    if (!phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else {
      const digits = phoneNumber.replace(/\D/g, "");
      if (digits.length !== 10) {
        errors.phoneNumber = "Phone number must be exactly 10 digits";
      }
    }
    
    if (!addressLine1.trim()) errors.addressLine1 = "Address line 1 is required";
    if (!city.trim()) errors.city = "City is required";
    if (!state.trim()) errors.state = "State is required";
    if (!country.trim()) errors.country = "Country is required";
    if (!postalCode.trim()) errors.postalCode = "Postal code is required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const cleanedPhone = phoneNumber.trim();

    const addressData: Omit<Address, "addressId" | "createdAt" | "updatedAt"> = {
      fullName: fullName.trim(),
      phoneNumber: cleanedPhone,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || "",
      landmark: landmark.trim() || "",
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      postalCode: postalCode.trim(),
      addressType,
      isDefault,
    };

    const success = await onSubmit(addressData);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={saving ? undefined : onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 z-10 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">
            {address ? t('AddressDialog-EditAddress') : t('AddressDialog-AddNewAddress')}
          </h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
            aria-label={t('Global-Close')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label htmlFor="fullName" className="text-base font-semibold text-gray-700">
              {t('AddressDialog-FullName')}
            </label>
            <input
              id="fullName"
              type="text"
              className={`w-full px-4 py-2.5 rounded-xl border text-base transition focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${
                validationErrors.fullName ? "border-red-500" : "border-gray-200"
              }`}
              placeholder={t('AddressDialog-EgJohnDoe')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={saving}
            />
            {validationErrors.fullName && (
              <p className="text-sm font-semibold text-red-500">{validationErrors.fullName}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label htmlFor="phone" className="text-base font-semibold text-gray-700">
              {t('AddressDialog-PhoneNumber10Digits')}
            </label>
            <input
              id="phone"
              type="tel"
              className={`w-full px-4 py-2.5 rounded-xl border text-base transition focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${
                validationErrors.phoneNumber ? "border-red-500" : "border-gray-200"
              }`}
              placeholder={t('Global-Eg5556667777')}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={saving}
            />
            {validationErrors.phoneNumber && (
              <p className="text-sm font-semibold text-red-500">{validationErrors.phoneNumber}</p>
            )}
          </div>

          {/* Address Line 1 */}
          <div className="space-y-1">
            <label htmlFor="line1" className="text-base font-semibold text-gray-700">
              {t('AddressDialog-AddressLine1')}
            </label>
            <input
              id="line1"
              type="text"
              className={`w-full px-4 py-2.5 rounded-xl border text-base transition focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${
                validationErrors.addressLine1 ? "border-red-500" : "border-gray-200"
              }`}
              placeholder={t('AddressDialog-StreetAddressPoBox')}
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              disabled={saving}
            />
            {validationErrors.addressLine1 && (
              <p className="text-sm font-semibold text-red-500">{validationErrors.addressLine1}</p>
            )}
          </div>

          {/* Address Line 2 */}
          <div className="space-y-1">
            <label htmlFor="line2" className="text-base font-semibold text-gray-700">
              {t('AddressDialog-AddressLine2Optional')}
            </label>
            <input
              id="line2"
              type="text"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base transition focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              placeholder={t('AddressDialog-ApartmentSuiteUnitBuildin')}
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Landmark */}
          <div className="space-y-1">
            <label htmlFor="landmark" className="text-base font-semibold text-gray-700">
              {t('AddressDialog-LandmarkOptional')}
            </label>
            <input
              id="landmark"
              type="text"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base transition focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              placeholder={t('AddressDialog-EgNearCentralPark')}
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* City & State Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="city" className="text-base font-semibold text-gray-700">
                {t('AddressDialog-City')}
              </label>
              <input
                id="city"
                type="text"
                className={`w-full px-4 py-2.5 rounded-xl border text-base transition focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${
                  validationErrors.city ? "border-red-500" : "border-gray-200"
                }`}
                placeholder={t('AddressDialog-EgNewYork')}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={saving}
              />
              {validationErrors.city && (
                <p className="text-sm font-semibold text-red-500">{validationErrors.city}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="state" className="text-base font-semibold text-gray-700">
                {t('AddressDialog-State')}
              </label>
              {statesList.length > 0 ? (
                <select
                  id="state"
                  className={`w-full px-4 py-2.5 rounded-xl border text-base transition focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white ${
                    validationErrors.state ? "border-red-500" : "border-gray-200"
                  }`}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={saving}
                >
                  <option value="">{t('AddressDialog-SelectState')}</option>
                  {statesList.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="state"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border text-base transition focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${
                    validationErrors.state ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder={t('AddressDialog-EgStateprovince')}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={saving || !country}
                />
              )}
              {validationErrors.state && (
                <p className="text-sm font-semibold text-red-500">{validationErrors.state}</p>
              )}
            </div>
          </div>

          {/* Country & Postal Code Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="country" className="text-base font-semibold text-gray-700">
                {t('AddressDialog-Country')}
              </label>
              <select
                id="country"
                className={`w-full px-4 py-2.5 rounded-xl border text-base transition focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white ${
                  validationErrors.country ? "border-red-500" : "border-gray-200"
                }`}
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setState("");
                }}
                disabled={saving}
              >
                <option value="">{t('AddressDialog-SelectCountry')}</option>
                {countriesData.map((c) => (
                  <option key={c.iso2} value={c.name}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
              {validationErrors.country && (
                <p className="text-sm font-semibold text-red-500">{validationErrors.country}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="postalCode" className="text-base font-semibold text-gray-700">
                {t('AddressDialog-PostalCode')}
              </label>
              <input
                id="postalCode"
                type="text"
                className={`w-full px-4 py-2.5 rounded-xl border text-base transition focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${
                  validationErrors.postalCode ? "border-red-500" : "border-gray-200"
                }`}
                placeholder={t('AddressDialog-Eg10001')}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                disabled={saving}
              />
              {validationErrors.postalCode && (
                <p className="text-sm font-semibold text-red-500">{validationErrors.postalCode}</p>
              )}
            </div>
          </div>

          {/* Address Type Selector */}
          <div className="space-y-1">
            <label className="text-base font-semibold text-gray-700 block mb-1">
              {t('AddressDialog-AddressType')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Home", "Work", "Other"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAddressType(type)}
                  disabled={saving}
                  className={`py-2.5 text-base rounded-xl border font-medium transition cursor-pointer ${
                    addressType === type
                      ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Default Address Checkbox */}
          <div className="flex items-center gap-2.5 pt-2">
            <input
              id="isDefault"
              type="checkbox"
              className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              disabled={saving}
            />
            <label htmlFor="isDefault" className="text-base text-gray-700 cursor-pointer select-none">
              {t('AddressDialog-MakeThisMyDefault')}
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 border border-gray-200 rounded-xl text-base font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              {t('Global-Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-base rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-75"
            >
              {saving ? t('AddressDialog-Saving') : address ? "Update Address" : "Add Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
