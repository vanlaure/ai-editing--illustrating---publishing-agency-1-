import React, { useState } from 'react';
import { MoodboardImage, CharacterConcept, SceneIllustration, PanelLayout, Panel, ColorPalette, PaletteColor, StyleGuide, EnvironmentDesign, PropDesign, MapDesign, SymbolDesign, CoverDesign, PrintSpecs, RevisionFeedback, TypographyDesign } from '../types';
import {
  PaletteIcon,
  ImageIcon,
  ContactIcon,
  LightbulbIcon,
  LayersIcon,
  MapIcon,
  BookIcon,
  SettingsIcon,
  MessageSquareIcon
} from './icons/IconDefs';
import { CharacterSheetView } from './CharacterSheetView';
import { SceneManagementView } from './SceneManagementView';
import { PanelLayoutView } from './PanelLayoutView';
import { StyleLockView } from './StyleLockView';
import { WorldbuildingView } from './WorldbuildingView';
import { CoverDesignView } from './CoverDesignView';
import ProductionQCView from './ProductionQCView';
import ConceptPreProductionView from './ConceptPreProductionView';
import RevisionManagementView from './RevisionManagementView';

interface IllustrationViewProps {
    // Original Moodboard
    onGenerateMoodboard: (text: string) => void;
    moodboardImages: MoodboardImage[];
    isLoading: boolean;
    initialText: string;
    
    // Original Character Concepts
    onGenerateCharacterConcepts: (name: string, description: string) => void;
    isGeneratingConcepts: boolean;
    characterConcepts: CharacterConcept[];
    onSetReferenceImage: (characterId: string, imageUrl: string) => void;
    
    // Character Sheets (Expression/Pose/Variation/Turnaround)
    onGenerateExpression: (characterId: string, emotion: string) => Promise<void>;
    onGeneratePose: (characterId: string, poseName: string, description: string) => Promise<void>;
    onGenerateVariation: (characterId: string, variationName: string, description: string) => Promise<void>;
    onGenerateTurnaround: (characterId: string) => Promise<void>;
    
    // Scene Management
    scenes: SceneIllustration[];
    onGenerateScene: (sceneType: SceneIllustration['sceneType'], title: string, description: string, paletteId?: string) => Promise<void>;
    onDeleteScene: (sceneId: string) => void;
    
    // Panel Layouts
    panels: PanelLayout[];
    onCreateLayout: (layoutType: PanelLayout['layoutType'], title: string, description: string) => Promise<void>;
    onGeneratePanel: (layoutId: string, panelDescription: string, cameraAngle: Panel['cameraAngle']) => Promise<void>;
    onAddDialogue: (layoutId: string, panelId: string, speaker: string, text: string) => void;
    onAddSoundEffect: (layoutId: string, panelId: string, soundEffect: string) => void;
    onDeleteLayout: (layoutId: string) => void;
    
    // Style Lock
    colorPalettes: ColorPalette[];
    styleGuide: StyleGuide | null;
    onCreateStyleGuide: (artStyle: StyleGuide['artStyle'], lighting: StyleGuide['lighting'], linework: StyleGuide['linework'], notes: string) => Promise<void>;
    onUpdateStyleGuide: (updates: Partial<StyleGuide>) => void;
    onUploadReference: (file: File) => Promise<string>;
    onCreatePalette: (name: string, colors: PaletteColor[], purpose: ColorPalette['purpose'], notes: string) => Promise<void>;
    onDeletePalette: (paletteId: string) => void;
    
    // Worldbuilding
    environments: EnvironmentDesign[];
    props: PropDesign[];
    maps: MapDesign[];
    symbols: SymbolDesign[];
    onGenerateMap: (name: string, description: string, mapType: MapDesign['mapType']) => Promise<void>;
    onGenerateSymbol: (name: string, description: string, symbolType: string) => Promise<void>;
    onGenerateEnvironment: (name: string, description: string, environmentType: EnvironmentDesign['environmentType']) => Promise<void>;
    onGenerateProp: (name: string, description: string, propType: PropDesign['propType']) => Promise<void>;
    onDeleteMap: (mapId: string) => void;
    onDeleteSymbol: (symbolId: string) => void;
    onDeleteEnvironment: (environmentId: string) => void;
    onDeleteProp: (propId: string) => void;
    
