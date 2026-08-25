import React, { useState } from 'react';
import {
  Upload,
  Award,
  Sparkles,
  Sliders,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowUpDown,
  TrendingUp,
  Download
} from 'lucide-react';
import { cn } from '../lib/utils';

type RankedVendorValue = string | number | boolean | null | undefined;

type RankedVendor = Record<string, RankedVendorValue>;

export function VendorRanking() {
  const [file, setFile] = useState<File | null>(null);
  const [weights, setWeights] = useState<string>('unit_price:-0.5,on_time_rate:0.3,quality_score:0.2');
  const [vendorColumn, setVendorColumn] = useState<string>('vendor_id');
  const [rankedData, setRankedData] = useState<RankedVendor[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleRankVendors = async () => {
    if (!file) {
      setError('Please upload a CSV file with vendor metrics first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummary('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('weights', weights);
      formData.append('vendor_column', vendorColumn);

      const response = await fetch('/api/vendors/rank', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to rank vendors');
      }

      const data: RankedVendor[] = await response.json();
      setRankedData(data);

      if (data.length > 0) {
        setColumns(Object.keys(data[0]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while ranking vendors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplainRanking = async () => {
    if (rankedData.length === 0) {
      setError('Rank vendors first before requesting AI analysis.');
      return;
    }

    setIsExplaining(true);
    setError(null);

    try {
      // Re-create CSV string from rankedData
      if (columns.length === 0) return;
      const headerLine = columns.join(',');
      const rowLines = rankedData.map((row) =>
        columns.map((col) => row[col] ?? '').join(',')
      );
      const csvContent = [headerLine, ...rowLines].join('\n');
      const rankedBlob = new Blob([csvContent], { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', rankedBlob, 'ranked_vendors.csv');
      formData.append('top_n', '3');

      const response = await fetch('/api/vendors/explain-ranking', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to generate explanation');
      }

      const resData = await response.json();
      setSummary(resData.summary || 'Explanation generated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate explanation');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleExportRankedCSV = () => {
    if (rankedData.length === 0 || columns.length === 0) return;
    const headerLine = columns.join(',');
    const rowLines = rankedData.map((row) =>
      columns.map((col) => row[col] ?? '').join(',')
    );
    const csvContent = [headerLine, ...rowLines].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranked_vendors_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-background border border-border-soft rounded-card p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-accent-light rounded-xl text-accent flex-shrink-0">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Vendor Evaluation & Weighted Ranking</h2>
            <p className="text-sm text-text-tertiary mt-1">
              Upload vendor metric datasets, configure criteria weightings (cost vs quality vs punctuality), and generate executive insights.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-rose-800 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input & Config Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: File Upload */}
        <div className="bg-background border border-border-soft rounded-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-text-primary font-semibold text-sm mb-4">
              <FileSpreadsheet className="w-4 h-4 text-accent" />
              <span>1. Upload Vendor CSV</span>
            </div>

            <label className="border-2 border-dashed border-border-soft hover:border-accent rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center bg-neutral-50/50 dark:bg-neutral-900/20">
              <Upload className="w-8 h-8 text-text-tertiary mb-2" />
              <span className="text-sm font-medium text-text-primary">
                {file ? file.name : 'Click or drop CSV file here'}
              </span>
              <span className="text-xs text-text-tertiary mt-1">
                CSV containing metrics (e.g. unit_price, on_time_rate)
              </span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {file && (
            <div className="mt-4 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate">Ready: {file.name}</span>
            </div>
          )}
        </div>

        {/* Step 2: Configure Weights */}
        <div className="bg-background border border-border-soft rounded-card p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-text-primary font-semibold text-sm mb-2">
              <Sliders className="w-4 h-4 text-accent" />
              <span>2. Scoring Criteria Weights</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Weights Specification
              </label>
              <input
                type="text"
                value={weights}
                onChange={(e) => setWeights(e.target.value)}
                placeholder="unit_price:-0.5,on_time_rate:0.3"
                className="w-full px-3 py-2 text-sm border border-border-soft rounded-control bg-transparent focus:outline-none focus:border-accent font-mono"
              />
              <p className="text-[11px] text-text-tertiary mt-1">
                Positive = higher is better; Negative = lower is better (e.g. price/risk).
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Vendor Identifier Column
              </label>
              <input
                type="text"
                value={vendorColumn}
                onChange={(e) => setVendorColumn(e.target.value)}
                placeholder="vendor_id"
                className="w-full px-3 py-2 text-sm border border-border-soft rounded-control bg-transparent focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Action Buttons */}
        <div className="bg-background border border-border-soft rounded-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-text-primary font-semibold text-sm mb-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span>3. Execute Analysis</span>
            </div>
            <p className="text-xs text-text-tertiary leading-relaxed">
              Calculate composite performance scores across all vendors and invoke AI explanation summaries.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleRankVendors}
              disabled={isLoading || !file}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-control font-medium text-sm transition-all shadow-xs",
                isLoading || !file
                  ? "bg-neutral-100 text-text-tertiary border border-border-soft cursor-not-allowed"
                  : "bg-accent text-white hover:bg-accent-hover"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating Scores...
                </>
              ) : (
                <>
                  <ArrowUpDown className="w-4 h-4" />
                  Compute Vendor Rankings
                </>
              )}
            </button>

            <button
              onClick={handleExplainRanking}
              disabled={isExplaining || rankedData.length === 0}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-control font-medium text-sm transition-all border",
                isExplaining || rankedData.length === 0
                  ? "bg-neutral-50 text-text-tertiary border-border-soft cursor-not-allowed dark:bg-neutral-900"
                  : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100"
              )}
            >
              {isExplaining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Insights...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Explain Top Vendors with AI
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Summary Banner */}
      {summary && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-accent-light/30 border border-purple-200 dark:border-purple-800/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-semibold text-base">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>AI Vendor Ranking Business Executive Summary</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {summary}
          </p>
        </div>
      )}

      {/* Ranked Output Data Table */}
      {rankedData.length > 0 && (
        <div className="bg-background border border-border-soft rounded-card overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border-soft flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-text-primary text-base">Ranked Vendor Results</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent-light text-accent font-medium">
                {rankedData.length} Vendors Evaluated
              </span>
            </div>

            <button
              onClick={handleExportRankedCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control border border-border-soft hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-text-secondary transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Ranked CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-sidebar-bg text-table-header text-text-tertiary border-b border-border-soft">
                <tr>
                  <th className="px-6 py-3 font-semibold">Rank</th>
                  {columns.map((col) => (
                    <th key={col} className="px-6 py-3 font-semibold uppercase tracking-wider">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {rankedData.map((row, index) => (
                  <tr key={index} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-text-primary">
                      <span className={cn(
                        "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs",
                        index === 0 ? "bg-amber-100 text-amber-800 font-extrabold" :
                        index === 1 ? "bg-slate-200 text-slate-800 font-bold" :
                        index === 2 ? "bg-amber-700/20 text-amber-900 font-semibold" :
                        "bg-neutral-100 text-text-tertiary"
                      )}>
                        #{index + 1}
                      </span>
                    </td>
                    {columns.map((col) => {
                      const val = row[col];
                      const isNumeric = typeof val === 'number';
                      return (
                        <td key={col} className={cn("px-6 py-4 text-text-secondary", isNumeric && "font-mono")}>
                          {isNumeric ? Number(val).toFixed(2) : String(val ?? '-')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
