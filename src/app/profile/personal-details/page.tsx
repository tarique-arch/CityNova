'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Landmark,
  Building2,
  MapPin,
  ShieldCheck,
  FileText,
  Edit3,
  Check,
  AlertCircle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';

export default function PersonalDetailsPage() {
  const router = useRouter();
  const { user, loading: authLoading, refresh } = useAuth();

  const [profileForm, setProfileForm] = useState({
    dob: user?.dob || '',
    email: user?.email || '',
    bio: user?.bio || '',
    designation: user?.designation || '',
  });

  // Sync form when user is loaded
  React.useEffect(() => {
    if (user) {
      setProfileForm({
        dob: user.dob || '',
        email: user.email || '',
        bio: user.bio || '',
        designation: user.designation || '',
      });
    }
  }, [user]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading personal details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-16 text-center space-y-4">
          <h2 className="text-xl font-black text-slate-900">Sign in Required</h2>
          <p className="text-xs text-slate-600">Please sign in to view and update your personal details.</p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Go to Sign In
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isAuthority = user.role === 'AUTHORITY';
  const cityName = user.city?.name || 'Local City';
  const stateName = user.state || user.city?.state || 'India';

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingProfile(true);
    setProfileSaveError('');
    setProfileSaveSuccess(false);

    try {
      if (user?.id) {
        localStorage.setItem(
          `citynova_profile_extras_${user.id}`,
          JSON.stringify(profileForm)
        );
      }

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      await refresh();
      setProfileSaveSuccess(true);
      setProfileSaveError('');
      setIsEditingProfile(false);
      setTimeout(() => setProfileSaveSuccess(false), 4000);
    } catch (err) {
      setProfileSaveError(err instanceof Error ? err.message : 'Failed to update profile');
      setProfileSaveSuccess(false);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </Link>
        </div>

        {/* Personal Details Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Personal Details</h1>
              <p className="text-xs text-slate-500 mt-1">
                {isAuthority
                  ? 'Your authenticated official authority credentials and jurisdictional details.'
                  : 'Your authenticated civic citizen credentials and official details.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(!isEditingProfile);
                  setProfileSaveError('');
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isEditingProfile
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingProfile ? 'Cancel Edit' : 'Edit Profile Info'}</span>
              </button>
            </div>
          </div>

          {profileSaveSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Successfully updated profile.</span>
            </div>
          )}

          {profileSaveError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{profileSaveError}</span>
            </div>
          )}

          {/* Editing Form Mode */}
          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="p-4 rounded-2xl bg-slate-100/60 border border-slate-200/70 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Full Legal Name (Verified)
                  </span>
                  <p className="text-base font-extrabold text-slate-800">{user.name || 'Not provided'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100/60 border border-slate-200/70 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    CityNova Username (Fixed)
                  </span>
                  <p className="text-base font-extrabold text-slate-800">@{user.username || 'citizen'}</p>
                </div>

                {/* Email ID Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    Email ID
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="e.g. citizen@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Date of Birth Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    Date of Birth (DOB)
                  </label>
                  <input
                    type="date"
                    value={profileForm.dob}
                    onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                {/* Authority Designation Dropdown (for authority) */}
                {isAuthority && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-amber-600" />
                      Authority Designation *
                    </label>
                    <select
                      value={profileForm.designation}
                      onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    >
                      <option value="">-- Choose Designation --</option>
                      <option value="District Magistrate (DM)">District Magistrate (DM)</option>
                      <option value="Sub-divisional Magistrate (SDM)">Sub-divisional Magistrate (SDM)</option>
                      <option value="Mayor">Mayor</option>
                      <option value="Commissioner of Police (CP)">Commissioner of Police (CP)</option>
                    </select>
                  </div>
                )}

                {/* Bio Textarea */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      Bio
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {profileForm.bio.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Tell your local community a little about yourself, civic interests, or municipal department..."
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setProfileSaveError('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-transform hover:scale-102 cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            /* Display Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Full Legal Name
                </span>
                <p className="text-base font-extrabold text-slate-900">{user.name || 'Not provided'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  CityNova Username
                </span>
                <p className="text-base font-extrabold text-slate-900">@{user.username || 'citizen'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  Mobile Phone Number
                </span>
                <p className="text-base font-extrabold text-slate-900">
                  {user.phone ? user.phone : 'Not linked'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                  <Mail className="w-3 h-3 text-blue-600" />
                  Email ID
                </span>
                <p className="text-base font-extrabold text-slate-900">
                  {profileForm.email ? (
                    profileForm.email
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="text-xs text-blue-600 hover:underline font-bold"
                    >
                      + Add Email ID
                    </button>
                  )}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-purple-600" />
                  Date of Birth (DOB)
                </span>
                <p className="text-base font-extrabold text-slate-900">
                  {profileForm.dob ? (
                    new Date(
                      profileForm.dob.includes('T') ? profileForm.dob : `${profileForm.dob}T00:00:00`
                    ).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="text-xs text-purple-600 hover:underline font-bold"
                    >
                      + Add Date of Birth
                    </button>
                  )}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  Account Role & Access
                </span>
                <p className="text-base font-extrabold text-slate-900">
                  {isAuthority ? 'Municipal Authority Official' : 'Standard Citizen Account'}
                </p>
              </div>

              {/* Authority Designation Card (for Authority accounts) */}
              {isAuthority && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1 md:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block flex items-center gap-1">
                    <Landmark className="w-3 h-3 text-amber-700" />
                    Authority Designation
                  </span>
                  <p className="text-base font-extrabold text-amber-950">
                    {profileForm.designation ? (
                      profileForm.designation
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="text-xs text-amber-700 hover:underline font-bold"
                      >
                        + Select Designation
                      </button>
                    )}
                  </p>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-600" />
                  Registered State
                </span>
                <p className="text-base font-extrabold text-slate-900">{stateName}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-purple-600" />
                  City / District Jurisdiction
                </span>
                <p className="text-base font-extrabold text-slate-900">{cityName}</p>
              </div>

              {/* Bio Card */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1 md:col-span-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                  <FileText className="w-3 h-3 text-emerald-600" />
                  Bio
                </span>
                {profileForm.bio ? (
                  <p className="text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                    {profileForm.bio}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No bio added yet.{' '}
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="text-emerald-700 font-bold not-italic hover:underline ml-1"
                    >
                      Write a bio &rarr;
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
