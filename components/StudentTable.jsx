import React from 'react';
import { ChevronDown, AlertCircle, AlertTriangle } from 'lucide-react';

export default function StudentTable({
  visibleStudents,
  listToRender,
  viewMode,
  setViewMode,
  filteredShortlist,
  students,
  debarredCount,
  flaggedCount = 0,
  minScore,
  visibleCount,
  setVisibleCount,
  handleToggleDebar,
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* header & view switch tabs */}
      <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">Student Records</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {visibleStudents.length} of {listToRender.length} candidates (min score: {minScore})
          </p>
        </div>
        
        {/* view filters */}
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setViewMode('shortlist')}
            className={`px-3 py-1 rounded-md transition duration-150 cursor-pointer ${
              viewMode === 'shortlist' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Shortlist ({filteredShortlist.length})
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1 rounded-md transition duration-150 cursor-pointer ${
              viewMode === 'all' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Candidates ({students.length})
          </button>
          <button
            onClick={() => setViewMode('debarred')}
            className={`px-3 py-1 rounded-md transition duration-150 cursor-pointer ${
              viewMode === 'debarred' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Debarred Only ({debarredCount})
          </button>
          <button
            onClick={() => setViewMode('flagged')}
            className={`px-3 py-1 rounded-md transition duration-150 cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'flagged' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            Needs Review ({flaggedCount})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/30 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2.5">S.No.</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Gender</th>
              <th className="px-4 py-2.5">Grade</th>
              <th className="px-4 py-2.5 text-center">Math</th>
              <th className="px-4 py-2.5 text-center">Science</th>
              <th className="px-4 py-2.5 text-center">English</th>
              <th className="px-4 py-2.5 text-center font-bold">Total</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-center">Debar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-slate-800">
            {visibleStudents.map((student) => {
              const meetsCriteria = student.total >= minScore && !student.isDebarred;
              
              return (
                <tr 
                  key={student.id}
                  className={`transition duration-105 ${
                    !meetsCriteria 
                      ? 'bg-slate-50/40 text-slate-400 opacity-60' 
                      : 'hover:bg-slate-50/20 bg-white text-slate-800'
                  }`}
                >
                  {/* index identifier */}
                  <td className="px-4 py-2 text-slate-500 font-medium">
                    {student.recordId}
                  </td>
                  {/* name */}
                  <td className="px-4 py-2 font-semibold text-slate-950">
                    {student.name}
                  </td>
                  {/* gender */}
                  <td className="px-4 py-2 font-medium">
                    {student.gender === 'Unknown' ? (
                      <span 
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded cursor-help"
                        title={
                          student.rawGender 
                            ? `Original entry provided: "${student.rawGender}" (Unrecognized format)` 
                            : "Original entry was missing or empty"
                        }
                      >
                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                        Unknown
                      </span>
                    ) : (
                      student.gender
                    )}
                  </td>
                  {/* grade */}
                  <td className="px-4 py-2 text-slate-600">
                    Grade {student.grade}
                  </td>
                  {/* math score */}
                  <td className="px-4 py-2 text-center">
                    {student.math}
                  </td>
                  {/* science score */}
                  <td className="px-4 py-2 text-center">
                    {student.science}
                  </td>
                  {/* english score */}
                  <td className="px-4 py-2 text-center">
                    {student.english}
                  </td>
                  {/* total score */}
                  <td className="px-4 py-2 text-center font-bold text-slate-950">
                    {student.total}
                  </td>
                  {/* status badge */}
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {student.isDebarred ? (
                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 shadow-sm animate-pulse">
                          Debarred
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 shadow-sm">
                          Active
                        </span>
                      )}
                      {student.hasWarning && (
                        <span 
                          className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 cursor-help"
                          title={student.warnings?.join(' • ') || 'Data Quality Warning'}
                        >
                          <AlertTriangle className="h-2.5 w-2.5 text-amber-600" />
                          Review
                        </span>
                      )}
                    </div>
                  </td>
                  {/* debar action checkbox */}
                  <td className="px-4 py-2 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={student.isDebarred}
                        onChange={() => handleToggleDebar(student.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-650"></div>
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* show more pagination triggers */}
      {listToRender.length > visibleCount && (
        <div className="flex justify-center p-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setVisibleCount((prev) => prev + 100)}
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition duration-150 focus:outline-none cursor-pointer"
          >
            <ChevronDown className="h-4 w-4 text-slate-500 animate-bounce" />
            Show More (+100 candidates)
          </button>
        </div>
      )}

      {listToRender.length === 0 && (
        <div className="flex flex-col items-center justify-center p-10 text-slate-400">
          <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm font-semibold">No candidates found in this view mode.</p>
          <p className="text-xs text-slate-500 mt-0.5">Adjust filters or choose a different view to see data.</p>
        </div>
      )}
    </div>
  );
}
