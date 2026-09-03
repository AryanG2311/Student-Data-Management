'use client';

import React, { useState, useEffect } from 'react';
import { cleanCSV } from '@/utils/cleaner';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import FileDropzone from './FileDropzone';
import MetricCards from './MetricCards';
import FilterControls from './FilterControls';
import StudentTable from './StudentTable';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DashboardClient({ sessionId, usePythonBackend }) {
  const [students, setStudents] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // filtering criteria
  const [searchQuery, setSearchQuery] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [minMath, setMinMath] = useState(0);
  const [minScience, setMinScience] = useState(0);
  const [minEnglish, setMinEnglish] = useState(0);

  // view pagination limit
  const [viewMode, setViewMode] = useState('shortlist');
  const [visibleCount, setVisibleCount] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // assign sequential record number and stable client-side key
  const ensureUniqueIds = (data) => {
    if (!data) return [];
    return data.map((s, idx) => {
      const warnings = Array.isArray(s.warnings) ? [...s.warnings] : [];
      if (warnings.length === 0) {
        if (s.gender === 'Unknown') warnings.push('Unknown / Ambiguous Gender');
        if (s.grade === 0) warnings.push('Missing / Unresolved Grade');
        if (!s.name || s.name.toLowerCase() === 'unknown' || s.name.trim() === '') warnings.push('Missing Candidate Name');
        if (s.total === 0) warnings.push('Zero Total Score');
      }
      return {
        ...s,
        id: s.id || s._id || `std-${idx}-${Math.random().toString(36).substring(2, 9)}`,
        recordId: s.recordId || idx + 1,
        rawGender: s.rawGender !== undefined ? s.rawGender : (s.gender === 'Unknown' ? '' : s.gender),
        hasWarning: s.hasWarning !== undefined ? s.hasWarning : warnings.length > 0,
        warnings,
      };
    });
  };

  // load saved session state if id exists in search queries
  useEffect(() => {
    if (!sessionId) return;
    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Hydrating session from database...' });
    
    fetch(`/api/sessions/${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Session not found or database offline');
        return res.json();
      })
      .then((resData) => {
        if (resData?.success && resData?.data) {
          const doc = resData.data;
          setStudents(ensureUniqueIds(doc.students || []));
          setSessionName(doc.sessionName || '');
          setCurrentSessionId(doc._id || sessionId);
          setMinScore(doc.minScore || 0);
          setMinMath(doc.minMath || 0);
          setMinScience(doc.minScience || 0);
          setMinEnglish(doc.minEnglish || 0);
          setSearchQuery(doc.searchQuery || '');
          setStatusMessage({ type: 'success', text: `Loaded session "${doc.sessionName}" successfully` });
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
  }, [sessionId]);

  // truncate pagination when active queries shift
  useEffect(() => {
    setVisibleCount(100);
  }, [viewMode, searchQuery, minScore, minMath, minScience, minEnglish, students.length]);

  // auto dismiss banner toasts
  useEffect(() => {
    if (statusMessage && statusMessage.type !== 'error') {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // process incoming raw file streams
  const handleCSVData = async (file) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const cleaned = cleanCSV(e.target.result);
          setStudents(ensureUniqueIds(cleaned));
          setStatusMessage({ 
            type: 'success', 
            text: `Cleaned ${cleaned.length} records successfully!` 
          });
        } catch (err) {
          setStatusMessage({ type: 'error', text: `Data processing failed: ${err.message}` });
        }
      };
      reader.readAsText(file);
      setSessionName(file.name.replace(/\.[^/.]+$/, "") + ' Session');
    } catch (err) {
      console.error(err);
      setStatusMessage({ 
        type: 'error', 
        text: `Error reading file: ${err.message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    const files = e.dataTransfer?.files;
    if (files?.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv')) {
        handleCSVData(file);
      } else {
        setStatusMessage({ type: 'error', text: 'Unsupported file type. Please upload a .csv file.' });
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target?.files;
    if (files?.length > 0) {
      handleCSVData(files[0]);
    }
  };

  // toggle debar flag for selected candidate
  const handleToggleDebar = (id) => {
    setStudents((prev) => 
      prev.map((s) => s.id === id ? { ...s, isDebarred: !s.isDebarred } : s)
    );
  };

  // write session configuration back to MongoDB Atlas
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
        method,
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
      if (data?.success) {
        if (!isUpdate && data.data?._id) {
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

  // export active filtered shortlist as formatted CSV stream
  const handleExportCSV = () => {
    if (filteredShortlist.length === 0) {
      setStatusMessage({ type: 'error', text: 'Shortlist is empty. Add candidates or adjust filters to export.' });
      return;
    }

    const headers = ['Name', 'Gender', 'Grade', 'Math', 'Science', 'English', 'Total'];
    const rows = filteredShortlist.map(s => [s.name, s.gender, s.grade, s.math, s.science, s.english, s.total]);
    
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

  // export active filtered shortlist as formatted PDF
  const handleExportPDF = () => {
    if (filteredShortlist.length === 0) {
      setStatusMessage({ type: 'error', text: 'Shortlist is empty. Add candidates or adjust filters to export.' });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // title text
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('DELHI TECHNOLOGICAL UNIVERSITY', 14, 20);
      
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Session Report: ${sessionName || 'Student Assessor'}`, 14, 27);
      doc.text(`Min score requirements: Math >= ${minMath}, Science >= ${minScience}, English >= ${minEnglish}, Total >= ${minScore}`, 14, 33);
      doc.text(`Total candidates shortlisted: ${filteredShortlist.length}`, 14, 39);

      const tableColumn = ["S.No.", "Name", "Gender", "Grade", "Math", "Science", "English", "Total"];
      const tableRows = filteredShortlist.map(s => [
        s.recordId,
        s.name,
        s.gender,
        s.grade,
        s.math,
        s.science,
        s.english,
        s.total
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 9 }
      });

      doc.save(`${sessionName.replace(/\s+/g, "_") || 'student'}_shortlist.pdf`);
      setStatusMessage({ type: 'success', text: 'Clean filtered shortlist PDF downloaded successfully.' });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: `Failed to export PDF: ${err.message}` });
    }
  };

  // compose filters list reactively
  const filteredList = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTotal = s.total >= minScore;
    const matchesMath = s.math >= minMath;
    const matchesScience = s.science >= minScience;
    const matchesEnglish = s.english >= minEnglish;
    return matchesSearch && matchesTotal && matchesMath && matchesScience && matchesEnglish;
  });

  const filteredShortlist = filteredList.filter(s => !s.isDebarred);

  let listToRender = [];
  if (viewMode === 'shortlist') {
    listToRender = filteredShortlist;
  } else if (viewMode === 'debarred') {
    listToRender = filteredList.filter(s => s.isDebarred);
  } else if (viewMode === 'flagged') {
    listToRender = filteredList.filter(s => s.hasWarning);
  } else {
    listToRender = filteredList;
  }

  const visibleStudents = listToRender.slice(0, visibleCount);

  // calculate reactive overview card values
  const totalLoaded = students.length;
  const activeCandidatesCount = students.filter(s => !s.isDebarred).length;
  const debarredCount = students.filter(s => s.isDebarred).length;
  const flaggedCount = students.filter(s => s.hasWarning).length;
  
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
      {/* alert status messages */}
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

      {/* controls */}
      {students.length > 0 && (
        <FilterControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sessionName={sessionName}
          setSessionName={setSessionName}
          minScore={minScore}
          setMinScore={setMinScore}
          minMath={minMath}
          setMinMath={setMinMath}
          minScience={minScience}
          setMinScience={setMinScience}
          minEnglish={minEnglish}
          setMinEnglish={setMinEnglish}
          isSaving={isSaving}
          currentSessionId={currentSessionId}
          handleSaveSession={handleSaveSession}
          handleExportCSV={handleExportCSV}
          handleExportPDF={handleExportPDF}
          resetSession={resetSession}
        />
      )}

      {/* CSV upload zone */}
      {students.length === 0 && (
        <FileDropzone
          isLoading={isLoading}
          isDragging={isDragging}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleFileSelect={handleFileSelect}
        />
      )}

      {/* overview KPI values */}
      {students.length > 0 && (
        <MetricCards
          totalLoaded={totalLoaded}
          activeCandidatesCount={activeCandidatesCount}
          debarredCount={debarredCount}
          flaggedCount={flaggedCount}
          averageScore={averageScore}
        />
      )}

      {/* student listing */}
      {students.length > 0 && (
        <StudentTable
          visibleStudents={visibleStudents}
          listToRender={listToRender}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filteredShortlist={filteredShortlist}
          students={students}
          debarredCount={debarredCount}
          flaggedCount={flaggedCount}
          minScore={minScore}
          visibleCount={visibleCount}
          setVisibleCount={setVisibleCount}
          handleToggleDebar={handleToggleDebar}
        />
      )}
    </div>
  );
}
