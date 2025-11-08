import React, { useState } from 'react';
import { AudiobookProject, DistributionPipeline, PlatformDistribution, PricingTier, RoyaltyConfiguration } from '../types';

interface Props {
  projects: AudiobookProject[];
  onUpdateProject: (projectId: string, updates: Partial<AudiobookProject>) => void;
}

export default function DistributionPipelineView({ projects, onUpdateProject }: Props) {
  const [selectedProject, setSelectedProject] = useState<AudiobookProject | null>(
    projects.length > 0 ? projects[0] : null
  );
  const [activeTab, setActiveTab] = useState<'platforms' | 'pricing' | 'royalty' | 'launch'>('platforms');
  
  // Platform configuration modals
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<PlatformDistribution | null>(null);
  
  // Platform form state
  const [platformForm, setPlatformForm] = useState<{
    platform: 'audible' | 'acx' | 'spotify' | 'apple' | 'google' | 'overdrive' | 'hoopla' | 'findaway';
    status: 'pending' | 'uploaded' | 'processing' | 'approved' | 'live' | 'rejected';
    platformId: string;
    uploadDate: Date | null;
    liveDate: Date | null;
    pricing: PricingTier;
    rejectionReason: string;
  }>({
    platform: 'audible',
    status: 'pending',
    platformId: '',
    uploadDate: null,
    liveDate: null,
    pricing: {
      currency: 'USD',
      retailPrice: 0,
      wholesalePrice: 0,
      subscriptionTier: 'included'
    },
    rejectionReason: ''
  });
  
  // Pricing configuration modal
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingPricingPlatform, setEditingPricingPlatform] = useState<string | null>(null);
  const [pricingForm, setPricingForm] = useState<PricingTier>({
    currency: 'USD',
    retailPrice: 0,
    wholesalePrice: 0,
    subscriptionTier: 'included'
  });
  
  // Royalty configuration
  const [royaltyConfig, setRoyaltyConfig] = useState<RoyaltyConfiguration>({
    model: 'royalty-share',
    royaltyRate: 40,
    flatFee: 0,
    revenueShare: {
      author: 70,
      narrator: 20,
      producer: 10
    }
  });
  
  // Launch date configuration
  const [launchDate, setLaunchDate] = useState<Date | null>(null);
  const [coordinatedLaunch, setCoordinatedLaunch] = useState(true);

  const platformOptions = [
    { value: 'audible', label: 'Audible (ACX)', description: 'Amazon audiobook marketplace - exclusive or non-exclusive' },
    { value: 'acx', label: 'ACX Direct', description: 'Audiobook Creation Exchange - author/narrator direct upload' },
    { value: 'spotify', label: 'Spotify Audiobooks', description: 'Spotify audiobook platform with streaming focus' },
    { value: 'apple', label: 'Apple Books', description: 'Apple audiobook distribution via Books app' },
    { value: 'google', label: 'Google Play Books', description: 'Google audiobook marketplace' },
    { value: 'overdrive', label: 'OverDrive', description: 'Library audiobook distribution system' },
    { value: 'hoopla', label: 'Hoopla Digital', description: 'Library on-demand streaming service' },
    { value: 'findaway', label: 'Findaway Voices', description: 'Wide audiobook aggregator for 40+ platforms' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending Upload', color: 'bg-gray-500' },
    { value: 'uploaded', label: 'Uploaded', color: 'bg-blue-500' },
    { value: 'processing', label: 'Processing', color: 'bg-yellow-500' },
    { value: 'approved', label: 'Approved', color: 'bg-green-500' },
    { value: 'live', label: 'Live', color: 'bg-emerald-600' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-500' }
  ];

  const royaltyModels = [
    { 
      value: 'royalty-share', 
      label: 'Royalty Share', 
      description: 'Split royalties with narrator - no upfront cost, narrator gets % of sales',
      recommendedRate: 50
    },
    { 
      value: 'exclusive', 
      label: 'Exclusive (ACX)', 
      description: 'Exclusive to Audible - higher royalty rate (40%), 7-year exclusivity',
      recommendedRate: 40
    },
    { 
      value: 'non-exclusive', 
      label: 'Non-Exclusive', 
      description: 'Distribute everywhere - pay narrator upfront, author keeps all royalties (25%)',
      recommendedRate: 25
    },
    { 
      value: 'flat-rate', 
      label: 'Flat Rate', 
      description: 'Pay narrator fixed fee per finished hour - author owns all rights',
      recommendedRate: 100
    }
  ];

  const currencyOptions = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
  const subscriptionTiers = [
    { value: 'included', label: 'Included (base subscription)', description: 'Available to all subscribers' },
    { value: 'premium', label: 'Premium (plus tier)', description: 'Requires premium subscription' },
    { value: 'exclusive', label: 'Exclusive (top tier)', description: 'Only in highest subscription tier' }
  ];

  const handleAddPlatform = () => {
    setEditingPlatform(null);
    setPlatformForm({
      platform: 'audible',
      status: 'pending',
      platformId: '',
      uploadDate: null,
      liveDate: null,
      pricing: {
        currency: 'USD',
        retailPrice: 0,
        wholesalePrice: 0,
        subscriptionTier: 'included'
      },
      rejectionReason: ''
    });
    setShowPlatformModal(true);
  };

  const handleEditPlatform = (platform: PlatformDistribution) => {
    setEditingPlatform(platform);
    setPlatformForm({
      platform: platform.platform,
      status: platform.status,
      platformId: platform.platformId || '',
      uploadDate: platform.uploadDate || null,
      liveDate: platform.liveDate || null,
      pricing: platform.pricing,
      rejectionReason: platform.rejectionReason || ''
    });
    setShowPlatformModal(true);
  };

  const handleSavePlatform = () => {
    if (!selectedProject) return;

    const newPlatform: PlatformDistribution = {
      platform: platformForm.platform,
      status: platformForm.status,
      platformId: platformForm.platformId || undefined,
      uploadDate: platformForm.uploadDate || undefined,
      liveDate: platformForm.liveDate || undefined,
      pricing: platformForm.pricing,
      rejectionReason: platformForm.rejectionReason || undefined
    };

    const distribution = selectedProject.distribution || {
      id: `dist-${Date.now()}`,
      audiobookId: selectedProject.id,
      platforms: [],
      royaltyConfig: royaltyConfig,
      status: 'preparing'
    };

    let updatedPlatforms: PlatformDistribution[];
    if (editingPlatform) {
      updatedPlatforms = distribution.platforms.map(p => 
        p.platform === editingPlatform.platform ? newPlatform : p
      );
    } else {
      updatedPlatforms = [...distribution.platforms, newPlatform];
    }

    onUpdateProject(selectedProject.id, {
      distribution: {
        ...distribution,
        platforms: updatedPlatforms
      }
    });

    setShowPlatformModal(false);
  };

  const handleRemovePlatform = (platform: string) => {
    if (!selectedProject || !selectedProject.distribution) return;

    const updatedPlatforms = selectedProject.distribution.platforms.filter(
      p => p.platform !== platform
    );

    onUpdateProject(selectedProject.id, {
      distribution: {
        ...selectedProject.distribution,
        platforms: updatedPlatforms
      }
    });
  };

  const handleEditPricing = (platform: string) => {
    if (!selectedProject?.distribution) return;

    const platformDist = selectedProject.distribution.platforms.find(p => p.platform === platform);
    if (!platformDist) return;

    setEditingPricingPlatform(platform);
    setPricingForm(platformDist.pricing);
    setShowPricingModal(true);
  };

  const handleSavePricing = () => {
    if (!selectedProject?.distribution || !editingPricingPlatform) return;

    const updatedPlatforms = selectedProject.distribution.platforms.map(p => 
      p.platform === editingPricingPlatform
        ? { ...p, pricing: pricingForm }
        : p
    );

    onUpdateProject(selectedProject.id, {
      distribution: {
        ...selectedProject.distribution,
        platforms: updatedPlatforms
      }
    });

    setShowPricingModal(false);
  };

  const handleUpdateRoyalty = () => {
    if (!selectedProject) return;

    const distribution = selectedProject.distribution || {
      id: `dist-${Date.now()}`,
      audiobookId: selectedProject.id,
      platforms: [],
      royaltyConfig: royaltyConfig,
      status: 'preparing'
    };

    onUpdateProject(selectedProject.id, {
      distribution: {
        ...distribution,
        royaltyConfig: royaltyConfig
      }
    });
  };

  const handleUpdateLaunchDate = () => {
    if (!selectedProject || !launchDate) return;

    const distribution = selectedProject.distribution || {
      id: `dist-${Date.now()}`,
      audiobookId: selectedProject.id,
      platforms: [],
      royaltyConfig: royaltyConfig,
      status: 'preparing',
      launchDate: launchDate
    };

    onUpdateProject(selectedProject.id, {
      distribution: {
        ...distribution,
        launchDate: launchDate
      }
    });
  };

  const calculateRevenueShare = () => {
    if (royaltyConfig.model !== 'royalty-share' || !royaltyConfig.revenueShare) {
      return null;
    }

    const { author, narrator, producer } = royaltyConfig.revenueShare;
    const total = author + narrator + producer;

    if (total !== 100) {
      return { valid: false, error: 'Revenue shares must total 100%' };
    }

    return { valid: true, author, narrator, producer };
  };

  const getPlatformRequirements = (platform: string) => {
    const requirements: Record<string, string[]> = {
      audible: [
        'Retail-quality audio (192 kbps MP3 or higher)',
        'Consistent audio levels (-23 to -18 dB RMS)',
        'Professional cover art (2400x2400 minimum)',
        'Complete metadata (title, subtitle, author, narrator, description)',
        'ACX Audio Submission Requirements compliance',
        'Chapter markers if multi-chapter book',
        'Proof of rights (for rights holder)'
      ],
      acx: [
        'Same as Audible requirements',
        'Author verification or rights holder proof',
        'Payment information configured',
        'Distribution agreement accepted'
      ],
      spotify: [
        'High-quality audio files (minimum 128 kbps)',
        'Cover art (minimum 1600x1600, recommended 3000x3000)',
        'Complete metadata with ISRC codes',
        'Publisher information',
        'Distribution agreement'
      ],
      apple: [
        'High-quality audio (AAC 64 kbps or higher)',
        'Cover art (minimum 1400x1400, recommended 3000x3000)',
        'ISBN or proprietary identifier',
        'Complete metadata',
        'Apple ID for iTunes Producer upload'
      ],
      google: [
        'MP3 files (128-320 kbps)',
        'Cover art (minimum 1400x1400)',
        'Complete metadata',
        'Google Play Books Partner Center account',
        'Tax and payment information'
      ],
      overdrive: [
        'Library-quality audio files',
        'Professional metadata',
        'Library pricing model',
        'Distribution agreement with library systems'
      ],
      hoopla: [
        'High-quality audio files',
        'Library-specific metadata',
        'Hoopla distribution agreement',
        'Library-friendly pricing structure'
      ],
      findaway: [
        'Master audio files',
        'Complete metadata for all platforms',
        'Findaway Voices account',
        'Distribution to 40+ platforms included'
      ]
    };

    return requirements[platform] || [];
  };

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No audiobook project selected</p>
          <p className="text-sm mt-2">Create an audiobook project to access distribution tools</p>
        </div>
      </div>
    );
  }

  const distribution = selectedProject.distribution;
  const platforms = distribution?.platforms || [];
  const revenueShareCalc = calculateRevenueShare();

  return (
    <div className="flex h-full bg-gray-50">
      {/* Project List Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Distribution Projects</h3>
        </div>
        <div className="p-2">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                selectedProject?.id === project.id
                  ? 'bg-orange-50 text-orange-900 border border-orange-200'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="font-medium truncate">{project.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {project.distribution?.platforms.length || 0} platforms
              </div>
              {project.distribution?.status && (
                <div className="text-xs mt-1">
                  <span className={`px-2 py-0.5 rounded-full ${
                    project.distribution.status === 'live' ? 'bg-green-100 text-green-800' :
                    project.distribution.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                    project.distribution.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.distribution.status}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 px-6 flex gap-1">
          <button
            onClick={() => setActiveTab('platforms')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'platforms'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Platforms
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'pricing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Pricing
          </button>
          <button
            onClick={() => setActiveTab('royalty')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'royalty'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Royalty Config
          </button>
          <button
            onClick={() => setActiveTab('launch')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'launch'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Launch Planning
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'platforms' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Platform Distribution</h2>
                  <p className="text-gray-600 mt-1">Configure and track audiobook distribution across platforms</p>
                </div>
                <button
                  onClick={handleAddPlatform}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                  <span>+ Add Platform</span>
                </button>
              </div>

              {platforms.length === 0 ? (
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                  <p className="text-gray-500 mb-4">No platforms configured yet</p>
                  <button
                    onClick={handleAddPlatform}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Add Your First Platform
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {platforms.map(platform => {
                    const statusOption = statusOptions.find(s => s.value === platform.status);
                    
                    return (
                      <div key={platform.platform} className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 capitalize">
                              {platformOptions.find(p => p.value === platform.platform)?.label || platform.platform}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {platformOptions.find(p => p.value === platform.platform)?.description}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditPlatform(platform)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleRemovePlatform(platform.platform)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-gray-500">Status:</span>
                            <div className="mt-1">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${statusOption?.color}`}>
                                {statusOption?.label}
                              </span>
                            </div>
                          </div>

                          {platform.platformId && (
                            <div>
                              <span className="text-sm text-gray-500">Platform ID:</span>
                              <div className="text-sm font-mono mt-1">{platform.platformId}</div>
                            </div>
                          )}

                          {platform.uploadDate && (
                            <div>
                              <span className="text-sm text-gray-500">Upload Date:</span>
                              <div className="text-sm mt-1">{new Date(platform.uploadDate).toLocaleDateString()}</div>
                            </div>
                          )}

                          {platform.liveDate && (
                            <div>
                              <span className="text-sm text-gray-500">Live Date:</span>
                              <div className="text-sm mt-1">{new Date(platform.liveDate).toLocaleDateString()}</div>
                            </div>
                          )}

                          <div>
                            <span className="text-sm text-gray-500">Pricing:</span>
                            <div className="text-sm mt-1">
                              {platform.pricing.currency} {platform.pricing.retailPrice.toFixed(2)}
                              {platform.pricing.subscriptionTier && (
                                <span className="ml-2 text-xs text-gray-500">({platform.pricing.subscriptionTier})</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleEditPricing(platform.platform)}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              Edit Pricing
                            </button>
                          </div>

                          {platform.rejectionReason && (
                            <div className="bg-red-50 border border-red-200 rounded p-3">
                              <div className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</div>
                              <div className="text-sm text-red-700">{platform.rejectionReason}</div>
                            </div>
                          )}

                          <div className="pt-3 border-t border-gray-200">
                            <details className="text-sm">
                              <summary className="cursor-pointer text-gray-700 font-medium hover:text-gray-900">
                                Platform Requirements
                              </summary>
                              <ul className="mt-2 space-y-1 text-xs text-gray-600 ml-4">
                                {getPlatformRequirements(platform.platform).map((req, idx) => (
                                  <li key={idx} className="list-disc">{req}</li>
                                ))}
                              </ul>
                            </details>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'pricing' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Platform Pricing</h2>
                <p className="text-gray-600 mt-1">Configure retail prices for each distribution platform</p>
              </div>

              {platforms.length === 0 ? (
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                  <p className="text-gray-500">Add platforms first to configure pricing</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {platforms.map(platform => (
                    <div key={platform.platform} className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">
                          {platformOptions.find(p => p.value === platform.platform)?.label}
                        </h3>
                        <button
                          onClick={() => handleEditPricing(platform.platform)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Edit Pricing
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Retail Price
                          </label>
                          <div className="text-2xl font-bold text-gray-900">
                            {platform.pricing.currency} {platform.pricing.retailPrice.toFixed(2)}
                          </div>
                        </div>

                        {platform.pricing.wholesalePrice && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Wholesale Price
                            </label>
                            <div className="text-2xl font-bold text-gray-900">
                              {platform.pricing.currency} {platform.pricing.wholesalePrice.toFixed(2)}
                            </div>
                          </div>
                        )}

                        {platform.pricing.subscriptionTier && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Subscription Tier
                            </label>
                            <div className="text-lg font-medium text-gray-900 capitalize">
                              {platform.pricing.subscriptionTier}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {subscriptionTiers.find(t => t.value === platform.pricing.subscriptionTier)?.description}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          <strong>Platform Note:</strong> Pricing may be subject to platform-specific requirements and regional variations.
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'royalty' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Royalty Configuration</h2>
                <p className="text-gray-600 mt-1">Define revenue sharing and royalty structure</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Royalty Model</h3>
                
                <div className="space-y-3 mb-6">
                  {royaltyModels.map(model => (
                    <label
                      key={model.value}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        royaltyConfig.model === model.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="royaltyModel"
                        value={model.value}
                        checked={royaltyConfig.model === model.value}
                        onChange={(e) => setRoyaltyConfig({
                          ...royaltyConfig,
                          model: e.target.value as any,
                          royaltyRate: model.recommendedRate
                        })}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{model.label}</div>
                        <div className="text-sm text-gray-600 mt-1">{model.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Typical royalty rate: {model.recommendedRate}%
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {royaltyConfig.model === 'royalty-share' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-3">Revenue Share Split</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Author Share (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={royaltyConfig.revenueShare?.author || 0}
                          onChange={(e) => setRoyaltyConfig({
                            ...royaltyConfig,
                            revenueShare: {
                              ...royaltyConfig.revenueShare!,
                              author: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Narrator Share (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={royaltyConfig.revenueShare?.narrator || 0}
                          onChange={(e) => setRoyaltyConfig({
                            ...royaltyConfig,
                            revenueShare: {
                              ...royaltyConfig.revenueShare!,
                              narrator: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Producer Share (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={royaltyConfig.revenueShare?.producer || 0}
                          onChange={(e) => setRoyaltyConfig({
                            ...royaltyConfig,
                            revenueShare: {
                              ...royaltyConfig.revenueShare!,
                              producer: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      {revenueShareCalc && !revenueShareCalc.valid && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="text-sm text-red-800 font-medium">{revenueShareCalc.error}</div>
                        </div>
                      )}

                      {revenueShareCalc && revenueShareCalc.valid && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="text-sm text-green-800 font-medium">✓ Revenue shares total 100%</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(royaltyConfig.model === 'exclusive' || royaltyConfig.model === 'non-exclusive') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Royalty Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={royaltyConfig.royaltyRate || 0}
                      onChange={(e) => setRoyaltyConfig({
                        ...royaltyConfig,
                        royaltyRate: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <div className="text-xs text-gray-600 mt-2">
                      {royaltyConfig.model === 'exclusive' 
                        ? 'ACX exclusive typically offers 40% royalty rate with 7-year exclusivity'
                        : 'Non-exclusive typically offers 25% royalty rate with wide distribution'}
                    </div>
                  </div>
                )}

                {royaltyConfig.model === 'flat-rate' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Flat Fee ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={royaltyConfig.flatFee || 0}
                      onChange={(e) => setRoyaltyConfig({
                        ...royaltyConfig,
                        flatFee: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <div className="text-xs text-gray-600 mt-2">
                      One-time payment to narrator - author retains all audiobook rights and royalties
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUpdateRoyalty}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save Royalty Configuration
                </button>
              </div>
            </div>
          )}

          {activeTab === 'launch' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Launch Planning</h2>
                <p className="text-gray-600 mt-1">Coordinate release dates across platforms</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Launch Date Configuration</h3>
                
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={coordinatedLaunch}
                      onChange={(e) => setCoordinatedLaunch(e.target.checked)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Coordinated Launch</div>
                      <div className="text-sm text-gray-600">Launch simultaneously across all platforms</div>
                    </div>
                  </label>
                </div>

                {coordinatedLaunch && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Global Launch Date
                    </label>
                    <input
                      type="date"
                      value={launchDate ? launchDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setLaunchDate(e.target.value ? new Date(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <div className="text-xs text-gray-600 mt-2">
                      All platforms will be coordinated to go live on this date
                    </div>
                  </div>
                )}

                {!coordinatedLaunch && platforms.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-700 font-medium mb-3">
                      Individual Platform Launch Dates
                    </div>
                    {platforms.map(platform => (
                      <div key={platform.platform} className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 capitalize">
                            {platformOptions.find(p => p.value === platform.platform)?.label}
                          </label>
                        </div>
                        <input
                          type="date"
                          value={platform.liveDate ? new Date(platform.liveDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const newDate = e.target.value ? new Date(e.target.value) : null;
                            const updatedPlatforms = distribution!.platforms.map(p =>
                              p.platform === platform.platform
                                ? { ...p, liveDate: newDate || undefined }
                                : p
                            );
                            onUpdateProject(selectedProject.id, {
                              distribution: {
                                ...distribution!,
                                platforms: updatedPlatforms
                              }
                            });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {coordinatedLaunch && (
                  <button
                    onClick={handleUpdateLaunchDate}
                    disabled={!launchDate}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Launch Date
                  </button>
                )}
              </div>

              {distribution?.launchDate && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h4 className="font-semibold text-purple-900 mb-3">Launch Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-purple-700 font-medium">Launch Date:</span>
                      <span className="ml-2 text-purple-900">
                        {new Date(distribution.launchDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-medium">Platforms Going Live:</span>
                      <div className="ml-2 mt-1 text-purple-900">
                        {platforms.map(p => (
                          <div key={p.platform} className="capitalize">
                            • {platformOptions.find(opt => opt.value === p.platform)?.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Platform Configuration Modal */}
      {showPlatformModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingPlatform ? 'Edit Platform' : 'Add Platform'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>
                <select
                  value={platformForm.platform}
                  onChange={(e) => setPlatformForm({ ...platformForm, platform: e.target.value as any })}
                  disabled={!!editingPlatform}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                >
                  {platformOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="text-xs text-gray-600 mt-1">
                  {platformOptions.find(p => p.value === platformForm.platform)?.description}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={platformForm.status}
                  onChange={(e) => setPlatformForm({ ...platformForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform ID (optional)
                </label>
                <input
                  type="text"
                  value={platformForm.platformId}
                  onChange={(e) => setPlatformForm({ ...platformForm, platformId: e.target.value })}
                  placeholder="e.g., ASIN, Product ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {platformForm.status === 'rejected' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={platformForm.rejectionReason}
                    onChange={(e) => setPlatformForm({ ...platformForm, rejectionReason: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowPlatformModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlatform}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {editingPlatform ? 'Save Changes' : 'Add Platform'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Configuration Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Edit Pricing - {platformOptions.find(p => p.value === editingPricingPlatform)?.label}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={pricingForm.currency}
                  onChange={(e) => setPricingForm({ ...pricingForm, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {currencyOptions.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retail Price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricingForm.retailPrice}
                  onChange={(e) => setPricingForm({ ...pricingForm, retailPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wholesale Price (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricingForm.wholesalePrice || 0}
                  onChange={(e) => setPricingForm({ ...pricingForm, wholesalePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subscription Tier
                </label>
                <select
                  value={pricingForm.subscriptionTier || 'included'}
                  onChange={(e) => setPricingForm({ ...pricingForm, subscriptionTier: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {subscriptionTiers.map(tier => (
                    <option key={tier.value} value={tier.value}>{tier.label}</option>
                  ))}
                </select>
                <div className="text-xs text-gray-600 mt-1">
                  {subscriptionTiers.find(t => t.value === pricingForm.subscriptionTier)?.description}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowPricingModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePricing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Pricing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}