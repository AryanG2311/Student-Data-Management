'use client';

import React, { useState, useEffect } from 'react';
import { cleanCSV } from '@/utils/cleaner';
import { 
  Upload, 
  Download, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Users, 
  UserCheck, 
  UserX, 
  Award,
  ChevronDown
} from 'lucide-react';

export default function DashboardClient({ sessionId, usePythonBackend }) {
  const [students, setStudents] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [usePython, setUsePython] = useState(usePythonBackend);

  useEffect(() => {
    setUsePython(usePythonBackend);
  }, [usePythonBackend]);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [minMath, setMinMath] = useState(0);
  const [minScience, setMinScience] = useState(0);
  const [minEnglish, setMinEnglish] = useState(0);
  
  // UI states & Performance Optimizations
  const [viewMode, setViewMode] = useState('shortlist'); // 'shortlist' | 'all' | 'debarred'
  const [visibleCount, setVisibleCount] = useState(100); // Pagination limit (increments of 100)
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error' | 'info', text: string }

  // Helper to ensure each student has a unique stable identifier in-memory and a recordId
  const ensureUniqueIds = (data) => {
    if (!data) return [];
    return data.map((s, idx) => ({
      ...s,
      id: s.id || s._id || `std-${idx}-${Math.random().toString(36).substring(2, 9)}`,
      recordId: s.recordId || idx + 1
    }));
  };

  // 1. Hydrate from session ID if present in URL
  useEffect(() => {
    if (sessionId) {
      setIsLoading(true);
      setStatusMessage({ type: 'info', text: 'Hydrating session from database...' });
      fetch(`/api/sessions/${sessionId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Session not found or database offline');
          return res.json();
        })
        .then((resData) => {
          if (resData.success && resData.data) {
            setStudents(ensureUniqueIds(resData.data.students || []));
            setSessionName(resData.data.sessionName || '');
            setCurrentSessionId(resData.data._id || sessionId);
            setMinScore(resData.data.minScore || 0);
            setMinMath(resData.data.minMath || 0);
            setMinScience(resData.data.minScience || 0);
            setMinEnglish(resData.data.minEnglish || 0);
            setSearchQuery(resData.data.searchQuery || '');
            setStatusMessage({ type: 'success', text: `Loaded session "${resData.data.sessionName}" successfully` });
          } else {
            setStatusMessage({ type: 'error', text: resData.error || 'Failed to load session.' });
          }
        })
        .catch((err) => {
          console.error(err);
          setStatusMessage({ type: 'error', text: `Error loading session: ${err.message}` });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [sessionId]);

  // Reset pagination limit when filters, dataset, or views change to keep rendering light
  useEffect(() => {
    setVisibleCount(100);
  }, [viewMode, searchQuery, minScore, minMath, minScience, minEnglish, students.length]);

  // Dismiss status messages after 5 seconds
  useEffect(() => {
    if (statusMessage && statusMessage.type !== 'error') {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // 2. CSV parsing handler
  const handleCSVData = async (file) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      if (usePython) {
        // Dual-Engine: Send CSV to Python Backend
        const formData = new FormData();
        formData.append('file', file);
        
        const pythonUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${pythonUrl}/clean`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Python API responded with status ${res.status}`);
        }

        const data = await res.json();
        setStudents(ensureUniqueIds(data));
        setStatusMessage({ 
          type: 'success', 
          text: `Cleaned ${data.length} records successfully using Python Pandas Engine!` 
        });
      } else {
        // Default Client-Side parsing
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const csvText = e.target.result;
            const cleaned = cleanCSV(csvText);
            setStudents(ensureUniqueIds(cleaned));
            setStatusMessage({ 
              type: 'success', 
              text: `Cleaned ${cleaned.length} records successfully using Client-Side JS Regex Engine!` 
            });
          } catch (err) {
            setStatusMessage({ type: 'error', text: `Client-side processing failed: ${err.message}` });
          }
        };
        reader.readAsText(file);
      }
      // Set a default session name based on file name
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setSessionName(`${nameWithoutExt} Session`);
    } catch (err) {
      console.error(err);
      setStatusMessage({ 
        type: 'error', 
        text: `Engine error: ${err.message}. Ensure the backend is running if utilizing the Python engine.` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Drag & drop events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv')) {
        handleCSVData(file);
      } else {
        setStatusMessage({ type: 'error', text: 'Unsupported file type. Please upload a .csv file.' });
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleCSVData(files[0]);
    }
  };

  // 3. Debar status toggle (uses unique stable identifier)
  const handleToggleDebar = (id) => {
    setStudents((prev) => 
      prev.map((s) => (s.id === id) ? { ...s, isDebarred: !s.isDebarred } : s)
    );
  };

  // 4. Save Session to MongoDB (Creates or Updates)
  const handleSaveSession = async () => {
    if (!sessionName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a session name before saving.' });
      return;
    }
    if (students.length === 0) {
      setStatusMessage({ type: 'error', text: 'No student data available to save.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const isUpdate = currentSessionId !== null;
    const url = isUpdate ? `/api/sessions/${currentSessionId}` : '/api/sessions';
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionName: sessionName.trim(),
          students,
          minScore,
          minMath,
          minScience,
          minEnglish,
          searchQuery
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (!isUpdate && data.data && data.data._id) {
          // Set currentSessionId so subsequent saves update this instance instead of duplicating
          setCurrentSessionId(data.data._id);
        }
        setStatusMessage({ 
          type: 'success', 
          text: isUpdate 
            ? `Session "${sessionName}" updated successfully in MongoDB!` 
            : `Session "${sessionName}" created and saved to MongoDB successfully!` 
        });
      } else {
        throw new Error(data.error || 'Failed to save session');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: `Error saving session: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Export filtered shortlist to CSV
  const handleExportCSV = () => {
    if (filteredShortlist.length === 0) {
      setStatusMessage({ type: 'error', text: 'Shortlist is empty. Add candidates or adjust filters to export.' });
      return;
    }

    const headers = ['Name', 'Gender', 'Grade', 'Math', 'Science', 'English', 'Total'];
    const rows = filteredShortlist.map(s => [
      s.name,
      s.gender,
      s.grade,
      s.math,
      s.science,
      s.english,
      s.total
    ]);
    
    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${sessionName.replace(/\s+/g, "_") || 'student'}_shortlist.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusMessage({ type: 'success', text: 'Clean filtered shortlist downloaded successfully.' });
  };

  // 6. Reactive calculations & Performance Slicing
  // Filter list based on search and subject scores
  const filteredList = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTotal = s.total >= minScore;
    const matchesMath = s.math >= minMath;
    const matchesScience = s.science >= minScience;
    const matchesEnglish = s.english >= minEnglish;
    return matchesSearch && matchesTotal && matchesMath && matchesScience && matchesEnglish;
  });

  // Filter shortlist: only matching candidates and NOT debarred
  const filteredShortlist = filteredList.filter(s => !s.isDebarred);

  // Prepare targeted list to render based on viewMode
  let listToRender = [];
  if (viewMode === 'shortlist') {
    listToRender = filteredShortlist;
  } else if (viewMode === 'debarred') {
    listToRender = filteredList.filter(s => s.isDebarred);
  } else {
    listToRender = filteredList;
  }

  // Slice list to display only a safe amount of DOM nodes at once (pagination)
  const visibleStudents = listToRender.slice(0, visibleCount);

  // Card stats based on the shortlist/active data
  const totalLoaded = students.length;
  const activeCandidatesCount = students.filter(s => !s.isDebarred).length;
  const debarredCount = students.filter(s => s.isDebarred).length;
  
  const averageScore = filteredShortlist.length > 0 
    ? (filteredShortlist.reduce((sum, s) => sum + s.total, 0) / filteredShortlist.length).toFixed(2)
    : '0.00';

  const resetSession = () => {
    setStudents([]);
    setSessionName('');
    setSearchQuery('');
    setMinScore(0);
    setMinMath(0);
    setMinScience(0);
    setMinEnglish(0);
    setCurrentSessionId(null);
    setStatusMessage(null);
  };

  return (
    <div className="space-y-6 text-sm">
      {/* Alert status messages */}
      {statusMessage && (
        <div className={`flex items-center gap-3 rounded-md border px-4 py-2.5 text-sm shadow-sm transition-all duration-150 ${
          statusMessage.type === 'success' 
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800' 
            : statusMessage.type === 'error'
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-slate-200 bg-slate-50 text-slate-800'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Control bar / dashboard actions */}
      {students.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          {/* Row 1: Session name, search, actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 flex-1 max-w-2xl">
              {/* Search input */}
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
              {/* Session name input */}
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

            {/* Action buttons */}
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

          {/* Row 2: Subject score filters */}
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
      )}

      {/* Upload area */}
      {students.length === 0 && (
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900">Import Raw Data</h2>
              <p className="text-xs text-slate-500 mt-0.5">Upload a messy raw student CSV to clean and process</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Engine:</span>
              <button
                onClick={() => setUsePython(!usePython)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold shadow-sm transition duration-150 cursor-pointer border ${
                  usePython 
                    ? 'bg-slate-900 border-slate-900 text-white' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title="Click to switch processing engine"
              >
                {usePython ? 'Python Pandas' : 'Client JS Regex'}
              </button>
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-md border p-10 text-center transition-all duration-150 ${
              isDragging 
                ? 'border-slate-900 bg-slate-50 scale-[0.99]' 
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            {isLoading ? (
              <div className="space-y-3">
                <RefreshCw className="mx-auto h-10 w-10 text-slate-850 animate-spin" />
                <p className="text-sm font-semibold text-slate-700">Executing pipeline cleaning regex filters...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 border border-slate-200 shadow-sm">
                  <Upload className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-slate-950 hover:text-slate-800 focus-within:outline-none">
                    <span>Upload a CSV file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1 text-slate-500 text-xs mt-0.5">or drag and drop it here</p>
                </div>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">RAW CSV FILES ONLY</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      {students.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Candidates */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3.5 hover:shadow transition duration-150">
            <div className="rounded-md bg-slate-50 border border-slate-100 p-2.5">
              <Users className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Candidates</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalLoaded}</h3>
            </div>
          </div>

          {/* Card 2: Active */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3.5 hover:shadow transition duration-150">
            <div className="rounded-md bg-emerald-50 border border-emerald-100 p-2.5">
              <UserCheck className="h-5 w-5 text-emerald-650" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{activeCandidatesCount}</h3>
            </div>
          </div>

          {/* Card 3: Debarred */}
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3.5 hover:shadow transition duration-150">
            <div className="rounded-md bg-rose-50 border border-rose-100 p-2.5">
              <UserX className="h-5 w-5 text-rose-650" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Debarred</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{debarredCount}</h3>
            </div>
          </div>

          {/* Card 4: Average Score */}
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
      )}

      {/* Main Student list Table */}
      {students.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
          
          {/* Header & View Switcher (Shortlist, All, Debarred) */}
          <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900">Student Records</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {visibleStudents.length} of {listToRender.length} candidates (min score: {minScore})
              </p>
            </div>
            
            {/* View Filter Segmented Controls */}
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
                  <th className="px-4 py-2.5 text-center">Debarred?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-800">
                {visibleStudents.map((student) => {
                  // Determine if this student satisfies the current shortlist criteria
                  const meetsCriteria = student.total >= minScore && !student.isDebarred;
                  
                  return (
                    <tr 
                      key={student.id}
                      className={`transition duration-100 ${
                        !meetsCriteria 
                          ? 'bg-slate-50/40 text-slate-400 opacity-60' 
                          : 'hover:bg-slate-50/20 bg-white text-slate-800'
                      }`}
                    >
                      {/* S.No. (Sequential Record ID) */}
                      <td className="px-4 py-2 text-slate-500 font-medium">
                        {student.recordId}
                      </td>
                      {/* Name */}
                      <td className="px-4 py-2 font-semibold text-slate-950">
                        {student.name}
                      </td>
                      {/* Gender */}
                      <td className="px-4 py-2 font-medium">
                        {student.gender}
                      </td>
                      {/* Grade */}
                      <td className="px-4 py-2 text-slate-600">
                        Grade {student.grade}
                      </td>
                      {/* Subject math */}
                      <td className="px-4 py-2 text-center">
                        {student.math}
                      </td>
                      {/* Subject science */}
                      <td className="px-4 py-2 text-center">
                        {student.science}
                      </td>
                      {/* Subject english */}
                      <td className="px-4 py-2 text-center">
                        {student.english}
                      </td>
                      {/* Total */}
                      <td className="px-4 py-2 text-center font-bold text-slate-950">
                        {student.total}
                      </td>
                      {/* Status badge */}
                      <td className="px-4 py-2">
                        {student.isDebarred ? (
                          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 shadow-sm animate-pulse">
                            Debarred
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 shadow-sm">
                            Active
                          </span>
                        )}
                      </td>
                      {/* Action checkbox / Toggle debar (using stable unique ID) */}
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

          {/* Show More Pagination Controls for performance optimization */}
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
      )}
    </div>
  );
}
