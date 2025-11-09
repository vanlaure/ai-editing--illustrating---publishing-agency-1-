import React, { useState, useRef, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { WorldBible, Character, Setting, Item } from '../types';
import { BookOpenIcon, UserPlusIcon, MapPinIcon, GemIcon, UserIcon, FileUpIcon, XCircleIcon, ChevronDownIcon, SearchIcon, PlusIcon } from './icons/IconDefs';
import { backendClient } from '../services/backendClient';

// Configure pdf.js worker
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.4.168/build/pdf.worker.mjs`;

interface WorldBibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldBible: WorldBible;
  onUpdate: (updatedBible: WorldBible) => void;
  isExtracting: boolean;
  extractionStatus: 'idle' | 'extracting' | 'success' | 'error';
  onExtractFromDocuments: () => void;
}

type Tab = 'characters' | 'settings' | 'items';

async function extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async () => {
            try {
                if (file.type === 'text/plain') {
                    resolve(reader.result as string);
                } else if (file.type === 'application/pdf') {
                    const arrayBuffer = reader.result as ArrayBuffer;
                    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
                    let textContent = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const text = await page.getTextContent();
                        textContent += text.items.map(item => 'str' in item ? item.str : '').join(' ') + '\n';
                    }
                    resolve(textContent);
                } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    const arrayBuffer = reader.result as ArrayBuffer;
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    resolve(result.value);
                } else {
                    reject(new Error(`Unsupported file type: ${file.type}`));
                }
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(reader.error);

        if (file.type === 'text/plain') {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
}

const WorldBibleTab: React.FC<{
    title: string;
    items: (Character | Setting | Item)[];
    onAdd: (name: string, description: string) => void;
    onDelete: (id: string) => void;
    Icon: React.FC<any>;
}> = ({ title, items, onAdd, onDelete, Icon }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const query = searchQuery.toLowerCase();
        return items.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        );
    }, [items, searchQuery]);

    const handleAdd = () => {
        if (name.trim() && description.trim()) {
            onAdd(name, description);
            setName('');
            setDescription('');
            setIsAddFormOpen(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Search and Add Header */}
            <div className="p-4 space-y-3 bg-brand-bg border-b border-brand-border">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={`Search ${title.toLowerCase()}...`}
                            className="w-full pl-10 pr-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddFormOpen(!isAddFormOpen)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add
                    </button>
                </div>

                {/* Collapsible Add Form */}
                {isAddFormOpen && (
                    <div className="space-y-2 p-3 bg-brand-surface rounded-lg border border-brand-border animate-fade-in">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-5 h-5 text-brand-primary" />
                            <h4 className="text-sm font-semibold">New {title.slice(0, -1)}</h4>
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Name"
                            className="w-full px-3 py-2 text-sm border border-brand-border rounded-md bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                        />
                        <textarea
                            rows={3}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Description"
                            className="w-full px-3 py-2 text-sm border border-brand-border rounded-md bg-brand-bg resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAdd}
                                disabled={!name.trim() || !description.trim()}
                                className="flex-1 py-2 text-sm font-semibold bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Add {title.slice(0, -1)}
                            </button>
                            <button
                                onClick={() => {
                                    setIsAddFormOpen(false);
                                    setName('');
                                    setDescription('');
                                }}
                                className="px-4 py-2 text-sm font-semibold text-brand-text-secondary hover:text-brand-text border border-brand-border rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Icon className="w-16 h-16 text-brand-text-secondary/30 mb-3" />
                        <p className="text-sm font-medium text-brand-text-secondary">
                            {searchQuery ? 'No matching items found' : `No ${title.toLowerCase()} added yet`}
                        </p>
                        {!searchQuery && !isAddFormOpen && (
                            <button
                                onClick={() => setIsAddFormOpen(true)}
                                className="mt-3 text-sm text-brand-primary hover:underline"
                            >
                                Add your first {title.slice(0, -1).toLowerCase()}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="group bg-brand-bg rounded-lg p-4 border border-brand-border hover:border-brand-primary/50 transition-all"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="mt-1 p-2 bg-brand-surface rounded-lg">
                                            <Icon className="w-4 h-4 text-brand-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-brand-text mb-1 truncate">{item.name}</h4>
                                            <p className="text-sm text-brand-text-secondary leading-relaxed whitespace-pre-wrap break-words">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onDelete(item.id)}
                                        className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-500 font-medium transition-opacity px-2 py-1 rounded hover:bg-red-400/10"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Items Count */}
            {items.length > 0 && (
                <div className="px-4 py-2 border-t border-brand-border bg-brand-bg">
                    <p className="text-xs text-brand-text-secondary text-center">
                        {filteredItems.length === items.length
                            ? `${items.length} ${title.toLowerCase()}`
                            : `${filteredItems.length} of ${items.length} ${title.toLowerCase()}`
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

const TabButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    Icon: React.FC<any>;
    count: number;
}> = ({label, isActive, onClick, Icon, count}) => (
    <button
        onClick={onClick}
        className={`
            flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold
            border-b-2 transition-all relative
            ${isActive
                ? 'text-brand-primary border-brand-primary bg-brand-primary/5'
                : 'text-brand-text-secondary border-transparent hover:text-brand-text hover:bg-brand-bg'
            }
        `}
    >
        <Icon className="w-5 h-5" />
        {label}
        {count > 0 && (
            <span className={`
                px-2 py-0.5 text-xs font-bold rounded-full
                ${isActive
                    ? 'bg-brand-primary text-white'
                    : 'bg-brand-text-secondary/20 text-brand-text-secondary'
                }
            `}>
                {count}
            </span>
        )}
    </button>
);

export const WorldBibleModal: React.FC<WorldBibleModalProps> = ({
    isOpen, onClose, worldBible, onUpdate,
    isExtracting, extractionStatus, onExtractFromDocuments
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('characters');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [contextFiles, setContextFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (!isOpen) {
            setContextFiles([]); // Clear files when modal closes
        }
    }, [isOpen]);

    useEffect(() => {
        const readFiles = async () => {
            if (contextFiles.length === 0) {
                if (worldBible.seriesContext !== '') {
                    onUpdate({ ...worldBible, seriesContext: '' });
                }
                setProcessingStatus('idle');
                setIsProcessing(false);
                return;
            }

            setIsProcessing(true);
            setProcessingStatus('processing');

            try {
                const fileContents = await Promise.all(
                    contextFiles.map(file => extractTextFromFile(file))
                );

                const combinedText = fileContents.join('\n\n--- End of Document ---\n\n');
                onUpdate({ ...worldBible, seriesContext: combinedText });
                
                setProcessingStatus('success');
                setTimeout(() => setIsProcessing(false), 2000);
            } catch (err: any) {
                console.error("Error reading context files:", err);
                setProcessingStatus('error');
                setTimeout(() => setIsProcessing(false), 3000);
                alert(`Failed to read a file. Please ensure it's a supported format (.txt, .pdf, .docx) and not corrupted. Error: ${err.message}`);
            }
        };

        readFiles();
    }, [contextFiles, onUpdate, worldBible]);

    if (!isOpen) return null;

    const handleAdd = (tab: Tab, name: string, description: string) => {
        const newItem = { id: uuidv4(), name, description };
        const updatedBible = {
            ...worldBible,
            [tab]: [...worldBible[tab], newItem]
        };
        onUpdate(updatedBible);
    };

    const handleDelete = (tab: Tab, id: string) => {
        const updatedBible = {
            ...worldBible,
            [tab]: worldBible[tab].filter(item => item.id !== id)
        };
        onUpdate(updatedBible);
    };
    
    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) return;
        const supportedTypes = [
            'text/plain', 
            'application/pdf', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        const uniqueNewFiles = Array.from(newFiles).filter(
          (newFile) =>
            supportedTypes.includes(newFile.type) &&
            !contextFiles.some((existingFile) => existingFile.name === newFile.name)
        );
        if (uniqueNewFiles.length > 0) {
          setContextFiles((prevFiles) => [...prevFiles, ...uniqueNewFiles]);
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };
    const handleRemoveFile = (indexToRemove: number) => {
        setContextFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    const totalItems = worldBible.characters.length + worldBible.settings.length + worldBible.items.length;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 no-print p-4" onClick={onClose}>
            <div className="bg-brand-surface rounded-xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden" style={{height: '90vh'}} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-brand-border bg-gradient-to-r from-brand-bg to-brand-surface">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-primary/10 rounded-lg">
                                <BookOpenIcon className="w-7 h-7 text-brand-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-brand-text">World Bible</h2>
                                <p className="text-sm text-brand-text-secondary mt-0.5">
                                    {totalItems === 0 ? 'Start building your continuity bible' : `${totalItems} items in your continuity bible`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg rounded-lg transition-colors"
                        >
                            <XCircleIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Bible Entries */}
                    <div className="flex-1 flex flex-col border-r border-brand-border">
                        {/* Tabs */}
                        <div className="border-b border-brand-border flex bg-brand-bg">
                            <TabButton
                                label="Characters"
                                Icon={UserIcon}
                                count={worldBible.characters.length}
                                isActive={activeTab === 'characters'}
                                onClick={() => setActiveTab('characters')}
                            />
                            <TabButton
                                label="Settings"
                                Icon={MapPinIcon}
                                count={worldBible.settings.length}
                                isActive={activeTab === 'settings'}
                                onClick={() => setActiveTab('settings')}
                            />
                            <TabButton
                                label="Items"
                                Icon={GemIcon}
                                count={worldBible.items.length}
                                isActive={activeTab === 'items'}
                                onClick={() => setActiveTab('items')}
                            />
                        </div>
                        
                        {/* Tab Content */}
                        {activeTab === 'characters' && (
                            <WorldBibleTab
                                title="Characters"
                                items={worldBible.characters}
                                onAdd={(n, d) => handleAdd('characters', n, d)}
                                onDelete={(id) => handleDelete('characters', id)}
                                Icon={UserPlusIcon}
                            />
                        )}
                        {activeTab === 'settings' && (
                            <WorldBibleTab
                                title="Settings"
                                items={worldBible.settings}
                                onAdd={(n, d) => handleAdd('settings', n, d)}
                                onDelete={(id) => handleDelete('settings', id)}
                                Icon={MapPinIcon}
                            />
                        )}
                        {activeTab === 'items' && (
                            <WorldBibleTab
                                title="Items"
                                items={worldBible.items}
                                onAdd={(n, d) => handleAdd('items', n, d)}
                                onDelete={(id) => handleDelete('items', id)}
                                Icon={GemIcon}
                            />
                        )}
                    </div>

                    {/* Right Panel - Series Context */}
                    <div className="w-96 flex flex-col bg-brand-bg">
                        <div className="px-4 py-4 border-b border-brand-border">
                            <div className="flex items-center gap-2 mb-2">
                                <FileUpIcon className="w-5 h-5 text-brand-primary" />
                                <h3 className="text-lg font-semibold text-brand-text">Series Context</h3>
                            </div>
                            <p className="text-xs text-brand-text-secondary leading-relaxed">
                                Upload reference documents to maintain consistency across your series. AI will use these for continuity checking.
                            </p>
                        </div>
                        
                        <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
                            {/* Upload Area */}
                            <div
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                                    flex flex-col items-center justify-center p-8
                                    border-2 border-dashed rounded-xl cursor-pointer
                                    transition-all duration-200
                                    ${isDragging
                                        ? 'border-brand-primary bg-brand-primary/10 scale-[1.02]'
                                        : 'border-brand-border hover:border-brand-primary/50 hover:bg-brand-surface'
                                    }
                                `}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".txt,.pdf,.docx"
                                    className="hidden"
                                    onChange={(e) => handleFiles(e.target.files)}
                                />
                                <FileUpIcon className={`w-12 h-12 mb-3 transition-colors ${isDragging ? 'text-brand-primary' : 'text-brand-text-secondary'}`} />
                                <p className="text-sm font-semibold text-brand-text mb-1">
                                    {isDragging ? 'Drop files here' : 'Drag & drop files'}
                                </p>
                                <p className="text-xs text-brand-text-secondary text-center">
                                    or click to browse<br />
                                    <span className="text-[10px]">Supports .txt, .pdf, .docx</span>
                                </p>
                            </div>
                            
                            {/* Document List */}
                            <div className="flex-1 overflow-y-auto">
                                {contextFiles.length > 0 ? (
                                    <>
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-sm font-semibold text-brand-text">
                                                Documents ({contextFiles.length})
                                            </h4>
                                            <button
                                                onClick={() => setContextFiles([])}
                                                className="text-xs text-red-400 hover:text-red-500 font-medium px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                        
                                        {/* Processing Status */}
                                        {isProcessing && (
                                            <div className={`
                                                mb-3 p-3 rounded-lg border flex items-center gap-3
                                                ${processingStatus === 'processing' ? 'bg-blue-500/10 border-blue-500/30' : ''}
                                                ${processingStatus === 'success' ? 'bg-green-500/10 border-green-500/30' : ''}
                                                ${processingStatus === 'error' ? 'bg-red-500/10 border-red-500/30' : ''}
                                            `}>
                                                {processingStatus === 'processing' && (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-blue-400">Processing documents...</p>
                                                            <p className="text-xs text-blue-400/70">AI is extracting text for continuity analysis</p>
                                                        </div>
                                                    </>
                                                )}
                                                {processingStatus === 'success' && (
                                                    <>
                                                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-green-400">Documents processed!</p>
                                                            <p className="text-xs text-green-400/70">Ready for AI continuity checking</p>
                                                        </div>
                                                    </>
                                                )}
                                                {processingStatus === 'error' && (
                                                    <>
                                                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-red-400">Processing failed</p>
                                                            <p className="text-xs text-red-400/70">Check file format and try again</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Extraction Status */}
                                        {isExtracting && (
                                            <div className={`
                                                mb-3 p-3 rounded-lg border flex items-center gap-3
                                                ${extractionStatus === 'extracting' ? 'bg-purple-500/10 border-purple-500/30' : ''}
                                                ${extractionStatus === 'success' ? 'bg-green-500/10 border-green-500/30' : ''}
                                                ${extractionStatus === 'error' ? 'bg-red-500/10 border-red-500/30' : ''}
                                            `}>
                                                {extractionStatus === 'extracting' && (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-purple-400">Extracting data...</p>
                                                            <p className="text-xs text-purple-400/70">AI is analyzing documents for characters, settings, and items</p>
                                                        </div>
                                                    </>
                                                )}
                                                {extractionStatus === 'success' && (
                                                    <>
                                                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-green-400">Extraction complete!</p>
                                                            <p className="text-xs text-green-400/70">Bible entries added successfully</p>
                                                        </div>
                                                    </>
                                                )}
                                                {extractionStatus === 'error' && (
                                                    <>
                                                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-red-400">Extraction failed</p>
                                                            <p className="text-xs text-red-400/70">Check console for details</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        
                                        <div className="space-y-2">
                                            {contextFiles.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="group flex items-center gap-3 bg-brand-surface p-3 rounded-lg border border-brand-border hover:border-brand-primary/50 transition-all animate-fade-in"
                                                >
                                                    <div className="p-2 bg-brand-bg rounded">
                                                        <FileUpIcon className="w-4 h-4 text-brand-primary" />
                                                    </div>
                                                    <span className="flex-1 text-sm text-brand-text truncate font-medium">
                                                        {file.name}
                                                    </span>
                                                    <button
                                                        onClick={() => handleRemoveFile(index)}
                                                        className="opacity-0 group-hover:opacity-100 text-brand-text-secondary hover:text-red-500 transition-opacity p-1 rounded hover:bg-red-400/10"
                                                    >
                                                        <XCircleIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Extract Button */}
                                        <button
                                            onClick={onExtractFromDocuments}
                                            disabled={isExtracting || processingStatus === 'processing'}
                                            className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isExtracting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Extracting...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                    </svg>
                                                    Extract from Documents
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                        <div className="p-4 bg-brand-surface rounded-full mb-3">
                                            <FileUpIcon className="w-8 h-8 text-brand-text-secondary/50" />
                                        </div>
                                        <p className="text-sm font-medium text-brand-text-secondary mb-1">
                                            No context documents
                                        </p>
                                        <p className="text-xs text-brand-text-secondary/70">
                                            Add previous books or notes<br />to maintain series continuity
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};