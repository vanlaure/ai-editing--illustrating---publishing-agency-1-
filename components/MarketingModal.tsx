import React, { useState } from 'react';
import { MarketingCampaign, SocialMediaPost } from '../types';
import { MegaphoneIcon, SparklesIcon, TwitterIcon, FacebookIcon, InstagramIcon, VideoIcon } from './icons/IconDefs';

interface MarketingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateCampaign: () => void;
  campaign: MarketingCampaign[] | null;
  isLoading: boolean;
  onOpenVideoTrailer: () => void;
}

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);

const PlatformIcon: React.FC<{ platform: SocialMediaPost['platform'] }> = ({ platform }) => {
    switch(platform) {
        case 'X': return <TwitterIcon className="w-5 h-5" />;
        case 'Facebook': return <FacebookIcon className="w-5 h-5" />;
        case 'Instagram': return <InstagramIcon className="w-5 h-5" />;
        default: return null;
    }
};

const CopyButton: React.FC<{ textToCopy: string, label: string }> = ({ textToCopy, label }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button onClick={handleCopy} className="text-xs text-brand-primary hover:underline disabled:opacity-50" disabled={!textToCopy}>
            {copied ? 'Copied!' : label}
        </button>
    );
};

export const MarketingModal: React.FC<MarketingModalProps> = ({ isOpen, onClose, onGenerateCampaign, campaign, isLoading, onOpenVideoTrailer }) => {
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 no-print" onClick={onClose}>
            <div className="bg-brand-surface rounded-lg shadow-2xl w-full max-w-4xl flex flex-col" style={{height: '90vh'}} onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <MegaphoneIcon className="w-8 h-8 text-brand-primary" />
                        <div>
                            <h2 className="text-xl font-bold">AI Marketing Campaign Generator</h2>
                            <p className="text-sm text-brand-text-secondary">Create social media posts and video trailers for your book.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text text-2xl leading-none">&times;</button>
                </div>

                <div className="flex-grow p-6 overflow-y-auto">
                    {!campaign && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <p className="text-lg font-semibold">Ready to promote your book?</p>
                            <p className="text-brand-text-secondary mb-6">Let the AI generate strategic social media content to build launch buzz.</p>
                            <div className="w-full max-w-sm space-y-3">
                                <button onClick={onGenerateCampaign} disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3 font-semibold bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover disabled:bg-gray-500">
                                    <SparklesIcon className="w-5 h-5"/> {isLoading ? 'Generating...' : 'Generate 3-Day Social Campaign'}
                                </button>
                                <button onClick={onOpenVideoTrailer} className="w-full flex items-center justify-center gap-2 py-3 font-semibold bg-brand-primary/20 text-brand-primary rounded-md hover:bg-brand-primary/40">
                                    <VideoIcon className="w-5 h-5"/> Generate Video Trailer
                                </button>
                            </div>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <LoadingSpinner />
                            <p className="mt-4 font-semibold">AI is crafting your campaign...</p>
                            <p className="text-sm text-brand-text-secondary">This may take a moment.</p>
                        </div>
                    )}

                    {campaign && (
                        <div className="space-y-6">
                            {campaign.map(day => (
                                <div key={day.day}>
                                    <div className="border-b border-brand-border pb-2 mb-4">
                                        <h3 className="text-lg font-bold">Day {day.day}: <span className="text-brand-primary">{day.theme}</span></h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {day.posts.map(post => (
                                            <div key={post.platform} className="bg-brand-bg rounded-lg p-4 flex flex-col">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2 font-bold">
                                                        <PlatformIcon platform={post.platform} />
                                                        {post.platform}
                                                    </div>
                                                    <CopyButton textToCopy={post.postContent} label="Copy Post" />
                                                </div>
                                                <p className="text-sm text-brand-text-secondary flex-grow mb-3 whitespace-pre-wrap">{post.postContent}</p>
                                                
                                                {post.platform === 'Instagram' && post.visualPrompt && (
                                                    <div className="text-xs italic bg-brand-surface p-2 rounded mb-3 border border-brand-border/50">
                                                        <strong>Visual Prompt:</strong> {post.visualPrompt}
                                                    </div>
                                                )}

                                                <div className="border-t border-brand-border pt-2 mt-auto">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-semibold">Hashtags</span>
                                                        <CopyButton textToCopy={post.hashtags.join(' ')} label="Copy Hashtags" />
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {post.hashtags.map((tag, i) => <span key={i} className="text-[10px] bg-brand-border px-1.5 py-0.5 rounded-full">{tag}</span>)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {campaign && (
                     <div className="p-4 border-t border-brand-border flex justify-center items-center gap-4 bg-brand-bg rounded-b-lg">
                        <button onClick={onGenerateCampaign} disabled={isLoading} className="w-full max-w-md mx-auto py-2 font-semibold bg-brand-primary/20 text-brand-primary rounded-md hover:bg-brand-primary/40 disabled:opacity-50">
                            {isLoading ? <div className="flex items-center justify-center gap-2"><LoadingSpinner /> Regenerating...</div> : 'Regenerate Social Posts'}
                        </button>
                         <button onClick={onOpenVideoTrailer} className="w-full max-w-md mx-auto py-2 font-semibold bg-brand-primary/20 text-brand-primary rounded-md hover:bg-brand-primary/40">
                             Generate Video Trailer
                         </button>
                    </div>
                )}
            </div>
        </div>
    );
};