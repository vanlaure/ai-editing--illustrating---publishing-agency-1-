import { LocalizationPack, LocalizedMetadata, RetailerRequirement, RetailerSubmission, SubmissionAsset } from '../types';

const BASE_REQUIREMENTS: RetailerRequirement[] = [
  {
    id: 'kdp-keywords',
    retailer: 'Amazon KDP',
    category: 'Metadata',
    detail: 'Provide 7 carefully researched keywords and 2 BISAC categories.',
    status: 'pending',
  },
  {
    id: 'kdp-cover',
    retailer: 'Amazon KDP',
    category: 'Cover',
    detail: 'Front cover JPEG (2560px tall) and full wrap PDF for print titles.',
    status: 'pending',
  },
  {
    id: 'apple-epub',
    retailer: 'Apple Books',
    category: 'Manuscript',
    detail: 'Validated EPUB 3 file with embedded fonts and TOC.',
    status: 'pending',
  },
  {
    id: 'kobo-localization',
    retailer: 'Kobo Writing Life',
    category: 'Metadata',
    detail: 'Localized description + pricing per territory.',
    status: 'pending',
  },
  {
    id: 'google-audio',
    retailer: 'Google Play Books',
    category: 'Audio',
    detail: '24-bit WAV masters with chapterized metadata.',
    status: 'pending',
  },
];

export const fetchRetailerRequirements = (): RetailerRequirement[] =>
  BASE_REQUIREMENTS.map((req) => ({ ...req }));

type SubmissionContext = {
  manuscript: string;
  blurb: string;
  keywords: string[];
  coverArt?: string | null;
  localizationPacks?: LocalizationPack[];
  localizedMetadata?: LocalizedMetadata[];
};

const buildAsset = (label: string, ready: boolean, notes: string): SubmissionAsset => ({
  label,
  status: ready ? 'ready' : 'missing',
  notes,
});

export const assembleRetailerSubmission = (
  retailer: string,
  context: SubmissionContext,
): RetailerSubmission => {
  const assets: SubmissionAsset[] = [
    buildAsset('Manuscript (docx/epub)', context.manuscript.trim().length > 500, 'Export from the editor as DOCX/EPUB.'),
    buildAsset('Sales blurb', context.blurb.trim().length > 0, 'KDP + wide retailers require 150-400 words.'),
    buildAsset('Keyword set', context.keywords.length >= 7, 'Target long-tail + niche genre phrases.'),
    buildAsset('Cover art package', Boolean(context.coverArt), 'Needs 2560x1600 JPEG and 300dpi print PDF.'),
    buildAsset(
      'Localized copy',
      (context.localizationPacks?.length || 0) > 0,
      'Provide localized blurbs for non-English retailers.',
    ),
    buildAsset(
      'Localized metadata',
      (context.localizedMetadata?.length || 0) > 0,
      'Territory-specific keywords/categories ready to upload.',
    ),
  ];

  const missingAssets = assets.filter((asset) => asset.status === 'missing');

  return {
    retailer,
    generatedAt: new Date().toISOString(),
    assets,
    priorityNotes:
      missingAssets.length === 0
        ? 'All core assets are ready for upload.'
        : `Need ${missingAssets.length} more asset${missingAssets.length === 1 ? '' : 's'}: ${missingAssets
            .map((asset) => asset.label)
            .join(', ')}`,
  };
};
