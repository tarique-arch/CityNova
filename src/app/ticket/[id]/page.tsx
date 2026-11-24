'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Share2,
  Printer,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Check,
  Clock,
  AlertCircle,
  FileText,
  MapPin,
  Lock,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CommitmentCard from '@/components/CommitmentCard';
import ProofComparison from '@/components/ProofComparison';
import CivicMemorySection from '@/components/CivicMemorySection';
import TicketHistory from '@/components/TicketHistory';
import { useAuth } from '@/lib/auth-context';

const STATUS_STEPS = [
  { value: 'OPEN', label: 'Registered & Docketed', desc: 'Case ID Generated' },
  { value: 'IN_PROGRESS', label: 'In Progress', desc: 'Status updated' },
  { value: 'PROVISIONALLY_RESOLVED', label: 'Repaired & Photo Proof', desc: 'Awaiting Citizen Sign-off' },
  { value: 'CLOSED', label: 'Closed', desc: 'Report completed' },
];

function TicketDetailContent() {
  const params = useParams();
  const { user } = useAuth();
  const id = params?.id as string;

  const [ticket, setTicket] = useState<any>(null);
  const [civicMemory, setCivicMemory] = useState<any[]>([]);
  const [canUpdateResolution, setCanUpdateResolution] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTicketData = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/tickets/${id}`);
      const data = await res.json();
      if (data.ticket) {
        setTicket(data.ticket);
        setCivicMemory(data.civicMemory || []);
        setCanUpdateResolution(data.canUpdateResolution === true);
      }
    } catch (err) {
      console.error('Error fetching ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [id]);

  useEffect(() => {
    if (!loading && ticket && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('print') === 'true') {
        setTimeout(() => window.print(), 500);
      }
    }
  }, [loading, ticket]);

  // Citizen Verify Action
  const handleVerifyResolution = async (comment?: string) => {
    if (!ticket) return;
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY', comment }),
      });
      const data = await res.json();
      if (data.success) {
        loadTicketData();
      } else {
        alert(data.error || 'Failed to update sign-off.');
      }
    } catch (err) {
      console.error('Failed to verify:', err);
    }
  };

  // Citizen Dispute Action
  const handleDisputeResolution = async (reason: string) => {
    if (!ticket) return;
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISPUTE',
          disputeReason: reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadTicketData();
      } else {
        alert(data.error || 'Failed to submit dispute.');
      }
    } catch (err) {
      console.error('Failed to dispute:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-600 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold">Loading Municipal Grievance Docket...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 text-2xl font-bold mb-3">
            !
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">
            Civic Record Not Found
          </h2>
          <p className="text-xs text-slate-600 max-w-sm mb-6">
            Could not locate complaint docket &ldquo;{id}&rdquo;. Please check the tracking number.
          </p>
          <Link
            href="/posts"
            className="px-5 py-2.5 bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-800 transition-all"
          >
            Return to City Reports
          </Link>
        </div>
      </div>
    );
  }

  // Calculate 4-step progress state
  const persistedStatus =
    ticket.status === 'ASSIGNED' ? 'IN_PROGRESS' :
    ticket.status === 'RESOLVED' ? 'CLOSED' :
    ticket.status;
  const currentIndex = Math.max(0, STATUS_STEPS.findIndex((option) => option.value === persistedStatus));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/posts"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to city reports
          </Link>
        </div>

        {/* 4-Stage Resolution Stepper */}
        <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-xs">
          <div className="relative my-2">
            {/* Connecting Line Track Background */}
            <div className="absolute top-4 left-[12.5%] right-[12.5%] h-1 bg-slate-200 -translate-y-1/2 z-0" />

            {/* Connecting Line Track Blue Active Fill */}
            <div
              className="absolute top-4 left-[12.5%] h-1 bg-blue-600 -translate-y-1/2 transition-all duration-500 z-0"
              style={{
                width: `${Math.min(75, Math.max(0, (currentIndex / (STATUS_STEPS.length - 1)) * 75))}%`,
              }}
            />

            {/* Four Tracking Stages */}
            <div className="relative z-10 grid grid-cols-4 gap-2 sm:gap-3">
              {STATUS_STEPS.map((item, index) => {
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;

                return (
                  <div key={item.value} className="flex flex-col items-center">
                    {/* Step Milestone Node */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isCompleted
                          ? 'bg-blue-600 border-white text-white shadow-xs'
                          : isCurrent
                          ? 'bg-blue-600 border-white text-white ring-4 ring-blue-100 shadow-md shadow-blue-200'
                          : 'bg-white border-slate-300 text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : isCurrent ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>

                    {/* Stage Card Box */}
                    <div
                      className={`mt-2.5 w-full rounded-xl p-2.5 sm:p-3 text-center text-xs font-bold transition-all duration-200 ${
                        isCurrent
                          ? 'border-2 border-blue-500 bg-blue-50 text-blue-900 shadow-xs font-black'
                          : isCompleted
                          ? 'border border-blue-200 bg-blue-50/70 text-blue-900'
                          : 'border border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                    >
                      <p className="line-clamp-2 leading-tight">{item.label}</p>
                      <span className="text-[10px] block opacity-80 font-normal mt-0.5">{item.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 1: Commitment Card */}
        <CommitmentCard
          caseId={ticket.caseId}
          cityName={ticket.city?.name || user?.city?.name || 'Your city'}
          stateName={ticket.city?.state || user?.city?.state || user?.state || ''}
          publicCommitmentDate={ticket.publicCommitmentDate}
          slaDeadline={ticket.slaDeadline}
          urgency={ticket.urgency}
          status={ticket.status}
        />

        {/* Complaint Summary Description */}
        <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                {ticket.category} &bull; {ticket.city?.state && ticket.city?.name && !ticket.city.name.toLowerCase().includes(ticket.city.state.toLowerCase()) ? `${ticket.city.name}, ${ticket.city.state}` : (ticket.city?.name || user?.city?.name || 'Your city')}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                {ticket.title}
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-600 font-mono bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              GPS: {ticket.latitude.toFixed(4)}, {ticket.longitude.toFixed(4)}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
            {ticket.description}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-3 border-t border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                <strong>Specific Location:</strong> {ticket.addressDescription}
              </span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1.5 flex-wrap">
                <strong>Reported By:</strong>{' '}
                {(ticket.reporter?.username || ticket.reporterUsername || ticket.reporterDetails?.username) ? (
                  <Link
                    href={`/profile/${ticket.reporter?.username || ticket.reporterUsername || ticket.reporterDetails?.username}`}
                    className="font-mono font-medium text-blue-700 hover:text-blue-900 hover:underline"
                    title="View citizen profile"
                  >
                    @{ticket.reporter?.username || ticket.reporterUsername || ticket.reporterDetails?.username}
                  </Link>
                ) : (
                  ticket.citizenName
                )}
              </span>
            </div>

            {/* DPDP Act Privacy notice */}
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>DPDP Act 2023: Citizen Data Masked</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: Proof-of-Work Comparison & Two-Stage Resolution Gate */}
        <ProofComparison
          ticketId={ticket.id}
          initialPhotoUrl={ticket.initialPhotoUrl}
          resolutionPhotoUrl={ticket.resolutionPhotoUrl}
          resolutionGpsLat={ticket.resolutionGpsLat}
          resolutionGpsLng={ticket.resolutionGpsLng}
          resolutionTimestamp={ticket.resolutionTimestamp}
          resolutionNotes={ticket.resolutionNotes}
          status={ticket.status}
          disputeReason={ticket.disputeReason}
          onVerify={handleVerifyResolution}
          onDispute={handleDisputeResolution}
          isCitizenUser={canUpdateResolution}
        />

        <TicketHistory key={ticket.updatedAt} ticketId={ticket.id} />

        {civicMemory.length > 0 && <CivicMemorySection pastFixes={civicMemory} />}

      </main>

      <Footer />
    </div>
  );
}

export default function TicketDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
          <div className="flex items-center gap-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold">Loading grievance docket...</span>
          </div>
        </div>
      }
    >
      <TicketDetailContent />
    </Suspense>
  );
}
