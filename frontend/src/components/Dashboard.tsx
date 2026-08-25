import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  AlertTriangle, 
  FileText, 
  Settings, 
  Bell, 
  Download, 
  Filter,
  Play,
  Loader2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Zap,
  HelpCircle,
  Award,
  TrendingUp,
  ShieldCheck,
  Eye,
  CheckCircle2,
  X,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { PODetailModal, type DetectionResult } from './PODetailModal';
import { VendorRanking } from './VendorRanking';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ReactSlider from 'react-slider';

interface DashboardStats {
  totalDetections: number;
  avgDrift: number;
  alertsCount: number;
  highDriftCount: number;
  estLeakCost: number;
}

interface SortConfig {
  key: keyof DetectionResult;
  direction: 'asc' | 'desc';
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [selectedPO, setSelectedPO] = useState<DetectionResult | null>(null);
  const [flaggedPOs, setFlaggedPOs] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    totalDetections: 0,
    avgDrift: 0,
    alertsCount: 0,
    highDriftCount: 0,
    estLeakCost: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDrift, setFilterDrift] = useState<'all' | 'high'>('all');
  const [driftScoreRange, setDriftScoreRange] = useState<[number, number]>([0, 100]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const calculateStats = (data: DetectionResult[]) => {
    const total = data.length;
    const alerts = data.length;
    let highDrift = 0;
    let totalLeakCost = 0;

    data.forEach(d => {
      const ratio = d.price_drift || 1;
      const pct = (ratio - 1) * 100;
      if (pct > 20) highDrift++;

      if (ratio > 1) {
        const baseUnitPrice = d.unit_price / ratio;
        const overcharge = (d.unit_price - baseUnitPrice) * (d.qty || 1);
        if (overcharge > 0) totalLeakCost += overcharge;
      }
    });
    
    let avg = 0;
    if (data.length > 0) {
      const drifts = data.map(d => ((d.price_drift || 1) - 1) * 100).sort((a, b) => a - b);
      const mid = Math.floor(drifts.length / 2);
      avg = drifts.length % 2 !== 0 ? drifts[mid] : (drifts[mid - 1] + drifts[mid]) / 2;
    }

    setStats({
      totalDetections: total,
      avgDrift: parseFloat(avg.toFixed(1)),
      alertsCount: alerts,
      highDriftCount: highDrift,
      estLeakCost: parseFloat(totalLeakCost.toFixed(2))
    });
  };

  const fetchResults = useCallback(async (drift_threshold: number | null = null) => {
    try {
      let url = '/api/leaks';
      if (drift_threshold !== null) {
        url += `?drift_threshold=${drift_threshold}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch results", error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const response = await fetch('/api/leaks');
        if (response.ok && isMounted) {
          const data = await response.json();
          setResults(data);
          calculateStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch results", error);
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleApplyFilters = () => {
    fetchResults(driftScoreRange[0]);
    setShowFilters(false);
  };

  const runDetection = async () => {
    setIsDetecting(true);
    try {
      const response = await fetch('/api/run-detection', { method: 'POST' });
      if (response.ok) {
        const { task_id } = await response.json();
        pollStatus(task_id);
      } else {
        setIsDetecting(false);
      }
    } catch (error) {
      console.error("Failed to start detection", error);
      setIsDetecting(false);
    }
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const response = await fetch('/api/simulate-traffic', { method: 'POST' });
      if (response.ok) {
        showToast("Generated synthetic purchase orders!");
        setTimeout(() => {
           setIsSimulating(false);
           runDetection();
        }, 2000);
      } else {
        setIsSimulating(false);
      }
    } catch (error) {
      console.error("Failed to simulate traffic", error);
      setIsSimulating(false);
    }
  };

  const pollStatus = async (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/run-detection/${taskId}`);
        const data = await response.json();
        if (data.status === 'completed') {
          clearInterval(interval);
          fetchResults();
          setIsDetecting(false);
          showToast("Detection run completed! Fresh leaks loaded.");
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setIsDetecting(false);
        }
      } catch {
        clearInterval(interval);
        setIsDetecting(false);
      }
    }, 1000);
  };

  const handleSort = (key: keyof DetectionResult) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFlagPO = (poId: string) => {
    setFlaggedPOs(prev => new Set(prev).add(poId));
    showToast(`Dispute flagged for PO #${poId}`);
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    
    const headers = ['PO ID', 'Vendor', 'Item', 'Date', 'Unit Price', 'Total', 'Contract ID', 'Drift %'];
    const csvContent = [
      headers.join(','),
      ...results.map(row => [
        row.po_id,
        row.vendor_id,
        row.item_id,
        row.date,
        row.unit_price,
        row.total,
        row.contract_id,
        ((row.price_drift || 1) - 1) * 100
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `procurement_detections_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Procurement Drift Report", 14, 22);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableColumn = ["PO ID", "Vendor", "Item", "Date", "Unit Price", "Total", "Drift %"];
    const tableRows = results.map(row => [
      row.po_id,
      row.vendor_id,
      row.item_id,
      row.date,
      `$${row.unit_price.toFixed(2)}`,
      `$${row.total.toFixed(2)}`,
      `${(((row.price_drift || 1) - 1) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
    });

    doc.save(`procurement_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getDriftLevel = (driftRatio: number | undefined) => {
    if (!driftRatio) return { label: 'Unknown', color: 'bg-neutral-100 text-text-tertiary' };
    const percentage = (driftRatio - 1) * 100;
    
    if (percentage <= 0) return { label: 'Compliant', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' };
    if (percentage < 15) return { label: 'Low', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/80 dark:text-yellow-300' };
    if (percentage < 30) return { label: 'Medium', color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300' };
    return { label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300' };
  };

  const sortedResults = React.useMemo(() => {
    let sortableItems = [...results];
    
    if (filterDrift === 'high') {
      sortableItems = sortableItems.filter(item => ((item.price_drift || 1) - 1) * 100 > 20);
    }

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const key = sortConfig.key;
        const aVal = a[key];
        const bVal = b[key];

        if (aVal === undefined || bVal === undefined) return 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [results, sortConfig, filterDrift]);

  const filteredResults = sortedResults.filter(item => 
    (item.vendor_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.item_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.po_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderContent = () => {
    if (activeTab === 'vendor-ranking') {
      return <VendorRanking />;
    }

    if (activeTab === 'settings') {
      return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <h2 className="text-h2 text-text-primary">System Settings</h2>
          <div className="bg-background rounded-card border border-border-soft p-6 shadow-xs">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Drift Threshold (%)</label>
                <input type="number" defaultValue={5} className="w-full max-w-xs px-3 py-2 border border-border-soft rounded-control bg-transparent focus:outline-none focus:border-accent" />
                <p className="text-xs text-text-tertiary mt-1">Transactions exceeding this variance will be flagged.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Notification Email</label>
                <input type="email" defaultValue="admin@procureguard.com" className="w-full max-w-md px-3 py-2 border border-border-soft rounded-control bg-transparent focus:outline-none focus:border-accent" />
              </div>
              <div className="pt-4">
                <button className="px-4 py-2 bg-accent text-white rounded-control hover:bg-accent-hover transition-colors font-medium text-sm">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'reports') {
      return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <h2 className="text-h2 text-text-primary">Audit Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background p-6 rounded-card border border-border-soft shadow-xs">
              <div className="w-12 h-12 bg-accent-light rounded-xl flex items-center justify-center text-accent mb-4">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Monthly Drift Report</h3>
              <p className="text-sm text-text-tertiary mb-4">Comprehensive summary of all price drifts detected in the last 30 days.</p>
              <button 
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 text-accent font-medium text-sm hover:underline"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
            <div className="bg-background p-6 rounded-card border border-border-soft shadow-xs">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                <Download size={24} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Vendor Performance Export</h3>
              <p className="text-sm text-text-tertiary mb-4">Export raw transaction data and drift ratios in CSV format.</p>
              <button 
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 text-accent font-medium text-sm hover:underline"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* KPI Cards Header */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Flagged POs"
              value={stats.totalDetections.toString()} 
              subtext="Scanned against active contracts"
              icon={<FileText className="text-accent" size={24} />}
            />
            <StatCard 
              title="Median Price Drift"
              value={`${stats.avgDrift}%`} 
              subtext="Variance over contracted rate"
              icon={<ArrowUpDown className="text-amber-500" size={24} />}
            />
            <StatCard 
              title="Critical Leaks (>20%)"
              value={stats.highDriftCount.toString()}
              subtext="High-risk vendor overcharges"
              icon={<AlertTriangle className="text-rose-500" size={24} />}
            />
            <StatCard
              title="Estimated Overcharge Leak"
              value={`$${stats.estLeakCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtext="Direct potential savings"
              icon={<TrendingUp className="text-emerald-500" size={24} />}
            />
          </div>
        )}

        {/* Filters & Actions Card */}
        <div className="bg-background rounded-card border border-border-soft shadow-xs">
          <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-quaternary" size={18} />
              <input 
                type="text" 
                placeholder="Search vendors, items, or POs..." 
                className="w-full pl-9 pr-4 py-2 bg-transparent border border-border-soft rounded-control focus:outline-none focus:border-accent transition-colors text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => fetchResults()}
                className="p-2 text-text-tertiary hover:text-text-primary rounded-control border border-border-soft hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Refresh Table"
              >
                <RefreshCw size={16} />
              </button>

              <div className="relative">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-control border transition-colors",
                    showFilters 
                      ? "bg-accent-light text-accent border-accent"
                      : "text-text-secondary bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 border-border-soft"
                  )}
                >
                  <Filter size={16} />
                  Filters
                </button>
                
                {showFilters && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-background rounded-xl shadow-xl border border-border-soft z-20 p-4">
                    <div className="text-xs font-semibold text-text-tertiary mb-2 px-1">By Drift Severity</div>
                    <button 
                      onClick={() => setFilterDrift('all')}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors",
                        filterDrift === 'all' ? "bg-accent-light text-accent font-medium" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      )}
                    >
                      Show All
                    </button>
                    <button 
                      onClick={() => setFilterDrift('high')}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors",
                        filterDrift === 'high' ? "bg-accent-light text-accent font-medium" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      )}
                    >
                      High Drift Only ({'>'}20%)
                    </button>

                    <div className="text-xs font-semibold text-text-tertiary mt-4 mb-2 px-1">By Drift Score</div>
                    <div className="p-2">
                      <ReactSlider
                        className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full"
                        thumbClassName="w-4 h-4 bg-accent rounded-full cursor-pointer -top-1 focus:outline-none focus:ring-2 focus:ring-accent/50"
                        trackClassName="h-1.5 bg-accent-light rounded-full"
                        defaultValue={[0, 100]}
                        ariaLabel={['Lower thumb', 'Upper thumb']}
                        ariaValuetext={state => `Thumb value ${state.valueNow}`}
                        renderThumb={(props, state) => (
                          <div {...props}>
                            <div className="text-xs text-white absolute -top-5 left-1/2 -translate-x-1/2">
                              {state.valueNow}
                            </div>
                          </div>
                        )}
                        pearling
                        minDistance={10}
                        onChange={(value) => setDriftScoreRange(value as [number, number])}
                      />
                      <div className="flex justify-between text-xs mt-2 text-text-tertiary">
                        <span>{driftScoreRange[0]}%</span>
                        <span>{driftScoreRange[1]}%</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleApplyFilters}
                      className="w-full mt-4 px-3 py-2 text-sm font-medium rounded-control bg-accent text-white hover:bg-accent-hover transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={runSimulation}
                disabled={isSimulating || isDetecting}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-control border transition-colors",
                  isSimulating
                    ? "bg-amber-100 text-amber-700 border-amber-200 cursor-not-allowed dark:bg-amber-950 dark:text-amber-300"
                    : "text-text-secondary bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 border-border-soft"
                )}
              >
                {isSimulating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                Generate Leaks
              </button>
            </div>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-sidebar-bg text-table-header text-text-tertiary border-b border-border-soft">
                <tr>
                  <Th label="PO ID" sortKey="po_id" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Vendor" sortKey="vendor_id" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Item Code" sortKey="item_id" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Date" sortKey="date" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Invoiced Unit Price" sortKey="unit_price" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Total Amount" sortKey="total" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Drift Severity" sortKey="price_drift" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="AI Summary Insights" sortKey="gemini_summary" currentSort={sortConfig} onSort={handleSort} />
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {paginatedResults.length > 0 ? (
                  paginatedResults.map((row, idx) => {
                    const driftLevel = getDriftLevel(row.price_drift);
                    const isFlagged = flaggedPOs.has(row.po_id);

                    return (
                      <tr
                        key={idx}
                        onClick={() => setSelectedPO(row)}
                        className="hover:bg-neutral-100/60 dark:hover:bg-neutral-900/40 transition-colors cursor-pointer group"
                        style={{ height: '56px' }}
                      >
                        <td className="px-6 font-semibold text-text-primary flex items-center gap-2">
                          <span>{row.po_id}</span>
                          {isFlagged && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                              Disputed
                            </span>
                          )}
                        </td>
                        <td className="px-6 text-text-secondary">{row.vendor_id}</td>
                        <td className="px-6 text-text-secondary font-mono text-xs">{row.item_id}</td>
                        <td className="px-6 text-text-tertiary">{row.date}</td>
                        <td className="px-6 font-mono text-text-secondary">${row.unit_price.toFixed(2)}</td>
                        <td className="px-6 font-mono font-medium text-text-primary">${row.total.toFixed(2)}</td>
                        <td className="px-6">
                          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", driftLevel.color)}>
                            {driftLevel.label}
                          </span>
                        </td>
                        <td className="px-6 text-text-tertiary max-w-xs truncate">{row.gemini_summary || '—'}</td>
                        <td className="px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedPO(row)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-medium text-text-primary transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-text-tertiary">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={32} className="text-neutral-300" />
                        <p className="font-medium">No purchase order detections found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-border-soft flex items-center justify-between text-sm text-text-tertiary">
            <span>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredResults.length)} to {Math.min(currentPage * itemsPerPage, filteredResults.length)} of {filteredResults.length} records
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1 rounded-control border border-border-soft hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center gap-1 px-3 py-1 rounded-control border border-border-soft hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background font-sans text-text-primary">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PO Detail Drawer/Modal */}
      <PODetailModal
        po={selectedPO}
        onClose={() => setSelectedPO(null)}
        onFlagPO={handleFlagPO}
      />

      {/* Sidebar */}
      <aside className="w-80 bg-sidebar-bg border-r border-border-soft hidden md:flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-border-soft h-[65px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center text-white font-bold shadow-xs">
              P
            </div>
            <span className="text-lg font-semibold tracking-tight text-text-primary">ProcureGuard</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Active</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<AlertTriangle size={20} />} label="Detections" active={activeTab === 'detections'} onClick={() => setActiveTab('detections')} />
          <NavItem icon={<Award size={20} />} label="Vendor Ranking" active={activeTab === 'vendor-ranking'} onClick={() => setActiveTab('vendor-ranking')} />
          <NavItem icon={<FileText size={20} />} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          <NavItem icon={<Settings size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4 border-t border-border-soft">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-accent-light text-accent flex items-center justify-center text-xs font-semibold">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">Jane Doe</p>
              <p className="text-xs text-text-tertiary truncate">Lead Procurement Auditor</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <header className="h-[65px] bg-background border-b border-border-soft flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-dashboard-title text-text-primary capitalize">
            {activeTab.replace('-', ' ')}
          </h1>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowDemo(true)}
              className="p-2 text-text-tertiary hover:text-text-primary transition-colors rounded-control hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Demo Guide"
            >
              <HelpCircle size={20} />
            </button>
            <ThemeToggle />
            <button className="p-2 text-text-tertiary hover:text-text-primary transition-colors relative rounded-control hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            <button 
              onClick={runDetection}
              disabled={isDetecting}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-control font-medium text-sm transition-all border shadow-xs",
                isDetecting 
                  ? "bg-neutral-100 text-text-tertiary border-transparent cursor-not-allowed dark:bg-neutral-800"
                  : "bg-accent text-white border-accent hover:bg-accent-hover"
              )}
            >
              {isDetecting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Run Detection
                </>
              )}
            </button>
          </div>
        </header>

        {/* Demo Guide Modal */}
        {showDemo && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-background rounded-card shadow-2xl max-w-2xl w-full p-6 border border-border-soft">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center text-accent">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">Welcome to ProcureGuard</h2>
                    <p className="text-sm text-text-tertiary">Interactive Platform Guide</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDemo(false)}
                  className="text-text-tertiary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-accent font-semibold">
                    <Play size={18} />
                    <h3>1. Run Agent Detection</h3>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Click <strong>Run Detection</strong> to scan Purchase Orders against Contracts. The drift detection agent flags any variance over contracted rates.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 font-semibold">
                    <Zap size={18} />
                    <h3>2. Generate Traffic</h3>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Click <strong>Generate Leaks</strong> to trigger traffic simulation with synthetic contract leaks and test automated drift detection.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-purple-600 font-semibold">
                    <Award size={18} />
                    <h3>3. Evaluate Vendors</h3>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Navigate to <strong>Vendor Ranking</strong> to upload supplier CSVs, configure scoring weights, and stream AI explanations.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                    <Eye size={18} />
                    <h3>4. Drilldown & Dispute</h3>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Click any PO row to inspect contract line items, view AI summaries, flag overcharges for vendor disputes, or export PDF reports.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => setShowDemo(false)}
                  className="px-6 py-2 bg-accent text-white rounded-control hover:bg-accent-hover font-medium transition-colors"
                >
                  Got it, let's start!
                </button>
              </div>
            </div>
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 rounded-control text-sm font-medium transition-colors relative",
        active 
          ? "bg-accent-light text-accent font-semibold"
          : "text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary"
      )}
    >
      {active && <div className="absolute left-0 top-0 h-full w-1 bg-accent rounded-r-full"></div>}
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, subtext, icon }: { title: string, value: string, subtext?: string, icon: React.ReactNode }) {
  return (
    <div className="bg-background p-card rounded-card border border-border-soft shadow-xs transition-all duration-150 ease-out hover:scale-[1.01] hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{title}</p>
          <h3 className="text-metric-large text-text-primary mt-2 font-light">{value}</h3>
          {subtext && <p className="text-xs text-text-tertiary mt-2">{subtext}</p>}
        </div>
        <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Th({ label, sortKey, currentSort, onSort }: { 
  label: string, 
  sortKey: keyof DetectionResult | 'gemini_summary', 
  currentSort: SortConfig | null, 
  onSort: (key: keyof DetectionResult) => void 
}) {
  const isActive = currentSort?.key === sortKey;

  return (
    <th 
      className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors select-none group"
      onClick={() => onSort(sortKey as keyof DetectionResult)}
    >
      <div className="flex items-center gap-1.5 font-semibold">
        {label}
        <ArrowUpDown 
          size={14} 
          className={cn(
            "transition-colors",
            isActive ? "text-accent" : "text-neutral-300 dark:text-neutral-700 group-hover:text-text-tertiary"
          )} 
        />
      </div>
    </th>
  );
}