    // Cover Design
    covers: CoverDesign[];
    onGenerateHeroImage: (coverId: string, prompt: string) => Promise<void>;
    onGenerateFullJacket: (coverId: string, prompt: string) => Promise<void>;
    onCreateTypography: (coverId: string, typography: TypographyDesign) => Promise<void>;
    onGenerateMarketingGraphic: (coverId: string, platform: string) => Promise<void>;
    onDeleteCover: (coverId: string) => void;
    
    // Production & QC
    printSpecs: PrintSpecs | null;
    onUpdatePrintSpecs: (specs: PrintSpecs) => void;
    onExportAsset: (assetId: string, format: string) => void;
    
    // Revisions
    revisions: RevisionFeedback[];
    onCreateRevision: (revision: Partial<RevisionFeedback>) => Promise<void>;
    onUpdateRevisionStatus: (id: string, status: RevisionFeedback['status']) => Promise<void>;
    onAddRevisionResponse: (feedbackId: string, message: string, author: 'author' | 'artist') => Promise<void>;
    onDeleteRevision: (id: string) => Promise<void>;
    
    // Shared loading state
    isGeneratingIllustration: boolean;
}

type MoodboardViewProps = Pick<IllustrationViewProps, 'onGenerateMoodboard' | 'moodboardImages' | 'isLoading' | 'initialText'>;
type CharacterDesignViewProps = Pick<IllustrationViewProps, 'onGenerateCharacterConcepts' | 'isGeneratingConcepts' | 'characterConcepts' | 'onSetReferenceImage'>;

const IllustrationLoadingSpinner: React.FC<{text: string}> = ({ text }) => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 font-semibold">{text}</p>
        <p className="text-sm text-brand-text-secondary">The AI is working its magic.</p>
    </div>
);

