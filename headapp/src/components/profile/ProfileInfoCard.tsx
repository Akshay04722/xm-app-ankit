import { useTranslations } from "next-intl";
import React from "react";
import ProfileForm from "./ProfileForm";
import { UserProfile } from "@/lib/AuthContext";

interface ProfileInfoCardProps {
  profile: UserProfile | null;
  onSave: (firstName: string, lastName: string, phoneNumber: string) => Promise<boolean>;
  saving?: boolean;
}

export default function ProfileInfoCard({
  profile,
  onSave,
  saving = false,
}: ProfileInfoCardProps) {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xs">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">{t('ProfileInfoCard-PersonalInformation')}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{t('ProfileInfoCard-ManageYourNamePhone')}</p>
      </div>
      <ProfileForm profile={profile} onSave={onSave} saving={saving} />
    </div>
  );
}
