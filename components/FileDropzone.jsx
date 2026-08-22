import React from 'react';
import { Upload, RefreshCw } from 'lucide-react';

export default function FileDropzone({
  isLoading,
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileSelect,
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">Import Raw Data</h2>
          <p className="text-xs text-slate-500 mt-0.5">Upload a messy raw student CSV to clean and process</p>
        </div>
      </div>

      <label
        htmlFor="file-upload"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-md border p-10 text-center transition-all duration-150 cursor-pointer ${
          isDragging 
            ? 'border-slate-900 bg-slate-50 scale-[0.99]' 
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
        }`}
      >
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="sr-only"
        />
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
              <span className="font-semibold text-slate-955 hover:text-slate-800">
                Upload a CSV file
              </span>
              <p className="text-slate-500 text-xs mt-1">or drag and drop it here</p>
            </div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">RAW CSV FILES ONLY</p>
          </div>
        )}
      </label>
    </div>
  );
}
