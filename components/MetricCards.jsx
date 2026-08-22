import React from 'react';
import { Users, UserCheck, UserX, Award } from 'lucide-react';

export default function MetricCards({
  totalLoaded,
  activeCandidatesCount,
  debarredCount,
  averageScore,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* total loaded */}
      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3.5 hover:shadow transition duration-150">
        <div className="rounded-md bg-slate-50 border border-slate-100 p-2.5">
          <Users className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Candidates</p>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalLoaded}</h3>
        </div>
      </div>

      {/* active */}
      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3.5 hover:shadow transition duration-150">
        <div className="rounded-md bg-emerald-50 border border-emerald-100 p-2.5">
          <UserCheck className="h-5 w-5 text-emerald-650" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active</p>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">{activeCandidatesCount}</h3>
        </div>
      </div>

      {/* debarred */}
      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3.5 hover:shadow transition duration-150">
        <div className="rounded-md bg-rose-50 border border-rose-100 p-2.5">
          <UserX className="h-5 w-5 text-rose-650" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Debarred</p>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">{debarredCount}</h3>
        </div>
      </div>

      {/* average score */}
      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3.5 hover:shadow transition duration-150">
        <div className="rounded-md bg-amber-50 border border-amber-100 p-2.5">
          <Award className="h-5 w-5 text-amber-650" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Score</p>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">{averageScore}</h3>
        </div>
      </div>
    </div>
  );
}
