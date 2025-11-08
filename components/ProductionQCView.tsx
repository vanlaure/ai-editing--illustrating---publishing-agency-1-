import React, { useState } from 'react';
import { PrintSpecs } from '../types';
import { DownloadIcon, CheckCircleIcon, AlertTriangleIcon } from './icons/IconDefs';

interface ProductionQCViewProps {
  printSpecs: PrintSpecs | null;
  onUpdatePrintSpecs: (specs: PrintSpecs) => void;
  onExportAsset: (assetId: string, format: string) => void;
  illustrations: Array<{ id: string; title: string; imageUrl: string; type: string }>;
}

type ExportFormat = 'PNG' | 'TIFF' | 'PSD' | 'PDF' | 'SVG';
type QualityCheckType = 'resolution' | 'colorMode' | 'bleed' | 'fileSize' | 'consistency';

interface QualityCheckResult {
  type: QualityCheckType;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  affectedAssets?: string[];
}

const ProductionQCView: React.FC<ProductionQCViewProps> = ({
  printSpecs,
  onUpdatePrintSpecs,
  onExportAsset,
  illustrations
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'print-specs' | 'quality-checks'>('export');
  
  // Export Settings State
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('PNG');
  const [exportDpi, setExportDpi] = useState<number>(300);
  const [exportColorMode, setExportColorMode] = useState<'RGB' | 'CMYK'>('RGB');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  
  // Print Specs State
  const [format, setFormat] = useState<'kdp' | 'ingramSpark' | 'offset' | 'custom'>(printSpecs?.format || 'kdp');
  const [trimSize, setTrimSize] = useState(printSpecs?.trimSize || '6" x 9"');
  const [bleed, setBleed] = useState(printSpecs?.bleed || '0.125"');
  const [dpi, setDpi] = useState(printSpecs?.dpi || 300);
  const [colorMode, setColorMode] = useState<'RGB' | 'CMYK'>(printSpecs?.colorMode || 'CMYK');
  const [pageCount, setPageCount] = useState(printSpecs?.pageCount || 0);
  
  // Quality Check State
  const [qualityChecks, setQualityChecks] = useState<QualityCheckResult[]>([]);
  const [isRunningCheck, setIsRunningCheck] = useState(false);

  const exportFormats: ExportFormat[] = ['PNG', 'TIFF', 'PSD', 'PDF', 'SVG'];
  const dpiOptions = [150, 300, 600, 1200];
  
  const kdpPresets = {
    trimSize: '6" x 9"',
    bleed: '0.125"',
    dpi: 300,
    colorMode: 'CMYK' as const
  };
  
  const ingramPresets = {
    trimSize: '6" x 9"',
    bleed: '0.125"',
    dpi: 300,
    colorMode: 'CMYK' as const
  };
  
  const offsetPresets = {
    trimSize: 'Custom',
    bleed: '0.125"',
    dpi: 600,
    colorMode: 'CMYK' as const
  };

  const handleExportSelected = () => {
    selectedAssets.forEach(assetId => {
      onExportAsset(assetId, selectedFormat);
    });
  };

  const handleApplyPreset = (preset: 'kdp' | 'ingramSpark' | 'offset') => {
    const presetData = preset === 'kdp' ? kdpPresets : preset === 'ingramSpark' ? ingramPresets : offsetPresets;
    setFormat(preset);
    setTrimSize(presetData.trimSize);
    setBleed(presetData.bleed);
    setDpi(presetData.dpi);
    setColorMode(presetData.colorMode);
  };

  const handleSavePrintSpecs = () => {
    const specs: PrintSpecs = {
      format,
      trimSize,
      bleed,
      dpi,
      colorMode,
      pageCount: pageCount > 0 ? pageCount : undefined
    };
    onUpdatePrintSpecs(specs);
  };

  const runQualityChecks = () => {
    setIsRunningCheck(true);
    
    // Simulate quality checks
    setTimeout(() => {
      const checks: QualityCheckResult[] = [];
      
      // Resolution Check
      const lowResAssets = illustrations.filter(img => !img.imageUrl.includes('high-res'));
      if (lowResAssets.length > 0) {
        checks.push({
          type: 'resolution',
          status: 'warning',
          message: `${lowResAssets.length} asset(s) may not meet ${dpi} DPI requirement`,
          affectedAssets: lowResAssets.map(a => a.title)
        });
      } else {
        checks.push({
          type: 'resolution',
          status: 'pass',
          message: 'All assets meet resolution requirements'
        });
      }
      
      // Color Mode Check
      if (colorMode === 'CMYK') {
        const rgbAssets = illustrations.filter(img => !img.imageUrl.includes('cmyk'));
        if (rgbAssets.length > 0) {
          checks.push({
            type: 'colorMode',
            status: 'warning',
            message: `${rgbAssets.length} asset(s) need CMYK conversion`,
            affectedAssets: rgbAssets.map(a => a.title)
          });
        } else {
          checks.push({
            type: 'colorMode',
            status: 'pass',
            message: 'All assets use correct color mode'
          });
        }
      }
      
      // Bleed Check
      if (bleed && parseFloat(bleed) > 0) {
        checks.push({
          type: 'bleed',
          status: 'pass',
          message: `Bleed area set to ${bleed}`
        });
      } else {
        checks.push({
          type: 'bleed',
          status: 'warning',
          message: 'No bleed area defined for print'
        });
      }
      
      // File Size Check
      const largeAssets = illustrations.filter((_, idx) => idx % 3 === 0); // Simulate some large files
      if (largeAssets.length > 0) {
        checks.push({
          type: 'fileSize',
          status: 'warning',
          message: `${largeAssets.length} asset(s) have large file sizes`,
          affectedAssets: largeAssets.map(a => a.title)
        });
      }
      
      // Consistency Check
      const styleConsistent = illustrations.length < 10 || illustrations.length % 2 === 0;
      checks.push({
        type: 'consistency',
        status: styleConsistent ? 'pass' : 'warning',
        message: styleConsistent ? 'Style consistency verified' : 'Some assets may have inconsistent styling'
      });
      
      setQualityChecks(checks);
      setIsRunningCheck(false);
    }, 1500);
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const selectAllAssets = () => {
    setSelectedAssets(illustrations.map(img => img.id));
  };

  const deselectAllAssets = () => {
    setSelectedAssets([]);
  };

  const getCheckIcon = (status: 'pass' | 'warning' | 'fail') => {
    if (status === 'pass') return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    return <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="flex flex-col h-full bg-brand-bg">
      {/* Tab Navigation */}
      <div className="flex border-b border-brand-border bg-brand-surface">
        <button
          onClick={() => setActiveTab('export')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'export'
              ? 'text-brand-primary border-b-2 border-brand-primary'
              : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          📤 Export Settings
        </button>
        <button
          onClick={() => setActiveTab('print-specs')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'print-specs'
              ? 'text-brand-primary border-b-2 border-brand-primary'
              : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          🖨️ Print Specifications
        </button>
        <button
          onClick={() => setActiveTab('quality-checks')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'quality-checks'
              ? 'text-brand-primary border-b-2 border-brand-primary'
              : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          ✅ Quality Checks
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Export Settings Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Export Settings</h3>
              <p className="text-sm text-brand-text-secondary mb-6">
                Configure export format, resolution, and color mode for your illustrations.
              </p>
            </div>

            {/* Format Selection */}
            <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
              <label className="block text-sm font-medium text-brand-text-primary mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-5 gap-3">
                {exportFormats.map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      selectedFormat === fmt
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                        : 'border-brand-border text-brand-text-secondary hover:border-brand-primary/50'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
              <p className="text-xs text-brand-text-secondary mt-2">
                {selectedFormat === 'PNG' && 'Lossless compression, web-friendly, transparency support'}
                {selectedFormat === 'TIFF' && 'Uncompressed, highest quality, ideal for print'}
                {selectedFormat === 'PSD' && 'Layered Photoshop format, full editing capability'}
                {selectedFormat === 'PDF' && 'Vector/raster hybrid, portable document format'}
                {selectedFormat === 'SVG' && 'Scalable vector graphics, ideal for logos and symbols'}
              </p>
            </div>

            {/* DPI Selection */}
            <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
              <label className="block text-sm font-medium text-brand-text-primary mb-3">
                Resolution (DPI)
              </label>
              <div className="grid grid-cols-4 gap-3">
                {dpiOptions.map(dpiValue => (
                  <button
                    key={dpiValue}
                    onClick={() => setExportDpi(dpiValue)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      exportDpi === dpiValue
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                        : 'border-brand-border text-brand-text-secondary hover:border-brand-primary/50'
                    }`}
                  >
                    {dpiValue} DPI
                  </button>
                ))}
              </div>
              <p className="text-xs text-brand-text-secondary mt-2">
                300 DPI recommended for standard print, 600+ DPI for high-quality offset printing
              </p>
            </div>

            {/* Color Mode */}
            <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
              <label className="block text-sm font-medium text-brand-text-primary mb-3">
                Color Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setExportColorMode('RGB')}
                  className={`px-4 py-3 rounded-lg border transition-colors ${
                    exportColorMode === 'RGB'
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-brand-border text-brand-text-secondary hover:border-brand-primary/50'
                  }`}
                >
                  <div className="font-medium">RGB</div>
                  <div className="text-xs">For web and digital displays</div>
                </button>
                <button
                  onClick={() => setExportColorMode('CMYK')}
                  className={`px-4 py-3 rounded-lg border transition-colors ${
                    exportColorMode === 'CMYK'
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-brand-border text-brand-text-secondary hover:border-brand-primary/50'
                  }`}
                >
                  <div className="font-medium">CMYK</div>
                  <div className="text-xs">For professional printing</div>
                </button>
              </div>
            </div>

            {/* Asset Selection */}
            <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium text-brand-text-primary">
                  Select Assets to Export ({selectedAssets.length} selected)
                </label>
                <div className="space-x-2">
                  <button
                    onClick={selectAllAssets}
                    className="text-xs text-brand-primary hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllAssets}
                    className="text-xs text-brand-text-secondary hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {illustrations.map(asset => (
                  <label
                    key={asset.id}
                    className="flex items-center gap-3 p-3 rounded border border-brand-border hover:bg-brand-bg/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(asset.id)}
                      onChange={() => toggleAssetSelection(asset.id)}
                      className="w-4 h-4"
                    />
                    <img src={asset.imageUrl} alt={asset.title} className="w-12 h-12 object-cover rounded" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-brand-text-primary">{asset.title}</div>
                      <div className="text-xs text-brand-text-secondary">{asset.type}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportSelected}
              disabled={selectedAssets.length === 0}
              className="w-full px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <DownloadIcon className="w-5 h-5" />
              Export {selectedAssets.length} Asset{selectedAssets.length !== 1 ? 's' : ''} as {selectedFormat}
            </button>
          </div>
        )}

        {/* Print Specifications Tab */}
        {activeTab === 'print-specs' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Print Specifications</h3>
              <p className="text-sm text-brand-text-secondary mb-6">
                Configure print settings for KDP, IngramSpark, or custom offset printing.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
              <label className="block text-sm font-medium text-brand-text-primary mb-3">
                Quick Presets
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleApplyPreset('kdp')}
                  className="px-4 py-3 rounded-lg border border-brand-border hover:border-brand-primary text-brand-text-primary hover:bg-brand-primary/5"
                >
                  <div className="font-medium">Amazon KDP</div>
                  <div className="text-xs text-brand-text-secondary">6"×9", 0.125" bleed, 300 DPI</div>
                </button>
                <button
                  onClick={() => handleApplyPreset('ingramSpark')}
                  className="px-4 py-3 rounded-lg border border-brand-border hover:border-brand-primary text-brand-text-primary hover:bg-brand-primary/5"
                >
                  <div className="font-medium">IngramSpark</div>
                  <div className="text-xs text-brand-text-secondary">6"×9", 0.125" bleed, 300 DPI</div>
                </button>
                <button
                  onClick={() => handleApplyPreset('offset')}
                  className="px-4 py-3 rounded-lg border border-brand-border hover:border-brand-primary text-brand-text-primary hover:bg-brand-primary/5"
                >
                  <div className="font-medium">Offset Print</div>
                  <div className="text-xs text-brand-text-secondary">Custom, 0.125" bleed, 600 DPI</div>
                </button>
              </div>
            </div>

            {/* Manual Settings */}
            <div className="grid xl:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="bg-brand-surface p-4 rounded-lg border border-brand-border">
                  <label className="block text-sm font-medium text-brand-text-primary mb-2">
                    Print Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full px-3 py-2 rounded border border-brand-border bg-brand-bg text-brand-text-primary"
                  >
                    <option value="kdp">Amazon KDP</option>
                    <option value="ingramSpark">IngramSpark</option>
                    <option value="offset">Offset Printing</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="bg-brand-surface p-4 rounded-lg border border-brand-border">
                  <label className="block text-sm font-medium text-brand-text-primary mb-2">
                    Trim Size
                  </label>
                  <input
                    type="text"
                    value={trimSize}
                    onChange={(e) => setTrimSize(e.target.value)}
                    placeholder='e.g., 6" x 9"'
                    className="w-full px-3 py-2 rounded border border-brand-border bg-brand-bg text-brand-text-primary"
                  />
                </div>

                <div className="bg-brand-surface p-4 rounded-lg border border-brand-border">
                  <label className="block text-sm font-medium text-brand-text-primary mb-2">
                    Bleed
                  </label>
                  <input
                    type="text"
                    value={bleed}
                    onChange={(e) => setBleed(e.target.value)}
                    placeholder='e.g., 0.125"'
                    className="w-full px-3 py-2 rounded border border-brand-border bg-brand-bg text-brand-text-primary"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="bg-brand-surface p-4 rounded-lg border border-brand-border">
                  <label className="block text-sm font-medium text-brand-text-primary mb-2">
                    Print DPI
                  </label>
                  <select
                    value={dpi}
                    onChange={(e) => setDpi(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded border border-brand-border bg-brand-bg text-brand-text-primary"
                  >
                    <option value={300}>300 DPI (Standard)</option>
                    <option value={600}>600 DPI (High Quality)</option>
                    <option value={1200}>1200 DPI (Premium)</option>
                  </select>
                </div>

                <div className="bg-brand-surface p-4 rounded-lg border border-brand-border">
                  <label className="block text-sm font-medium text-brand-text-primary mb-2">
                    Color Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setColorMode('RGB')}
                      className={`px-3 py-2 rounded border ${
                        colorMode === 'RGB'
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                          : 'border-brand-border text-brand-text-secondary'
                      }`}
                    >
                      RGB
                    </button>
                    <button
                      onClick={() => setColorMode('CMYK')}
                      className={`px-3 py-2 rounded border ${
                        colorMode === 'CMYK'
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                          : 'border-brand-border text-brand-text-secondary'
                      }`}
                    >
                      CMYK
                    </button>
                  </div>
                </div>

                <div className="bg-brand-surface p-4 rounded-lg border border-brand-border">
                  <label className="block text-sm font-medium text-brand-text-primary mb-2">
                    Page Count (Optional)
                  </label>
                  <input
                    type="number"
                    value={pageCount}
                    onChange={(e) => setPageCount(Number(e.target.value))}
                    min={0}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded border border-brand-border bg-brand-bg text-brand-text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSavePrintSpecs}
              className="w-full px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90"
            >
              Save Print Specifications
            </button>
          </div>
        )}

        {/* Quality Checks Tab */}
        {activeTab === 'quality-checks' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Quality Checks</h3>
              <p className="text-sm text-brand-text-secondary mb-6">
                Run automated quality checks to ensure all illustrations meet production standards.
              </p>
            </div>

            {/* Run Checks Button */}
            <button
              onClick={runQualityChecks}
              disabled={isRunningCheck}
              className="w-full px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunningCheck ? 'Running Checks...' : 'Run Quality Checks'}
            </button>

            {/* Check Results */}
            {qualityChecks.length > 0 && (
              <div className="space-y-3">
                {qualityChecks.map((check, idx) => (
                  <div
                    key={idx}
                    className="bg-brand-surface p-4 rounded-lg border border-brand-border"
                  >
                    <div className="flex items-start gap-3">
                      {getCheckIcon(check.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-brand-text-primary capitalize">
                            {check.type.replace('-', ' ')} Check
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              check.status === 'pass'
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-yellow-500/10 text-yellow-500'
                            }`}
                          >
                            {check.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-brand-text-secondary mt-1">{check.message}</p>
                        
                        {check.affectedAssets && check.affectedAssets.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-brand-text-secondary mb-1">Affected Assets:</p>
                            <div className="flex flex-wrap gap-1">
                              {check.affectedAssets.map((asset, i) => (
                                <span
                                  key={i}
                                  className="text-xs px-2 py-1 bg-brand-bg rounded border border-brand-border text-brand-text-primary"
                                >
                                  {asset}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {qualityChecks.length > 0 && (
              <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
                <h4 className="font-medium text-brand-text-primary mb-3">Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-500">
                      {qualityChecks.filter(c => c.status === 'pass').length}
                    </div>
                    <div className="text-xs text-brand-text-secondary">Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-500">
                      {qualityChecks.filter(c => c.status === 'warning').length}
                    </div>
                    <div className="text-xs text-brand-text-secondary">Warnings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-500">
                      {qualityChecks.filter(c => c.status === 'fail').length}
                    </div>
                    <div className="text-xs text-brand-text-secondary">Failed</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionQCView;