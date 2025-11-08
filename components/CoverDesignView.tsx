import React, { useState } from 'react';
import type { CoverDesign, TypographyDesign } from '../types';

type CoverDesignTab = 'hero-image' | 'full-jacket' | 'typography' | 'marketing';

interface CoverDesignViewProps {
  covers: CoverDesign[];
  onGenerateHeroImage: (title: string, description: string, genre: string) => Promise<void>;
  onGenerateFullJacket: (coverId: string, title: string, author: string, blurb: string) => Promise<void>;
  onCreateTypography: (coverId: string, typography: TypographyDesign) => Promise<void>;
  onGenerateMarketingGraphic: (coverId: string, platform: string, format: string) => Promise<void>;
  onDeleteCover: (id: string) => void;
}

export const CoverDesignView: React.FC<CoverDesignViewProps> = ({
  covers,
  onGenerateHeroImage,
  onGenerateFullJacket,
  onCreateTypography,
  onGenerateMarketingGraphic,
  onDeleteCover,
}) => {
  const [activeTab, setActiveTab] = useState<CoverDesignTab>('hero-image');
  const [isGenerating, setIsGenerating] = useState(false);

  // Hero Image state
  const [heroTitle, setHeroTitle] = useState('');
  const [heroDescription, setHeroDescription] = useState('');
  const [heroGenre, setHeroGenre] = useState('');

  // Full Jacket state
  const [selectedCoverId, setSelectedCoverId] = useState('');
  const [jacketTitle, setJacketTitle] = useState('');
  const [jacketAuthor, setJacketAuthor] = useState('');
  const [jacketBlurb, setJacketBlurb] = useState('');

  // Typography state
  const [typoCoverId, setTypoCoverId] = useState('');
  const [titleFont, setTitleFont] = useState('');
  const [titleStyle, setTitleStyle] = useState('');
  const [authorFont, setAuthorFont] = useState('');
  const [colorScheme, setColorScheme] = useState<string[]>(['#000000', '#FFFFFF']);

  // Marketing state
  const [marketingCoverId, setMarketingCoverId] = useState('');
  const [marketingPlatform, setMarketingPlatform] = useState('');
  const [marketingFormat, setMarketingFormat] = useState('');

  const handleGenerateHeroImage = async () => {
    if (!heroTitle || !heroDescription) return;
    setIsGenerating(true);
    try {
      await onGenerateHeroImage(heroTitle, heroDescription, heroGenre);
      setHeroTitle('');
      setHeroDescription('');
      setHeroGenre('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFullJacket = async () => {
    if (!selectedCoverId || !jacketTitle || !jacketAuthor) return;
    setIsGenerating(true);
    try {
      await onGenerateFullJacket(selectedCoverId, jacketTitle, jacketAuthor, jacketBlurb);
      setJacketTitle('');
      setJacketAuthor('');
      setJacketBlurb('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateTypography = async () => {
    if (!typoCoverId || !titleFont || !authorFont) return;
    setIsGenerating(true);
    try {
      const typography: TypographyDesign = {
        titleFont,
        titleStyle,
        authorFont,
        colorScheme,
      };
      await onCreateTypography(typoCoverId, typography);
      setTitleFont('');
      setTitleStyle('');
      setAuthorFont('');
      setColorScheme(['#000000', '#FFFFFF']);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMarketing = async () => {
    if (!marketingCoverId || !marketingPlatform || !marketingFormat) return;
    setIsGenerating(true);
    try {
      await onGenerateMarketingGraphic(marketingCoverId, marketingPlatform, marketingFormat);
    } finally {
      setIsGenerating(false);
    }
  };

  const genreOptions = [
    'Fantasy', 'Science Fiction', 'Romance', 'Mystery', 'Thriller',
    'Horror', 'Literary Fiction', 'Historical Fiction', 'Young Adult', 'Non-Fiction'
  ];

  const platformOptions = [
    { value: 'instagram-post', label: 'Instagram Post (1:1)' },
    { value: 'instagram-story', label: 'Instagram Story (9:16)' },
    { value: 'facebook-post', label: 'Facebook Post' },
    { value: 'twitter-header', label: 'Twitter/X Header' },
    { value: 'tiktok', label: 'TikTok (9:16)' },
    { value: 'youtube-thumbnail', label: 'YouTube Thumbnail' },
  ];

  const formatOptions = [
    { value: 'teaser', label: 'Teaser/Quote' },
    { value: 'character-intro', label: 'Character Introduction' },
    { value: 'release-announcement', label: 'Release Announcement' },
    { value: 'review-share', label: 'Review Share' },
  ];

  return (
    <div className="h-full flex flex-col bg-brand-bg">
      {/* Tab Navigation */}
      <div className="border-b border-brand-border bg-brand-surface">
        <div className="flex space-x-1 px-4">
          <button
            onClick={() => setActiveTab('hero-image')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'hero-image'
                ? 'border-b-2 border-brand-primary text-brand-primary'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            📸 Hero Image
          </button>
          <button
            onClick={() => setActiveTab('full-jacket')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'full-jacket'
                ? 'border-b-2 border-brand-primary text-brand-primary'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            📕 Full Jacket
          </button>
          <button
            onClick={() => setActiveTab('typography')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'typography'
                ? 'border-b-2 border-brand-primary text-brand-primary'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            🔤 Typography
          </button>
          <button
            onClick={() => setActiveTab('marketing')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'marketing'
                ? 'border-b-2 border-brand-primary text-brand-primary'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            📱 Marketing Graphics
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Hero Image Tab */}
        {activeTab === 'hero-image' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid xl:grid-cols-2 gap-6">
              {/* Hero Image Creation Panel */}
              <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Create Hero Image</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Book Title
                  </label>
                  <input
                    type="text"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="e.g., The Crystal Prophecy"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Genre
                  </label>
                  <select
                    value={heroGenre}
                    onChange={(e) => setHeroGenre(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="">Select Genre</option>
                    {genreOptions.map((genre) => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Cover Description
                  </label>
                  <textarea
                    value={heroDescription}
                    onChange={(e) => setHeroDescription(e.target.value)}
                    placeholder="Describe the imagery, mood, key visual elements, colors, and composition..."
                    rows={6}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                </div>

                <button
                  onClick={handleGenerateHeroImage}
                  disabled={isGenerating || !heroTitle || !heroDescription}
                  className="w-full px-4 py-2 bg-brand-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {isGenerating ? 'Generating Hero Image...' : 'Generate Hero Image'}
                </button>

                <div className="mt-4 p-3 bg-brand-bg rounded border border-brand-border">
                  <p className="text-xs text-brand-text-secondary">
                    <strong>Tip:</strong> Hero images should be high-resolution (300+ DPI) and work well as standalone cover centerpieces.
                  </p>
                </div>
              </div>

              {/* Cover Gallery */}
              <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
                  Covers ({covers.length})
                </h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {covers.length === 0 ? (
                    <p className="text-brand-text-secondary text-sm text-center py-8">
                      No covers created yet. Generate your first cover!
                    </p>
                  ) : (
                    covers.map((cover) => (
                      <div
                        key={cover.id}
                        className="bg-brand-bg rounded-lg border border-brand-border p-4 hover:border-brand-primary transition-colors"
                      >
                        {cover.heroImageUrl && (
                          <img
                            src={cover.heroImageUrl}
                            alt={cover.title}
                            className="w-full h-48 object-cover rounded mb-3"
                          />
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-brand-text-primary">{cover.title}</h4>
                          <button
                            onClick={() => onDeleteCover(cover.id)}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                        {cover.typography && (
                          <div className="text-xs text-brand-text-secondary mt-2">
                            <div>Title: {cover.typography.titleFont}</div>
                            <div>Author: {cover.typography.authorFont}</div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Jacket Tab */}
        {activeTab === 'full-jacket' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
              <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Create Full Jacket Spread</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Select Base Cover
                </label>
                <select
                  value={selectedCoverId}
                  onChange={(e) => setSelectedCoverId(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">Choose a cover...</option>
                  {covers.map((cover) => (
                    <option key={cover.id} value={cover.id}>{cover.title}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Book Title
                </label>
                <input
                  type="text"
                  value={jacketTitle}
                  onChange={(e) => setJacketTitle(e.target.value)}
                  placeholder="Full book title"
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Author Name
                </label>
                <input
                  type="text"
                  value={jacketAuthor}
                  onChange={(e) => setJacketAuthor(e.target.value)}
                  placeholder="Author name"
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Back Cover Blurb
                </label>
                <textarea
                  value={jacketBlurb}
                  onChange={(e) => setJacketBlurb(e.target.value)}
                  placeholder="Back cover description, reviews, bio..."
                  rows={5}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                />
              </div>

              <button
                onClick={handleGenerateFullJacket}
                disabled={isGenerating || !selectedCoverId || !jacketTitle || !jacketAuthor}
                className="w-full px-4 py-2 bg-brand-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isGenerating ? 'Generating Full Jacket...' : 'Generate Full Jacket'}
              </button>

              <div className="mt-4 p-3 bg-brand-bg rounded border border-brand-border">
                <p className="text-xs text-brand-text-secondary">
                  <strong>Note:</strong> Full jacket includes front cover, spine, and back cover with proper bleed, trim, and barcode placement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
              <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Typography Design</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Select Cover
                </label>
                <select
                  value={typoCoverId}
                  onChange={(e) => setTypoCoverId(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">Choose a cover...</option>
                  {covers.map((cover) => (
                    <option key={cover.id} value={cover.id}>{cover.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Title Font
                  </label>
                  <input
                    type="text"
                    value={titleFont}
                    onChange={(e) => setTitleFont(e.target.value)}
                    placeholder="e.g., Cinzel Bold"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Author Font
                  </label>
                  <input
                    type="text"
                    value={authorFont}
                    onChange={(e) => setAuthorFont(e.target.value)}
                    placeholder="e.g., Open Sans Regular"
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Title Style/Treatment
                </label>
                <input
                  type="text"
                  value={titleStyle}
                  onChange={(e) => setTitleStyle(e.target.value)}
                  placeholder="e.g., Gold foil, embossed, gradient overlay"
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Color Scheme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {colorScheme.map((color, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => {
                          const newScheme = [...colorScheme];
                          newScheme[index] = e.target.value;
                          setColorScheme(newScheme);
                        }}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => {
                          const newScheme = [...colorScheme];
                          newScheme[index] = e.target.value;
                          setColorScheme(newScheme);
                        }}
                        className="flex-1 px-2 py-1 text-sm bg-brand-bg border border-brand-border rounded text-brand-text-primary"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setColorScheme([...colorScheme, '#000000'])}
                  className="mt-2 text-sm text-brand-primary hover:underline"
                >
                  + Add Color
                </button>
              </div>

              <button
                onClick={handleCreateTypography}
                disabled={isGenerating || !typoCoverId || !titleFont || !authorFont}
                className="w-full px-4 py-2 bg-brand-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isGenerating ? 'Saving Typography...' : 'Save Typography Design'}
              </button>
            </div>
          </div>
        )}

        {/* Marketing Graphics Tab */}
        {activeTab === 'marketing' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-brand-surface rounded-lg border border-brand-border p-6">
              <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Generate Marketing Graphics</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Select Cover
                </label>
                <select
                  value={marketingCoverId}
                  onChange={(e) => setMarketingCoverId(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">Choose a cover...</option>
                  {covers.map((cover) => (
                    <option key={cover.id} value={cover.id}>{cover.title}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Platform & Size
                </label>
                <select
                  value={marketingPlatform}
                  onChange={(e) => setMarketingPlatform(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">Select platform...</option>
                  {platformOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Graphic Type
                </label>
                <select
                  value={marketingFormat}
                  onChange={(e) => setMarketingFormat(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">Select type...</option>
                  {formatOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGenerateMarketing}
                disabled={isGenerating || !marketingCoverId || !marketingPlatform || !marketingFormat}
                className="w-full px-4 py-2 bg-brand-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isGenerating ? 'Generating Graphic...' : 'Generate Marketing Graphic'}
              </button>

              <div className="mt-6 p-4 bg-brand-bg rounded border border-brand-border">
                <h4 className="text-sm font-medium text-brand-text-primary mb-2">Quick Templates</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setMarketingPlatform('instagram-post');
                      setMarketingFormat('teaser');
                    }}
                    className="px-3 py-2 text-xs bg-brand-surface border border-brand-border rounded hover:border-brand-primary transition-colors text-left"
                  >
                    📸 Instagram Teaser
                  </button>
                  <button
                    onClick={() => {
                      setMarketingPlatform('instagram-story');
                      setMarketingFormat('character-intro');
                    }}
                    className="px-3 py-2 text-xs bg-brand-surface border border-brand-border rounded hover:border-brand-primary transition-colors text-left"
                  >
                    📱 Story Character Card
                  </button>
                  <button
                    onClick={() => {
                      setMarketingPlatform('twitter-header');
                      setMarketingFormat('release-announcement');
                    }}
                    className="px-3 py-2 text-xs bg-brand-surface border border-brand-border rounded hover:border-brand-primary transition-colors text-left"
                  >
                    🐦 Twitter Release Banner
                  </button>
                  <button
                    onClick={() => {
                      setMarketingPlatform('tiktok');
                      setMarketingFormat('teaser');
                    }}
                    className="px-3 py-2 text-xs bg-brand-surface border border-brand-border rounded hover:border-brand-primary transition-colors text-left"
                  >
                    🎵 TikTok Promo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};