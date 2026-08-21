'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  UserX, 
  Award,
  RefreshCw, 
  ArrowRight,
  Database,
  Search,
  AlertCircle,
  Trash2
} from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Fetch all sessions on mount
  useEffect(() => {
    fetch('/api/sessions')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch session history.');
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setSessions(data.data || []);
        } else {
          throw new Error(data.error || 'Failed to retrieve sessions.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleLoadSession = (sessionId) => {
    // Redirect to dashboard with query parameter
    router.push(`/?sessionId=${sessionId}`);
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation(); // Prevent loading session on card click
    
    if (!confirm('Are you sure you want to delete this saved session? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      if (data.success) {
        // Remove deleted session from state instantly
        setSessions(prev => prev.filter(s => s._id !== sessionId));
      } else {
        throw new Error(data.error || 'Failed to delete session.');
      }
    } catch (err) {
      console.error(err);
      alert(`Error deleting session: ${err.message}`);
    }
  };

  // Format Date in human-readable local format
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter sessions by search query
  const filteredSessions = sessions.filter(session => 
    session.sessionName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-sm">
      {/* Search and control header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex-1 max-w-md relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search saved sessions by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition duration-150 hover:border-slate-300 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500 shadow-sm shrink-0">
          <Database className="h-3.5 w-3.5 text-slate-400" />
          Saved Sessions: {sessions.length}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-md border border-slate-200 shadow-sm min-h-[250px]">
          <RefreshCw className="h-8 w-8 text-slate-900 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-700">Connecting to MongoDB database...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-md flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Database connection issue</p>
            <p className="text-xs text-red-650 mt-0.5">{error}</p>
            <p className="text-xs text-slate-500 mt-2">Please verify that process.env.MONGODB_URI is correctly configured in your .env.local file and MongoDB Atlas cluster is active.</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredSessions.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-md border border-slate-200 shadow-sm min-h-[250px]">
          <Database className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-700">No saved sessions found</p>
          <p className="text-xs text-slate-500 mt-0.5">Go to the Dashboard, clean a CSV dataset, and click "Save Session" to see it here.</p>
        </div>
      )}

      {/* Sessions Grid */}
      {!isLoading && !error && filteredSessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSessions.map((session) => {
            const studentCount = session.students?.length || 0;
            const debarredCount = session.students?.filter(s => s.isDebarred).length || 0;
            
            // Calculate average score for active candidates
            const activeStudents = session.students?.filter(s => !s.isDebarred) || [];
            const averageScore = activeStudents.length > 0
              ? (activeStudents.reduce((sum, s) => sum + s.total, 0) / activeStudents.length).toFixed(2)
              : '0.00';

            return (
              <div 
                key={session._id}
                className="group rounded-md border border-slate-200 bg-white p-4 shadow-sm hover:shadow hover:border-slate-300 transition-all duration-150 flex flex-col justify-between"
              >
                <div>
                  {/* Title, Delete & Date */}
                  <div className="flex justify-between items-start gap-4 mb-3 border-b border-slate-100 pb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 group-hover:text-slate-950 transition-colors duration-150 text-sm">
                        {session.sessionName}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(session._id, e)}
                      className="rounded-md p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 transition duration-150 cursor-pointer shrink-0"
                      title="Delete Session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50 rounded-md px-3 mb-4 border border-slate-100 text-xs">
                    <div className="text-center border-r border-slate-200/60 last:border-0">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-center gap-1">
                        <Users className="h-3 w-3 text-slate-400" /> Students
                      </p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{studentCount}</p>
                    </div>
                    <div className="text-center border-r border-slate-200/60 last:border-0">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-center gap-1">
                        <UserX className="h-3 w-3 text-slate-400" /> Debarred
                      </p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{debarredCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-center gap-1">
                        <Award className="h-3 w-3 text-slate-400" /> Avg Score
                      </p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{averageScore}</p>
                    </div>
                  </div>
                </div>

                {/* Load button */}
                <button
                  onClick={() => handleLoadSession(session._id)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-900 hover:border-slate-900 hover:text-white px-3 py-2 text-sm font-semibold text-slate-700 transition duration-150 focus:outline-none cursor-pointer"
                >
                  Load Session State
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
