import React, { useState, useMemo, useCallback } from 'react';
import { AudiobookProject, LocalizationPack, LocalizedMetadata, Retailer, RetailerSubmission, CostPlan } from '../types';
import {
  BookUpIcon,
  ImageIcon,
  SparklesIcon,
  MegaphoneIcon,
  SaveIcon,
} from './icons/IconDefs';
import { fetchRetailerRequirements, assembleRetailerSubmission } from '../services/publishingService';

interface PublishingViewProps {
  projects: AudiobookProject[];
  manuscript: string;
  coverArt: string | null;
  onGenerateBlurb: () => Promise<string>;
  onGenerateKeywords: () => Promise<string[]>;
  onGenerateCoverArt: (prompt: string) => Promise<void>;
  onOpenImageEditor: (image: string) => void;
  onExportManuscript: (format: 'txt' | 'html') => void;
  onOpenMarketingSuite?: () => void;
  onOpenDistributionSuite?: () => void;
  localizationPacks: LocalizationPack[];
  localizedMetadata: LocalizedMetadata[];
  onGenerateLocalizationPack: (locales: string[]) => Promise<LocalizationPack[]>;
  onTranslateMetadata: (locales: string[]) => Promise<LocalizedMetadata[]>;
  isGeneratingLocalizationPack: boolean;
  isGeneratingLocalizedMetadata: boolean;
  costPlan: CostPlan | null;
  onGenerateCostPlan: (tier: 'starter' | 'professional' | 'cinematic') => Promise<CostPlan | null>;
  isGeneratingCostPlan: boolean;
}

type RetailerFilter = Retailer | 'Google Play Books';