const IllustrationTabButton: React.FC<{label:string, isActive:boolean, onClick:() => void, Icon: React.FC<any>}> = ({label, isActive, onClick, Icon}) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${isActive ? 'text-brand-primary border-brand-primary bg-brand-surface' : 'text-brand-text-secondary border-transparent hover:bg-brand-border/50'}`}>
        <Icon className="w-5 h-5"/> {label}
    </button>
);

const MoodboardView: React.FC<MoodboardViewProps> = 
({ onGenerateMoodboard, moodboardImages, isLoading, initialText }) => {
    const [text, setText] = useState(initialText);

    return (
        <div className="flex-grow grid grid-cols-12 gap-6 overflow-hidden">
            <div className="col-span-4 flex flex-col gap-4">
                <div className="p-4 bg-brand-surface rounded-lg border border-brand-border flex-grow flex flex-col">
                    <h2 className="text-xl font-semibold mb-2">1. Story Visualization</h2>
                    <p className="text-sm text-brand-text-secondary mb-4">Paste a chapter or scene. The AI will generate a visual mood board to establish the look and feel.</p>
                    <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your manuscript excerpt here..." className="w-full flex-grow p-2 border border-brand-border rounded-md bg-brand-bg resize-none text-sm"/>
                    <button onClick={() => onGenerateMoodboard(text)} disabled={isLoading || !text.trim()} className="w-full mt-4 flex items-center justify-center gap-2 py-2 font-semibold bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover disabled:opacity-50">
                        <PaletteIcon className="w-5 h-5" />
                        {isLoading ? 'Generating...' : 'Generate Mood Board'}
                    </button>
                </div>
            </div>
            <div className="col-span-8 bg-brand-surface rounded-lg border border-brand-border flex flex-col">
                <h2 className="text-xl font-semibold p-4 border-b border-brand-border">2. Generated Mood Board</h2>
                <div className="flex-grow p-4 overflow-y-auto">
                    {isLoading && <IllustrationLoadingSpinner text="Generating mood board..." />}
                    {!isLoading && moodboardImages.length === 0 && <div className="flex items-center justify-center h-full text-center text-brand-text-secondary"><p>Your generated concept art will appear here.</p></div>}
                    {!isLoading && moodboardImages.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {moodboardImages.map((image, index) => (
                                <div key={index} className="bg-brand-bg rounded-lg overflow-hidden group">
                                    <div className="aspect-video bg-brand-border flex items-center justify-center"><img src={image.imageUrl} alt={image.prompt} className="w-full h-full object-cover" /></div>
                                    <p className="text-xs text-brand-text-secondary p-2 italic">"{image.prompt}"</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CharacterDesignView: React.FC<CharacterDesignViewProps> = 
({ onGenerateCharacterConcepts, isGeneratingConcepts, characterConcepts, onSetReferenceImage }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const latestConcept = characterConcepts.length > 0 ? characterConcepts[characterConcepts.length - 1] : null;

    const handleGenerate = () => {
        if (name.trim() && description.trim()) {
            onGenerateCharacterConcepts(name, description);
        }
    };
    
    return (
        <div className="flex-grow grid grid-cols-12 gap-6 overflow-hidden">
            <div className="col-span-4 flex flex-col gap-4">
                <div className="p-4 bg-brand-surface rounded-lg border border-brand-border flex flex-col">
                    <h2 className="text-xl font-semibold mb-2">1. Character Details</h2>
                    <p className="text-sm text-brand-text-secondary mb-4">Describe your character. The AI will generate four visual concepts to choose from.</p>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Character Name" className="w-full p-2 border border-brand-border rounded-md bg-brand-bg text-sm mb-2"/>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., A grizzled space marine with a cybernetic eye and a scar across his cheek..." rows={5} className="w-full p-2 border border-brand-border rounded-md bg-brand-bg resize-none text-sm"/>
                    <button onClick={handleGenerate} disabled={isGeneratingConcepts || !name.trim() || !description.trim()} className="w-full mt-4 flex items-center justify-center gap-2 py-2 font-semibold bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover disabled:opacity-50">
                        <ContactIcon className="w-5 h-5" />
                        {isGeneratingConcepts ? 'Generating...' : 'Generate Concepts'}
                    </button>
                </div>
                <div className="p-4 bg-brand-surface rounded-lg border border-brand-border flex-grow flex flex-col">
                    <h2 className="text-lg font-semibold mb-2">Character Library</h2>
                    <div className="flex-grow overflow-y-auto space-y-2 pr-1">
                        {characterConcepts.length === 0 ? <p className="text-sm text-brand-text-secondary text-center pt-4">Your created characters will appear here.</p> :
                            characterConcepts.map(char => (
                                <div key={char.id} className="flex items-center gap-3 bg-brand-bg p-2 rounded-md">
                                    <div className="w-12 h-16 bg-brand-border rounded flex-shrink-0">
                                        {char.referenceImageUrl && <img src={char.referenceImageUrl} alt={char.name} className="w-full h-full object-cover rounded"/>}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{char.name}</p>
                                        <p className="text-xs text-brand-text-secondary truncate">{char.description}</p>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
            <div className="col-span-8 bg-brand-surface rounded-lg border border-brand-border flex flex-col">
                <h2 className="text-xl font-semibold p-4 border-b border-brand-border">2. Concept Generation</h2>
                <div className="flex-grow p-4 overflow-y-auto">
                    {isGeneratingConcepts && <IllustrationLoadingSpinner text="Generating character concepts..." />}
                    {!isGeneratingConcepts && !latestConcept && <div className="flex items-center justify-center h-full text-center text-brand-text-secondary"><p>Generated character concepts will appear here.</p></div>}
                    {!isGeneratingConcepts && latestConcept && (
                        <div>
                             <h3 className="font-semibold mb-2">Concepts for: <span className="text-brand-primary">{latestConcept.name}</span></h3>
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {latestConcept.conceptImages.map((imageUrl, index) => (
                                    <div key={index} className="bg-brand-bg rounded-lg overflow-hidden group">
                                        <div className="aspect-[3/4] bg-brand-border flex items-center justify-center">
                                             <img src={imageUrl} alt={`Concept ${index + 1} for ${latestConcept.name}`} className="w-full h-full object-cover"/>
                                        </div>
                                        <button onClick={() => onSetReferenceImage(latestConcept.id, imageUrl)} className="w-full text-center py-1.5 text-xs bg-brand-border hover:bg-brand-primary/20 transition-colors">
                                            Set as Reference
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const IllustrationView: React.FC<IllustrationViewProps> = (props) => {
    type TabId = 'concept' | 'moodboard' | 'character' | 'characterSheets' | 'scenes' | 'panels' | 'styleLock' | 'worldbuilding' | 'covers' | 'production' | 'revisions';
    const [activeTab, setActiveTab] = useState<TabId>('concept');

    const tabs = [
        { id: 'concept' as const, label: 'Concept', Icon: LightbulbIcon },
        { id: 'moodboard' as const, label: 'Mood Board', Icon: PaletteIcon },
        { id: 'character' as const, label: 'Character Design', Icon: ContactIcon },
        { id: 'characterSheets' as const, label: 'Character Sheets', Icon: ContactIcon },
        { id: 'scenes' as const, label: 'Scenes', Icon: ImageIcon },
        { id: 'panels' as const, label: 'Panels', Icon: LayersIcon },
        { id: 'styleLock' as const, label: 'Style Lock', Icon: PaletteIcon },
        { id: 'worldbuilding' as const, label: 'Worldbuilding', Icon: MapIcon },
        { id: 'covers' as const, label: 'Cover Design', Icon: BookIcon },
        { id: 'production' as const, label: 'Production', Icon: SettingsIcon },
        { id: 'revisions' as const, label: 'Revisions', Icon: MessageSquareIcon },
    ];

    return (
        <div className="flex-grow flex flex-col p-6 bg-brand-bg overflow-hidden gap-6">
            <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-brand-text flex items-center gap-3">
                    <ImageIcon className="w-8 h-8 text-brand-primary" />
                    Illustration Studio
                </h1>
                <p className="text-lg text-brand-text-secondary mt-1">Complete illustration workflow from concept to final production.</p>
            </div>
            
            <div className="flex-shrink-0 border-b border-brand-border overflow-x-auto">
                <div className="flex gap-1">
                    {tabs.map((tab) => (
                        <IllustrationTabButton
                            key={tab.id}
                            label={tab.label}
                            Icon={tab.Icon}
                            isActive={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                        />
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'concept' && (
                    <ConceptPreProductionView
                        moodBoards={[]}
                        referenceCollections={[]}
                        artDirections={[]}
                        brainstormNotes={[]}
                        onCreateMoodBoard={async () => {}}
                        onDeleteMoodBoard={async () => {}}
                        onCreateReference={async () => {}}
                        onDeleteReference={async () => {}}
                        onCreateArtDirection={async () => {}}
                        onDeleteArtDirection={async () => {}}
                        onCreateNote={async () => {}}
                        onDeleteNote={async () => {}}
                    />
                )}
                {activeTab === 'moodboard' && <MoodboardView {...props} />}
                {activeTab === 'character' && <CharacterDesignView {...props} />}
                {activeTab === 'characterSheets' && (
                    <CharacterSheetView
                        characters={props.characterConcepts}
                        onGenerateExpression={props.onGenerateExpression}
                        onGeneratePose={props.onGeneratePose}
                        onGenerateVariation={props.onGenerateVariation}
                        onGenerateTurnaround={props.onGenerateTurnaround}
                        isGenerating={props.isGeneratingIllustration}
                    />
                )}
                {activeTab === 'scenes' && (
                    <SceneManagementView
                        scenes={props.scenes}
                        palettes={props.colorPalettes}
                        onGenerateScene={props.onGenerateScene}
                        onDeleteScene={props.onDeleteScene}
                        isGenerating={props.isGeneratingIllustration}
                    />
                )}
                {activeTab === 'panels' && (
                    <PanelLayoutView
                        layouts={props.panels}
                        onCreateLayout={props.onCreateLayout}
                        onGeneratePanel={props.onGeneratePanel}
                        onAddDialogue={props.onAddDialogue}
                        onAddSoundEffect={props.onAddSoundEffect}
                        onDeleteLayout={props.onDeleteLayout}
                        isGenerating={props.isGeneratingIllustration}
                    />
                )}
                {activeTab === 'styleLock' && (
                    <StyleLockView
                        styleGuide={props.styleGuide}
                        palettes={props.colorPalettes}
                        onCreateStyleGuide={props.onCreateStyleGuide}
                        onUpdateStyleGuide={props.onUpdateStyleGuide}
                        onCreatePalette={props.onCreatePalette}
                        onDeletePalette={props.onDeletePalette}
                        onUploadReference={props.onUploadReference}
                        isGenerating={props.isGeneratingIllustration}
                    />
                )}
                {activeTab === 'worldbuilding' && (
                    <WorldbuildingView
                        maps={props.maps}
                        symbols={props.symbols}
                        environments={props.environments}
                        props={props.props}
                        onGenerateMap={props.onGenerateMap}
                        onGenerateSymbol={props.onGenerateSymbol}
                        onGenerateEnvironment={props.onGenerateEnvironment}
                        onGenerateProp={props.onGenerateProp}
                        onDeleteMap={props.onDeleteMap}
                        onDeleteSymbol={props.onDeleteSymbol}
                        onDeleteEnvironment={props.onDeleteEnvironment}
                        onDeleteProp={props.onDeleteProp}
                    />
                )}
                {activeTab === 'covers' && (
                    <CoverDesignView
                        covers={props.covers}
                        onGenerateHeroImage={props.onGenerateHeroImage}
                        onGenerateFullJacket={props.onGenerateFullJacket}
                        onCreateTypography={props.onCreateTypography}
                        onGenerateMarketingGraphic={props.onGenerateMarketingGraphic}
                        onDeleteCover={props.onDeleteCover}
                    />
                )}
                {activeTab === 'production' && (
                    <ProductionQCView
                        printSpecs={props.printSpecs}
                        onUpdatePrintSpecs={props.onUpdatePrintSpecs}
                        onExportAsset={props.onExportAsset}
                        illustrations={[
                            ...props.scenes.map(s => ({ id: s.id, title: s.title, imageUrl: s.imageUrl, type: 'scene' })),
                            ...props.covers.map(c => ({ id: c.id, title: c.title, imageUrl: c.heroImageUrl || c.fullJacketUrl || '', type: 'cover' }))
                        ]}
                    />
                )}
                {activeTab === 'revisions' && (
                    <RevisionManagementView
                        revisions={props.revisions.map(r => ({
                            ...r,
                            createdAt: typeof r.createdAt === 'string' ? r.createdAt : r.createdAt.toISOString(),
                            resolvedAt: r.resolvedAt ? (typeof r.resolvedAt === 'string' ? r.resolvedAt : r.resolvedAt.toISOString()) : undefined,
                            responses: r.responses?.map(resp => ({
                                ...resp,
                                createdAt: typeof resp.createdAt === 'string' ? resp.createdAt : resp.createdAt.toISOString()
                            }))
                        }))}
                        versionHistory={[]}
                        onCreateRevision={async (revision) => {
                            // Convert string dates back to Date objects for global type
                            const globalRevision: Partial<RevisionFeedback> = {
                                ...revision,
                                createdAt: revision.createdAt ? new Date(revision.createdAt) : new Date(),
                                resolvedAt: revision.resolvedAt ? new Date(revision.resolvedAt) : undefined,
                                responses: revision.responses?.map(resp => ({
                                    ...resp,
                                    createdAt: resp.createdAt ? new Date(resp.createdAt) : new Date()
                                }))
                            };
                            await props.onCreateRevision(globalRevision);
                        }}
                        onUpdateRevisionStatus={props.onUpdateRevisionStatus}
                        onAddResponse={props.onAddRevisionResponse}
                        onDeleteRevision={props.onDeleteRevision}
                    />
                )}
            </div>
        </div>
    );
};