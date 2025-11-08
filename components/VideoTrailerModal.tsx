import React, { useState, useEffect, useRef } from 'react';
import { VideoIcon, SparklesIcon } from './icons/IconDefs';

interface VideoTrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  manuscript: string;
  onGenerateVideo: (prompt: string, aspectRatio: '16:9' | '9:16') => Promise<any>;
  onGetVideoStatus: (operation: any) => Promise<any>;
  onGeneratePrompt: (manuscript: string) => Promise<string>;
}

type GenerationStatus = 'idle' | 'checkingKey' | 'prompting' | 'generating' | 'polling' | 'success' | 'error';

const LOADING_MESSAGES = [
    "Warming up the cameras...",
    "Scouting digital locations...",
    "Casting virtual actors...",
    "Director is reviewing the script...",
    "Action! Rendering the first scenes...",
    "Adding special effects...",
    "Compositing shots...",
    "Sound mixing in progress...",
    "Color grading the footage...",
    "Polishing the final cut..."
];

const VideoLoadingSpinner: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 font-semibold text-lg">{message}</p>
        <p className="text-sm text-brand-text-secondary">This can take a few minutes. Please keep this modal open.</p>
    </div>
);

export const VideoTrailerModal: React.FC<VideoTrailerModalProps> = ({ isOpen, onClose, manuscript, onGenerateVideo, onGetVideoStatus, onGeneratePrompt }) => {
    const [status, setStatus] = useState<GenerationStatus>('idle');
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);

    const poller = useRef<number>();
    const messageChanger = useRef<number>();

    useEffect(() => {
        if (!isOpen) {
            clearInterval(poller.current);
            clearInterval(messageChanger.current);
            return;
        }
        
        setStatus('checkingKey');
        setError(null);
        setVideoUrl(null);

        // @ts-ignore
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            // @ts-ignore
            window.aistudio.hasSelectedApiKey().then((hasKey: boolean) => {
                setApiKeySelected(hasKey);
                setStatus(hasKey ? 'prompting' : 'idle');
                if (hasKey) {
                    handleGeneratePrompt();
                }
            });
        } else {
             // Fallback for environments where aistudio is not available
            console.warn('aistudio API not found. Assuming API key is set.');
            setApiKeySelected(true);
            setStatus('prompting');
            handleGeneratePrompt();
        }

    }, [isOpen, onGeneratePrompt, manuscript]);

    useEffect(() => {
        if (status === 'polling') {
            messageChanger.current = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = LOADING_MESSAGES.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
                    return LOADING_MESSAGES[nextIndex];
                });
            }, 4000);
        } else {
            clearInterval(messageChanger.current);
        }
        return () => clearInterval(messageChanger.current);
    }, [status]);


    const handleGeneratePrompt = async () => {
        setPrompt('Generating a compelling prompt...');
        try {
            const generatedPrompt = await onGeneratePrompt(manuscript);
            setPrompt(generatedPrompt);
        } catch (e) {
            setPrompt('Could not generate a prompt. Please write one manually.');
        }
    };
    
    const handleSelectKey = async () => {
        // @ts-ignore
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            try {
                // @ts-ignore
                await window.aistudio.openSelectKey();
                // Assume success and proceed. The API call will fail if the key is invalid.
                setApiKeySelected(true);
                setStatus('prompting');
                handleGeneratePrompt();
            } catch (e) {
                console.error("Error opening select key dialog", e);
            }
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setStatus('generating');
        setError(null);
        setVideoUrl(null);
        setLoadingMessage(LOADING_MESSAGES[0]);

        try {
            let operation = await onGenerateVideo(prompt, aspectRatio);
            setStatus('polling');

            poller.current = window.setInterval(async () => {
                try {
                    operation = await onGetVideoStatus(operation);
                    if (operation.done) {
                        clearInterval(poller.current);
                        if (operation.response?.generatedVideos?.[0]?.video?.uri) {
                            const downloadLink = operation.response.generatedVideos[0].video.uri;
                            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                            const blob = await response.blob();
                            setVideoUrl(URL.createObjectURL(blob));
                            setStatus('success');
                        } else {
                            throw new Error('Video generation finished but no video URI was found.');
                        }
                    }
                } catch (pollError: any) {
                    clearInterval(poller.current);
                    if (pollError.message?.includes("Requested entity was not found.")) {
                        setError("API Key error. The selected key may be invalid or lack permissions for the Veo API.");
                        setStatus('error');
                        setApiKeySelected(false); // Reset key state
                    } else {
                        setError('An error occurred while checking video status.');
                        setStatus('error');
                    }
                }
            }, 10000);

        } catch (initialError: any) {
             if (initialError.message?.includes("API key not valid")) {
                setError("API Key error. The selected key is invalid. Please select a valid one.");
                setStatus('error');
                setApiKeySelected(false);
            } else {
                setError('Failed to start video generation.');
                setStatus('error');
            }
        }
    };

    const renderContent = () => {
        if (!apiKeySelected) {
            return (
                <div className="text-center">
                    <h3 className="text-lg font-semibold">API Key Required</h3>
                    <p className="text-sm text-brand-text-secondary my-2">The Veo video generation model requires you to use your own API key. Please select a key to continue.</p>
                    <p className="text-xs text-brand-text-secondary mb-4">For more information on billing, visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-brand-primary underline">ai.google.dev/gemini-api/docs/billing</a>.</p>
                    <button onClick={handleSelectKey} className="px-4 py-2 rounded-md font-semibold bg-brand-primary text-white hover:bg-brand-primary-hover">
                        Select API Key
                    </button>
                </div>
            )
        }
        
        if (status === 'generating' || status === 'polling') {
            return <VideoLoadingSpinner message={loadingMessage} />;
        }

        if (status === 'success' && videoUrl) {
            return (
                <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">Your Book Trailer is Ready!</h3>
                    <video key={videoUrl} controls className={`w-full rounded-lg bg-black aspect-video object-contain`}>
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <div className="mt-4 flex gap-2 justify-center">
                        <a href={videoUrl} download="book-trailer.mp4" className="px-4 py-2 w-40 text-center rounded-md font-semibold bg-green-600 text-white hover:bg-green-500">
                            Download
                        </a>
                        <button onClick={handleGenerate} className="px-4 py-2 w-40 rounded-md font-semibold bg-brand-border hover:bg-brand-border/70">
                            Regenerate
                        </button>
                    </div>
                </div>
            );
        }

         if (status === 'error') {
            return (
                <div className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg">
                    <h3 className="font-bold">Generation Failed</h3>
                    <p className="text-sm">{error}</p>
                    <button onClick={() => setStatus('prompting')} className="mt-4 px-4 py-2 rounded-md font-semibold bg-brand-primary text-white hover:bg-brand-primary-hover">
                        Try Again
                    </button>
                </div>
            )
        }
        
        return (
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                         <label className="text-sm font-medium text-brand-text-secondary block">Video Prompt</label>
                         <button onClick={handleGeneratePrompt} className="text-xs text-brand-primary hover:underline">
                            <SparklesIcon className="w-4 h-4 inline-block mr-1"/>
                            Regenerate Prompt
                         </button>
                    </div>
                    <textarea 
                        rows={4} 
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="e.g., 'Cinematic shot of a lone spaceship drifting through a vibrant nebula...'" 
                        className="w-full p-2 text-sm border border-brand-border rounded-md bg-brand-bg resize-none"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-brand-text-secondary block mb-2">Aspect Ratio</label>
                    <div className="flex gap-2">
                        <button onClick={() => setAspectRatio('16:9')} className={`flex-1 p-2 rounded-md border-2 ${aspectRatio === '16:9' ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border bg-brand-bg'}`}>
                            16:9 (Landscape)
                        </button>
                        <button onClick={() => setAspectRatio('9:16')} className={`flex-1 p-2 rounded-md border-2 ${aspectRatio === '9:16' ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border bg-brand-bg'}`}>
                            9:16 (Portrait)
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 no-print" onClick={onClose}>
            <div className="bg-brand-surface rounded-lg shadow-2xl w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <VideoIcon className="w-8 h-8 text-brand-primary" />
                        <div>
                            <h2 className="text-xl font-bold">AI Book Trailer Generator</h2>
                            <p className="text-sm text-brand-text-secondary">Create a cinematic trailer for your book.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text text-2xl leading-none">&times;</button>
                </div>

                <div className="flex-grow p-6">
                    {renderContent()}
                </div>

                {(status === 'prompting' && apiKeySelected) && (
                    <div className="p-4 border-t border-brand-border bg-brand-bg/50 rounded-b-lg flex justify-end">
                        <button onClick={handleGenerate} disabled={!prompt} className="px-6 py-2 rounded-md font-semibold bg-brand-primary text-white hover:bg-brand-primary-hover disabled:bg-gray-500">
                            Generate Trailer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};