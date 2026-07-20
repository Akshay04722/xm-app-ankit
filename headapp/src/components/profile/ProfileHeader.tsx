import { useTranslations } from "next-intl";
import React from "react";
import { UserProfile } from "@/lib/AuthContext";

interface ProfileHeaderProps {
  profile: UserProfile | null;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);

  const email = profile?.email || "";
  
  const getInitials = () => {
    if (!profile) return "U";
    if (profile.firstName && profile.lastName) {
      return (profile.firstName.trim().charAt(0) + profile.lastName.trim().charAt(0)).toUpperCase();
    }
    if (profile.firstName) return profile.firstName.trim().charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return "U";
  };

  const getFullName = () => {
    if (!profile) return "User Account";
    const first = profile.firstName?.trim() || "";
    const last = profile.lastName?.trim() || "";
    if (first || last) {
      return `${first} ${last}`.trim();
    }
    return email ? email.split("@")[0] : "User Account";
  };

  // Generate a deterministic soft pastel background color based on email string
  const getAvatarBg = () => {
    if (!email) return "bg-amber-100 text-amber-700";
    const colors = [
      "bg-amber-100 text-amber-800 border-amber-200",
      "bg-emerald-100 text-emerald-800 border-emerald-200",
      "bg-blue-100 text-blue-800 border-blue-200",
      "bg-indigo-100 text-indigo-800 border-indigo-200",
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-rose-100 text-rose-800 border-rose-200",
    ];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="relative overflow-hidden bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-amber-50/40 to-transparent -z-10 rounded-full" />
      
      {/* Avatar Container */}
      <div className="relative">
        <div
          className={`w-24 h-24 rounded-full border-4 border-white flex items-center justify-center text-3xl font-bold tracking-wider shadow-md uppercase select-none ${getAvatarBg()}`}
        >
          {getInitials()}
        </div>
        <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-xs" title={t('Global-Online')} />
      </div>

      {/* User Info details */}
      <div className="text-center md:text-left space-y-1">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">
            {getFullName()}
          </h2>
          <span className="text-xs font-semibold uppercase px-2.5 py-1 rounded bg-gray-100 text-gray-600 border border-gray-200 w-fit mx-auto md:mx-0">
            {t('ProfileHeader-VerifiedAccount')}
          </span>
        </div>
        <p className="text-sm text-gray-500 font-medium">{email}</p>
        <p className="text-sm text-gray-400 mt-2">
          {t('ProfileHeader-MemberSince')} {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : t('ProfileHeader-Recently')}
        </p>
      </div>
    </div>
  );
}
