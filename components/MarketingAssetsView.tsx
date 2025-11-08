import React, { useState } from 'react';
import { AudiobookProject, MarketingAsset, EmailSequence, Reviewer, MarketingAnalytics } from '../types';

interface MarketingAssetsViewProps {
  projects: AudiobookProject[];
  onUpdateProject: (projectId: string, updates: Partial<AudiobookProject>) => void;
}

type AssetType = 'waveform-video' | 'character-voice-teaser' | 'bts-narrator-clip' | 'visual-quote' | 'trailer';
type Platform = 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'twitter' | 'all';
type EmailAudience = 'pre-order' | 'launch' | 'follow-up' | 'review-request';

export const MarketingAssetsView: React.FC<MarketingAssetsViewProps> = ({ projects, onUpdateProject }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'assets' | 'email' | 'reviewers' | 'analytics'>('assets');
  
  // Asset generation state
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetForm, setAssetForm] = useState<{
    type: AssetType;
    title: string;
    platform: Platform;
    duration?: number;
    audioClip?: string;
    quoteText?: string;
    characterName?: string;
  }>({
    type: 'waveform-video',
    title: '',
    platform: 'all',
    duration: 15
  });

  // Email campaign state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState<{
    sequenceNumber: number;
    subject: string;
    content: string;
    sendDate: string;
    targetAudience: EmailAudience;
  }>({
    sequenceNumber: 1,
    subject: '',
    content: '',
    sendDate: new Date().toISOString().split('T')[0],
    targetAudience: 'pre-order'
  });

  // Reviewer outreach state
  const [showReviewerModal, setShowReviewerModal] = useState(false);
  const [reviewerForm, setReviewerForm] = useState<{
    name: string;
    platform: string;
    email: string;
    genre: string[];
    audienceSize: number;
  }>({
    name: '',
    platform: '',
    email: '',
    genre: [],
    audienceSize: 0
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const marketingCampaign = selectedProject?.marketing;

  const assetTypeOptions: { value: AssetType; label: string; description: string }[] = [
    { value: 'waveform-video', label: 'Waveform Video', description: 'Animated audio visualization for social media' },
    { value: 'character-voice-teaser', label: 'Character Voice Teaser', description: 'Short dialogue samples featuring different character voices' },
    { value: 'bts-narrator-clip', label: 'Behind-the-Scenes Clip', description: 'Studio recording footage and narrator interviews' },
    { value: 'visual-quote', label: 'Visual Quote Graphic', description: 'Audiogram-style quote cards with waveform backgrounds' },
    { value: 'trailer', label: 'Full Audiobook Trailer', description: '30-60 second cinematic preview' }
  ];

  const platformOptions: { value: Platform; label: string; format: string }[] = [
    { value: 'tiktok', label: 'TikTok', format: '9:16 (1080x1920) Vertical' },
    { value: 'instagram', label: 'Instagram', format: '1:1 (1080x1080) Square' },
    { value: 'youtube', label: 'YouTube', format: '16:9 (1920x1080) Horizontal' },
    { value: 'facebook', label: 'Facebook', format: '16:9 (1200x628) Horizontal' },
    { value: 'twitter', label: 'Twitter/X', format: '16:9 (1200x675) Horizontal' },
    { value: 'all', label: 'All Platforms', format: 'Generate for all formats' }
  ];

  const emailAudienceOptions: { value: EmailAudience; label: string; timing: string }[] = [
    { value: 'pre-order', label: 'Pre-Order Announcement', timing: '2-4 weeks before launch' },
    { value: 'launch', label: 'Launch Day', timing: 'On release date' },
    { value: 'follow-up', label: 'Post-Launch Follow-up', timing: '1 week after launch' },
    { value: 'review-request', label: 'Review Request', timing: '2-3 weeks after launch' }
  ];

  const handleGenerateAsset = () => {
    if (!selectedProject || !assetForm.title) return;

    const newAsset: MarketingAsset = {
      id: `asset-${Date.now()}`,
      type: assetForm.type,
      title: assetForm.title,
      platform: assetForm.platform,
      assetUrl: `placeholder-url-${assetForm.type}-${Date.now()}.mp4`,
      duration: assetForm.duration,
      createdDate: new Date(),
      performanceMetrics: {
        views: 0,
        engagement: 0,
        clicks: 0
      }
    };

    const updatedAssets = [...(marketingCampaign?.assets || []), newAsset];
    
    onUpdateProject(selectedProjectId, {
      marketing: {
        ...marketingCampaign,
        id: marketingCampaign?.id || `campaign-${Date.now()}`,
        audiobookId: selectedProject.id,
        launchDate: marketingCampaign?.launchDate || new Date(),
        assets: updatedAssets,
        analyticsTracking: marketingCampaign?.analyticsTracking || {
          campaignId: `analytics-${Date.now()}`,
          impressions: 0,
          clicks: 0,
          conversions: 0
        }
      }
    });

    setShowAssetModal(false);
    setAssetForm({
      type: 'waveform-video',
      title: '',
      platform: 'all',
      duration: 15
    });
  };

  const handleAddEmailSequence = () => {
    if (!selectedProject || !emailForm.subject) return;

    const newSequence: EmailSequence = {
      sequenceNumber: emailForm.sequenceNumber,
      subject: emailForm.subject,
      content: emailForm.content,
      sendDate: new Date(emailForm.sendDate),
      targetAudience: emailForm.targetAudience
    };

    const emailCampaign = marketingCampaign?.emailCampaign || {
      sequences: [],
      recipientLists: [],
      trackingEnabled: true
    };

    const updatedSequences = [...emailCampaign.sequences, newSequence];

    onUpdateProject(selectedProjectId, {
      marketing: {
        ...marketingCampaign,
        id: marketingCampaign?.id || `campaign-${Date.now()}`,
        audiobookId: selectedProject.id,
        launchDate: marketingCampaign?.launchDate || new Date(),
        assets: marketingCampaign?.assets || [],
        emailCampaign: {
          ...emailCampaign,
          sequences: updatedSequences
        },
        analyticsTracking: marketingCampaign?.analyticsTracking || {
          campaignId: `analytics-${Date.now()}`,
          impressions: 0,
          clicks: 0,
          conversions: 0
        }
      }
    });

    setShowEmailModal(false);
    setEmailForm({
      sequenceNumber: updatedSequences.length + 1,
      subject: '',
      content: '',
      sendDate: new Date().toISOString().split('T')[0],
      targetAudience: 'pre-order'
    });
  };

  const handleAddReviewer = () => {
    if (!selectedProject || !reviewerForm.name || !reviewerForm.email) return;

    const newReviewer: Reviewer = {
      name: reviewerForm.name,
      platform: reviewerForm.platform,
      email: reviewerForm.email,
      genre: reviewerForm.genre,
      audienceSize: reviewerForm.audienceSize,
      contacted: false,
      responded: false
    };

    const reviewerOutreach = marketingCampaign?.reviewerOutreach || {
      targetReviewers: [],
      pitchTemplate: '',
      reviewCopiesSent: 0,
      reviewsReceived: 0
    };

    const updatedReviewers = [...reviewerOutreach.targetReviewers, newReviewer];

    onUpdateProject(selectedProjectId, {
      marketing: {
        ...marketingCampaign,
        id: marketingCampaign?.id || `campaign-${Date.now()}`,
        audiobookId: selectedProject.id,
        launchDate: marketingCampaign?.launchDate || new Date(),
        assets: marketingCampaign?.assets || [],
        reviewerOutreach: {
          ...reviewerOutreach,
          targetReviewers: updatedReviewers
        },
        analyticsTracking: marketingCampaign?.analyticsTracking || {
          campaignId: `analytics-${Date.now()}`,
          impressions: 0,
          clicks: 0,
          conversions: 0
        }
      }
    });

    setShowReviewerModal(false);
    setReviewerForm({
      name: '',
      platform: '',
      email: '',
      genre: [],
      audienceSize: 0
    });
  };

  const handleToggleReviewerContact = (reviewerId: number) => {
    if (!selectedProject || !marketingCampaign?.reviewerOutreach) return;

    const updatedReviewers = marketingCampaign.reviewerOutreach.targetReviewers.map((r, idx) => 
      idx === reviewerId ? { ...r, contacted: !r.contacted } : r
    );

    onUpdateProject(selectedProjectId, {
      marketing: {
        ...marketingCampaign,
        reviewerOutreach: {
          ...marketingCampaign.reviewerOutreach,
          targetReviewers: updatedReviewers,
          reviewCopiesSent: updatedReviewers.filter(r => r.contacted).length
        }
      }
    });
  };

  const handleDeleteAsset = (assetId: string) => {
    if (!selectedProject || !marketingCampaign) return;

    const updatedAssets = marketingCampaign.assets.filter(a => a.id !== assetId);

    onUpdateProject(selectedProjectId, {
      marketing: {
        ...marketingCampaign,
        assets: updatedAssets
      }
    });
  };

  const handleDeleteEmailSequence = (sequenceNumber: number) => {
    if (!selectedProject || !marketingCampaign?.emailCampaign) return;

    const updatedSequences = marketingCampaign.emailCampaign.sequences.filter(
      s => s.sequenceNumber !== sequenceNumber
    );

    onUpdateProject(selectedProjectId, {
      marketing: {
        ...marketingCampaign,
        emailCampaign: {
          ...marketingCampaign.emailCampaign,
          sequences: updatedSequences
        }
      }
    });
  };

  const handleDeleteReviewer = (reviewerIndex: number) => {
    if (!selectedProject || !marketingCampaign?.reviewerOutreach) return;

    const updatedReviewers = marketingCampaign.reviewerOutreach.targetReviewers.filter(
      (_, idx) => idx !== reviewerIndex
    );

    onUpdateProject(selectedProjectId, {
      marketing: {
        ...marketingCampaign,
        reviewerOutreach: {
          ...marketingCampaign.reviewerOutreach,
          targetReviewers: updatedReviewers
        }
      }
    });
  };

  const getTotalViews = () => {
    return marketingCampaign?.assets.reduce((sum, asset) => 
      sum + (asset.performanceMetrics?.views || 0), 0) || 0;
  };

  const getTotalEngagement = () => {
    return marketingCampaign?.assets.reduce((sum, asset) => 
      sum + (asset.performanceMetrics?.engagement || 0), 0) || 0;
  };

  const getTotalClicks = () => {
    return marketingCampaign?.assets.reduce((sum, asset) => 
      sum + (asset.performanceMetrics?.clicks || 0), 0) || 0;
  };

  if (!selectedProject) {
    return (
      <div className="p-8 text-center text-gray-500">
        No audiobook projects available. Create a project first.
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Project List Sidebar */}
      <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Marketing Campaigns</h3>
        <div className="space-y-2">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={`w-full text-left p-3 rounded transition-colors ${
                selectedProjectId === project.id
                  ? 'bg-purple-100 border-l-4 border-purple-600'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="font-medium truncate">{project.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {project.marketing?.assets.length || 0} assets
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'assets'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Marketing Assets
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'email'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Email Campaigns
            </button>
            <button
              onClick={() => setActiveTab('reviewers')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'reviewers'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Reviewer Outreach
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Marketing Assets Tab */}
          {activeTab === 'assets' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Marketing Assets Library</h2>
                <button
                  onClick={() => setShowAssetModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  + Generate New Asset
                </button>
              </div>

              {marketingCampaign?.assets && marketingCampaign.assets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketingCampaign.assets.map(asset => (
                    <div key={asset.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className={`inline-block px-2 py-1 text-xs rounded ${
                            asset.type === 'trailer' ? 'bg-purple-100 text-purple-800' :
                            asset.type === 'waveform-video' ? 'bg-blue-100 text-blue-800' :
                            asset.type === 'character-voice-teaser' ? 'bg-green-100 text-green-800' :
                            asset.type === 'visual-quote' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {asset.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </span>
                          <span className="ml-2 text-xs text-gray-500 capitalize">{asset.platform}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                      
                      <h3 className="font-semibold mb-2">{asset.title}</h3>
                      
                      {asset.duration && (
                        <p className="text-sm text-gray-600 mb-2">{asset.duration}s</p>
                      )}

                      <div className="text-xs text-gray-500 mb-3">
                        Created {new Date(asset.createdDate).toLocaleDateString()}
                      </div>

                      {asset.performanceMetrics && (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-gray-500">Views</div>
                            <div className="font-semibold">{asset.performanceMetrics.views.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Engagement</div>
                            <div className="font-semibold">{asset.performanceMetrics.engagement.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Clicks</div>
                            <div className="font-semibold">{asset.performanceMetrics.clicks.toLocaleString()}</div>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex gap-2">
                        <button className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 py-1 rounded">
                          Preview
                        </button>
                        <button className="flex-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 py-1 rounded">
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-4">No marketing assets created yet.</p>
                  <button
                    onClick={() => setShowAssetModal(true)}
                    className="text-purple-600 hover:underline"
                  >
                    Generate your first asset
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Email Campaigns Tab */}
          {activeTab === 'email' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Email Campaign Sequences</h2>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  + Add Email Sequence
                </button>
              </div>

              {marketingCampaign?.emailCampaign?.sequences && marketingCampaign.emailCampaign.sequences.length > 0 ? (
                <div className="space-y-4">
                  {marketingCampaign.emailCampaign.sequences
                    .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                    .map(sequence => (
                    <div key={sequence.sequenceNumber} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">
                            #{sequence.sequenceNumber}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            sequence.targetAudience === 'pre-order' ? 'bg-purple-100 text-purple-800' :
                            sequence.targetAudience === 'launch' ? 'bg-green-100 text-green-800' :
                            sequence.targetAudience === 'follow-up' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {sequence.targetAudience.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteEmailSequence(sequence.sequenceNumber)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>

                      <h3 className="font-semibold mb-2">{sequence.subject}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{sequence.content}</p>
                      <p className="text-xs text-gray-500">
                        Scheduled: {new Date(sequence.sendDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-4">No email sequences configured yet.</p>
                  <p className="text-sm mb-6">
                    Build a strategic email campaign to engage your audience throughout the launch cycle.
                  </p>
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="text-blue-600 hover:underline"
                  >
                    Create your first email sequence
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reviewer Outreach Tab */}
          {activeTab === 'reviewers' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Reviewer Outreach</h2>
                  {marketingCampaign?.reviewerOutreach && (
                    <p className="text-sm text-gray-600 mt-1">
                      {marketingCampaign.reviewerOutreach.reviewCopiesSent} sent • {marketingCampaign.reviewerOutreach.reviewsReceived} reviews received
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowReviewerModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  + Add Reviewer
                </button>
              </div>

              {marketingCampaign?.reviewerOutreach?.targetReviewers && marketingCampaign.reviewerOutreach.targetReviewers.length > 0 ? (
                <div className="space-y-3">
                  {marketingCampaign.reviewerOutreach.targetReviewers.map((reviewer, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{reviewer.name}</h3>
                          <span className="text-xs text-gray-500">{reviewer.platform}</span>
                          {reviewer.contacted && (
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 text-xs rounded">
                              Contacted
                            </span>
                          )}
                          {reviewer.responded && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 text-xs rounded">
                              Responded
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{reviewer.email}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>Genres: {reviewer.genre.join(', ')}</span>
                          <span>Audience: {reviewer.audienceSize.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleReviewerContact(idx)}
                          className={`px-3 py-1 text-sm rounded ${
                            reviewer.contacted
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {reviewer.contacted ? 'Mark Uncontacted' : 'Mark Contacted'}
                        </button>
                        <button
                          onClick={() => handleDeleteReviewer(idx)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-4">No reviewers in your outreach list yet.</p>
                  <p className="text-sm mb-6">
                    Build a targeted list of reviewers who cover your genre and have engaged audiences.
                  </p>
                  <button
                    onClick={() => setShowReviewerModal(true)}
                    className="text-green-600 hover:underline"
                  >
                    Add your first reviewer
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Marketing Performance Analytics</h2>

              {marketingCampaign?.assets && marketingCampaign.assets.length > 0 ? (
                <div>
                  {/* Overview Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-sm text-blue-600 mb-1">Total Views</h3>
                      <p className="text-3xl font-bold text-blue-900">{getTotalViews().toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-sm text-green-600 mb-1">Total Engagement</h3>
                      <p className="text-3xl font-bold text-green-900">{getTotalEngagement().toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="text-sm text-purple-600 mb-1">Total Clicks</h3>
                      <p className="text-3xl font-bold text-purple-900">{getTotalClicks().toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Campaign Analytics */}
                  {marketingCampaign.analyticsTracking && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                      <h3 className="font-semibold mb-4">Campaign Performance</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Impressions</div>
                          <div className="text-lg font-semibold">{marketingCampaign.analyticsTracking.impressions.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Clicks</div>
                          <div className="text-lg font-semibold">{marketingCampaign.analyticsTracking.clicks.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Conversions</div>
                          <div className="text-lg font-semibold">{marketingCampaign.analyticsTracking.conversions.toLocaleString()}</div>
                        </div>
                        {marketingCampaign.analyticsTracking.costPerAcquisition && (
                          <div>
                            <div className="text-xs text-gray-500">Cost Per Acquisition</div>
                            <div className="text-lg font-semibold">${marketingCampaign.analyticsTracking.costPerAcquisition.toFixed(2)}</div>
                          </div>
                        )}
                        {marketingCampaign.analyticsTracking.returnOnInvestment && (
                          <div>
                            <div className="text-xs text-gray-500">ROI</div>
                            <div className="text-lg font-semibold">{marketingCampaign.analyticsTracking.returnOnInvestment.toFixed(1)}%</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Asset Performance Breakdown */}
                  <h3 className="font-semibold mb-4">Asset Performance Breakdown</h3>
                  <div className="space-y-3">
                    {marketingCampaign.assets
                      .sort((a, b) => (b.performanceMetrics?.views || 0) - (a.performanceMetrics?.views || 0))
                      .map(asset => (
                      <div key={asset.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{asset.title}</h4>
                            <p className="text-xs text-gray-500 capitalize">{asset.platform} • {asset.type.replace(/-/g, ' ')}</p>
                          </div>
                        </div>
                        {asset.performanceMetrics && (
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500 text-xs">Views</div>
                              <div className="font-semibold">{asset.performanceMetrics.views.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-xs">Engagement</div>
                              <div className="font-semibold">{asset.performanceMetrics.engagement.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-xs">Clicks</div>
                              <div className="font-semibold">{asset.performanceMetrics.clicks.toLocaleString()}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-4">No analytics data available yet.</p>
                  <p className="text-sm">Create marketing assets to start tracking performance.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Asset Generation Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Generate Marketing Asset</h2>
                <button
                  onClick={() => setShowAssetModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Asset Type</label>
                  <select
                    value={assetForm.type}
                    onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value as AssetType })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    {assetTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {assetTypeOptions.find(o => o.value === assetForm.type)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Asset Title</label>
                  <input
                    type="text"
                    value={assetForm.title}
                    onChange={(e) => setAssetForm({ ...assetForm, title: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="e.g., Chapter 1 Teaser - Epic Battle Scene"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Target Platform</label>
                  <select
                    value={assetForm.platform}
                    onChange={(e) => setAssetForm({ ...assetForm, platform: e.target.value as Platform })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    {platformOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} - {opt.format}
                      </option>
                    ))}
                  </select>
                </div>

                {(assetForm.type === 'waveform-video' || assetForm.type === 'character-voice-teaser' || assetForm.type === 'trailer') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
                    <input
                      type="number"
                      value={assetForm.duration || 15}
                      onChange={(e) => setAssetForm({ ...assetForm, duration: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      min="5"
                      max="120"
                    />
                  </div>
                )}

                {assetForm.type === 'visual-quote' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Quote Text</label>
                    <textarea
                      value={assetForm.quoteText || ''}
                      onChange={(e) => setAssetForm({ ...assetForm, quoteText: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      rows={3}
                      placeholder="Enter the quote to feature..."
                    />
                  </div>
                )}

                {assetForm.type === 'character-voice-teaser' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Character Name</label>
                    <input
                      type="text"
                      value={assetForm.characterName || ''}
                      onChange={(e) => setAssetForm({ ...assetForm, characterName: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="e.g., Sarah Connor"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateAsset}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  disabled={!assetForm.title}
                >
                  Generate Asset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Sequence Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add Email Sequence</h2>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Target Audience</label>
                  <select
                    value={emailForm.targetAudience}
                    onChange={(e) => setEmailForm({ ...emailForm, targetAudience: e.target.value as EmailAudience })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    {emailAudienceOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} - {opt.timing}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subject Line</label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="e.g., Your Audiobook is Now Available!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email Content</label>
                  <textarea
                    value={emailForm.content}
                    onChange={(e) => setEmailForm({ ...emailForm, content: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows={8}
                    placeholder="Write your email content here..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Send Date</label>
                  <input
                    type="date"
                    value={emailForm.sendDate}
                    onChange={(e) => setEmailForm({ ...emailForm, sendDate: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEmailSequence}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!emailForm.subject || !emailForm.content}
                >
                  Add Sequence
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviewer Modal */}
      {showReviewerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add Reviewer</h2>
                <button
                  onClick={() => setShowReviewerModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Reviewer Name</label>
                  <input
                    type="text"
                    value={reviewerForm.name}
                    onChange={(e) => setReviewerForm({ ...reviewerForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="e.g., Sarah's Book Reviews"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <input
                    type="text"
                    value={reviewerForm.platform}
                    onChange={(e) => setReviewerForm({ ...reviewerForm, platform: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="e.g., BookTok, Instagram, YouTube"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={reviewerForm.email}
                    onChange={(e) => setReviewerForm({ ...reviewerForm, email: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="reviewer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Genres (comma-separated)</label>
                  <input
                    type="text"
                    value={reviewerForm.genre.join(', ')}
                    onChange={(e) => setReviewerForm({ ...reviewerForm, genre: e.target.value.split(',').map(g => g.trim()) })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="e.g., Fantasy, Romance, Thriller"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Audience Size</label>
                  <input
                    type="number"
                    value={reviewerForm.audienceSize}
                    onChange={(e) => setReviewerForm({ ...reviewerForm, audienceSize: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="e.g., 50000"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowReviewerModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReviewer}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={!reviewerForm.name || !reviewerForm.email}
                >
                  Add Reviewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};