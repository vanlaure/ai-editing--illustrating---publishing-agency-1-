import React, { useState, useEffect } from 'react';
import { SparklesIcon, ImageIcon } from './icons/IconDefs';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseImage: string | null;
  onSave: (newImage: string) => void;
  onEditImage: (base64: string, prompt: string) => Promise<string>;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center h-full">
        <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, baseImage, onSave, onEditImage }) => {
    const [prompt, setPrompt] = useState('');
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            setEditedImage(null);
            setPrompt('');
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        if (!prompt || !baseImage) return;
        setIsLoading(true);
        setEditedImage(null);
        try {
            // The baseImage from props might have the `data:image/png;base64,` prefix
            const pureBase64 = baseImage.split(',')[1] || baseImage;
            const result = await onEditImage(pureBase64, prompt);
            setEditedImage(result);
        } catch (error) {
            console.error(error);
            alert('Failed to edit image.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (editedImage) {
            onSave(editedImage);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 no-print" onClick={onClose}>
            <div className="bg-brand-surface rounded-lg shadow-2xl w-full max-w-4xl flex flex-col" style={{height: '90vh'}} onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-8 h-8 text-brand-primary" />
                        <div>
                            <h2 className="text-xl font-bold">AI Image Editor</h2>
                            <p className="text-sm text-brand-text-secondary">Refine your image with text prompts.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text text-2xl leading-none">&times;</button>
                </div>

                <div className="flex-grow p-6 grid grid-cols-2 gap-6 overflow-y-auto">
                    {/* Left Column: Original Image */}
                    <div className="flex flex-col gap-4">
                         <h3 className="text-lg font-semibold text-center">Original</h3>
                         <div className="flex-grow bg-brand-bg rounded-lg p-3 flex justify-center items-center">
                            {baseImage ? (
                                <img src={baseImage} alt="Original" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <div className="text-center text-brand-text-secondary">
                                    <ImageIcon className="w-12 h-12 mx-auto" />
                                    <p>No image loaded.</p>
                                </div>
                            )}
                         </div>
                    </div>
                    {/* Right Column: Edited Image */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-semibold text-center">Edited Version</h3>
                         <div className="flex-grow bg-brand-bg rounded-lg p-3 flex justify-center items-center">
                            {isLoading && <LoadingSpinner />}
                            {!isLoading && editedImage && (
                                <img src={`data:image/png;base64,${editedImage}`} alt="Edited" className="max-w-full max-h-full object-contain" />
                            )}
                             {!isLoading && !editedImage && (
                                <div className="text-center text-brand-text-secondary">
                                    <SparklesIcon className="w-12 h-12 mx-auto" />
                                    <p>Your edited image will appear here.</p>
                                </div>
                            )}
                         </div>
                    </div>
                </div>

                <div className="p-4 border-t border-brand-border bg-brand-bg/50 rounded-b-lg space-y-3">
                    <div>
                        <label className="text-sm font-medium text-brand-text-secondary block mb-1">Editing Prompt</label>
                        <textarea 
                            rows={2} 
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="e.g., 'Add a retro filter' or 'Make the sky a vibrant sunset'" 
                            className="w-full p-2 text-sm border border-brand-border rounded-md bg-brand-surface resize-none"
                        />
                    </div>
                    <div className="flex justify-between items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-md font-semibold bg-brand-border hover:bg-brand-border/70">
                            Cancel
                        </button>
                        <div className="flex gap-2">
                             <button onClick={handleGenerate} disabled={isLoading || !prompt || !baseImage} className="w-48 flex items-center justify-center gap-2 py-2 font-semibold bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover disabled:opacity-50">
                                <SparklesIcon className="w-5 h-5"/> {isLoading ? 'Generating...' : 'Generate Edit'}
                            </button>
                            <button onClick={handleSave} disabled={!editedImage} className="px-6 py-2 rounded-md font-semibold bg-green-600 text-white hover:bg-green-500 disabled:opacity-50">
                                Accept & Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};