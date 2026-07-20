"use client";

import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { checkProfileCompletion } from "@/services/profileService";

export default function ProfileCompletionDialog() {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);

  const { user, userProfile, loadingProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Avoid running on the profile page itself, as the user is already here to update it
    if (pathname === "/profile" || pathname?.includes("/profile")) {
      setIsOpen(false);
      return;
    }

    if (!user || loadingProfile) return;

    // Check if popup was already shown in the current browser session
    const hasBeenShown = sessionStorage.getItem("profileCompletionPopupShown");
    if (hasBeenShown === "true") return;

    const performCompletionCheck = async () => {
      try {
        const isComplete = await checkProfileCompletion(user.uid, userProfile);
        if (!isComplete) {
          setIsOpen(true);
          sessionStorage.setItem("profileCompletionPopupShown", "true");
        }
      } catch (err) {
        console.error("Error checking profile completion:", err);
      }
    };

    performCompletionCheck();
  }, [user, userProfile, loadingProfile, pathname]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleUpdate = () => {
    setIsOpen(false);
    router.push("/profile");
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Popup Dialog Box */}
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 p-6 overflow-hidden transform transition-all duration-300 z-10 text-center">
        
        {/* Warning Icon */}
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-7 h-7 text-amber-600 animate-pulse"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('ProfileCompletionDialog-CompleteYourProfile')}</h3>
        <p className="text-base text-gray-500 leading-relaxed mb-6">
          {t('ProfileCompletionDialog-SomeImportantInformationI')}
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-base rounded-xl transition cursor-pointer"
          >
            {t('Global-Close')}
          </button>
          <button
            onClick={handleUpdate}
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-base rounded-xl shadow-xs hover:shadow transition cursor-pointer"
          >
            {t('ProfileCompletionDialog-UpdateProfile')}
          </button>
        </div>
      </div>
    </div>
  );
}
