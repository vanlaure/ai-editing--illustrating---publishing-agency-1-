import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircleIcon, DownloadIcon, BookIcon, LayersIcon, PrinterIcon, SaveIcon } from '../icons/IconDefs';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardData: any;
  currentView: string;
}

type ExportFormat = 'pdf' | 'csv' | 'excel' | 'json' | 'print';

export const ExportModal: React.FC<ExportModalProps> = ({ 
  isOpen, 
  onClose, 
  dashboardData,
  currentView 
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [dateRange, setDateRange] = useState('current');
  const [isExporting, setIsExporting] = useState(false);

  const exportFormats = [
    {
      id: 'pdf' as ExportFormat,
      name: 'PDF Document',
      icon: BookIcon,
      description: 'Professional report with charts and insights'
    },
    {
      id: 'csv' as ExportFormat,
      name: 'CSV File',
      icon: LayersIcon,
      description: 'Raw data for spreadsheet analysis'
    },
    {
      id: 'excel' as ExportFormat,
      name: 'Excel Workbook',
      icon: LayersIcon,
      description: 'Formatted workbook with multiple sheets'
    },
    {
      id: 'json' as ExportFormat,
      name: 'JSON Data',
      icon: BookIcon,
      description: 'Raw data in JSON format for developers'
    },
    {
      id: 'print' as ExportFormat,
      name: 'Print Preview',
      icon: PrinterIcon,
      description: 'Print-friendly formatted view'
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      switch (selectedFormat) {
        case 'pdf':
          await exportToPDF();
          break;
        case 'csv':
          await exportToCSV();
          break;
        case 'excel':
          await exportToExcel();
          break;
        case 'json':
          await exportToJSON();
          break;
        case 'print':
          handlePrint();
          break;
      }
      
      // Show success message
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    // Implementation will use jsPDF or similar library
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `analytics-dashboard-${currentView}-${timestamp}.pdf`;
    
    // Mock implementation - would need jsPDF library
    console.log('Exporting to PDF:', filename);
    
    // Create a downloadable blob
    const reportContent = generateReportHTML();
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const exportToCSV = async () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `analytics-data-${currentView}-${timestamp}.csv`;
    
    const csvContent = convertToCSV(dashboardData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const exportToExcel = async () => {
    // Would use libraries like xlsx or exceljs
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `analytics-workbook-${currentView}-${timestamp}.xlsx`;
    
    console.log('Exporting to Excel:', filename);
    // Implementation would create proper Excel file
    await exportToCSV(); // Fallback to CSV for now
  };

  const exportToJSON = async () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `analytics-data-${currentView}-${timestamp}.json`;
    
    const jsonContent = JSON.stringify(dashboardData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateReportHTML());
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const generateReportHTML = (): string => {
    const date = new Date().toLocaleDateString();
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Dashboard Report - ${currentView}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
          h2 { color: #3b82f6; margin-top: 30px; }
          .metric { display: inline-block; margin: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
          .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .metric-value { font-size: 24px; font-weight: bold; color: #1e40af; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Analytics Dashboard Report</h1>
        <p><strong>View:</strong> ${currentView} | <strong>Generated:</strong> ${date}</p>
        
        <h2>Key Metrics</h2>
        <div class="metrics-container">
          ${generateMetricsHTML()}
        </div>
        
        ${includeRawData ? `<h2>Raw Data</h2><pre>${JSON.stringify(dashboardData, null, 2)}</pre>` : ''}
        
        <div class="footer">
          <p>Generated by AI Editing, Illustrating & Publishing Agency Analytics Dashboard</p>
          <p>© ${new Date().getFullYear()} - All rights reserved</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateMetricsHTML = (): string => {
    if (!dashboardData) return '<p>No data available</p>';
    
    const metrics: string[] = [];
    
    // Extract key metrics from dashboard data
    if (dashboardData.writing) {
      metrics.push(`
        <div class="metric">
          <div class="metric-label">Words Written</div>
          <div class="metric-value">${dashboardData.writing.wordsWritten?.toLocaleString() || 0}</div>
        </div>
      `);
    }
    
    if (dashboardData.ai) {
      metrics.push(`
        <div class="metric">
          <div class="metric-label">AI Requests</div>
          <div class="metric-value">${dashboardData.ai.totalRequests?.toLocaleString() || 0}</div>
        </div>
      `);
    }
    
    return metrics.join('');
  };

  const convertToCSV = (data: any): string => {
    if (!data) return '';
    
    const rows: string[][] = [];
    
    // Headers
    rows.push(['Metric', 'Value', 'Category', 'Timestamp']);
    
    // Writing metrics
    if (data.writing) {
      Object.entries(data.writing).forEach(([key, value]) => {
        rows.push([key, String(value), 'Writing', new Date().toISOString()]);
      });
    }
    
    // AI metrics
    if (data.ai) {
      Object.entries(data.ai).forEach(([key, value]) => {
        rows.push([key, String(value), 'AI', new Date().toISOString()]);
      });
    }
    
    // Convert to CSV format
    return rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Export Dashboard</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Export Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exportFormats.map((format) => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        selectedFormat === format.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-1 ${
                          selectedFormat === format.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-900">{format.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{format.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Export Options
              </label>
              
              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-medium text-gray-900">Include Charts</div>
                  <div className="text-xs text-gray-500">Export visualizations as images</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRawData}
                  onChange={(e) => setIncludeRawData(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-medium text-gray-900">Include Raw Data</div>
                  <div className="text-xs text-gray-500">Export underlying data tables</div>
                </div>
              </label>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="current">Current Period</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="last90">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <DownloadIcon className="w-4 h-4" />
              {isExporting ? 'Exporting...' : `Export as ${selectedFormat.toUpperCase()}`}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};