'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Star,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  Award,
  Bookmark,
  Building2,
  Copy,
  Check,
  MoreVertical,
  X,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CivicScoreBadge from '@/components/CivicScoreBadge';
import { useAuth } from '@/lib/auth-context';
import { getCivicScoreTier } from '@/lib/civic-score';

interface PublicTicket {
  id: string;
  caseId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  addressDescription: string;
  createdAt: string;
  commentsCount: number;
  reactionsCount: number;
}

interface PublicProfile {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  role: string;
  designation?: string | null;
  bio?: string | null;
  civicScore: number;
  isBanned: boolean;
  banReason?: string | null;
  bannedAt?: string | null;
  bannedBy?: string | null;
  isStarred: boolean;
  starredReason?: string | null;
  starredAt?: string | null;
  starredBy?: string | null;
  createdAt: string;
  city?: { id: string; name: string; state: string } | null;
  tickets: PublicTicket[];
}

export const dynamic = 'force-dynamic';

function CitizenPublicProfileContent() {
  const params = useParams<{ username?: string }>();
  const rawUsername = params?.username || '';
  const cleanUsername = rawUsername ? decodeURIComponent(rawUsername).replace(/^@/, '').trim() : '';
  const { user: currentUser, loading: authLoading } = useAuth();
  const isAuthority = currentUser?.role === 'AUTHORITY';
  const isOwnProfile = Boolean(currentUser?.username && cleanUsername && currentUser.username.toLowerCase() === cleanUsername.toLowerCase());

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Citizen 3-dots menu & Civic score modal
  const [showCitizenMenu, setShowCitizenMenu] = useState(false);
  const [showCivicScoreModal, setShowCivicScoreModal] = useState(false);

  // Active Tab & Filters
  const [activeTab, setActiveTab] = useState<'complaints'>('complaints');
  const [complaintFilter, setComplaintFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [copiedCaseId, setCopiedCaseId] = useState<string | null>(null);

  // Modals for Authority actions
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [showStarModal, setShowStarModal] = useState(false);
  const [starReason, setStarReason] = useState('Recognized for reporting genuine, high-quality civic road and sanitation issues.');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/profile/${cleanUsername}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load citizen profile.');
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [cleanUsername]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const copyToClipboard = (text: string) => {
    try {
      void navigator.clipboard.writeText(text);
      setCopiedCaseId(text);
      setTimeout(() => setCopiedCaseId(null), 2000);
    } catch {}
  };

  const handleStarToggle = async (action: 'STAR' | 'UNSTAR') => {
    if (!profile) return;
    setActionBusy(true);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch('/api/authority/star', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenId: profile.id,
          action,
          reason: action === 'STAR' ? starReason : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update star status.');
      setActionSuccess(data.message);
      setShowStarModal(false);
      await fetchProfile();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error updating star status.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleBanToggle = async (action: 'BAN' | 'UNBAN') => {
    if (!profile) return;
    setActionBusy(true);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch('/api/authority/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenId: profile.id,
          action,
          reason: action === 'BAN' ? banReason : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update ban status.');
      setActionSuccess(data.message);
      setShowBanModal(false);
      await fetchProfile();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error updating ban status.');
    } finally {
      setActionBusy(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'OPEN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          Open
        </span>
      );
    }
    if (s === 'IN_PROGRESS' || s === 'ASSIGNED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          In Progress
        </span>
      );
    }
    if (s === 'PROVISIONALLY_RESOLVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
          <Sparkles className="w-3 h-3 text-purple-600" />
          Pending Verification
        </span>
      );
    }
    if (s === 'RESOLVED' || s === 'CLOSED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Resolved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
        {status.replaceAll('_', ' ')}
      </span>
    );
  };

  // Citizens are not permitted to view other citizens' profiles; only Authorities can.
  if (!authLoading && currentUser && currentUser.role !== 'AUTHORITY' && currentUser.username !== cleanUsername) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16 text-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-slate-900">Access Restricted</h1>
            <p className="mt-2 text-sm text-slate-600">
              Citizen profiles can only be viewed by Municipal Authority officials. Citizens cannot view other citizens&apos; profiles.
            </p>
            <div className="mt-6">
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Community Posts</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const filteredTickets = profile?.tickets.filter((t) => {
    if (complaintFilter === 'ALL') return true;
    if (complaintFilter === 'OPEN') return t.status.toUpperCase() === 'OPEN';
    if (complaintFilter === 'IN_PROGRESS') return ['IN_PROGRESS', 'ASSIGNED'].includes(t.status.toUpperCase());
    if (complaintFilter === 'RESOLVED') return ['RESOLVED', 'CLOSED', 'PROVISIONALLY_RESOLVED'].includes(t.status.toUpperCase());
    return true;
  }) ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 space-y-6">
        <div className="mb-2">
          <Link
            href="/posts"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Community Posts</span>
          </Link>
        </div>

        {actionSuccess && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-in fade-in">
            {actionSuccess}
          </div>
        )}

        {actionError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800 animate-in fade-in">
            {actionError}
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
            <p className="mt-3 text-sm font-semibold text-slate-600">Loading citizen profile...</p>
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-sm font-semibold text-red-700">
            <p>{error}</p>
            <Link
              href="/posts"
              className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
            >
              Return to Posts
            </Link>
          </div>
        )}

        {!loading && profile && (
          <div className="space-y-6">
            {/* Profile Header Banner - EXACT same layout as /profile */}
            <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="h-44 sm:h-56 bg-linear-to-r from-slate-950 via-slate-900 to-teal-950 relative overflow-hidden group">
                {profile.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.coverUrl}
                    alt="Profile Cover Background"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="px-6 sm:px-8 pb-6 pt-0 relative">
                {/* Top row: Avatar overlapping banner on left */}
                <div className="flex items-end justify-between -mt-14 sm:-mt-16 gap-4 mb-4">
                  {/* Profile Avatar with z-10 ensuring it never gets clipped */}
                  <div className="relative group shrink-0 z-10">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl bg-slate-900 overflow-hidden flex items-center justify-center ring-1 ring-slate-200/80">
                      {profile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatarUrl}
                          alt={profile.name || 'Citizen'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-3xl sm:text-4xl font-black select-none tracking-tight">
                          {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'CN'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action area on the right: Authority controls or Citizen 3-dots */}
                  {isAuthority ? (
                    <div className="flex items-center gap-2">
                      {profile.isStarred ? (
                        <button
                          type="button"
                          onClick={() => void handleStarToggle('UNSTAR')}
                          disabled={actionBusy}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          title="Remove from Star Citizens"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          <span>Starred</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowStarModal(true)}
                          disabled={actionBusy}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          title="Recognize as Star Citizen"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          <span>Star Citizen</span>
                        </button>
                      )}

                      {profile.isBanned ? (
                        <button
                          type="button"
                          onClick={() => void handleBanToggle('UNBAN')}
                          disabled={actionBusy}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          title="Restore reporting permissions"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Unban Citizen</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowBanModal(true)}
                          disabled={actionBusy}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          title="Restrict citizen reporting access"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                          <span>Ban Citizen</span>
                        </button>
                      )}
                    </div>
                  ) : isOwnProfile ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCitizenMenu(!showCitizenMenu)}
                        className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                        title="Citizen Options"
                        aria-label="Citizen Options"
                      >
                        <MoreVertical className="w-5 h-5 text-slate-700" />
                      </button>

                      {showCitizenMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-20 cursor-default"
                            onClick={() => setShowCitizenMenu(false)}
                          />
                          <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-30 animate-in fade-in zoom-in-95">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCitizenMenu(false);
                                setShowCivicScoreModal(true);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                            >
                              <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Civic Score & Trust Credibility</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* User Info */}
                <div className="space-y-1 mb-5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {profile.name || 'Citizen User'}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {profile.role === 'AUTHORITY' ? 'Authority Official' : 'Verified Citizen'}
                    </span>
                    {isAuthority && (
                      <CivicScoreBadge
                        score={profile.civicScore ?? 50}
                        isBanned={profile.isBanned}
                        size="md"
                      />
                    )}
                    {profile.isStarred && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-900 border border-amber-300">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Star Citizen</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 font-medium flex items-center gap-2 pt-0.5">
                    <span>@{profile.username}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-orange-600" />
                      {profile.city ? `${profile.city.name}, ${profile.city.state}` : 'Ponda, Goa'}
                    </span>
                  </p>

                  {profile.bio && (
                    <p className="pt-2 text-sm text-slate-700 leading-relaxed max-w-2xl font-normal">
                      {profile.bio}
                    </p>
                  )}
                </div>

                {/* Quick Metrics Bar */}
                <div className={`grid gap-3 pt-4 border-t border-slate-100 ${isAuthority ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
                  <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">My Complaints</p>
                      <p className="text-lg font-black text-slate-900">{profile.tickets.length}</p>
                    </div>
                  </div>

                  {isAuthority && (
                    <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${profile.isBanned ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Civic Score</p>
                        <p className={`text-lg font-black ${profile.isBanned ? 'text-red-700' : 'text-slate-900'}`}>
                          {profile.isBanned ? '0' : profile.civicScore} <span className="text-xs font-bold text-slate-500">pts</span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                      <Bookmark className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Saved Posts</p>
                      <p className="text-lg font-black text-slate-900">0</p>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Jurisdiction</p>
                      <p className="text-sm font-black text-slate-900 truncate max-w-[140px]">
                        {profile.city?.name || 'Ponda'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-white rounded-2xl px-3 py-2 shadow-xs gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('complaints')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 text-white shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Complaints Filed by Citizen</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-sky-500 text-white">
                  {profile.tickets.length}
                </span>
              </button>
            </div>

            {/* Tab 1: Complaints Filed by Citizen */}
            {activeTab === 'complaints' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                    <div>
                      <h2 className="text-lg font-black text-slate-900">
                        Complaints Filed by {profile.name || `@${profile.username}`}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Track the live status, department assignment, and public dockets of grievances filed by this citizen.
                      </p>
                    </div>

                    {/* Filter Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { id: 'ALL', label: 'All' },
                        { id: 'OPEN', label: 'Open' },
                        { id: 'IN_PROGRESS', label: 'In Progress' },
                        { id: 'RESOLVED', label: 'Resolved' },
                      ].map((filter) => (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() => setComplaintFilter(filter.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            complaintFilter === filter.id
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredTickets.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-100 p-8">
                      <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <h3 className="text-base font-extrabold text-slate-800">
                        No complaints match this filter
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        This citizen has no complaints under the selected status filter.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredTickets.map((ticket) => (
                        <article
                          key={ticket.id}
                          className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs space-y-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(ticket.caseId)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs font-bold transition-colors cursor-pointer"
                                title="Click to copy Case ID"
                              >
                                <span>{ticket.caseId}</span>
                                {copiedCaseId === ticket.caseId ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                )}
                              </button>
                              <span className="text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                                {ticket.category}
                              </span>
                            </div>
                            <div>{getStatusBadge(ticket.status)}</div>
                          </div>

                          <div>
                            <h3 className="text-lg font-black text-slate-900">{ticket.title}</h3>
                            <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                              {ticket.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                            <div className="flex flex-wrap items-center gap-4">
                              {ticket.addressDescription && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                                  {ticket.addressDescription}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <Link
                              href={`/authority/complaints/${ticket.caseId}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs"
                            >
                              <span>View Public Docket</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Ban Citizen */}
        {showBanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2.5 text-red-600">
                <ShieldAlert className="w-6 h-6" />
                <h3 className="text-lg font-black text-slate-900">Ban Citizen @{profile?.username}</h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Banning this citizen will drop their Civic Score to <strong>0 pts</strong> and restrict them from filing new civic complaints or comments.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Restriction *
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g. Submitting fake, prank, or duplicate complaints..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => setShowBanModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionBusy || !banReason.trim()}
                  onClick={() => handleBanToggle('BAN')}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {actionBusy ? 'Banning...' : 'Confirm Ban'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Star Citizen */}
        {showStarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2.5 text-amber-500">
                <Star className="w-6 h-6 fill-amber-500" />
                <h3 className="text-lg font-black text-slate-900">Mark as Star Citizen</h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Add <strong>@{profile?.username}</strong> to your Star Citizen list as a verified genuine issue reporter.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Genuine Issue Citation / Note
                </label>
                <textarea
                  value={starReason}
                  onChange={(e) => setStarReason(e.target.value)}
                  placeholder="e.g. Reports high quality genuine road and sanitation issues with clear evidence."
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => setShowStarModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => handleStarToggle('STAR')}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-600 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {actionBusy ? 'Saving...' : 'Add to Star List'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Citizen Civic Score & Trust Credibility (via 3 dots) */}
        {showCivicScoreModal && profile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="border-b border-slate-100 pb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Award className="w-6 h-6 text-emerald-600" />
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">Civic Score & Trust Credibility</h2>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    Your score reflects verified civic contributions and municipal repair accountability.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <CivicScoreBadge score={profile.civicScore ?? 50} isBanned={profile.isBanned} size="lg" showDetails />
                  <button
                    type="button"
                    onClick={() => setShowCivicScoreModal(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Score Progress Meter */}
              {(() => {
                const score = profile.isBanned ? 0 : (profile.civicScore ?? 50);
                const tier = getCivicScoreTier(score, profile.isBanned);
                const progressPct = profile.isBanned ? 0 : Math.min(100, Math.round((score / 500) * 100));

                return (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm sm:text-base font-extrabold text-slate-900">
                      <span>Current Credibility Tier: <strong className={tier.badgeText}>{tier.label}</strong> <span className="font-semibold text-slate-500">({tier.trustLevel})</span></span>
                      <span className="font-black text-slate-900">{score} / 500 Target Points</span>
                    </div>
                    <div className="h-3.5 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          profile.isBanned ? 'bg-red-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{tier.description}</p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function CitizenPublicProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
          <div className="flex items-center gap-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold">Loading citizen profile...</span>
          </div>
        </div>
      }
    >
      <CitizenPublicProfileContent />
    </Suspense>
  );
}
