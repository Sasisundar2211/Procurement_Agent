import {
  X,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
  ShieldAlert,
  Building2,
  Calendar,
  Hash,
  DollarSign,
  ExternalLink
} from 'lucide-react';

export interface DetectionResult {
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
  gemini_summary?: string;
}

interface PODetailModalProps {
  po: DetectionResult | null;
  onClose: () => void;
  onFlagPO?: (poId: string) => void;
}

export function PODetailModal({ po, onClose, onFlagPO }: PODetailModalProps) {
  if (!po) return null;

  const driftRatio = po.price_drift || 1;
  const driftPercentage = (driftRatio - 1) * 100;
  const expectedUnitPrice = po.unit_price / (driftRatio > 0 ? driftRatio : 1);
  const expectedTotal = expectedUnitPrice * (po.qty || 1);
  const overchargeAmount = po.total - expectedTotal;

  const getSeverityBadge = (pct: number) => {
    if (pct <= 0) {
      return {
        label: 'Contract Compliant',
        bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      };
    }
    if (pct < 15) {
      return {
        label: `Low Variance (+${pct.toFixed(1)}%)`,
        bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      };
    }
    if (pct < 30) {
      return {
        label: `Moderate Leak (+${pct.toFixed(1)}%)`,
        bg: 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        icon: <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
      };
    }
    return {
      label: `Critical Drift (+${pct.toFixed(1)}%)`,
      bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      icon: <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
    };
  };

  const severity = getSeverityBadge(driftPercentage);

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Purchase Order Leak Audit: ${po.po_id}`, 14, 20);

    doc.setFontSize(10);
    doc.text(`Vendor: ${po.vendor_id}`, 14, 30);
    doc.text(`Contract Reference: ${po.contract_id}`, 14, 36);
    doc.text(`Date of Issue: ${po.date}`, 14, 42);
    doc.text(`Audit Date: ${new Date().toLocaleDateString()}`, 14, 48);

    autoTable(doc, {
      startY: 56,
      head: [['Metric', 'Contracted Rate', 'Invoiced PO Rate', 'Variance / Drift']],
      body: [
        ['Unit Price', `$${expectedUnitPrice.toFixed(2)}`, `$${po.unit_price.toFixed(2)}`, `+${driftPercentage.toFixed(1)}%`],
        ['Quantity', `${po.qty || 1}`, `${po.qty || 1}`, '0%'],
        ['Total Order Price', `$${expectedTotal.toFixed(2)}`, `$${po.total.toFixed(2)}`, `+$${overchargeAmount.toFixed(2)}`],
      ],
    });

    if (po.gemini_summary) {
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 100;
      doc.text('AI Audit Insights:', 14, finalY + 12);
      const splitText = doc.splitTextToSize(po.gemini_summary, 180);
      doc.text(splitText, 14, finalY + 20);
    }

    doc.save(`PO_Audit_${po.po_id}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div
        className="bg-background rounded-2xl shadow-2xl border border-border-soft max-w-2xl w-full overflow-hidden transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-6 border-b border-border-soft flex items-start justify-between bg-sidebar-bg/50">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-accent-light rounded-xl text-accent">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-text-primary">PO #{po.po_id}</h2>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${severity.bg}`}>
                  {severity.icon}
                  {severity.label}
                </span>
              </div>
              <p className="text-xs text-text-tertiary mt-1 flex items-center gap-2">
                <span>Contract ID: <strong className="text-text-secondary">{po.contract_id}</strong></span>
                <span>•</span>
                <span>Date: <strong className="text-text-secondary">{po.date}</strong></span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close detail modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Grid Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl border border-border-soft bg-neutral-50/50 dark:bg-neutral-900/30">
              <span className="text-xs text-text-tertiary flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Vendor
              </span>
              <p className="text-sm font-semibold text-text-primary mt-1 truncate">{po.vendor_id}</p>
            </div>

            <div className="p-3 rounded-xl border border-border-soft bg-neutral-50/50 dark:bg-neutral-900/30">
              <span className="text-xs text-text-tertiary flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" /> Item Code
              </span>
              <p className="text-sm font-semibold text-text-primary mt-1 truncate">{po.item_id}</p>
            </div>

            <div className="p-3 rounded-xl border border-border-soft bg-neutral-50/50 dark:bg-neutral-900/30">
              <span className="text-xs text-text-tertiary flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Quantity
              </span>
              <p className="text-sm font-semibold text-text-primary mt-1">{po.qty || 1} units</p>
            </div>

            <div className="p-3 rounded-xl border border-border-soft bg-neutral-50/50 dark:bg-neutral-900/30">
              <span className="text-xs text-text-tertiary flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> Total Billed
              </span>
              <p className="text-sm font-semibold text-text-primary mt-1 font-mono">${po.total.toFixed(2)}</p>
            </div>
          </div>

          {/* Pricing Comparison Card */}
          <div className="p-4 rounded-xl border border-border-soft bg-gradient-to-br from-neutral-50 to-neutral-100/50 dark:from-neutral-900/40 dark:to-neutral-900/10">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
              Price Drift Variance Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-background rounded-lg border border-border-soft shadow-xs">
                <span className="text-xs text-text-tertiary block">Contract Target Unit</span>
                <span className="text-base font-bold text-text-secondary font-mono mt-1 block">
                  ${expectedUnitPrice.toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-background rounded-lg border border-border-soft shadow-xs">
                <span className="text-xs text-text-tertiary block">PO Invoiced Unit</span>
                <span className="text-base font-bold text-text-primary font-mono mt-1 block">
                  ${po.unit_price.toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-200 dark:border-rose-900 shadow-xs">
                <span className="text-xs text-rose-700 dark:text-rose-400 block font-medium">Excess Overcharge</span>
                <span className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono mt-1 block">
                  +${overchargeAmount > 0 ? overchargeAmount.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Explanation Callout */}
          {po.gemini_summary && (
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
              <div className="flex items-center gap-2 mb-2 text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                <ExternalLink className="w-4 h-4" />
                <span>AI Automated Audit Summary</span>
              </div>
              <p className="text-sm text-indigo-950 dark:text-indigo-200 leading-relaxed">
                {po.gemini_summary}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border-soft flex items-center justify-between gap-3 bg-sidebar-bg/30">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-control border border-border-soft text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>

          <div className="flex items-center gap-2">
            {onFlagPO && driftPercentage > 0 && (
              <button
                onClick={() => {
                  onFlagPO(po.po_id);
                  onClose();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-control bg-rose-600 text-white hover:bg-rose-700 text-sm font-medium transition-colors shadow-xs"
              >
                <ShieldAlert className="w-4 h-4" />
                Flag for Vendor Dispute
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-control bg-neutral-200 dark:bg-neutral-800 text-text-primary hover:bg-neutral-300 dark:hover:bg-neutral-700 text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
