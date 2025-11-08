import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { WorldBible, Character, Setting, Item } from '../types';
import { BookOpenIcon, UserPlusIcon, MapPinIcon, GemIcon, UserIcon, FileUpIcon, XCircleIcon } from './icons/IconDefs';

// Configure pdf.js worker
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.4.168/build/pdf.worker.mjs`;

interface WorldBibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldBible: WorldBible;
  onUpdate: (updatedBible: WorldBible) => void;
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

    const handleAdd = () => {
        if (name.trim() && description.trim()) {
            onAdd(name, description);
            setName('');
            setDescription('');
        }
    };

    return (
        <div className="flex-grow flex flex-col overflow-hidden">
            <div className="p-4 border-b border-brand-border space-y-2 bg-brand-bg">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Icon className="w-5 h-5" /> Add New {title.slice(0, -1)}</h3>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Name"
                    className="w-full p-2 border border-brand-border rounded-md bg-brand-surface"
                />
                <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description"
                    className="w-full p-2 border border-brand-border rounded-md bg-brand-surface resize-none"
                />
                <button
                    onClick={handleAdd}
                    disabled={!name.trim() || !description.trim()}
                    className="w-full py-2 font-semibold bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover disabled:bg-gray-500"
                >
                    Add {title.slice(0, -1)}
                </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-2">
                {items.length === 0 ? (
                    <p className="text-sm text-center text-brand-text-secondary pt-8">No {title.toLowerCase()} added yet.</p>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="bg-brand-bg rounded-md p-3 text-sm">
                            <div className="flex justify-between items-start">
                                <p className="font-bold">{item.name}</p>
                                <button onClick={() => onDelete(item.id)} className="text-xs text-red-400 hover:underline">Delete</button>
                            </div>
                            <p className="text-xs text-brand-text-secondary mt-1 whitespace-pre-wrap">{item.description}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const TabButton: React.FC<{label:string, isActive:boolean, onClick:() => void, Icon: React.FC<any>}> = ({label, isActive, onClick, Icon}) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${isActive ? 'text-brand-primary border-brand-primary' : 'text-brand-text-secondary border-transparent hover:text-brand-text'}`}>
        <Icon className="w-5 h-5"/> {label}
    </button>
);

export const WorldBibleModal: React.FC<WorldBibleModalProps> = ({ isOpen, onClose, worldBible, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<Tab>('characters');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [contextFiles, setContextFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);

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
                return;
            }

            const fileContents = await Promise.all(
                contextFiles.map(file => extractTextFromFile(file))
            );

            const combinedText = fileContents.join('\n\n--- End of Document ---\n\n');
            onUpdate({ ...worldBible, seriesContext: combinedText });
        };

        readFiles().catch(err => {
            console.error("Error reading context files:", err);
            alert(`Failed to read a file. Please ensure it's a supported format (.txt, .pdf, .docx) and not corrupted. Error: ${err.message}`);
        });
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 no-print" onClick={onClose}>
            <div className="bg-brand-surface rounded-lg shadow-2xl w-full max-w-4xl flex flex-col" style={{height: '90vh'}} onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <BookOpenIcon className="w-8 h-8 text-brand-primary" />
                        <div>
                            <h2 className="text-xl font-bold">World Bible</h2>
                            <p className="text-sm text-brand-text-secondary">Manage your story's continuity bible.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text text-2xl leading-none">&times;</button>
                </div>
                
                <div className="flex-grow flex overflow-hidden">
                    <div className="w-1/2 flex flex-col border-r border-brand-border">
                        <div className="border-b border-brand-border flex">
                            <TabButton label="Characters" Icon={UserIcon} isActive={activeTab === 'characters'} onClick={() => setActiveTab('characters')} />
                            <TabButton label="Settings" Icon={MapPinIcon} isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                            <TabButton label="Items" Icon={GemIcon} isActive={activeTab === 'items'} onClick={() => setActiveTab('items')} />
                        </div>
                        
                        {activeTab === 'characters' && <WorldBibleTab title="Characters" items={worldBible.characters} onAdd={(n, d) => handleAdd('characters', n, d)} onDelete={(id) => handleDelete('characters', id)} Icon={UserPlusIcon} />}
                        {activeTab === 'settings' && <WorldBibleTab title="Settings" items={worldBible.settings} onAdd={(n, d) => handleAdd('settings', n, d)} onDelete={(id) => handleDelete('settings',id)} Icon={MapPinIcon} />}
                        {activeTab === 'items' && <WorldBibleTab title="Items" items={worldBible.items} onAdd={(n, d) => handleAdd('items', n, d)} onDelete={(id) => handleDelete('items', id)} Icon={GemIcon} />}
                    </div>
                    <div className="w-1/2 flex flex-col">
                        <div className="p-4 border-b border-brand-border">
                             <h3 className="text-lg font-semibold">Series Context</h3>
                             <p className="text-xs text-brand-text-secondary">Drag and drop context documents (.txt, .pdf, .docx) below. The AI will use their content for continuity checking.</p>
                        </div>
                        <div className="flex-grow p-4 flex flex-col gap-4 overflow-hidden">
                            <div
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border hover:border-brand-primary/50'}`}
                            >
                                <input ref={fileInputRef} type="file" multiple accept=".txt,.pdf,.docx" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                                <FileUpIcon className="w-8 h-8 text-brand-text-secondary mb-2" />
                                <p className="text-sm font-semibold">Drag & drop files here</p>
                                <p className="text-xs text-brand-text-secondary">or click to select .txt, .pdf, or .docx files</p>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto space-y-2 border-t border-brand-border pt-4">
                                {contextFiles.length > 0 && (
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-semibold">Context Documents</h4>
                                        <button onClick={() => setContextFiles([])} className="text-xs text-red-400 hover:underline">Clear All</button>
                                    </div>
                                )}
                                {contextFiles.length > 0 ? (
                                    contextFiles.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-brand-bg p-2 rounded-md animate-fade-in">
                                            <span className="text-sm truncate pr-2">{file.name}</span>
                                            <button onClick={() => handleRemoveFile(index)} className="text-brand-text-secondary hover:text-red-500">
                                                <XCircleIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-sm text-brand-text-secondary pt-4">No context documents added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};