const LoadingSpinner: React.FC = () => (
  <svg
    className="animate-spin h-4 w-4 text-brand-primary"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const CopyButton: React.FC<{ textToCopy: string; size?: 'sm' | 'xs' }> = ({
  textToCopy,
  size = 'xs',
}) => {
  const [copied, setCopied] = useState(false);
  const padding = size === 'sm' ? 'px-2 py-1.5' : 'px-1.5 py-1';
  const textSize = size === 'sm' ? 'text-xs' : 'text-[10px]';

  const handleCopy = () => {
    if (!textToCopy) return;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // Swallow clipboard errors silently for now
      });
  };

  return (
    <button
      onClick={handleCopy}
      disabled={!textToCopy}
      className={`${padding} ${textSize} rounded-md border border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10 disabled:opacity-40`}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const LOCALE_OPTIONS = [
  { code: 'es-ES', label: 'Spanish (Spain)' },
  { code: 'fr-FR', label: 'French (France)' },
  { code: 'de-DE', label: 'German' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'hi-IN', label: 'Hindi' },
];

export const PublishingView: React.FC<PublishingViewProps> = ({
  projects,
  manuscript,
  coverArt,
  onGenerateBlurb,
  onGenerateKeywords,
  onGenerateCoverArt,
  onOpenImageEditor,
  onExportManuscript,
  onOpenMarketingSuite,
  onOpenDistributionSuite,
  localizationPacks,
  localizedMetadata,
  onGenerateLocalizationPack,
  onTranslateMetadata,
  isGeneratingLocalizationPack,
  isGeneratingLocalizedMetadata,
  costPlan,
  onGenerateCostPlan,
  isGeneratingCostPlan,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects[0]?.id || null
  );
  const [isGeneratingBlurb, setIsGeneratingBlurb] = useState(false);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [blurb, setBlurb] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [coverPrompt, setCoverPrompt] = useState('');
  const [activeChecklistTab, setActiveChecklistTab] =
    useState<'kdp' | 'wide' | 'audiobook'>('kdp');
  const [selectedLocales, setSelectedLocales] = useState<string[]>(['es-ES', 'fr-FR']);
  const [selectedCostTier, setSelectedCostTier] = useState<'starter' | 'professional' | 'cinematic'>('starter');
  const retailerRequirements = useMemo(() => fetchRetailerRequirements(), []);
  const [selectedRetailer, setSelectedRetailer] = useState<RetailerFilter>('Amazon KDP');
  const [retailerSubmissions, setRetailerSubmissions] = useState<RetailerSubmission[]>([]);
  const [isAssemblingSubmission, setIsAssemblingSubmission] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const effectiveTitle =
    selectedProject?.title || 'Untitled Manuscript';
  const effectiveAuthor =
    selectedProject?.author || 'Author Name';

  const handleGenBlurb = async () => {
    setIsGeneratingBlurb(true);
    try {
      const generated = await onGenerateBlurb();
      setBlurb(generated);
    } catch (e) {
      alert('Failed to generate blurb.');
    } finally {
      setIsGeneratingBlurb(false);
    }
  };

  const handleGenKeywords = async () => {
    setIsGeneratingKeywords(true);
    try {
      const ks = await onGenerateKeywords();
      setKeywords(ks);
    } catch (e) {
      alert('Failed to generate keywords.');
    } finally {
      setIsGeneratingKeywords(false);
    }
  };

  const handleGenCover = async () => {
    if (!coverPrompt.trim()) return;
    setIsGeneratingCover(true);
    try {
      await onGenerateCoverArt(coverPrompt.trim());
    } catch (e) {
      alert('Failed to generate cover art.');
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const toggleLocale = (code: string) => {
    setSelectedLocales((prev) =>
      prev.includes(code) ? prev.filter((locale) => locale !== code) : [...prev, code]
    );
  };

  const retailerOptions: RetailerFilter[] = ['Amazon KDP', 'Apple Books', 'Kobo Writing Life', 'Google Play Books'];
  const primaryProject = selectedProject || projects[0] || null;
  const audioPreviewUrl = primaryProject?.outputs
    ?.flatMap((output) => output.formats)
    .find((format) => format.fileUrl)?.fileUrl;
  const marketingPreview = primaryProject?.marketing?.assets?.[0] || null;
  const formatCurrency = useCallback((value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value), []);

  const activeRetailerRequirements = useMemo(
    () => retailerRequirements.filter((req) => req.retailer === selectedRetailer),
    [retailerRequirements, selectedRetailer]
  );

  const latestSubmission = retailerSubmissions.find(
    (submission) => submission.retailer === selectedRetailer
  );

  const getRequirementStatus = useCallback(
    (requirementId: string): 'ready' | 'pending' => {
      switch (requirementId) {
        case 'kdp-keywords':
          return keywords.length >= 7 ? 'ready' : 'pending';
        case 'kdp-cover':
          return coverArt ? 'ready' : 'pending';
        case 'apple-epub':
          return manuscript.trim().length > 1000 ? 'ready' : 'pending';
        case 'kobo-localization':
          return localizationPacks.length > 0 ? 'ready' : 'pending';
        default:
          return 'pending';
      }
    },
    [keywords.length, coverArt, manuscript, localizationPacks.length]
  );

  const handleLocalizationClick = async () => {
    await onGenerateLocalizationPack(selectedLocales);
  };

  const handleMetadataClick = async () => {
    await onTranslateMetadata(selectedLocales);
  };

  const handleAssembleSubmission = async () => {
    setIsAssemblingSubmission(true);
    try {
      const submission = assembleRetailerSubmission(selectedRetailer, {
        manuscript,
        blurb,
        keywords,
        coverArt,
        localizationPacks,
        localizedMetadata,
      });
      setRetailerSubmissions((prev) => [submission, ...prev.filter((entry) => entry.retailer !== selectedRetailer)].slice(0, 5));
    } finally {
      setIsAssemblingSubmission(false);
    }
  };

  const launchTasks = useMemo(
    () => {
      const localeTarget = selectedLocales.length || 1;
      return [
        { id: 'blurb', label: 'Compelling blurb', complete: Boolean(blurb.trim()) },
        { id: 'keywords', label: 'Optimized keywords', complete: keywords.length >= 7 },
        { id: 'cover', label: 'Cover art locked', complete: Boolean(coverArt) },
        {
          id: 'localization',
          label: 'Localization packs',
          complete: localeTarget > 0 && localizationPacks.length >= localeTarget,
        },
        {
          id: 'metadata',
          label: 'Localized metadata',
          complete: localeTarget > 0 && localizedMetadata.length >= localeTarget,
        },
        {
          id: 'submission',
          label: 'Submission package',
          complete:
            !!latestSubmission && latestSubmission.assets.every((asset) => asset.status === 'ready'),
        },
      ];
    },
    [blurb, keywords.length, coverArt, localizationPacks.length, localizedMetadata.length, latestSubmission, selectedLocales.length],
  );

  const handleDownloadCover = () => {
    if (!coverArt) return;
    const link = document.createElement('a');
    link.href = coverArt;
    link.download = 'book-cover.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenKdp = () => {
    window.open('https://kdp.amazon.com/', '_blank', 'noopener,noreferrer');
  };

  const handleOpenIngramSpark = () => {
    window.open('https://myaccount.ingramspark.com/', '_blank', 'noopener,noreferrer');
  };

  const handleOpenDraft2Digital = () => {
    window.open('https://draft2digital.com/', '_blank', 'noopener,noreferrer');
  };

  const kdpChecklist = [
    'Manuscript exported as .docx/.epub/.pdf (final, proofed)',
    'Title, subtitle, and series information finalized',
    'Primary and secondary categories selected',
    '7 KDP keywords optimized and verified',
    'Book description (blurb) formatted for KDP',
    'Trim size, bleed, and margins confirmed for print (if applicable)',
    'Cover meets size/ratio and resolution requirements',
    'Pricing and royalty options selected',
    'Territories and rights confirmed',
  ];

  const wideChecklist = [
    'IngramSpark or similar account configured',
    'Print specs validated for non-Amazon printers',
    'Global pricing strategy set (USD, GBP, EUR, etc.)',
    'Metadata synchronized across platforms',
    'Returnability and discount terms chosen',
  ];

  const audiobookChecklist = [
    'Audio meets ACX / Audible technical requirements',
    'Chapter markers and file naming standardized',
    'Audiobook cover (2400x2400) prepared',
    'Narrator contracts/royalty shares documented',
  ];

  return (
    <div className="flex h-full bg-brand-bg text-brand-text">
      {/* Project Sidebar */}
      <aside className="w-60 border-r border-brand-border/70 bg-brand-surface/98 backdrop-blur-sm p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <BookUpIcon className="w-5 h-5 text-brand-primary" />
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
              Publishing Hub
            </h2>
            <p className="text-[10px] text-brand-text-muted">
              Select the project to publish.
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          {projects.length === 0 && (
            <p className="text-[10px] text-brand-text-muted">
              No audiobook projects yet. Create one from the Audiobooks view.
            </p>
          )}
          {projects.map((project) => {
            const isActive = project.id === selectedProjectId;
            return (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-[10px] transition-colors ${
                  isActive
                    ? 'bg-brand-primary/12 border-brand-primary/70 text-brand-primary shadow-sm'
                    : 'bg-brand-surface border-brand-border/40 text-brand-text-secondary hover:bg-brand-elevated hover:text-brand-primary'
                }`}
              >
                <div className="font-semibold truncate">
                  {project.title || 'Untitled Project'}
                </div>
                <div className="text-[9px] text-brand-text-muted mt-0.5">
                  {project.outputs?.[0]?.formats?.length || 0} outputs •{' '}
                  {project.distribution?.platforms?.length || 0} platforms
                </div>
              </button>
            );
          })}
        </div>
        <div className="pt-3 mt-3 border-t border-brand-border/60 space-y-1.5 text-[10px]">
          <div className="font-semibold text-brand-text-secondary uppercase tracking-wide">
            Quick Links
          </div>
          <button
            onClick={() => onExportManuscript('html')}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-brand-elevated text-brand-text-secondary"
          >
            <SaveIcon className="w-3.5 h-3.5" />
            <span>Export Manuscript (HTML)</span>
          </button>
          <button
            onClick={() => onExportManuscript('txt')}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-brand-elevated text-brand-text-secondary"
          >
            <SaveIcon className="w-3.5 h-3.5" />
            <span>Export Manuscript (TXT)</span>
          </button>
          <button
            onClick={handleOpenKdp}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-green-600/10 text-green-600"
          >
            <SaveIcon className="w-3.5 h-3.5" />
            <span>Open Amazon KDP</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-3 border-b border-brand-border/80 bg-brand-surface/98 backdrop-blur-sm flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <BookUpIcon className="w-5 h-5 text-brand-primary" />
              Unified Publishing Pipeline
            </h1>
            <p className="text-[11px] text-brand-text-secondary">
              Prep metadata, cover, formats, and checklists in one place before going live.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onOpenDistributionSuite}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-brand-elevated text-[10px] text-brand-text-secondary hover:bg-brand-primary/10 hover:text-brand-primary border border-brand-border/60"
            >
              <SaveIcon className="w-3.5 h-3.5" />
              Distribution Suite
            </button>
            <button
              onClick={onOpenMarketingSuite}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-brand-elevated text-[10px] text-brand-text-secondary hover:bg-brand-primary/10 hover:text-brand-primary border border-brand-border/60"
            >
              <MegaphoneIcon className="w-3.5 h-3.5" />
              Marketing Suite
            </button>
          </div>
        </header>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Column 1: Metadata & Blurb */}
          <section className="space-y-3 xl:col-span-1">
            <div className="bg-brand-surface/95 rounded-2xl border border-brand-border/80 p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                    Core Book Metadata
                  </h2>
                  <p className="text-[10px] text-brand-text-muted">
                    Title, author, and identifiers ready for KDP and wide.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 text-[10px]">
                <div>
                  <div className="text-[9px] uppercase text-brand-text-secondary">
                    Title
                  </div>
                  <div className="px-2 py-1.5 rounded-md bg-brand-bg border border-brand-border/70 text-brand-text">
                    {effectiveTitle}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-brand-text-secondary">
                    Author
                  </div>
                  <div className="px-2 py-1.5 rounded-md bg-brand-bg border border-brand-border/70 text-brand-text">
                    {effectiveAuthor}
                  </div>
                </div>
                {selectedProject?.outputs?.[0]?.metadata?.isbn && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="text-[9px] uppercase text-brand-text-secondary">
                        ISBN
                      </div>
                      <div className="px-2 py-1.5 rounded-md bg-brand-bg border border-brand-border/70 text-brand-text">
                        {selectedProject.outputs[0].metadata.isbn}
                      </div>
                    </div>
                    {selectedProject.outputs[0].metadata.asin && (
                      <div className="flex-1">
                        <div className="text-[9px] uppercase text-brand-text-secondary">
                          ASIN
                        </div>
                        <div className="px-2 py-1.5 rounded-md bg-brand-bg border border-brand-border/70 text-brand-text">
                          {selectedProject.outputs[0].metadata.asin}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-brand-surface/95 rounded-2xl border border-brand-border/80 p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                    Book Description (KDP-Ready)
                  </h3>
                  <p className="text-[9px] text-brand-text-muted">
                    Generate and refine a strong sales blurb from your manuscript.
                  </p>
                </div>
                <div className="flex gap-1.5 items-center">
                  <CopyButton textToCopy={blurb} size="xs" />
                  <button
                    onClick={handleGenBlurb}
                    disabled={isGeneratingBlurb || !manuscript}
                    className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-brand-primary/12 text-[9px] text-brand-primary border border-brand-primary/40 hover:bg-brand-primary/20 disabled:opacity-40"
                  >
                    <SparklesIcon className="w-3 h-3" />
                    {isGeneratingBlurb ? (
                      <>
                        <LoadingSpinner />
                        <span>Working</span>
                      </>
                    ) : (
                      <span>Generate</span>
                    )}
                  </button>
                </div>
              </div>
              <textarea
                className="w-full h-32 resize-none px-2 py-1.5 text-[10px] bg-brand-bg border border-brand-border/70 rounded-md text-brand-text"
                placeholder="Your sales-optimized description will appear here..."
                value={blurb}
                onChange={(e) => setBlurb(e.target.value)}
              />
              <p className="text-[8px] text-brand-text-muted">
                Tip: You can paste this directly into KDP’s book description field
                (supports basic HTML formatting).
              </p>
            </div>

            <div className="bg-brand-surface/95 rounded-2xl border border-brand-border/80 p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                    Keyword Strategy
                  </h3>
                  <p className="text-[9px] text-brand-text-muted">
                    Generate 7+ search-optimized keywords for KDP and retailers.
                  </p>
                </div>
                <div className="flex gap-1.5 items-center">
                  <CopyButton
                    textToCopy={keywords.join(', ')}
                    size="xs"
                  />
                  <button
                    onClick={handleGenKeywords}
                    disabled={isGeneratingKeywords || !manuscript}
                    className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-brand-primary/12 text-[9px] text-brand-primary border border-brand-primary/40 hover:bg-brand-primary/20 disabled:opacity-40"
                  >
                    <SparklesIcon className="w-3 h-3" />
                    {isGeneratingKeywords ? (
                      <>
                        <LoadingSpinner />
                        <span>Working</span>
                      </>
                    ) : (
                      <span>Generate</span>
                    )}
                  </button>
                </div>
              </div>
              <div className="min-h-[40px] flex flex-wrap gap-1.5">
                {keywords.length === 0 && !isGeneratingKeywords && (
                  <span className="text-[9px] text-brand-text-muted">
                    No keywords yet. Click Generate to propose a set.
                  </span>
                )}
                {keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[9px]"
                  >
                    {kw}
                  </span>
                ))}
                {isGeneratingKeywords && (
                  <div className="flex items-center gap-1 text-[9px] text-brand-primary">
                    <LoadingSpinner />
                    <span>Generating keyword set...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-brand-surface/95 rounded-2xl border border-brand-border/80 p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                    Localization & Metadata
                  </h3>
                  <p className="text-[9px] text-brand-text-muted">
                    Pick locales to localize blurbs, hooks, and retailer metadata.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                {LOCALE_OPTIONS.map((option) => (
                  <label
                    key={option.code}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-md border text-[9px] cursor-pointer ${
                      selectedLocales.includes(option.code)
                        ? 'bg-brand-primary/10 border-brand-primary/60 text-brand-primary'
                        : 'bg-brand-bg border-brand-border/60 text-brand-text-secondary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLocales.includes(option.code)}
                      onChange={() => toggleLocale(option.code)}
                      className="accent-brand-primary"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                <button
                  onClick={handleLocalizationClick}
                  disabled={isGeneratingLocalizationPack || selectedLocales.length === 0}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-brand-primary text-white font-semibold disabled:opacity-40"
                >
                  {isGeneratingLocalizationPack ? (
                    <>
                      <LoadingSpinner />
                      <span>Generating…</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-3 h-3" />
                      <span>Localization Pack</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleMetadataClick}
                  disabled={isGeneratingLocalizedMetadata || selectedLocales.length === 0}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-brand-elevated border border-brand-border/70 text-brand-text-secondary hover:text-brand-primary disabled:opacity-40"
                >
                  {isGeneratingLocalizedMetadata ? (
                    <>
                      <LoadingSpinner />
                      <span>Translating…</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-3 h-3" />
                      <span>Metadata Pack</span>
                    </>
                  )}
                </button>
              </div>
              {(localizationPacks.length > 0 || localizedMetadata.length > 0) && (
                <div className="space-y-3 text-[9px]">
                  {localizationPacks.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-brand-text">
                        <span>Localized Hooks</span>
                        <CopyButton
                          textToCopy={localizationPacks
                            .map((pack) => `${pack.locale}: ${pack.localizedTitle}\n${pack.hook}\n${pack.blurb}`)
                            .join('\n\n')}
                        />
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {localizationPacks.map((pack) => (
                          <div key={pack.locale} className="border border-brand-border/50 rounded-lg p-2">
                            <div className="flex items-center justify-between text-[9px] font-semibold">
                              <span>{pack.locale}</span>
                              <span className="text-brand-text-secondary">{pack.localizedTitle}</span>
                            </div>
                            <p className="text-brand-primary text-[9px]">{pack.hook}</p>
                            <p className="text-brand-text-muted leading-snug">{pack.blurb}</p>
                            <p className="text-[8px] text-brand-text-muted mt-1">Tone notes: {pack.toneNotes}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {localizedMetadata.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-brand-text">
                        <span>Localized Metadata</span>
                        <CopyButton
                          textToCopy={localizedMetadata
                            .map((entry) => `${entry.locale}: keywords=${entry.keywords.join(', ')} | categories=${entry.categories.join(', ')} | audience=${entry.audienceNotes}`)
                            .join('\n')}
                        />
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {localizedMetadata.map((entry) => (
                          <div key={entry.locale} className="border border-brand-border/50 rounded-lg p-2">
                            <div className="flex items-center justify-between text-[9px] font-semibold">
                              <span>{entry.locale}</span>
                              <span className="text-brand-text-secondary">Metadata</span>
                            </div>
                            <p className="text-brand-text">Keywords: {entry.keywords.join(', ')}</p>
                            <p className="text-brand-text-secondary">Categories: {entry.categories.join(', ')}</p>
                            <p className="text-[8px] text-brand-text-muted">Audience: {entry.audienceNotes}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="bg-brand-surface/95 rounded-2xl border border-brand-border/80 p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                    Cost & Timeline Planner
                  </h3>
                  <p className="text-[9px] text-brand-text-muted">Estimate production spend for each tier.</p>
                </div>
                <select
                  value={selectedCostTier}
                  onChange={(e) => setSelectedCostTier(e.target.value as 'starter' | 'professional' | 'cinematic')}
                  className="text-[10px] px-2 py-1 rounded-md border border-brand-border/60 bg-brand-bg"
                >
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="cinematic">Cinematic</option>
                </select>
              </div>
              <button
                onClick={() => onGenerateCostPlan(selectedCostTier)}
                disabled={isGeneratingCostPlan}
                className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-lg bg-brand-primary text-white hover:bg-brand-primary-hover disabled:opacity-40"
              >
                {isGeneratingCostPlan ? 'Estimating…' : 'Estimate Budget'}
              </button>
              {costPlan ? (
                <div className="space-y-2 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-text-secondary">Total budget</span>
                    <span className="font-semibold text-brand-text">{formatCurrency(costPlan.totalBudget)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-text-secondary">Timeline</span>
                    <span className="font-semibold text-brand-text">{costPlan.estimatedTimeline}</span>
                  </div>
                  <p className="text-brand-text text-xs leading-snug">{costPlan.summary}</p>
                  <div className="space-y-1">
                    {costPlan.costBreakdown.slice(0, 4).map((line) => (
                      <div key={line.label} className="flex items-center justify-between text-brand-text-secondary">
                        <span>{line.label}</span>
                        <span>{formatCurrency(line.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-brand-text-secondary">
                    {costPlan.notes.slice(0, 3).map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-[9px] text-brand-text-muted">Run an estimate to see budget + schedule guidance.</p>
              )}
            </div>
          </section>

          {/* Column 2: Cover & Export */}
          <section className="space-y-3 xl:col-span-1">
            <div className="bg-brand-surface/95 rounded-2xl border border-brand-border/80 p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-brand-primary" />
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                      Cover Art Studio
                    </h3>
                    <p className="text-[9px] text-brand-text-muted">
                      Generate or refine a KDP-compliant cover.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-24 h-32 rounded-md border border-brand-border/70 bg-brand-bg flex items-center justify-center relative overflow-hidden">
                  {isGeneratingCover && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <LoadingSpinner />
                    </div>
                  )}
                  {coverArt ? (
                    <img
                      src={coverArt}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-brand-text-secondary" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <textarea
                    className="w-full h-16 resize-none px-2 py-1.5 text-[9px] bg-brand-bg border border-brand-border/70 rounded-md text-brand-text"
                    placeholder="Describe the visual concept for your cover (style, setting, mood, character)..."
                    value={coverPrompt}
                    onChange={(e) => setCoverPrompt(e.target.value)}
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleGenCover}
                      disabled={
                        isGeneratingCover || !coverPrompt.trim()
                      }
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-brand-primary text-white text-[9px] font-semibold hover:bg-brand-primary-hover disabled:opacity-40"
                    >
                      <SparklesIcon className="w-3.5 h-3.5" />
                      {isGeneratingCover ? 'Generating...' : 'Generate Cover'}
                    </button>
                    <button
                      onClick={() => coverArt && onOpenImageEditor(coverArt)}
                      disabled={!coverArt}
                      className="px-2 py-1.5 rounded-md bg-brand-elevated text-[9px] text-brand-text-secondary border border-brand-border/70 hover:bg-brand-bg disabled:opacity-30"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDownloadCover}
                      disabled={!coverArt}
                      className="px-2 py-1.5 rounded-md bg-brand-elevated text-[9px] text-brand-text-secondary border border-brand-border/70 hover:bg-brand-bg disabled:opacity-30"
                    >
                      Download
                    </button>
                  </div>
                  <p className="text-[8px] text-brand-text-muted">
                    KDP print: front+back+spine PDF. For now, export hero art
                    and assemble full wrap externally.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-brand-surface/95 rounded-2xl border border-brand-border/80 p-3 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <SaveIcon className="w-3.5 h-3.5 text-brand-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                  Export Formats
                </h3>
              </div>
              <p className="text-[9px] text-brand-text-muted mb-1">
                Quickly export your manuscript in formats ready for upload.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <button
                  onClick={() => onExportManuscript('html')}
                  className="flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-brand-bg border border-brand-border/70 hover:bg-brand-primary/10 hover:border-brand-primary/50"
                >
                  <span>KDP / Web (HTML)</span>
                  <span className="text-brand-primary text-[8px]">
                    Export
                  </span>
                </button>
                <button
                  onClick={() => onExportManuscript('txt')}
                  className="flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-brand-bg border border-brand-border/70 hover:bg-brand-primary/10 hover:border-brand-primary/50"
                >
                  <span>Clean Manuscript (.txt)</span>
                  <span className="text-brand-primary text-[8px]">
                    Export
                  </span>
                </button>
              </div>
              <p className="text-[8px] text-brand-text-muted mt-1">
                Use the dedicated Format Output and Distribution views for
                full audio/format orchestration. This panel focuses on core
                publishing assets.
              </p>
            </div>
            <div className="bg-brand-surface/95 rounded-2xl border border-brand-border/80 p-3 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5">
                <MegaphoneIcon className="w-3.5 h-3.5 text-brand-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                  Marketing & Audio Preview
                </h3>
              </div>
              <div className="space-y-2">
                <div className="rounded-lg border border-brand-border/60 p-2">
                  <p className="text-[10px] font-semibold text-brand-text mb-1">Audio teaser</p>
                  {audioPreviewUrl ? (
                    <audio controls className="w-full" src={audioPreviewUrl}>
                      Your browser does not support audio playback.
                    </audio>
                  ) : (
                    <p className="text-[9px] text-brand-text-muted">No audio preview attached to this project yet.</p>
                  )}
                </div>
                <div className="rounded-lg border border-brand-border/60 p-2">
                  <p className="text-[10px] font-semibold text-brand-text mb-1">Hero marketing asset</p>
                  {marketingPreview ? (
                    marketingPreview.type === 'waveform-video' || marketingPreview.type === 'trailer' ? (
                      <video controls className="w-full rounded" src={marketingPreview.assetUrl}/>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[9px] text-brand-text-secondary">{marketingPreview.title}</p>
                        <a
                          href={marketingPreview.assetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-primary text-[9px] underline"
                        >
                          Open asset
                        </a>
                      </div>
                    )
                  ) : (
                    <p className="text-[9px] text-brand-text-muted">Generate marketing assets to preview them here.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Column 3: Checklists & Actions */}
          <section className="space-y-3 xl:col-span-1">
            <div className="bg-brand-surface/95 rounded-2xl border border-brand-border/80 p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                    Retailer Requirements
                  </h3>
                  <p className="text-[9px] text-brand-text-muted">
                    Track what each retailer expects before upload.
                  </p>
                </div>
                <select
                  className="text-[9px] px-2 py-1 rounded-md border border-brand-border/60 bg-brand-bg"
                  value={selectedRetailer}
                  onChange={(e) => setSelectedRetailer(e.target.value as RetailerFilter)}
                >
                  {retailerOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 text-[9px]">
                {activeRetailerRequirements.length === 0 && (
                  <p className="text-brand-text-muted">
                    No requirements configured yet.
                  </p>
                )}
                {activeRetailerRequirements.map((req) => {
                  const status = getRequirementStatus(req.id);
                  return (
                    <div key={req.id} className="flex items-start gap-1.5">
                      <span
                        className={`mt-1 w-2 h-2 rounded-full ${
                          status === 'ready' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <div>
                        <p className="font-semibold text-brand-text">
                          {req.category}
                        </p>
                        <p className="text-brand-text-muted leading-snug">
                          {req.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={handleAssembleSubmission}
                disabled={isAssemblingSubmission}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.75 rounded-lg bg-brand-primary text-white text-[9px] font-semibold hover:bg-brand-primary-hover disabled:opacity-40"
              >
                {isAssemblingSubmission ? (
                  <>
                    <LoadingSpinner />
                    <span>Preparing Package…</span>
                  </>
                ) : (
                  <>
                    <SaveIcon className="w-3.5 h-3.5" />
                    <span>Assemble Submission</span>
                  </>
                )}
              </button>
              {latestSubmission && (
                <div className="border border-brand-border/60 rounded-lg p-2 text-[9px] space-y-1">
                  <div className="flex items-center justify-between text-[8px] text-brand-text-muted">
                    <span>Last built</span>
                    <span>
                      {new Date(latestSubmission.generatedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="space-y-0.5 max-h-28 overflow-y-auto pr-1">
                    {latestSubmission.assets.map((asset) => (
                      <div key={asset.label} className="flex items-center justify-between">
                        <span>{asset.label}</span>
                        <span
                          className={
                            asset.status === 'ready'
                              ? 'text-emerald-500 font-semibold'
                              : 'text-amber-500 font-semibold'
                          }
                        >
                          {asset.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[8px] text-brand-text-muted leading-snug">
                    {latestSubmission.priorityNotes}
                  </p>
                </div>
              )}
            </div>
            <div className="bg-brand-surface/95 rounded-2xl border border-brand-border/80 p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                    Launch Board
                  </h3>
                  <p className="text-[9px] text-brand-text-muted">Auto-completes as assets are generated.</p>
                </div>
                <span className="text-[10px] text-brand-text-secondary">
                  {launchTasks.filter((task) => task.complete).length}/{launchTasks.length} ready
                </span>
              </div>
              <div className="space-y-1.5">
                {launchTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-[10px] ${
                      task.complete
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100'
                        : 'border-brand-border/60 text-brand-text'
                    }`}
                  >
                    <span>{task.label}</span>
                    <span>{task.complete ? 'Ready' : 'Pending'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-brand-surface/95 rounded-2xl border border-brand-border/80 p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <SaveIcon className="w-3.5 h-3.5 text-brand-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                    Launch Checklist
                  </h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveChecklistTab('kdp')}
                    className={`px-2 py-0.5 rounded-full text-[8px] border ${
                      activeChecklistTab === 'kdp'
                        ? 'bg-brand-primary/14 text-brand-primary border-brand-primary/70'
                        : 'bg-transparent text-brand-text-muted border-brand-border/40'
                    }`}
                  >
                    KDP
                  </button>
                  <button
                    onClick={() => setActiveChecklistTab('wide')}
                    className={`px-2 py-0.5 rounded-full text-[8px] border ${
                      activeChecklistTab === 'wide'
                        ? 'bg-brand-primary/14 text-brand-primary border-brand-primary/70'
                        : 'bg-transparent text-brand-text-muted border-brand-border/40'
                    }`}
                  >
                    Wide
                  </button>
                  <button
                    onClick={() => setActiveChecklistTab('audiobook')}
                    className={`px-2 py-0.5 rounded-full text-[8px] border ${
                      activeChecklistTab === 'audiobook'
                        ? 'bg-brand-primary/14 text-brand-primary border-brand-primary/70'
                        : 'bg-transparent text-brand-text-muted border-brand-border/40'
                    }`}
                  >
                    Audio
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {(activeChecklistTab === 'kdp' ? kdpChecklist : activeChecklistTab === 'wide' ? wideChecklist : audiobookChecklist).map(
                  (item, idx) => (
                    <div
                      key={`${activeChecklistTab}-${idx}`}
                      className="flex items-start gap-1.5 text-[9px]"
                    >
                      <div className="mt-0.5 w-2 h-2 rounded-full bg-brand-primary/40" />
                      <p className="text-brand-text">{item}</p>
                    </div>
                  )
                )}
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                {activeChecklistTab === 'kdp' && (
                  <button
                    onClick={handleOpenKdp}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.75 rounded-lg bg-green-600 text-white text-[9px] font-semibold hover:bg-green-500"
                  >
                    <SaveIcon className="w-3.5 h-3.5" />
                    Go to Amazon KDP
                  </button>
                )}
                {activeChecklistTab === 'wide' && (
                  <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                    <button
                      onClick={handleOpenIngramSpark}
                      className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-brand-bg border border-brand-border/70 hover:bg-brand-primary/10 hover:border-brand-primary/60"
                    >
                      <SaveIcon className="w-3 h-3" />
                      IngramSpark
                    </button>
                    <button
                      onClick={handleOpenDraft2Digital}
                      className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-brand-bg border border-brand-border/70 hover:bg-brand-primary/10 hover:border-brand-primary/60"
                    >
                      <SaveIcon className="w-3 h-3" />
                      Draft2Digital
                    </button>
                  </div>
                )}
                {activeChecklistTab === 'audiobook' && (
                  <p className="text-[8px] text-brand-text-muted">
                    Manage detailed audio distribution, royalty, and QC from
                    the Audiobook and Distribution views.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-brand-surface/95 rounded-2xl border border-brand-border/80 p-3 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5">
                <MegaphoneIcon className="w-3.5 h-3.5 text-brand-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                  Orchestrated Actions
                </h3>
              </div>
              <p className="text-[9px] text-brand-text-muted">
                Jump directly into deeper tools using your prepared assets.
              </p>
              <div className="space-y-1.5 text-[9px]">
                <button
                  onClick={onOpenMarketingSuite}
                  className="w-full flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg bg-brand-bg border border-brand-border/70 hover:border-brand-primary/60 hover:bg-brand-primary/8"
                >
                  <span>Open Marketing Campaign Workspace</span>
                  <MegaphoneIcon className="w-3 h-3 text-brand-primary" />
                </button>
                <button
                  onClick={onOpenDistributionSuite}
                  className="w-full flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg bg-brand-bg border border-brand-border/70 hover:border-brand-primary/60 hover:bg-brand-primary/8"
                >
                  <span>Configure Wide & Audio Distribution</span>
                  <SaveIcon className="w-3 h-3 text-brand-primary" />
                </button>
              </div>
              <p className="text-[8px] text-brand-text-muted">
                This Publishing Hub is a single control surface. Use it to
                confirm you're launch-ready before committing to live
                uploads.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
