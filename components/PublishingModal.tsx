import React, { useState, useEffect } from 'react';
import { BotIcon, ImageIcon, SparklesIcon } from './icons/IconDefs';

interface PublishingModalProps {
  isOpen: boolean;
  onClose: () => void;
  manuscript: string;
  coverArt: string | null;
  onGenerateBlurb: () => Promise<string>;
  onGenerateCoverArt: (prompt: string) => Promise<void>;
  onGenerateKeywords: () => Promise<string[]>;
  onOpenImageEditor: (image: string) => void;
}

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button onClick={handleCopy} className="text-xs text-brand-primary hover:underline disabled:opacity-50" disabled={!textToCopy}>
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
};

export const PublishingModal: React.FC<PublishingModalProps> = ({ isOpen, onClose, manuscript, coverArt, onGenerateBlurb, onGenerateCoverArt, onGenerateKeywords, onOpenImageEditor }) => {
    const [title, setTitle] = useState("My Awesome Book");
    const [author, setAuthor] = useState("A.I. Author");
    const [blurb, setBlurb] = useState("");
    const [keywords, setKeywords] = useState<string[]>([]);
    const [coverPrompt, setCoverPrompt] = useState("");

    const [isGeneratingBlurb, setIsGeneratingBlurb] = useState(false);
    const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
    const [isGeneratingCover, setIsGeneratingCover] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setBlurb(manuscript.substring(0, 400) + '...');
            // Reset other fields if needed
            setKeywords([]);
            setCoverPrompt('');
        }
    }, [isOpen, manuscript]);

    const handleGenBlurb = async () => {
        setIsGeneratingBlurb(true);
        try {
            setBlurb(await onGenerateBlurb());
        } catch (e) { alert("Failed to generate blurb."); }
        finally { setIsGeneratingBlurb(false); }
    };
    
    const handleGenKeywords = async () => {
        setIsGeneratingKeywords(true);
        try {
            setKeywords(await onGenerateKeywords());
        } catch (e) { alert("Failed to generate keywords."); }
        finally { setIsGeneratingKeywords(false); }
    };
    
    const handleGenCover = async () => {
        if (!coverPrompt) return;
        setIsGeneratingCover(true);
        try {
            await onGenerateCoverArt(coverPrompt);
        } catch (e) { alert("Failed to generate cover art."); }
        finally { setIsGeneratingCover(false); }
    };

    const handleDownloadCover = () => {
        if (!coverArt) return;
        const link = document.createElement('a');
        link.href = coverArt;
        link.download = 'cover-art.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 no-print" onClick={onClose}>
            <div className="bg-brand-surface rounded-lg shadow-2xl w-full max-w-4xl flex flex-col" style={{height: '90vh'}} onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <BotIcon className="w-8 h-8 text-brand-primary" />
                        <div>
                            <h2 className="text-xl font-bold">AI Publishing Assistant</h2>
                            <p className="text-sm text-brand-text-secondary">Prepare your assets for Amazon KDP.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text text-2xl leading-none">&times;</button>
                </div>

                <div className="flex-grow p-6 grid grid-cols-2 gap-6 overflow-y-auto">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b border-brand-border pb-2">Book Details</h3>
                        <div>
                            <label className="text-sm font-medium text-brand-text-secondary block mb-1">Book Title</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border border-brand-border rounded-md bg-brand-bg" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-brand-text-secondary block mb-1">Author Name</label>
                            <input type="text" value={author} onChange={e => setAuthor(e.target.value)} className="w-full p-2 border border-brand-border rounded-md bg-brand-bg" />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-brand-text-secondary">Book Description (Blurb)</label>
                                <div className="flex items-center gap-2">
                                    <CopyButton textToCopy={blurb} />
                                    <button onClick={handleGenBlurb} disabled={isGeneratingBlurb} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/40 disabled:opacity-50">
                                        <SparklesIcon className="w-3 h-3"/> {isGeneratingBlurb ? 'Generating...' : 'Generate'}
                                    </button>
                                </div>
                            </div>
                            <textarea rows={8} value={blurb} onChange={e => setBlurb(e.target.value)} className="w-full p-2 border border-brand-border rounded-md bg-brand-bg text-sm" />
                        </div>
                         <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-brand-text-secondary">KDP Keywords</label>
                                <div className="flex items-center gap-2">
                                    <CopyButton textToCopy={keywords.join(', ')} />
                                    <button onClick={handleGenKeywords} disabled={isGeneratingKeywords} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/40 disabled:opacity-50">
                                        <SparklesIcon className="w-3 h-3"/> {isGeneratingKeywords ? 'Generating...' : 'Generate'}
                                    </button>
                                </div>
                            </div>
                            <div className="p-2 border border-brand-border rounded-md bg-brand-bg min-h-[6rem]">
                                {isGeneratingKeywords ? <div className="flex justify-center items-center h-full"><LoadingSpinner /></div> : (
                                    <div className="flex flex-wrap gap-2">
                                        {keywords.map((kw, i) => <span key={i} className="text-xs bg-brand-border px-2 py-1 rounded-full">{kw}</span>)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Right Column */}
                    <div className="space-y-4">
                         <h3 className="text-lg font-semibold border-b border-brand-border pb-2">Cover Art</h3>
                         <div className="bg-brand-bg rounded-lg p-3 space-y-3">
                            <div className="flex justify-center items-center aspect-[3/4] bg-brand-border rounded-md relative overflow-hidden">
                                {isGeneratingCover && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><LoadingSpinner /></div>}
                                {coverArt ? (
                                <img src={coverArt} alt="Book Cover" className="w-full h-full object-contain" />
                                ) : (
                                <ImageIcon className="w-10 h-10 text-brand-text-secondary" />
                                )}
                            </div>
                         </div>
                         <div className="bg-brand-bg rounded-lg p-3 space-y-2">
                             <label className="text-sm font-medium text-brand-text-secondary">AI Cover Art Prompt</label>
                             <textarea 
                                rows={3} 
                                value={coverPrompt}
                                onChange={e => setCoverPrompt(e.target.value)}
                                placeholder="e.g., 'An epic fantasy landscape with a dragon flying over a castle, digital art'" 
                                className="w-full p-2 text-sm border border-brand-border rounded-md bg-brand-surface resize-none"
                            />
                            <div className="flex gap-2">
                                <button onClick={handleGenCover} disabled={isGeneratingCover || !coverPrompt} className="w-full flex items-center justify-center gap-2 py-2 font-semibold bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover disabled:opacity-50">
                                    <SparklesIcon className="w-5 h-5"/> {isGeneratingCover ? 'Generating...' : 'Generate Cover'}
                                </button>
                                <button onClick={() => onOpenImageEditor(coverArt!)} disabled={!coverArt} className="w-full py-2 font-semibold bg-brand-border text-brand-text rounded-md hover:bg-brand-border/70 disabled:opacity-50">
                                    Edit Image
                                </button>
                            </div>
                            <button onClick={handleDownloadCover} disabled={!coverArt} className="w-full py-2 font-semibold bg-brand-border text-brand-text rounded-md hover:bg-brand-border/70 disabled:opacity-50">
                                Download Cover
                            </button>
                         </div>
                    </div>
                </div>

                <div className="p-4 border-t border-brand-border text-center bg-brand-bg rounded-b-lg">
                    <p className="text-xs text-brand-text-secondary mb-3">When you have all your assets ready, proceed to the official KDP website to complete publishing.</p>
                     <button
                        onClick={() => window.open('https://kdp.amazon.com/', '_blank')}
                        className="w-full max-w-md mx-auto py-3 rounded-lg text-white font-semibold transition-colors bg-green-600 hover:bg-green-500"
                    >
                        Proceed to Amazon KDP
                    </button>
                </div>
            </div>
        </div>
    );
};