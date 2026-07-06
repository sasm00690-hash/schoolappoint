"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, AlertTriangle, Crown, Shield, User, Mail, Calendar, ArrowLeft } from "lucide-react";

export default function StaffVerificationPage() {
  const params = useParams();
  const serial = params.id as string;

  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!serial) return;

    const verify = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/public/verify-staff/${serial}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Muuqaalkan ma ahan shaqaale diiwaangashan.");
        }
        
        setStaff(data);
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "Xaqiijinta waa ku guuldareysatay.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [serial, API_BASE]);

  // Determine Rank
  const isOwner = staff && !staff.sub_role && staff.role === "SuperAdmin";
  const isGudoomiye = staff && staff.is_department_head;
  const isAgent = staff && !isOwner && !isGudoomiye;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-md w-full z-10 space-y-6 text-center">
        {/* Header Branding */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-black tracking-wider text-white">
              SMA <span className="text-primary">SCHOOL APPOINT</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Secure Staff Verification System</p>
        </div>

        {loading ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 space-y-4 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-slate-800 mx-auto" />
            <div className="h-4 bg-slate-800 rounded w-3/4 mx-auto" />
            <div className="h-3 bg-slate-800 rounded w-1/2 mx-auto" />
          </div>
        ) : error ? (
          /* Red Unverified / Invalid Warning Card */
          <div className="bg-red-950/20 border-2 border-red-500/40 rounded-3xl p-6 sm:p-8 space-y-5 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative overflow-hidden animate-scaleIn">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto shadow-inner text-red-500">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-red-500 uppercase tracking-wide">AQOONSI AAN LA AQOONSAN</h2>
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wider">Invalid Reference Code</p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-red-950/40 p-4 rounded-xl border border-red-900/30 font-medium">
              Nambarkan tixraaca ee la baaray laguma helin nidaamka. Qofkani ma ahan shaqaale firfircoon oo ka tirsan SMA.
            </p>

            <div className="pt-2">
              <span className="px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold tracking-widest border border-red-500/20 uppercase">
                Status: Unverified ❌
              </span>
            </div>
            
            {serial && (
              <div className="text-[10px] text-slate-500 font-mono pt-1">
                Ref Code: {serial}
              </div>
            )}
          </div>
        ) : (
          /* Green Verified Card & Stylized Badge depending on Rank */
          <div className="space-y-5">
            {/* Verified Header Label */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Verified Staff / Shaqaale La Hubiyey</span>
            </div>

            {/* Stylized Badge Pass Card */}
            <div className={`p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden transition-all text-left space-y-6 border-2 animate-scaleIn ${
              isOwner 
                ? "bg-slate-900/90 border-purple-500/50 shadow-[0_0_30px_rgba(139,92,246,0.2)]" 
                : isGudoomiye 
                  ? "bg-slate-900/90 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                  : "bg-slate-900/80 border-slate-800 shadow-xl"
            }`}>
              
              {/* Corner Design Graphics */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none" />

              {/* Card Header: Rank Seal */}
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isOwner 
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                      : isGudoomiye 
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-slate-800 text-slate-400"
                  }`}>
                    {isOwner ? (
                      <Crown className="w-6 h-6" />
                    ) : isGudoomiye ? (
                      <Shield className="w-6 h-6" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest">Official ID Pass</h3>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isOwner 
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                        : isGudoomiye 
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-slate-800 text-slate-300"
                    }`}>
                      {isOwner ? "Maamulaha Guud" : isGudoomiye ? `Gudoomiyaha ${staff.sub_role}` : `Staff / ${staff.sub_role}`}
                    </span>
                  </div>
                </div>
                
                <span className="text-[10px] font-black text-slate-600 font-mono uppercase tracking-widest select-all">
                  Active
                </span>
              </div>

              {/* Card Body: Info Grid */}
              <div className="flex gap-4 items-center">
                {/* Avatar */}
                {staff.avatar_url ? (
                  <img 
                    src={staff.avatar_url} 
                    alt={staff.name} 
                    className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 p-1 object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 text-2xl font-bold">
                    {staff.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="space-y-0.5">
                  <h2 className="text-base font-black text-white">{staff.name}</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{staff.email}</span>
                  </p>
                </div>
              </div>

              {/* Details table */}
              <div className="grid grid-cols-2 gap-4 pt-2 text-xs border-t border-slate-800/80">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">ID-ga Nidaamka</span>
                  <span className="font-mono text-slate-200 font-semibold">{staff.staff_id}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Xilka/Qeybta</span>
                  <span className="text-slate-200 font-semibold">{staff.sub_role || "Owner / Executive"}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Muddada la aasaasay</span>
                  <span className="text-slate-200 font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(staff.created_at).toLocaleDateString()}</span>
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Nambarka Tixraaca</span>
                  <span className="font-mono text-slate-200 font-bold select-all text-[11px]">{staff.serial_number || "N/A"}</span>
                </div>
              </div>

              {/* Status Message */}
              <p className="text-[10px] text-slate-400 text-center leading-relaxed pt-2 border-t border-slate-800/80 italic font-medium">
                "Kani waa shaqaale firfircoon oo si sharci ah uga diiwaangashan platform-ka SMA - School Appoint."
              </p>

            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4">
          <a 
            href="https://schoolappoint.com" 
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ku Laabo Bogga Hore</span>
          </a>
        </div>
      </div>
    </div>
  );
}
