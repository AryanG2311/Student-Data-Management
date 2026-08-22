import React from 'react';
import { RefreshCw, Save, Download } from 'lucide-react';

export default function FilterControls({
  searchQuery,
  setSearchQuery,
  sessionName,
  setSessionName,
  minScore,
  setMinScore,
  minMath,
  setMinMath,
  minScience,
  setMinScience,
  minEnglish,
  setMinEnglish,
  isSaving,
  currentSessionId,
  handleSaveSession,
  handleExportCSV,
  resetSession,
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      {/* row 1: configuration fields & primary actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 flex-1 max-w-2xl">
          {/* search by name */}
          <div className="flex-1 min-w-[180px] relative">
            <label htmlFor="search-name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Search by Name
            </label>
            <input
              id="search-name"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name..."
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition duration-150 hover:border-slate-300 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
          {/* session name */}
          <div className="flex-1 min-w-[180px]">
            <label htmlFor="session-name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Session Name
            </label>
            <input
              id="session-name"
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter Session Name"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition duration-150 hover:border-slate-300 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* action button triggers */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSaveSession}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-md bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 focus:outline-none cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : (currentSessionId ? 'Update Session' : 'Save Session')}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition duration-150 focus:outline-none cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={resetSession}
            className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition duration-150 focus:outline-none cursor-pointer"
          >
            Clear Session
          </button>
        </div>
      </div>

      {/* row 2: subject score limits */}
      <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-3">
        <div className="w-28">
          <label htmlFor="min-score" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Min Total
          </label>
          <input
            id="min-score"
            type="number"
            value={minScore}
            onChange={(e) => setMinScore(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            min="0"
          />
        </div>
        <div className="w-28">
          <label htmlFor="min-math" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Min Math
          </label>
          <input
            id="min-math"
            type="number"
            value={minMath}
            onChange={(e) => setMinMath(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            min="0"
          />
        </div>
        <div className="w-28">
          <label htmlFor="min-science" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Min Science
          </label>
          <input
            id="min-science"
            type="number"
            value={minScience}
            onChange={(e) => setMinScience(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            min="0"
          />
        </div>
        <div className="w-28">
          <label htmlFor="min-english" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Min English
          </label>
          <input
            id="min-english"
            type="number"
            value={minEnglish}
            onChange={(e) => setMinEnglish(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            min="0"
          />
        </div>
      </div>
    </div>
  );
}
