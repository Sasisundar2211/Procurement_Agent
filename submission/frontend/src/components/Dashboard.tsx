import React, { useState, useEffect } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ThemeToggle } from './ThemeToggle';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ReactSlider from 'react-slider';

// Types
interface DetectionResult {
  po_id: string;
  vendor_id: string;
  item_id: string;
  unit_price: number;
  qty: number;
  total: number;
  date: string;
  contract_id: string;
  leak?: boolean;
  price_drift?: number;
}

interface DashboardStats {
  totalDetections: number;
  avgDrift: number;
  alertsCount: number;
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
  const [stats, setStats] = useState<DashboardStats>({ totalDetections: 0, avgDrift: 0, alertsCount: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterDrift, setFilterDrift] = useState<'all' | 'high'>('all');
  const [driftScoreRange, setDriftScoreRange] = useState<[number, number]>([0, 100]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const calculateStats = (data: DetectionResult[]) => {
    const total = data.length;
    const alerts = data.length;
    // Calculate average drift if available, else mock
    // price_drift is a ratio (e.g. 1.20), we want percentage (20)
    const avg = data.length > 0 
      ? data.reduce((acc, curr) => acc + ((curr.price_drift || 1) - 1) * 100, 0) / data.length 
      : 15.5;

    setStats({
      totalDetections: total,
      avgDrift: parseFloat(avg.toFixed(1)),
      alertsCount: alerts
    });
  };

  const fetchResults = async (drift_threshold: number | null = null) => {
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
  };

  // Mock initial fetch or real fetch
  useEffect(() => {
    fetchResults();
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
        // Wait a bit for simulation to finish (it's fast) then run detection
        setTimeout(() => {
           setIsSimulating(false);
           runDetection(); // Automatically detect after simulation
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
          fetchResults(); // Refresh data
          setIsDetecting(false);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setIsDetecting(false);
        }
      } catch (e) {
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
    
    if (percentage < 15) return { label: 'Low', color: 'bg-yellow-100 text-yellow-800' };
    if (percentage < 30) return { label: 'Medium', color: 'bg-orange-100 text-orange-800' };
    return { label: 'High', color: 'bg-red-100 text-red-800' };
  };

  const sortedResults = React.useMemo(() => {
    let sortableItems = [...results];
    
    // Apply Filters
    if (filterDrift === 'high') {
      sortableItems = sortableItems.filter(item => ((item.price_drift || 1) - 1) * 100 > 20);
    }

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] as any;
        const bValue = b[sortConfig.key] as any;
        
        if (aValue === undefined || bValue === undefined) return 0;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
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

  // Pagination Logic
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

  // Render Content based on Tab
  const renderContent = () => {
    if (activeTab === 'settings') {
      return (
        <div className="p-6 max-w-4xl mx-auto">
          <h2 className="text-h2 text-text-primary mb-6">System Settings</h2>
          <div className="bg-background rounded-card border border-border-soft p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Drift Threshold (%)</label>
                <input type="number" defaultValue={5} className="w-full max-w-xs px-3 py-2 border border-border-soft rounded-control bg-transparent" />
                <p className="text-xs text-text-tertiary mt-1">Transactions exceeding this variance will be flagged.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Notification Email</label>
                <input type="email" defaultValue="admin@procureguard.com" className="w-full max-w-md px-3 py-2 border border-border-soft rounded-control bg-transparent" />
              </div>
              <div className="pt-4">
                <button className="px-4 py-2 bg-accent text-white rounded-control hover:bg-accent-hover transition-colors">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'reports') {
      return (
        <div className="p-6 max-w-4xl mx-auto">
          <h2 className="text-h2 text-text-primary mb-6">Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background p-6 rounded-card border border-border-soft">
              <div className="w-12 h-12 bg-accent-light rounded-lg flex items-center justify-center text-accent mb-4">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Monthly Drift Report</h3>
              <p className="text-sm text-text-tertiary mb-4">Comprehensive summary of all price drifts detected in the last 30 days.</p>
              <button 
                onClick={handleDownloadPDF}
                className="text-accent font-medium text-sm hover:underline"
              >
                Download PDF
              </button>
            </div>
            <div className="bg-background p-6 rounded-card border border-border-soft">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
                <Download size={24} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Vendor Performance</h3>
              <p className="text-sm text-text-tertiary mb-4">Analysis of vendor compliance and pricing consistency.</p>
              <button 
                onClick={handleExportCSV}
                className="text-accent font-medium text-sm hover:underline"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Default: Dashboard or Detections (showing same view for now but could filter)
    return (
      <div className="flex-1 overflow-auto p-6">
        {/* Stats Cards - Only show on Dashboard tab */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <StatCard 
              title="Total Detections" 
              value={stats.totalDetections.toString()} 
              icon={<FileText className="text-text-tertiary" size={24} />}
            />
            <StatCard 
              title="Avg. Price Drift" 
              value={`${stats.avgDrift}%`} 
              icon={<ArrowUpDown className="text-text-tertiary" size={24} />}
            />
            <StatCard 
              title="Active Alerts" 
              value={stats.alertsCount.toString()}
              icon={<AlertTriangle className="text-text-tertiary" size={24} />}
            />
          </div>
        )}

        {/* Filters & Actions */}
        {/* Filters & Actions */}
        <div className="bg-background rounded-card border border-border-soft mb-6">
          <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-text-quaternary" size={18} />
              <input 
                type="text" 
                placeholder="Search vendors, items, or POs..." 
                className="w-full pl-8 pr-4 py-2 bg-transparent border-b border-border-soft focus:outline-none focus:ring-0 focus:border-accent transition-colors text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-control border transition-colors",
                    showFilters 
                      ? "bg-accent-light text-accent border-accent"
                      : "text-text-secondary bg-transparent hover:bg-neutral-100 border-border-soft"
                  )}
                >
                  <Filter size={16} />
                  Filters
                </button>
                
                {/* Filter Dropdown */}
                {showFilters && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-background rounded-lg shadow-lg border border-border-soft z-10 p-4">
                    <div className="text-xs font-semibold text-text-tertiary mb-2 px-2">By Drift Severity</div>
                    <button 
                      onClick={() => setFilterDrift('all')}
                      className={cn(
                        "w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors",
                        filterDrift === 'all' ? "bg-accent-light text-accent" : "hover:bg-neutral-100"
                      )}
                    >
                      Show All
                    </button>
                    <button 
                      onClick={() => setFilterDrift('high')}
                      className={cn(
                        "w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors",
                        filterDrift === 'high' ? "bg-accent-light text-accent" : "hover:bg-neutral-100"
                      )}
                    >
                      High Drift Only ({'>'}20%)
                    </button>
                    <div className="text-xs font-semibold text-text-tertiary mt-4 mb-2 px-2">By Drift Score</div>
                    <div className="p-2">
                      <ReactSlider
                        className="w-full h-1.5 bg-neutral-200 rounded-full"
                        thumbClassName="w-4 h-4 bg-accent rounded-full cursor-pointer -top-1 focus:outline-none focus:ring-2 focus:ring-accent/50"
                        trackClassName="h-1.5 bg-accent-light rounded-full"
                        defaultValue={[0, 100]}
                        ariaLabel={['Lower thumb', 'Upper thumb']}
                        ariaValuetext={state => `Thumb value ${state.valueNow}`}
                        renderThumb={(props: any, state: any) => <div {...props}><div className="text-xs text-white absolute -top-5 left-1/2 -translate-x-1/2">{state.valueNow}</div></div>}
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
                    ? "bg-amber-100 text-amber-600 border-amber-200 cursor-not-allowed"
                    : "text-text-secondary bg-transparent hover:bg-neutral-100 border-border-soft"
                )}
              >
                {isSimulating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                Generate Leaks
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-table-header text-text-tertiary border-b border-border-soft">
                <tr>
                  <Th label="PO ID" sortKey="po_id" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Vendor" sortKey="vendor_id" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Item" sortKey="item_id" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Date" sortKey="date" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Unit Price" sortKey="unit_price" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Total" sortKey="total" currentSort={sortConfig} onSort={handleSort} />
                  <Th label="Drift Level" sortKey="price_drift" currentSort={sortConfig} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {paginatedResults.length > 0 ? (
                  paginatedResults.map((row, idx) => {
                    const driftLevel = getDriftLevel(row.price_drift);
                    return (
                      <tr key={idx} className="hover:bg-neutral-100/50 transition-colors group" style={{ height: '56px' }}>
                        <td className="px-6 font-medium text-text-primary">{row.po_id}</td>
                        <td className="px-6 text-text-secondary">{row.vendor_id}</td>
                        <td className="px-6 text-text-secondary">{row.item_id}</td>
                        <td className="px-6 text-text-tertiary">{row.date}</td>
                        <td className="px-6 font-mono text-text-secondary">${row.unit_price.toFixed(2)}</td>
                        <td className="px-6 font-mono text-text-secondary">${row.total.toFixed(2)}</td>
                        <td className="px-6">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", driftLevel.color)}>
                            {driftLevel.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-text-tertiary">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={32} className="text-neutral-200" />
                        <p>No results found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-border-soft flex items-center justify-between text-sm text-text-tertiary">
            <span>Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredResults.length)} to {Math.min(currentPage * itemsPerPage, filteredResults.length)} of {filteredResults.length} results</span>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1 rounded-control border border-border-soft hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center gap-1 px-3 py-1 rounded-control border border-border-soft hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      {/* Sidebar */}
      <aside className="w-80 bg-sidebar-bg border-r border-border-soft hidden md:flex flex-col">
        <div className="p-6 border-b border-border-soft h-[65px] flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold">
              P
            </div>
            <span className="text-lg font-semibold tracking-tight text-text-primary">ProcureGuard</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<AlertTriangle size={20} />} label="Detections" active={activeTab === 'detections'} onClick={() => setActiveTab('detections')} />
          <NavItem icon={<FileText size={20} />} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          <NavItem icon={<Settings size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4 border-t border-border-soft">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-medium text-text-secondary">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">Jane Doe</p>
              <p className="text-xs text-text-tertiary truncate">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <header className="h-[65px] bg-background border-b border-border-soft flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-dashboard-title text-text-primary">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowDemo(true)}
              className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
              title="Demo Guide"
            >
              <HelpCircle size={20} />
            </button>
            <ThemeToggle />
            <button className="p-2 text-text-tertiary hover:text-text-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-drift-high rounded-full"></span>
            </button>
            <button 
              onClick={runDetection}
              disabled={isDetecting}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-control font-medium text-sm transition-all border",
                isDetecting 
                  ? "bg-neutral-100 text-text-tertiary border-transparent cursor-not-allowed" 
                  : "bg-transparent text-accent border-accent hover:bg-accent-light"
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
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-background rounded-card shadow-xl max-w-2xl w-full p-6 border border-border-soft">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-light rounded-full flex items-center justify-center text-accent">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">Welcome to ProcureGuard</h2>
                    <p className="text-sm text-text-tertiary">Interactive Demo Guide</p>
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
                    <h3>1. Run Detection</h3>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Click the <strong>Run Detection</strong> button to scan all existing Purchase Orders against Contracts. The agent will identify any transactions where the unit price exceeds the contracted rate.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 font-semibold">
                    <Zap size={18} />
                    <h3>2. Generate Leaks</h3>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Want to see the agent in action? Click <strong>Generate Leaks</strong> to create 50 new random transactions. Some will intentionally have price leaks! The system will auto-detect them.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-purple-600 font-semibold">
                    <Filter size={18} />
                    <h3>3. Filter & Analyze</h3>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Use the <strong>Filters</strong> menu to narrow down results. You can filter by <strong>Drift Severity</strong> (High/Medium/Low) or use the slider to find specific drift percentages.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <FileText size={18} />
                    <h3>4. Export Reports</h3>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Go to the <strong>Reports</strong> tab to download a professional PDF summary or export the raw data as CSV for further analysis.
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
          ? "bg-accent-light text-accent" 
          : "text-text-secondary hover:bg-neutral-100 hover:text-text-primary"
      )}
    >
      {active && <div className="absolute left-0 top-0 h-full w-1 bg-accent rounded-r-full"></div>}
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-background p-card rounded-card border border-border-soft transition-transform duration-150 ease-out hover:scale-101 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <p className="text-body text-text-tertiary">{title}</p>
          <h3 className="text-metric-large text-text-primary mt-1">{value}</h3>
        </div>
        {icon}
      </div>
    </div>
  );
}

function Th({ label, sortKey, currentSort, onSort }: { 
  label: string, 
  sortKey: keyof DetectionResult, 
  currentSort: SortConfig | null, 
  onSort: (key: keyof DetectionResult) => void 
}) {
  const isActive = currentSort?.key === sortKey;

  return (
    <th 
      className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors select-none group"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown 
          size={14} 
          className={cn(
            "transition-colors",
            isActive ? "text-accent" : "text-neutral-300 group-hover:text-text-tertiary"
          )} 
        />
      </div>
    </th>
  );
}
