import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { Editor } from './components/Editor';
import { Toolbar } from './components/Toolbar';
import { LeftSidebar } from './components/LeftSidebar';
import { AiPanel } from './components/AiPanel';
import { StatusBar, TtsStatus } from './components/StatusBar';
import { ResearchModal } from './components/ResearchModal';
import { FindReplaceModal } from './components/FindReplaceModal';
import { WritingGoalModal } from './components/WritingGoalModal';
import { GeneratedContentModal } from './components/GeneratedContentModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { PublishingModal } from './components/PublishingModal';
import { PublishingView } from './components/PublishingView';
import { MarketingModal } from './components/MarketingModal';
import { WorldBibleModal } from './components/WorldBibleModal';
import { ExportModal } from './components/ExportModal';
import { ImageEditorModal } from './components/ImageEditorModal';
import { VideoTrailerModal } from './components/VideoTrailerModal';
import { ChatModal } from './components/ChatModal';
import { AudiobookModal } from './components/AudiobookModal';
import { NavigationPane } from './components/NavigationPane';
import { Navbar } from './components/Navbar';
import { IllustrationView } from './components/IllustrationView';
import { AudiobookView } from './components/AudiobookView';
import { CommentsPanel } from './components/CommentsPanel';
import { RightsDrawer } from './components/RightsDrawer';
import type { AudiobookProject } from './types';
import { GrammarExtension, grammarPluginKey } from './utils/grammarExtension';
import { SearchExtension } from './utils/searchExtension';
import { SuggestionBubble } from './components/SuggestionBubble';
import { generateImages, generateMoodboardPrompts, runGrammarCheckAgent, runConsistencyAgent, runAiCommand, generateSpeech, generateCoverPrompt, runExpertAgent, generateKeywords, runMarketingCampaignAgent, editImage, runShowVsTellAgent, generateVideo, getVideoOperationStatus, generateVideoPrompt, runFactCheckAgent, createChatSession, sendChatMessage, runCleanupAgent, runDialogueAnalysisAgent, runProsePolishAgent, runSensitivityAgent, runStructuralAnalysisAgent, generateAudiobook, runOutlinePacingAgent, generateContinuityTimeline, generateLocalizationPack, translateMetadata } from './services/geminiService';
import { backendClient } from './services/backendClient';
import { AiCommand, GrammarIssue, HistoryItem, Retailer, AI_COMMAND_OPTIONS, ConsistencyIssue, MarketingCampaign, WorldBible, ShowVsTellIssue, FactCheckIssue, Source, ChatMessage, DialogueIssue, ProsePolishIssue, SensitivityIssue, StructuralIssue, NarrationStyle, OutlineItem, AppView, MoodboardImage, CharacterConcept, SceneIllustration, PanelLayout, Panel, ColorPalette, PaletteColor, StyleGuide, EnvironmentDesign, PropDesign, MapDesign, SymbolDesign, CoverDesign, PrintSpecs, CharacterExpression, CharacterPose, CharacterVariation, CharacterTurnaround, TypographyDesign, RevisionFeedback, RevisionResponse, Collaborator, PacingBeat, ContinuityEvent, LocalizationPack, LocalizedMetadata, AssetRightsRecord, AssetRightsStatus, LaunchScenario, ManuscriptSegment, ManuscriptSearchResult, ComplianceIssue, CostPlan } from './types';
import { createWavBlobFromBase64 } from './utils/audioUtils';
import ReactToPrint from 'react-to-print';
import { v4 as uuidv4 } from 'uuid';
import { BarChartIcon, BookUpIcon, FilePenIcon, HeadphonesIcon, ImageIcon, MegaphoneIcon } from './components/icons/IconDefs';
import { Sparkline } from './components/Sparkline';
import { clampEvents, loadTelemetry, persistTelemetry, TelemetryCategory, TelemetryEvent, TelemetrySnapshot } from './utils/telemetry';
import { getDemoProjects, demoTelemetrySeeds } from './utils/demoData';
import { syncTelemetrySnapshot } from './services/analyticsService';
import { useProjectOps } from './hooks/useProjectOps';
import { useCollaborativeDocument } from './hooks/useCollaborativeDocument';
import { loadRightsRecords, addRightsRecord, updateRightsStatus } from './services/rightsService';

const defaultContent = `<h1>The Call of the Wild</h1>
<h2>Chapter 1: Into the Primitive</h2>
<p>Buck did not read the newspapers, or he would have known that trouble was brewing, not alone for himself, but for every tide-water dog, strong of muscle and with warm, long hair, from Puget Sound to San Diego. Because men, groping in the Arctic darkness, had found a yellow metal, and because steamship and transportation companies were booming the find, thousands of men were rushing into the Northland. These men wanted dogs, and the dogs they wanted were heavy dogs, with strong muscles by which to toil, and furry coats to protect them from the frost.</p>
<p>Buck lived at a big house in the sun-kissed Santa Clara Valley. Judge Miller’s place, it was called. It stood back from the road, half hidden among the trees, through which glimpses could be caught of the wide cool veranda that ran around its four sides. The house was approached by gravelled driveways which wound about through wide-spreading lawns and under the interlacing boughs of tall poplars. At the rear things were on even a more spacious scale than at the front. There were great stables, where a dozen grooms and boys held forth, rows of vine-clad servants’ cottages, an endless and orderly array of outhouses, long grape arbors, green pastures, orchards, and berry patches. Then there was the pumping plant for the artesian well, and the big cement tank where Judge Miller’s boys took their morning plunge and kept cool in the hot afternoon.</p>
<p>And over this great demesne Buck ruled. Here he was born, and here he had lived the four years of his life. It was true, there were other dogs. There could not but be other dogs on so vast a place, but they did not count. They came and went, resided in the populous kennels, or lived obscurely in the recesses of the house after the fashion of Toots, the Japanese pug, or Ysabel, the Mexican hairless,—strange creatures that rarely put their noses out of doors or set foot to ground. On the other hand, there were the fox-terriers, a score of them at least, who yelped fearful promises at Toots and Ysabel looking out of the windows at them and protected by a legion of housemaids armed with brooms and mops.</p>
`;

const COLLABORATOR_STORAGE_KEY = 'app.collaborator.identity';
const PRIMARY_DOCUMENT_ID = 'primary-manuscript';

const getLocalCollaborator = (): Collaborator => {
  if (typeof window === 'undefined') {
    return { id: 'offline-author', name: 'Guest Author' };
  }

  const stored = window.localStorage.getItem(COLLABORATOR_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as Collaborator;
    } catch (error) {
      console.warn('Failed to parse collaborator identity', error);
    }
  }

  const fallback: Collaborator = {
    id: uuidv4(),
    name: 'Lead Author',
    avatarColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
  };
  window.localStorage.setItem(COLLABORATOR_STORAGE_KEY, JSON.stringify(fallback));
  return fallback;
};

const processTextToHtml = (text: string): string => {
    let processedText = text;
    
    // Find and remove Project Gutenberg headers and footers
    const startMarker = /^\*\*\* START OF (THIS|THE) PROJECT GUTENBERG EBOOK .* \*\*\*$/m;
    const endMarker = /^\*\*\* END OF (THIS|THE) PROJECT GUTENBERG EBOOK .* \*\*\*$/m;
    
    const startIndexMatch = processedText.match(startMarker);
    const endIndexMatch = processedText.match(endMarker);

    if (startIndexMatch && startIndexMatch.index !== undefined) {
        processedText = processedText.substring(startIndexMatch.index + startIndexMatch[0].length);
    }
    if (endIndexMatch && endIndexMatch.index !== undefined) {
        processedText = processedText.substring(0, endIndexMatch.index);
    }

    processedText = processedText.trim();

    // Convert text to HTML paragraphs
    const paragraphs = processedText
        .split(/\r?\n\s*\r?\n/) // Split by one or more empty lines
        .map(p => p.trim().replace(/\r?\n/g, ' ')) // Join lines within a paragraph and trim
        .filter(p => p.length > 0); // Remove any resulting empty paragraphs
    
    return paragraphs.map(p => `<p>${p}</p>`).join('');
};

const LOCAL_STORAGE_KEY = 'ai-manuscript-content';

const PlaceholderView: React.FC<{ view: AppView }> = ({ view }) => {
    const details: { [key in AppView]?: { Icon: React.FC<any>, title: string, description: string } } = {
        audiobooks: { Icon: HeadphonesIcon, title: "Audiobook Production Suite", description: "Convert your manuscript to a fully narrated audiobook with AI voices." },
        publishing: { Icon: BookUpIcon, title: "Publishing Pipeline", description: "Automate uploads and manage metadata across KDP, IngramSpark, and more." },
        marketing: { Icon: MegaphoneIcon, title: "Marketing & Promotion Suite", description: "Generate ad campaigns, social media content, and author websites." },
        statistics: { Icon: BarChartIcon, title: "Analytics Dashboard", description: "Track sales, royalties, and marketing campaign performance." },
    };
    
    const currentDetail = details[view] || { Icon: FilePenIcon, title: "Coming Soon", description: "This feature is under development." };
    
    return (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-brand-bg">
            <div className="w-16 h-16 bg-brand-surface rounded-full flex items-center justify-center mb-6">
                <currentDetail.Icon className="w-8 h-8 text-brand-primary" />
            </div>
            <h1 className="text-3xl font-bold text-brand-text">{currentDetail.title}</h1>
            <p className="text-lg text-brand-text-secondary mt-2 max-w-md">{currentDetail.description}</p>
            <p className="mt-6 text-sm text-brand-text-secondary animate-pulse">Coming Soon</p>
        </div>
    );
};

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('editing');
  const [focusMode, setFocusMode] = useState(false);
  const [wordCount, setWordCount] = useState({ total: 0, selection: 0 });
  const [charCount, setCharCount] = useState({ total: 0, selection: 0 });
  const [writingGoal, setWritingGoal] = useState(1000);
  
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [isFindReplaceModalOpen, setIsFindReplaceModalOpen] = useState(false);
  const [isWritingGoalModalOpen, setIsWritingGoalModalOpen] = useState(false);
  const [isGeneratedContentModalOpen, setIsGeneratedContentModalOpen] = useState(false);
  const [generatedContent, setGeneratedContent] = useState({ title: '', content: '' });
  const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [isPublishingModalOpen, setIsPublishingModalOpen] = useState(false);
  const [coverArt, setCoverArt] = useState<string | null>(null);
  const [isMarketingModalOpen, setIsMarketingModalOpen] = useState(false);
  const [marketingCampaign, setMarketingCampaign] = useState<MarketingCampaign[] | null>(null);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);
  const [localizationPacks, setLocalizationPacks] = useState<LocalizationPack[]>([]);
  const [localizedMetadata, setLocalizedMetadata] = useState<LocalizedMetadata[]>([]);
  const [isGeneratingLocalizationPack, setIsGeneratingLocalizationPack] = useState(false);
  const [isGeneratingLocalizedMetadata, setIsGeneratingLocalizedMetadata] = useState(false);
  const [scenarioPriority, setScenarioPriority] = useState<'speed' | 'reach' | 'budget'>('speed');
  const [scenarioInsights, setScenarioInsights] = useState<LaunchScenario[]>([]);
  const [isSimulatingLaunch, setIsSimulatingLaunch] = useState(false);
  const [manuscriptIndex, setManuscriptIndex] = useState<ManuscriptSegment[]>([]);
  const [isIndexingManuscript, setIsIndexingManuscript] = useState(false);
  const [lastIndexedAt, setLastIndexedAt] = useState<string | null>(null);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [isRunningCompliance, setIsRunningCompliance] = useState(false);
  const [costPlan, setCostPlan] = useState<CostPlan | null>(null);
  const [isGeneratingCostPlan, setIsGeneratingCostPlan] = useState(false);
  const [isWorldBibleModalOpen, setIsWorldBibleModalOpen] = useState(false);
  const [worldBible, setWorldBible] = useState<WorldBible>({ characters: [], settings: [], items: [], seriesContext: '' });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [isVideoTrailerModalOpen, setIsVideoTrailerModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isAudiobookModalOpen, setIsAudiobookModalOpen] = useState(false);
  const [audiobookStatus, setAudiobookStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [audiobookUrl, setAudiobookUrl] = useState<string | null>(null);

  // AI Panel State
  const [isCommandLoading, setIsCommandLoading] = useState(false);
  const [isExpertLoading, setIsExpertLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [grammarIssues, setGrammarIssues] = useState<GrammarIssue[]>([]);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [isLiveAnalysisEnabled, setIsLiveAnalysisEnabled] = useState(true);
  const [liveCheckTimeout, setLiveCheckTimeout] = useState<number | null>(null);
  const [consistencyIssues, setConsistencyIssues] = useState<ConsistencyIssue[]>([]);
  const [isCheckingConsistency, setIsCheckingConsistency] = useState(false);
  const [showVsTellIssues, setShowVsTellIssues] = useState<ShowVsTellIssue[]>([]);
  const [isAnalyzingShowVsTell, setIsAnalyzingShowVsTell] = useState(false);
  const [factCheckIssues, setFactCheckIssues] = useState<FactCheckIssue[]>([]);
  const [factCheckSources, setFactCheckSources] = useState<Source[]>([]);
  const [isCheckingFacts, setIsCheckingFacts] = useState(false);
  const [dialogueIssues, setDialogueIssues] = useState<DialogueIssue[]>([]);
  const [isAnalyzingDialogue, setIsAnalyzingDialogue] = useState(false);
  const [prosePolishIssues, setProsePolishIssues] = useState<ProsePolishIssue[]>([]);
  const [isPolishingProse, setIsPolishingProse] = useState(false);
  const [sensitivityIssues, setSensitivityIssues] = useState<SensitivityIssue[]>([]);
  const [isAnalyzingSensitivity, setIsAnalyzingSensitivity] = useState(false);
  const [structuralIssues, setStructuralIssues] = useState<StructuralIssue[]>([]);
  const [isAnalyzingStructure, setIsAnalyzingStructure] = useState(false);

  const [activeSuggestion, setActiveSuggestion] = useState<{ issue: GrammarIssue, from: number, to: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'dirty' | 'saving'>('saved');
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const [chatSession, setChatSession] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false);
  const [hasCommentSelection, setHasCommentSelection] = useState(false);
  const [collaboratorIdentity] = useState<Collaborator>(() => getLocalCollaborator());
  const [isRightsDrawerOpen, setIsRightsDrawerOpen] = useState(false);
  const [rightsFilter, setRightsFilter] = useState<'all' | 'illustration' | 'audio'>('all');
  const [rightsRecords, setRightsRecords] = useState<AssetRightsRecord[]>(() => loadRightsRecords());

  // Nav Pane State
  const [isNavPaneOpen, setIsNavPaneOpen] = useState(true);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [pacingBeats, setPacingBeats] = useState<PacingBeat[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<ContinuityEvent[]>([]);
  const [isAnalyzingPacingBeats, setIsAnalyzingPacingBeats] = useState(false);
  const [isBuildingTimeline, setIsBuildingTimeline] = useState(false);

  // Illustration View State
  const [moodboardImages, setMoodboardImages] = useState<MoodboardImage[]>([]);
  const [isGeneratingMoodboard, setIsGeneratingMoodboard] = useState(false);
  const [characterConcepts, setCharacterConcepts] = useState<CharacterConcept[]>([]);
  const [isGeneratingConcepts, setIsGeneratingConcepts] = useState(false);
  const [scenes, setScenes] = useState<SceneIllustration[]>([]);
  const [panels, setPanels] = useState<PanelLayout[]>([]);
  const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>([]);
  const [styleGuide, setStyleGuide] = useState<StyleGuide | null>(null);
  const [environments, setEnvironments] = useState<EnvironmentDesign[]>([]);
  const [props, setProps] = useState<PropDesign[]>([]);
  const [maps, setMaps] = useState<MapDesign[]>([]);
  const [symbols, setSymbols] = useState<SymbolDesign[]>([]);
  const [covers, setCovers] = useState<CoverDesign[]>([]);
  const [printSpecs, setPrintSpecs] = useState<PrintSpecs | null>(null);
  const [revisions, setRevisions] = useState<RevisionFeedback[]>([]);
  const [isGeneratingIllustration, setIsGeneratingIllustration] = useState(false);

  const [telemetry, setTelemetry] = useState<TelemetrySnapshot>(() => loadTelemetry());

  const updateTelemetrySnapshot = useCallback((mutator: (snapshot: TelemetrySnapshot) => TelemetrySnapshot) => {
    setTelemetry(prev => {
      const next = mutator(prev);
      persistTelemetry(next);
      return next;
    });
  }, []);

  const trackTelemetry = useCallback(
    (category: TelemetryCategory, metric: string, value = 1, detail?: string) => {
      updateTelemetrySnapshot(prev => {
        const counters = {
          ...prev.counters,
          [category]: {
            ...prev.counters[category],
            [metric]: (prev.counters[category][metric] || 0) + (Number.isFinite(value) ? value : 0),
          },
        };
        const event: TelemetryEvent = {
          id: uuidv4(),
          category,
          action: metric,
          detail,
          value,
          timestamp: new Date().toISOString(),
        };
        return {
          ...prev,
          counters,
          events: clampEvents([event, ...prev.events]),
          lastUpdated: new Date().toISOString(),
        };
      });
    },
    [updateTelemetrySnapshot]
  );

  const {
    projects: opsProjects,
    createProject: createOpsProject,
    updateProject: updateOpsProject,
    deleteProject: deleteOpsProject,
    snapshot: projectOpsSnapshot,
  } = useProjectOps([]);

  const {
    collaboratorsOnline,
    commentThreads,
    addThread,
    addReply,
    resolveThread,
    reopenThread,
    removeThread,
    broadcastPresence,
  } = useCollaborativeDocument('primary-manuscript', collaboratorIdentity);

  const openCommentCount = useMemo(
    () => commentThreads.filter((thread) => thread.status === 'open').length,
    [commentThreads],
  );

  const printRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ttsStatus, setTtsStatus] = useState<TtsStatus>('idle');
  const previousWordCountRef = useRef(0);
  const telemetrySyncTimeout = useRef<number | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,
      GrammarExtension,
      SearchExtension,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none w-full max-w-4xl mx-auto p-8 font-serif',
      },
    },
    onUpdate: ({ editor }) => {
      setSaveStatus('dirty');
      const selection = editor.state.selection;
      const selectionText = editor.state.doc.textBetween(selection.from, selection.to);
      const hasSelection = selection.from !== selection.to;
      const totalWords = editor.storage.characterCount.words();
      const selectionWords = selectionText.split(/\s+/).filter(Boolean).length;
      setWordCount({
        total: totalWords,
        selection: selectionWords,
      });
      setCharCount({
        total: editor.storage.characterCount.characters(),
        selection: selectionText.length,
      });
      setHasCommentSelection(hasSelection);
      broadcastPresence(hasSelection ? 'editing' : 'idle', selection.to);

      const previousWords = previousWordCountRef.current || 0;
      if (totalWords > previousWords) {
        trackTelemetry('editing', 'wordsAuthored', totalWords - previousWords, 'Live drafting');
      }
      previousWordCountRef.current = totalWords;

      if (isLiveAnalysisEnabled) {
        if (liveCheckTimeout) {
            window.clearTimeout(liveCheckTimeout);
        }
        // @ts-ignore
        setLiveCheckTimeout(setTimeout(() => handleRunGrammarCheck(true), 1500));
      }

      // Update Outline
      const newOutline: OutlineItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading' && (node.attrs.level === 1 || node.attrs.level === 2)) {
            newOutline.push({
                id: `${node.type.name}-${pos}`,
                level: node.attrs.level,
                text: node.textContent,
                pos: pos
            });
        }
      });
      setOutline(newOutline);
    },
     onTransaction: ({ transaction, editor }) => {
        if (!transaction.selectionSet) return;
        setActiveSuggestion(null);
        const selection = editor.state.selection;
        const hasSelection = selection.from !== selection.to;
        setHasCommentSelection(hasSelection);
        broadcastPresence(hasSelection ? 'editing' : 'idle', selection.to);
     }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const alreadySeeded = window.localStorage.getItem('ai-agency-demo-seeded');
    if (alreadySeeded || opsProjects.length > 0) return;
    const demoProjects = getDemoProjects();
    demoProjects.forEach(project => createOpsProject(project));
    demoTelemetrySeeds.forEach(seed => trackTelemetry(seed.category, seed.metric, seed.value, seed.detail));
    window.localStorage.setItem('ai-agency-demo-seeded', 'true');
  }, [opsProjects.length, createOpsProject, trackTelemetry]);

  const handleCreateAudiobookProject = (project: AudiobookProject) => {
    createOpsProject(project);
    trackTelemetry('audiobooks', 'projectsCreated', 1, project.title);
  };

  const handleUpdateAudiobookProject = (projectId: string, updates: Partial<AudiobookProject>) => {
    const { stageChange } = updateOpsProject(projectId, updates);
    if (stageChange) {
      trackTelemetry('audiobooks', 'stageTransitions', 1, `${stageChange.from} → ${stageChange.to}`);
      if (stageChange.to === 'live') {
        trackTelemetry('audiobooks', 'distributions', 1, stageChange.title);
      }
    }
    if (updates.distribution?.status === 'live') {
      trackTelemetry('audiobooks', 'distributions', 1, updates.distribution.audiobookId || projectId);
    }
  };

  const handleDeleteAudiobookProject = (projectId: string) => {
    deleteOpsProject(projectId);
  };

  const handleCreateCommentThread = useCallback(
    (content: string) => {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      if (from === to) {
        alert('Select text in the manuscript to anchor your comment.');
        return;
      }
      const excerpt = editor.state.doc.textBetween(from, to).trim().slice(0, 240);
      addThread(
        {
          from,
          to,
          excerpt: excerpt || 'Selected passage',
        },
        content,
      );
    },
    [editor, addThread],
  );

  const handleReplyToThread = useCallback(
    (threadId: string, message: string) => {
      addReply(threadId, message);
    },
    [addReply],
  );

  const handleResolveThread = useCallback(
    (threadId: string) => {
      resolveThread(threadId);
    },
    [resolveThread],
  );

  const handleReopenThread = useCallback(
    (threadId: string) => {
      reopenThread(threadId);
    },
    [reopenThread],
  );

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      removeThread(threadId);
    },
    [removeThread],
  );

  const handleAddRightsRecord = useCallback(
    (record: Omit<AssetRightsRecord, 'id' | 'createdAt'>) => {
      const created = addRightsRecord(record);
      setRightsRecords((prev) => [created, ...prev]);
    },
    [],
  );

  const handleUpdateRightsRecordStatus = useCallback(
    (id: string, status: AssetRightsStatus) => {
      const updated = updateRightsStatus(id, status);
      if (updated) {
        setRightsRecords((prev) => prev.map((record) => (record.id === updated.id ? updated : record)));
      }
    },
    [],
  );

  const handleOpenRightsDrawer = useCallback((nextFilter: 'all' | 'illustration' | 'audio') => {
    setRightsFilter(nextFilter);
    setIsRightsDrawerOpen(true);
  }, []);

  const handleRunPacingAnalysis = useCallback(async () => {
    if (!editor) {
      alert('Editor not ready.');
      return;
    }
    if (outline.length === 0) {
      alert('Add at least one heading before running pacing analysis.');
      return;
    }
    setIsAnalyzingPacingBeats(true);
    try {
      const beats = await runOutlinePacingAgent(outline, editor.getText());
      setPacingBeats(beats);
    } catch (error) {
      console.error(error);
      alert('Failed to analyze pacing.');
    } finally {
      setIsAnalyzingPacingBeats(false);
    }
  }, [editor, outline]);

  const handleGenerateContinuityTimeline = useCallback(async () => {
    if (!editor) {
      alert('Editor not ready.');
      return;
    }
    setIsBuildingTimeline(true);
    try {
      const events = await generateContinuityTimeline(outline, editor.getText());
      setTimelineEvents(events);
    } catch (error) {
      console.error(error);
      alert('Failed to build timeline.');
    } finally {
      setIsBuildingTimeline(false);
    }
  }, [editor, outline]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (telemetrySyncTimeout.current) {
      window.clearTimeout(telemetrySyncTimeout.current);
    }
    telemetrySyncTimeout.current = window.setTimeout(() => {
      syncTelemetrySnapshot(telemetry);
    }, 2000);

    return () => {
      if (telemetrySyncTimeout.current) {
        window.clearTimeout(telemetrySyncTimeout.current);
      }
    };
  }, [telemetry]);

  useEffect(() => {
    // Load content from local storage on mount
    const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedContent && editor) {
      editor.commands.setContent(JSON.parse(savedContent));
    } else if (editor) {
      editor.commands.setContent(defaultContent);
    }
  }, [editor]);

  const handleSave = useCallback(() => {
    if (editor) {
        setSaveStatus('saving');
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(editor.getJSON()));
            setTimeout(() => {
                setSaveStatus('saved');
            }, 500);
        } catch (error) {
            console.error("Failed to save content:", error);
            setSaveStatus('dirty'); // Revert status if save fails
        }
    }
  }, [editor]);

  // Autosave functionality
  useEffect(() => {
    if (saveStatus === 'dirty') {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus, handleSave]);

  const handleSuggestionClick = useCallback((event: Event) => {
    const { issue, from, to } = (event as CustomEvent).detail;
    setActiveSuggestion({ issue, from, to });
  }, []);

  useEffect(() => {
    const editorDom = editor?.view.dom;
    editorDom?.addEventListener('suggestion-click', handleSuggestionClick);
    return () => {
      editorDom?.removeEventListener('suggestion-click', handleSuggestionClick);
    };
  }, [editor, handleSuggestionClick]);

  const handleAcceptSuggestion = useCallback(() => {
    if (activeSuggestion && editor) {
        const { from, to, issue } = activeSuggestion;
        editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, issue.suggestion).run();
        setActiveSuggestion(null);
        // Remove the accepted issue from the list
        setGrammarIssues(prev => prev.filter(i => i.id !== issue.id));
    }
  }, [activeSuggestion, editor]);

  const handleDismissSuggestion = useCallback(() => {
    if(activeSuggestion && editor) {
        setGrammarIssues(prev => prev.filter(i => i.id !== activeSuggestion.issue.id));
        setActiveSuggestion(null);
    }
  }, [activeSuggestion, editor]);

  const handleImportBook = (data: { content: string; blurb?: string; coverPrompt?: string; }) => {
    if (editor) {
        const htmlContent = processTextToHtml(data.content);
        editor.commands.setContent(htmlContent);
        setIsResearchModalOpen(false);
        // If blurb and coverPrompt are provided, seed the publishing modal
        if (data.blurb && data.coverPrompt) {
            setTimeout(() => {
                setIsPublishingModalOpen(true);
            }, 500);
        }
    }
  };

  const addToHistory = (prompt: string, content: string, type: 'user' | 'agent' = 'agent') => {
    const newItem: HistoryItem = { id: uuidv4(), type, prompt, content };
    setHistory(prev => [newItem, ...prev]);
  };
  
  const handleRunCommand = async (command: AiCommand, customPrompt: string) => {
    if (!editor) return;

    const selection = editor.state.selection;
    const context = editor.state.doc.textBetween(selection.from, selection.to) || editor.getText();
    const commandOption = AI_COMMAND_OPTIONS.find(c => c.value === command);
    const prompt = customPrompt || commandOption?.prompt || '';

    if (!prompt.trim()) return;

    setIsCommandLoading(true);

    try {
        const responseText = await runAiCommand(prompt, context);

        if (selection.from !== selection.to) { // If there's a selection
            editor.chain().focus().deleteSelection().insertContent(responseText).run();
        } else {
            setGeneratedContent({ title: customPrompt || commandOption?.label || "AI Result", content: responseText });
            setIsGeneratedContentModalOpen(true);
        }
        addToHistory(customPrompt || commandOption?.label || "AI Command", responseText);
        trackTelemetry('editing', 'aiCommands', 1, commandOption?.label || command);

    } catch (error) {
        alert(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
        setIsCommandLoading(false);
    }
  };

  const handleRunGrammarCheck = async (isLive = false) => {
    if (!editor) return;
    setIsCheckingGrammar(true);
    try {
        const fullText = editor.getText();
        const issues = await runGrammarCheckAgent(fullText);
        setGrammarIssues(issues);
        editor.view.dispatch(editor.state.tr.setMeta(grammarPluginKey, { issues }));
        if (!isLive) {
          trackTelemetry('editing', 'grammarChecks', 1, `${issues.length} issues flagged`);
        }
    } catch (error) {
        // Silently fail for live analysis, otherwise alert
        if (!isLive) {
            alert("Failed to run grammar check.");
        }
    } finally {
        setIsCheckingGrammar(false);
    }
  };

  const handleRunConsistencyCheck = async () => {
    if (!editor) return;
    setIsCheckingConsistency(true);
    try {
        const fullText = editor.getText();
        const issues = await runConsistencyAgent(fullText);
        setConsistencyIssues(issues);
        setGeneratedContent({ title: "Consistency Report", content: issues.length > 0 ? issues.map(i => `[${i.type}] ${i.description}\n> "${i.quote}"`).join('\n\n') : "No inconsistencies found." });
        setIsGeneratedContentModalOpen(true);
        trackTelemetry('editing', 'consistencyAudits', 1, `${issues.length} findings`);
    } catch (error) {
         alert("Failed to run consistency check.");
    } finally {
        setIsCheckingConsistency(false);
    }
  };

  const handleRunShowVsTell = async () => {
    if (!editor) return;
    setIsAnalyzingShowVsTell(true);
    try {
        const fullText = editor.getText();
        const issues = await runShowVsTellAgent(fullText);
        setShowVsTellIssues(issues);
        trackTelemetry('editing', 'showVsTellAudits', 1, `${issues.length} opportunities`);
    } catch (error) {
        alert("Failed to run Show vs. Tell analysis.");
    } finally {
        setIsAnalyzingShowVsTell(false);
    }
  };
  
  const handleApplyShowVsTellSuggestion = (issue: ShowVsTellIssue) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const textToReplace = editor.state.doc.textBetween(from, to);
    // Basic check to see if selection matches the quote
    if (textToReplace.trim() === issue.quote.trim()) {
        editor.chain().focus().deleteSelection().insertContent(issue.suggestion).run();
        setShowVsTellIssues(prev => prev.filter(i => i !== issue));
    } else {
        alert("Please select the exact text of the 'telling' quote to apply the suggestion.");
    }
  };
  
  const handleRunFactCheck = async () => {
    if (!editor) return;
    setIsCheckingFacts(true);
    try {
        const fullText = editor.getText();
        const {issues, sources} = await runFactCheckAgent(fullText);
        setFactCheckIssues(issues);
        setFactCheckSources(sources);
        trackTelemetry('editing', 'factChecks', 1, `${issues.length} flags`);
    } catch (error) {
        alert("Failed to run fact-check analysis.");
    } finally {
        setIsCheckingFacts(false);
    }
  };
  
  const handleRunDialogueAnalysis = async () => {
    if (!editor) return;
    setIsAnalyzingDialogue(true);
    try {
        const fullText = editor.getText();
        const issues = await runDialogueAnalysisAgent(fullText);
        setDialogueIssues(issues);
        trackTelemetry('editing', 'dialogueAudits', 1, `${issues.length} notes`);
    } catch (error) {
        alert("Failed to run dialogue analysis.");
    } finally {
        setIsAnalyzingDialogue(false);
    }
  };

  const handleRunProsePolish = async () => {
    if (!editor) return;
    setIsPolishingProse(true);
    try {
        const fullText = editor.getText();
        const issues = await runProsePolishAgent(fullText);
        setProsePolishIssues(issues);
        trackTelemetry('editing', 'prosePolish', 1, `${issues.length} suggestions`);
    } catch (error) {
        alert("Failed to run prose polish analysis.");
    } finally {
        setIsPolishingProse(false);
    }
  };

  const handleApplyProsePolishSuggestion = (issue: ProsePolishIssue) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const textToReplace = editor.state.doc.textBetween(from, to);
    if (textToReplace.trim() === issue.original.trim()) {
        editor.chain().focus().deleteSelection().insertContent(issue.suggestion).run();
        setProsePolishIssues(prev => prev.filter(i => i !== issue));
    } else {
        alert("Please select the exact paragraph to apply the suggestion.");
    }
  };

  const handleRunSensitivityCheck = async () => {
    if (!editor) return;
    setIsAnalyzingSensitivity(true);
    try {
        const fullText = editor.getText();
        const issues = await runSensitivityAgent(fullText);
        setSensitivityIssues(issues);
        trackTelemetry('editing', 'sensitivityPasses', 1, `${issues.length} cautions`);
    } catch (error) {
        alert("Failed to run sensitivity analysis.");
    } finally {
        setIsAnalyzingSensitivity(false);
    }
  };
  
  const handleApplySensitivitySuggestion = (issue: SensitivityIssue) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const textToReplace = editor.state.doc.textBetween(from, to);
    if (textToReplace.trim() === issue.quote.trim()) {
        editor.chain().focus().deleteSelection().insertContent(issue.suggestion).run();
        setSensitivityIssues(prev => prev.filter(i => i !== issue));
    } else {
        alert("Please select the exact text of the quote to apply the suggestion.");
    }
  };

  const handleRunStructuralAnalysis = async () => {
    if (!editor) return;
    setIsAnalyzingStructure(true);
    try {
        const fullText = editor.getText();
        const issues = await runStructuralAnalysisAgent(fullText);
        setStructuralIssues(issues);
        trackTelemetry('editing', 'structureAudits', 1, `${issues.length} beats flagged`);
    } catch (error) {
        alert("Failed to run structural analysis.");
    } finally {
        setIsAnalyzingStructure(false);
    }
  };

  const handleRunExpertAgent = async (prompt: string) => {
    if (!editor || !prompt) return;
    setIsExpertLoading(true);
    try {
      const manuscript = editor.getText();
      const context = JSON.stringify(worldBible);
      const response = await runExpertAgent(prompt, manuscript, context);
      setGeneratedContent({ title: "Expert Agent Response", content: response });
      setIsGeneratedContentModalOpen(true);
      addToHistory(prompt, response);
    } catch (error) {
      alert("Failed to get response from expert agent.");
    } finally {
      setIsExpertLoading(false);
    }
  };

  const handleReadAloud = async () => {
    if (!editor || ttsStatus !== 'idle') return;

    const selection = editor.state.selection;
    const textToRead = editor.state.doc.textBetween(selection.from, selection.to) || editor.getText();

    if (!textToRead.trim()) return;

    setTtsStatus('generating');
    try {
        const base64Audio = await generateSpeech(textToRead);
        const wavBlob = createWavBlobFromBase64(base64Audio);
        const url = URL.createObjectURL(wavBlob);
        
        if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play();
            setTtsStatus('playing');
        }

    } catch (error) {
        alert("Failed to generate audio.");
        setTtsStatus('idle');
    }
  };

  const handleTtsPlayPause = () => {
    if (audioRef.current) {
        if (ttsStatus === 'playing') {
            audioRef.current.pause();
            setTtsStatus('paused');
        } else if (ttsStatus === 'paused') {
            audioRef.current.play();
            setTtsStatus('playing');
        }
    }
  };

  const handleTtsStop = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
    }
    setTtsStatus('idle');
  };

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleEnded = () => setTtsStatus('idle');
    audio.addEventListener('ended', handleEnded);

    return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.src = '';
    };
  }, []);

  const handleGenerateBlurb = async (): Promise<string> => {
    if (!editor) return '';
    const prompt = `Based on the following manuscript, write a compelling book blurb of about 150-200 words.
---
${editor.getText().substring(0, 5000)}...
---`;
    const blurb = await runAiCommand(prompt, '');
    return blurb;
  };
  
  const handleGenerateKeywords = async (): Promise<string[]> => {
    if (!editor) return [];
    return await generateKeywords(editor.getText());
  };
  
  const handleGenerateCoverArt = async (prompt: string): Promise<void> => {
    const fullPrompt = `${prompt}, book cover, no text, epic`;
    const images = await generateImages(fullPrompt, 1, '3:4');
    if (images.length > 0) {
      const imageUrl = `data:image/png;base64,${images[0]}`;
      setCoverArt(imageUrl);
    } else {
        throw new Error("AI did not return an image.");
    }
  };
  
  const handleGenerateMarketingCampaign = async () => {
    if (!editor) return;
    setIsGeneratingCampaign(true);
    try {
        const campaign = await runMarketingCampaignAgent(editor.getText());
        setMarketingCampaign(campaign);
        trackTelemetry('marketing', 'campaigns', 1, 'AI campaign strategy generated');
    } catch (e) {
        alert("Failed to generate marketing campaign.");
    } finally {
        setIsGeneratingCampaign(false);
    }
  };

  const handleGenerateLocalizationPack = async (locales: string[]): Promise<LocalizationPack[]> => {
    if (!editor) return [];
    if (locales.length === 0) {
      alert('Select at least one locale.');
      return [];
    }
    setIsGeneratingLocalizationPack(true);
    try {
      const packs = await generateLocalizationPack(editor.getText(), locales);
      setLocalizationPacks(packs);
      return packs;
    } catch (error) {
      console.error(error);
      alert('Failed to generate localization pack.');
      return [];
    } finally {
      setIsGeneratingLocalizationPack(false);
    }
  };

  const handleTranslateMetadata = async (locales: string[]): Promise<LocalizedMetadata[]> => {
    if (!editor) return [];
    if (locales.length === 0) {
      alert('Select at least one locale.');
      return [];
    }
    setIsGeneratingLocalizedMetadata(true);
    try {
      const metadata = await translateMetadata(editor.getText(), locales);
      setLocalizedMetadata(metadata);
      return metadata;
    } catch (error) {
      console.error(error);
      alert('Failed to translate metadata.');
      return [];
    } finally {
      setIsGeneratingLocalizedMetadata(false);
    }
  };

  const handleSimulateScenarios = useCallback(
    async (priority: 'speed' | 'reach' | 'budget') => {
      if (!editor) return;
      setScenarioPriority(priority);
      setIsSimulatingLaunch(true);
      try {
        const response = await backendClient.simulateLaunch(priority, editor.getText());
        setScenarioInsights(response.scenarios);
      } catch (error) {
        alert('Unable to simulate launch scenarios right now.');
      } finally {
        setIsSimulatingLaunch(false);
      }
    },
    [editor],
  );

  const handleBuildManuscriptIndex = useCallback(async () => {
    if (!editor) return;
    setIsIndexingManuscript(true);
    try {
      const response = await backendClient.syncIndex(PRIMARY_DOCUMENT_ID, editor.getText());
      setManuscriptIndex(response.segments);
      setLastIndexedAt(new Date().toISOString());
    } catch (error) {
      console.error(error);
      alert('Failed to build knowledge index.');
    } finally {
      setIsIndexingManuscript(false);
    }
  }, [editor]);

  const handleRunComplianceScan = useCallback(async () => {
    if (!editor) return;
    setIsRunningCompliance(true);
    try {
      const response = await backendClient.runComplianceScan(editor.getText());
      setComplianceIssues(response.issues);
    } catch (error) {
      console.error(error);
      alert('Compliance scan failed.');
    } finally {
      setIsRunningCompliance(false);
    }
  }, [editor]);

  const handleGenerateCostPlan = useCallback(
    async (tier: 'starter' | 'professional' | 'cinematic'): Promise<CostPlan | null> => {
      if (!editor) return null;
      setIsGeneratingCostPlan(true);
      try {
        const response = await backendClient.generateCostPlan(tier, editor.getText());
        setCostPlan(response.plan);
        return response.plan;
      } catch (error) {
        console.error(error);
        alert('Unable to generate cost plan.');
        return null;
      } finally {
        setIsGeneratingCostPlan(false);
      }
    },
    [editor],
  );

  const searchManuscriptContext = useCallback(
    async (query: string) => {
      if (!query.trim() || !manuscriptIndex.length) return [] as ManuscriptSearchResult[];
      try {
        const response = await backendClient.searchIndex(PRIMARY_DOCUMENT_ID, query);
        return response.results;
      } catch (error) {
        console.error('Search failed', error);
        return [] as ManuscriptSearchResult[];
      }
    },
    [manuscriptIndex],
  );

  const handleOpenImageEditor = (image: string) => {
    setImageToEdit(image);
    setIsImageEditorOpen(true);
  };
  
  const handleSaveEditedImage = (newImageBase64: string) => {
    const imageUrl = `data:image/png;base64,${newImageBase64}`;
    setCoverArt(imageUrl);
    setIsImageEditorOpen(false);
  };

  const handleRunCleanup = async () => {
    if (!editor) return;
    setIsCleaningUp(true);
    try {
        const cleanedText = await runCleanupAgent(editor.getHTML());
        editor.commands.setContent(cleanedText);
        trackTelemetry('editing', 'cleanupRuns', 1, 'Formatting sweep complete');
    } catch (e) {
        alert("Failed to run cleanup agent.");
    } finally {
        setIsCleaningUp(false);
    }
  };
  
  const handleOpenChat = () => {
    if (!editor) return;
    if (!chatSession) {
        const manuscriptContext = `The user is working on the following manuscript. Use this as context for all their questions, but do not mention it unless they ask you to. Do not return it in your responses. \n\nMANUSCRIPT:\n${editor.getText()}`;
        const newChat = createChatSession([
            { role: 'user', parts: [{ text: manuscriptContext }] },
            { role: 'model', parts: [{ text: "Hello! I've read your manuscript. How can I help you with it?" }] },
        ]);
        setChatSession(newChat);
        setChatMessages([{ id: uuidv4(), role: 'model', content: "Hello! I've read your manuscript. How can I help you with it?" }]);
    }
    setIsChatModalOpen(true);
  };
  
  const handleSendMessage = async (message: string) => {
    if (!chatSession) return;
    
    setChatMessages(prev => [...prev, {id: uuidv4(), role: 'user', content: message}]);
    setIsChatLoading(true);

    try {
        let finalMessage = message;
        const matches = await searchManuscriptContext(message);
        if (matches.length) {
          const snippets = matches
            .map(match => {
              const segment = manuscriptIndex.find(seg => seg.id === match.segmentId);
              if (!segment) return null;
              return `Heading: ${segment.heading}\nSummary: ${segment.summary}\nQuote: ${segment.quote}`;
            })
            .filter(Boolean) as string[];
          if (snippets.length) {
            finalMessage = `Use the manuscript context below when answering. Prioritize factual accuracy over speculation.\n\n${snippets.join('\n\n')}\n\nUser question: ${message}`;
          }
        }

        const responseText = await sendChatMessage(chatSession, finalMessage);
        setChatMessages(prev => [...prev, {id: uuidv4(), role: 'model', content: responseText}]);
    } catch(e) {
        alert("Failed to send message.");
    } finally {
        setIsChatLoading(false);
    }
  };
  
  const handleGenerateAudiobook = async (style: NarrationStyle) => {
    if (!editor) return;
    setAudiobookStatus('generating');
    try {
        const text = editor.getText();
        const base64Audio = await generateAudiobook(text, style.prompt);
        const wavBlob = createWavBlobFromBase64(base64Audio);
        const url = URL.createObjectURL(wavBlob);
        setAudiobookUrl(url);
        setAudiobookStatus('success');
    } catch(e) {
        setAudiobookStatus('error');
    }
  };
  
  const handleExport = (format: 'txt' | 'html') => {
    if (!editor) return;
    const content = format === 'html' ? editor.getHTML() : editor.getText();
    const blob = new Blob([content], { type: format === 'html' ? 'text/html' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manuscript.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateMoodboard = async (text: string) => {
    setIsGeneratingMoodboard(true);
    setMoodboardImages([]);
    try {
        const prompts = await generateMoodboardPrompts(text);
        const imagePromises = prompts.map(p => generateImages(p, 1, '16:9'));
        const imageResults = await Promise.all(imagePromises);
        
        const newMoodboardImages: MoodboardImage[] = prompts.map((prompt, index) => ({
            prompt,
            imageUrl: `data:image/png;base64,${imageResults[index][0]}`,
        }));
        setMoodboardImages(newMoodboardImages);
        trackTelemetry('illustration', 'moodboards', 1, `${newMoodboardImages.length} tiles`);

    } catch (e) {
        alert("Failed to generate mood board.");
    } finally {
        setIsGeneratingMoodboard(false);
    }
  };

  const handleGenerateCharacterConcepts = async (name: string, description: string) => {
    setIsGeneratingConcepts(true);
    try {
        const prompt = `Full body character concept sheet for "${name}", a character who is ${description}. Style: digital painting, high detail, centered character, plain background.`;
        const images = await generateImages(prompt, 4, '3:4');
        const newConcept: CharacterConcept = {
            id: uuidv4(),
            name,
            description,
            referenceImageUrl: null,
            conceptImages: images.map(img => `data:image/png;base64,${img}`)
        };
        setCharacterConcepts(prev => [...prev, newConcept]);
        trackTelemetry('illustration', 'characterConcepts', 1, name);
    } catch(e) {
        alert("Failed to generate character concepts.");
    } finally {
        setIsGeneratingConcepts(false);
    }
  };
  
  const handleSetCharacterReferenceImage = (characterId: string, imageUrl: string) => {
    setCharacterConcepts(prev => prev.map(c =>
        c.id === characterId ? { ...c, referenceImageUrl: imageUrl } : c
    ));
  };

  // Character Expression/Pose/Variation/Turnaround Handlers
  const handleGenerateExpression = async (characterId: string, emotion: string) => {
    setIsGeneratingIllustration(true);
    try {
      const character = characterConcepts.find(c => c.id === characterId);
      if (!character) return;
      const prompt = `Close-up portrait of ${character.name}, showing ${emotion} emotion. Style: character concept art, high detail.`;
      const images = await generateImages(prompt, 1, '1:1');
      const newExpression: CharacterExpression = {
        id: uuidv4(),
        emotion,
        imageUrl: `data:image/png;base64,${images[0]}`,
      };
      setCharacterConcepts(prev => prev.map(c =>
        c.id === characterId ? { ...c, expressionLibrary: [...(c.expressionLibrary || []), newExpression] } : c
      ));
      trackTelemetry('illustration', 'expressions', 1, `${character.name} · ${emotion}`);
    } catch (e) {
      alert('Failed to generate expression.');
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  const handleGeneratePose = async (characterId: string, poseName: string, description: string) => {
    setIsGeneratingIllustration(true);
    try {
      const character = characterConcepts.find(c => c.id === characterId);
      if (!character) return;
      const prompt = `Full body pose of ${character.name}, ${description}. Style: character concept art, dynamic pose.`;
      const images = await generateImages(prompt, 1, '3:4');
      const newPose: CharacterPose = {
        id: uuidv4(),
        name: poseName,
        description,
        imageUrl: `data:image/png;base64,${images[0]}`,
      };
      setCharacterConcepts(prev => prev.map(c =>
        c.id === characterId ? { ...c, poseSets: [...(c.poseSets || []), newPose] } : c
      ));
      trackTelemetry('illustration', 'poses', 1, `${character.name} · ${poseName}`);
    } catch (e) {
      alert('Failed to generate pose.');
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  const handleGenerateVariation = async (characterId: string, variationName: string, description: string) => {
    setIsGeneratingIllustration(true);
    try {
      const character = characterConcepts.find(c => c.id === characterId);
      if (!character) return;
      const prompt = `Character variation of ${character.name}: ${description}. Style: character concept art.`;
      const images = await generateImages(prompt, 1, '3:4');
      const newVariation: CharacterVariation = {
        id: uuidv4(),
        name: variationName,
        description,
        imageUrl: `data:image/png;base64,${images[0]}`,
      };
      setCharacterConcepts(prev => prev.map(c =>
        c.id === characterId ? { ...c, variations: [...(c.variations || []), newVariation] } : c
      ));
      trackTelemetry('illustration', 'variations', 1, `${character.name} · ${variationName}`);
    } catch (e) {
      alert('Failed to generate variation.');
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  const handleGenerateTurnaround = async (characterId: string) => {
    setIsGeneratingIllustration(true);
    try {
      const character = characterConcepts.find(c => c.id === characterId);
      if (!character) return;
      const angles = ['front view', 'side view', 'back view', 'three-quarter view'];
      const imagePromises = angles.map(angle =>
        generateImages(`${character.name}, ${angle}. Style: character turnaround sheet, clean white background.`, 1, '1:1')
      );
      const results = await Promise.all(imagePromises);
      const turnaround: CharacterTurnaround = {
        front: `data:image/png;base64,${results[0][0]}`,
        side: `data:image/png;base64,${results[1][0]}`,
        back: `data:image/png;base64,${results[2][0]}`,
        threeFourth: `data:image/png;base64,${results[3][0]}`,
      };
      setCharacterConcepts(prev => prev.map(c =>
        c.id === characterId ? { ...c, turnaround } : c
      ));
      trackTelemetry('illustration', 'turnarounds', 1, character.name);
    } catch (e) {
      alert('Failed to generate turnaround.');
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  // Scene Management Handlers
  const handleGenerateScene = async (sceneType: SceneIllustration['sceneType'], title: string, description: string, paletteId?: string) => {
    setIsGeneratingIllustration(true);
    try {
      const prompt = `${description}. Style: ${sceneType} scene illustration, cinematic composition, detailed environment.`;
      const images = await generateImages(prompt, 1, '16:9');
      const newScene: SceneIllustration = {
        id: uuidv4(),
        title,
        description,
        imageUrl: `data:image/png;base64,${images[0]}`,
        sceneType,
        notes: paletteId ? `Using palette: ${colorPalettes.find(p => p.id === paletteId)?.name}` : undefined
      };
      setScenes(prev => [...prev, newScene]);
      trackTelemetry('illustration', 'scenes', 1, `${sceneType} · ${title}`);
    } catch (e) {
      alert('Failed to generate scene.');
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  const handleDeleteScene = (sceneId: string) => {
    setScenes(prev => prev.filter(s => s.id !== sceneId));
  };

  // Panel Layout Handlers
  const handleCreateLayout = async (layoutType: PanelLayout['layoutType'], title: string, description: string) => {
    const newLayout: PanelLayout = {
      id: uuidv4(),
      title,
      description,
      layoutType,
      pageNumber: panels.length + 1,
      panels: [],
    };
    setPanels(prev => [...prev, newLayout]);
    trackTelemetry('illustration', 'layouts', 1, `${layoutType} · ${title}`);
  };

  const handleGeneratePanel = async (layoutId: string, panelDescription: string, cameraAngle: Panel['cameraAngle']) => {
    setIsGeneratingIllustration(true);
    try {
      const prompt = `${panelDescription}. Camera angle: ${cameraAngle}. Style: sequential art panel, clear composition.`;
      const images = await generateImages(prompt, 1, '1:1');
      const layout = panels.find(p => p.id === layoutId);
      const newPanel: Panel = {
        id: uuidv4(),
        order: layout ? layout.panels.length + 1 : 1,
        cameraAngle,
        imageUrl: `data:image/png;base64,${images[0]}`,
      };
      setPanels(prev => prev.map(layout =>
        layout.id === layoutId ? { ...layout, panels: [...layout.panels, newPanel] } : layout
      ));
      trackTelemetry('illustration', 'panels', 1, `${layout?.title || 'Layout'} panel`);
    } catch (e) {
      alert('Failed to generate panel.');
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  const handleAddDialogue = (layoutId: string, panelId: string, speaker: string, text: string) => {
    setPanels(prev => prev.map(layout =>
      layout.id === layoutId ? {
        ...layout,
        panels: layout.panels.map(panel =>
          panel.id === panelId ? { ...panel, dialogue: `${speaker}: ${text}` } : panel
        )
      } : layout
    ));
  };

  const handleAddSoundEffect = (layoutId: string, panelId: string, soundEffect: string) => {
    setPanels(prev => prev.map(layout =>
      layout.id === layoutId ? {
        ...layout,
        panels: layout.panels.map(panel =>
          panel.id === panelId ? { ...panel, soundEffects: soundEffect } : panel
        )
      } : layout
    ));
  };

  const handleDeleteLayout = (layoutId: string) => {
    setPanels(prev => prev.filter(p => p.id !== layoutId));
  };

  // Style Lock Handlers
  const handleCreateStyleGuide = async (artStyle: StyleGuide['artStyle'], lighting: StyleGuide['lighting'], linework: StyleGuide['linework'], notes: string) => {
    const newStyleGuide: StyleGuide = {
      id: uuidv4(),
      artStyle,
      lighting,
      linework,
      notes,
      referenceImages: [],
    };
    setStyleGuide(newStyleGuide);
    trackTelemetry('illustration', 'styleGuides', 1, artStyle);
  };

  const handleUpdateStyleGuide = (updates: Partial<StyleGuide>) => {
    if (styleGuide) {
      setStyleGuide({ ...styleGuide, ...updates });
    }
  };

  const handleUploadReference = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        if (styleGuide) {
          setStyleGuide({
            ...styleGuide,
            referenceImages: [...styleGuide.referenceImages, imageUrl],
          });
        }
        resolve(imageUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCreatePalette = async (name: string, colors: PaletteColor[], purpose: ColorPalette['purpose'], notes: string) => {
    const newPalette: ColorPalette = {
      id: uuidv4(),
      name,
      colors,
      purpose,
      notes,
    };
    setColorPalettes(prev => [...prev, newPalette]);
    trackTelemetry('illustration', 'palettes', 1, `${purpose} · ${name}`);
  };

  const handleDeletePalette = (paletteId: string) => {
    setColorPalettes(prev => prev.filter(p => p.id !== paletteId));
  };

  // Worldbuilding Handlers
  const handleGenerateMap = async (name: string, description: string, mapType: MapDesign['mapType']) => {
    setIsGeneratingIllustration(true);
    try {
      const prompt = `${description}. Style: ${mapType} map, fantasy cartography, detailed.`;
      const images = await generateImages(prompt, 1, '16:9');
      const newMap: MapDesign = {
        id: uuidv4(),
        name,
        description,
        mapType,
        imageUrl: `data:image/png;base64,${images[0]}`,
      };
      setMaps(prev => [...prev, newMap]);
      trackTelemetry('illustration', 'maps', 1, `${mapType} · ${name}`);
    } catch (e) {
      alert('Failed to generate map.');
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  const handleGenerateSymbol = async (name: string, description: string, symbolType: string) => {
    setIsGeneratingIllustration(true);
    try {
      const prompt = `${description}. Style: emblem design, clean symbol, iconic.`;
      const images = await generateImages(prompt, 1, '1:1');
      const newSymbol: SymbolDesign = {
        id: uuidv4(),
        name,
        description,
        symbolType,
        imageUrl: `data:image/png;base64,${images[0]}`,
      };
      setSymbols(prev => [...prev, newSymbol]);
      trackTelemetry('illustration', 'symbols', 1, `${symbolType} · ${name}`);
    } catch (e) {
      alert('Failed to generate symbol.');
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  const handleGenerateEnvironment = async (name: string, description: string, environmentType: EnvironmentDesign['environmentType']) => {
    setIsGeneratingIllustration(true);
    try {
      const prompt = `${description}. Style: environment concept art, detailed ${environmentType} design.`;
      const images = await generateImages(prompt, 1, '16:9');
      const newEnvironment: EnvironmentDesign = {
        id: uuidv4(),
        name,
        description,
        environmentType,
        imageUrl: `data:image/png;base64,${images[0]}`,
      };
      setEnvironments(prev => [...prev, newEnvironment]);
      trackTelemetry('illustration', 'environments', 1, `${environmentType} · ${name}`);
    } catch (e) {
      alert('Failed to generate environment.');
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  const handleGenerateProp = async (name: string, description: string, propType: PropDesign['propType']) => {
    setIsGeneratingIllustration(true);
    try {
      const prompt = `${description}. Style: prop design, detailed ${propType} concept art.`;
      const images = await generateImages(prompt, 1, '1:1');
      const newProp: PropDesign = {
        id: uuidv4(),
        name,
        description,
        propType,
        imageUrl: `data:image/png;base64,${images[0]}`,
      };
      setProps(prev => [...prev, newProp]);
      trackTelemetry('illustration', 'props', 1, `${propType} · ${name}`);
    } catch (e) {
      alert('Failed to generate prop.');
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  const handleDeleteMap = (mapId: string) => {
    setMaps(prev => prev.filter(m => m.id !== mapId));
  };

  const handleDeleteSymbol = (symbolId: string) => {
    setSymbols(prev => prev.filter(s => s.id !== symbolId));
  };

  const handleDeleteEnvironment = (environmentId: string) => {
    setEnvironments(prev => prev.filter(e => e.id !== environmentId));
  };

  const handleDeleteProp = (propId: string) => {
    setProps(prev => prev.filter(p => p.id !== propId));
  };

  // Cover Design Handlers
  const handleGenerateHeroImage = async (coverId: string, prompt: string) => {
    setIsGeneratingIllustration(true);
    try {
      const fullPrompt = `${prompt}. Style: book cover art, no text, professional.`;
      const images = await generateImages(fullPrompt, 1, '3:4');
      setCovers(prev => prev.map(cover =>
        cover.id === coverId ? { ...cover, heroImageUrl: `data:image/png;base64,${images[0]}` } : cover
      ));
      trackTelemetry('illustration', 'heroCovers', 1, coverId);
    } catch (e) {
      alert('Failed to generate hero image.');
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  const handleGenerateFullJacket = async (coverId: string, prompt: string) => {
    setIsGeneratingIllustration(true);
    try {
      const fullPrompt = `${prompt}. Style: full book jacket wrap, includes spine area.`;
      const images = await generateImages(fullPrompt, 1, '16:9');
      setCovers(prev => prev.map(cover =>
        cover.id === coverId ? { ...cover, fullJacketUrl: `data:image/png;base64,${images[0]}` } : cover
      ));
      trackTelemetry('illustration', 'jackets', 1, coverId);
    } catch (e) {
      alert('Failed to generate full jacket.');
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  const handleCreateTypography = async (coverId: string, typography: TypographyDesign) => {
    setCovers(prev => prev.map(cover =>
      cover.id === coverId ? { ...cover, typography } : cover
    ));
  };

  const handleGenerateMarketingGraphic = async (coverId: string, platform: string) => {
    setIsGeneratingIllustration(true);
    try {
      const cover = covers.find(c => c.id === coverId);
      if (!cover) return;
      const prompt = `Social media graphic for ${platform}, based on book cover. Style: promotional, engaging.`;
      const images = await generateImages(prompt, 1, '1:1');
      alert(`Marketing graphic generated for ${platform}`);
      trackTelemetry('marketing', 'assets', 1, `${platform} promo`);
    } catch (e) {
      alert('Failed to generate marketing graphic.');
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  const handleDeleteCover = (coverId: string) => {
    setCovers(prev => prev.filter(c => c.id !== coverId));
  };

  // Production & QC Handlers
  const handleUpdatePrintSpecs = (specs: PrintSpecs) => {
    setPrintSpecs(specs);
  };

  const handleExportAsset = (assetId: string, format: string) => {
    alert(`Exporting asset ${assetId} as ${format}`);
  };

  // Revision Handlers
  const handleCreateRevision = async (revision: Partial<RevisionFeedback>) => {
    const newRevision: RevisionFeedback = {
      id: uuidv4(),
      assetId: revision.assetId || '',
      assetType: revision.assetType || 'illustration',
      assetTitle: revision.assetTitle,
      comment: revision.comment || '',
      status: 'pending',
      priority: revision.priority,
      createdAt: new Date(),
      responses: []
    };
    setRevisions(prev => [...prev, newRevision]);
    trackTelemetry('quality', 'revisionsLogged', 1, newRevision.assetType);
  };

  const handleUpdateRevisionStatus = async (id: string, status: RevisionFeedback['status']) => {
    setRevisions(prev => prev.map(r =>
      r.id === id ? { ...r, status, resolvedAt: status === 'resolved' ? new Date() : r.resolvedAt } : r
    ));
    if (status === 'resolved') {
      trackTelemetry('quality', 'revisionsResolved', 1, id);
    }
  };

  const handleAddRevisionResponse = async (feedbackId: string, message: string, author: 'author' | 'artist') => {
    const newResponse: RevisionResponse = {
      id: uuidv4(),
      feedbackId,
      author,
      message,
      createdAt: new Date()
    };
    setRevisions(prev => prev.map(r =>
      r.id === feedbackId ? { ...r, responses: [...(r.responses || []), newResponse] } : r
    ));
  };

  const handleDeleteRevision = async (id: string) => {
    setRevisions(prev => prev.filter(r => r.id !== id));
  };

  const formatCurrency = (value: number, currency: string = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('en-US').format(Math.round(value || 0));

  const formatPercent = (value: number) => `${(value || 0).toFixed(1)}%`;

  const formatHours = (value: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value || 0);

  const analyticsRollup = opsProjects.reduce(
    (acc, project) => {
      const listening = project.analytics?.listeningMetrics;
      const revenue = project.analytics?.revenueMetrics;

      if (listening) {
        acc.totalListens += listening.totalListens || 0;
        acc.totalListeningHours += listening.totalListeningHours || 0;
        acc.completionSum += listening.averageCompletionRate || 0;
        acc.analyticsCount += 1;
      }

      if (revenue) {
        acc.totalRevenue += revenue.totalRevenue || 0;
        acc.totalNetProfit += revenue.netProfit || 0;
        acc.currency = revenue.currency || acc.currency;
      }

      project.analytics?.platformBreakdown?.forEach(platform => {
        if (!acc.platforms[platform.platform]) {
          acc.platforms[platform.platform] = { listens: 0, revenue: 0 };
        }
        acc.platforms[platform.platform].listens += platform.listens || 0;
        acc.platforms[platform.platform].revenue += platform.revenue || 0;
      });

      return acc;
    },
    {
      totalListens: 0,
      totalListeningHours: 0,
      completionSum: 0,
      analyticsCount: 0,
      totalRevenue: 0,
      totalNetProfit: 0,
      currency: 'USD',
      platforms: {} as Record<string, { listens: number; revenue: number }>
    }
  );

  const marketingRollup = opsProjects.reduce(
    (acc, project) => {
      if (!project.marketing) return acc;

      acc.campaigns += 1;
      acc.assets += project.marketing.assets?.length || 0;

      if (project.marketing.analyticsTracking) {
        acc.impressions += project.marketing.analyticsTracking.impressions || 0;
        acc.clicks += project.marketing.analyticsTracking.clicks || 0;
        acc.conversions += project.marketing.analyticsTracking.conversions || 0;
      }

      return acc;
    },
    { campaigns: 0, assets: 0, impressions: 0, clicks: 0, conversions: 0 }
  );

  const revisionBreakdown = revisions.reduce(
    (acc, revision) => {
      acc[revision.status] = (acc[revision.status] || 0) + 1;
      return acc;
    },
    { pending: 0, 'in-progress': 0, resolved: 0 } as Record<RevisionFeedback['status'], number>
  );

  const pipelineStages: { key: AudiobookProject['status']; label: string; color: string; bar: string }[] = [
    { key: 'planning', label: 'Planning', color: 'bg-blue-400', bar: 'bg-blue-500' },
    { key: 'scripting', label: 'Script', color: 'bg-sky-400', bar: 'bg-sky-500' },
    { key: 'recording', label: 'Recording', color: 'bg-indigo-400', bar: 'bg-indigo-500' },
    { key: 'editing', label: 'Editing', color: 'bg-purple-400', bar: 'bg-purple-500' },
    { key: 'mastering', label: 'Mastering', color: 'bg-fuchsia-400', bar: 'bg-fuchsia-500' },
    { key: 'distribution', label: 'Distribution', color: 'bg-orange-400', bar: 'bg-orange-500' },
    { key: 'live', label: 'Live', color: 'bg-emerald-400', bar: 'bg-emerald-500' }
  ];

  const pipelineStats = pipelineStages.map(stage => ({
    ...stage,
    count: opsProjects.filter(project => project.status === stage.key).length
  }));

  const pipelineTotal = pipelineStats.reduce((sum, stage) => sum + stage.count, 0) || 1;

  const platformLeaders = Object.entries(analyticsRollup.platforms)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 4);

  const averageCompletionRate = analyticsRollup.analyticsCount
    ? analyticsRollup.completionSum / analyticsRollup.analyticsCount
    : 0;

  const liveProjects = opsProjects.filter(
    project => project.status === 'live' || project.distribution?.status === 'live'
  ).length;

  const marketingCtr = marketingRollup.impressions
    ? (marketingRollup.clicks / marketingRollup.impressions) * 100
    : 0;

  const marketingConversion = marketingRollup.impressions
    ? (marketingRollup.conversions / marketingRollup.impressions) * 100
    : 0;

  const openRevisions = revisionBreakdown.pending + revisionBreakdown['in-progress'];
  const editingSparkline = useMemo(() => {
    const series = telemetry.events
      .filter(event => event.category === 'editing')
      .slice(0, 12)
      .map(event => (event.value && event.value > 0 ? event.value : 1))
      .reverse();
    return series.length ? series : [0];
  }, [telemetry.events]);

  const marketingSparkline = useMemo(() => {
    const series = telemetry.events
      .filter(event => event.category === 'marketing')
      .slice(0, 12)
      .map(event => (event.value && event.value > 0 ? event.value : 1))
      .reverse();
    return series.length ? series : [0];
  }, [telemetry.events]);

  const marketingView = (
    <div className="flex-1 overflow-y-auto bg-brand-bg text-brand-text">
      <section className="max-w-6xl mx-auto px-6 py-10 md:py-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-primary/30 bg-brand-surface/70 text-xs text-brand-primary mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
          AI Editing • Illustration • Audiobooks • Publishing Ops
        </div>
        <div className="grid gap-8 md:grid-cols-[minmax(0,3fr),minmax(260px,2fr)] items-center">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold md:font-bold tracking-tight mb-4">
              The AI studio that takes your stories
              <span className="text-brand-primary"> from draft to global launch.</span>
            </h1>
            <p className="text-sm md:text-base text-brand-text-secondary mb-5 max-w-xl">
              Position your agency as the end-to-end production partner for authors and publishers:
              editing, illustration, cinematic audiobooks, and omnichannel marketing powered by safe, human-guided AI.
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={() => setActiveView('editing')}
                className="px-4 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-xs md:text-sm font-semibold shadow-sm shadow-brand-primary/30 transition-colors"
              >
                Start a Project in the Studio
              </button>
              <button
                onClick={() => setIsMarketingModalOpen(true)}
                className="px-4 py-2.5 rounded-lg border border-brand-border text-xs md:text-sm text-brand-text-secondary hover:text-brand-text hover:border-brand-primary/60 hover:bg-brand-surface/70 transition-colors"
              >
                Preview AI Campaign Generator
              </button>
            </div>
            <div className="flex flex-wrap gap-4 text-[10px] md:text-xs text-brand-text-secondary">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Human-reviewed outputs
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Brand-safe, rights-conscious workflows
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Built on your manuscripts & style guides
              </div>
            </div>
          </div>
          <div className="bg-brand-surface/90 border border-brand-border/80 rounded-2xl p-4 space-y-3 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-brand-text-secondary">
                  Live agency cockpit
                </p>
                <p className="text-sm font-semibold">Your pipeline at a glance</p>
              </div>
              <div className="flex gap-1.5">
                <div className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[9px] text-emerald-300">
                  96% On-time
                </div>
                <div className="px-2 py-1 rounded-md bg-brand-primary/10 border border-brand-primary/40 text-[9px] text-brand-primary">
                  40% Faster
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div className="p-2 rounded-lg bg-brand-bg/90 border border-brand-border/80">
                <p className="text-[9px] text-brand-text-secondary mb-0.5">Editing & QA</p>
                <p className="font-semibold text-xs mb-1">Manuscript Intelligence</p>
                <ul className="space-y-0.5 text-[8px] text-brand-text-secondary">
                  <li>Line editing & grammar at scale</li>
                  <li>Continuity, sensitivity, and fact checks</li>
                  <li>Style-locked revisions per imprint</li>
                </ul>
              </div>
              <div className="p-2 rounded-lg bg-brand-bg/90 border border-brand-border/80">
                <p className="text-[9px] text-brand-text-secondary mb-0.5">Illustration</p>
                <p className="font-semibold text-xs mb-1">Visual Worlds Engine</p>
                <ul className="space-y-0.5 text-[8px] text-brand-text-secondary">
                  <li>Character sheets & world bibles</li>
                  <li>Panel layouts & cover systems</li>
                  <li>Consistent art across SKUs</li>
                </ul>
              </div>
              <div className="p-2 rounded-lg bg-brand-bg/90 border border-brand-border/80">
                <p className="text-[9px] text-brand-text-secondary mb-0.5">Audiobooks</p>
                <p className="font-semibold text-xs mb-1">Cinematic Audio Suite</p>
                <ul className="space-y-0.5 text-[8px] text-brand-text-secondary">
                  <li>Hybrid human + AI narration</li>
                  <li>Automated QC & mastering</li>
                  <li>Format-ready exports</li>
                </ul>
              </div>
              <div className="p-2 rounded-lg bg-brand-bg/90 border border-brand-border/80">
                <p className="text-[9px] text-brand-text-secondary mb-0.5">Marketing Ops</p>
                <p className="font-semibold text-xs mb-1">Launch Command Center</p>
                <ul className="space-y-0.5 text-[8px] text-brand-text-secondary">
                  <li>Campaign blueprints per genre</li>
                  <li>Trailers, ads, emails in clicks</li>
                  <li>Attribution-ready assets</li>
                </ul>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-brand-border/70">
              <div className="flex items-center gap-1.5 text-[8px] text-brand-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Deploy as your white-label studio in days.
              </div>
              <button
                onClick={() => setActiveView('publishing')}
                className="px-2.5 py-1.5 rounded-md bg-brand-primary/10 text-[8px] text-brand-primary hover:bg-brand-primary/20 transition-colors"
              >
                View Publishing & Delivery
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 pb-10 md:pb-14 grid gap-6 lg:grid-cols-3 text-[10px] md:text-xs text-brand-text-secondary">
        <div className="bg-brand-surface/70 border border-brand-border/80 rounded-2xl p-4 space-y-2">
          <h3 className="text-sm md:text-base font-semibold text-brand-text">For Agencies</h3>
          <p>Offer a full-stack AI book production studio under your brand: SOP-based workflows, approval gates, and export-ready assets.</p>
        </div>
        <div className="bg-brand-surface/70 border border-brand-border/80 rounded-2xl p-4 space-y-2">
          <h3 className="text-sm md:text-base font-semibold text-brand-text">For Publishers</h3>
          <p>Centralize editing, illustration, audio, and launch in one governed environment that respects rights, voice, and imprint constraints.</p>
        </div>
        <div className="bg-brand-surface/70 border border-brand-border/80 rounded-2xl p-4 space-y-2">
          <h3 className="text-sm md:text-base font-semibold text-brand-text">For Creators</h3>
          <p>Turn manuscripts into premium universes without juggling vendors: our AI copilots stay on-voice, on-lore, and on-deadline.</p>
        </div>
      </section>
    </div>
  );

  const productionInFlight = pipelineTotal - (pipelineStats.find(stage => stage.key === 'live')?.count || 0);
  const analyticsUpdatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const lifecycleUpdatedAt = projectOpsSnapshot.lastUpdated
    ? new Date(projectOpsSnapshot.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : analyticsUpdatedAt;
  const revisionResolutionRate = (() => {
    const total = openRevisions + revisionBreakdown.resolved;
    if (!total) return 0;
    return (revisionBreakdown.resolved / total) * 100;
  })();

  const aiCommandRuns = telemetry.counters.editing.aiCommands || 0;
  const grammarRuns = telemetry.counters.editing.grammarChecks || 0;
  const factRuns = telemetry.counters.editing.factChecks || 0;
  const consistencyRuns = telemetry.counters.editing.consistencyAudits || 0;
  const sensitivityRuns = telemetry.counters.editing.sensitivityPasses || 0;
  const structureRuns = telemetry.counters.editing.structureAudits || 0;
  const cleanupRuns = telemetry.counters.editing.cleanupRuns || 0;
  const aiAuditRuns = grammarRuns + factRuns + consistencyRuns + sensitivityRuns + structureRuns;
  const aiWordsAuthored = telemetry.counters.editing.wordsAuthored || wordCount.total;
  const aiOpsTotal = aiCommandRuns + aiAuditRuns + cleanupRuns;

  const aiAuditsBreakdown = [
    { label: 'Grammar', value: grammarRuns },
    { label: 'Fact check', value: factRuns },
    { label: 'Consistency', value: consistencyRuns },
    { label: 'Sensitivity', value: sensitivityRuns },
    { label: 'Structure', value: structureRuns },
  ].filter(item => item.value > 0).slice(0, 4);

  const illustrationHighlights = [
    { label: 'Moodboards', value: telemetry.counters.illustration.moodboards || 0 },
    { label: 'Characters', value: telemetry.counters.illustration.characterConcepts || 0 },
    { label: 'Scenes', value: telemetry.counters.illustration.scenes || 0 },
    { label: 'Panels', value: telemetry.counters.illustration.panels || 0 },
    { label: 'Palettes', value: telemetry.counters.illustration.palettes || 0 },
  ].filter(item => item.value > 0).slice(0, 4);

  const illustrationThroughput = Object.values(telemetry.counters.illustration).reduce(
    (sum, value) => sum + (value || 0),
    0
  );

  const marketingCreativeReady = telemetry.counters.marketing.assets || marketingRollup.assets;
  const marketingCampaignsGenerated = telemetry.counters.marketing.campaigns || marketingRollup.campaigns;

  const qualityResolutionRate = telemetry.counters.quality.revisionsLogged
    ? (telemetry.counters.quality.revisionsResolved / telemetry.counters.quality.revisionsLogged) * 100
    : revisionResolutionRate;

  const recentTelemetryEvents = telemetry.events.slice(0, 6);

  const studioAlerts: { label: string; detail: string; severity: 'info' | 'warn' }[] = [];
  const editingStage = pipelineStats.find(stage => stage.key === 'editing');
  if (editingStage && editingStage.count / pipelineTotal > 0.35) {
    studioAlerts.push({
      label: 'Editing backlog detected',
      detail: 'Shift resources or approve AI polish passes to keep manuscripts moving.',
      severity: 'warn',
    });
  }
  if (qualityResolutionRate < 60 && telemetry.counters.quality.revisionsLogged > 4) {
    studioAlerts.push({
      label: 'Revisions piling up',
      detail: 'QA approvals are lagging. Consider adding an art director review block.',
      severity: 'warn',
    });
  }
  if (marketingCtr < 1 && marketingRollup.impressions > 1000) {
    studioAlerts.push({
      label: 'Low marketing CTR',
      detail: 'Refresh top creative or retarget segments to improve acquisition efficiency.',
      severity: 'warn',
    });
  }
  if (!studioAlerts.length) {
    studioAlerts.push({
      label: 'All systems nominal',
      detail: 'Pipelines, QA, and campaign health are balanced right now.',
      severity: 'info',
    });
  }

  const statisticsView = (
    <div className="flex-1 overflow-y-auto bg-brand-bg text-brand-text">
      <section className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-text-muted mb-2">
              Operational Intelligence
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">
              Live health of your AI production studio
            </h1>
            <p className="text-sm md:text-base text-brand-text-secondary max-w-3xl mt-2">
              Roll up editing, illustration, audio, and launch signals in one cockpit. Use it to spot
              production slowdowns, royalty opportunities, and marketing wins without leaving the studio.
            </p>
          </div>
          <div className="text-right text-xs text-brand-text-secondary">
            <p className="font-semibold text-brand-text">Synced {analyticsUpdatedAt}</p>
            <p>{formatNumber(opsProjects.length)} linked projects</p>
            <p className="text-[11px] text-brand-text-muted">Lifecycle update {lifecycleUpdatedAt}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="bg-brand-surface/80 border border-brand-border/80 rounded-2xl p-4 shadow-lg shadow-black/10">
            <p className="text-xs text-brand-text-secondary">Active productions</p>
            <p className="text-3xl font-semibold mt-2">{formatNumber(opsProjects.length)}</p>
            <p className="text-xs text-brand-text-muted mt-1">{formatNumber(productionInFlight)} in flight · {formatNumber(liveProjects)} live</p>
          </div>
          <div className="bg-brand-surface/80 border border-brand-border/80 rounded-2xl p-4 shadow-lg shadow-black/10">
            <p className="text-xs text-brand-text-secondary">Royalty forecast</p>
            <p className="text-3xl font-semibold mt-2">{formatCurrency(analyticsRollup.totalRevenue, analyticsRollup.currency)}</p>
            <p className="text-xs text-emerald-300 mt-1">Net {formatCurrency(analyticsRollup.totalNetProfit, analyticsRollup.currency)} projected</p>
          </div>
          <div className="bg-brand-surface/80 border border-brand-border/80 rounded-2xl p-4 shadow-lg shadow-black/10">
            <p className="text-xs text-brand-text-secondary">Listener completion</p>
            <p className="text-3xl font-semibold mt-2">{formatPercent(averageCompletionRate)}</p>
            <p className="text-xs text-brand-text-muted mt-1">{formatHours(analyticsRollup.totalListeningHours)} total hours streamed</p>
          </div>
          <div className="bg-brand-surface/80 border border-brand-border/80 rounded-2xl p-4 shadow-lg shadow-black/10">
            <p className="text-xs text-brand-text-secondary">Marketing reach</p>
            <p className="text-3xl font-semibold mt-2">{formatNumber(marketingRollup.impressions)}</p>
            <p className="text-xs text-brand-text-muted mt-1">CTR {formatPercent(marketingCtr)} · CVR {formatPercent(marketingConversion)}</p>
            <p className="text-[11px] text-brand-text-secondary mt-1">{formatNumber(marketingCampaignsGenerated)} AI campaigns · {formatNumber(marketingCreativeReady)} assets</p>
            <div className="mt-3">
              <Sparkline data={marketingSparkline} color="#22d3ee" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-brand-surface/80 border border-brand-border/80 rounded-2xl p-5">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-brand-text">AI Copilot Productivity</h2>
                <p className="text-xs text-brand-text-secondary">Editing automations + QA audits</p>
              </div>
              <span className="text-sm font-semibold text-brand-primary">{formatNumber(aiOpsTotal)} ops</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-brand-text-muted">AI commands</p>
                <p className="text-lg font-semibold">{formatNumber(aiCommandRuns)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-brand-text-muted">Audits</p>
                <p className="text-lg font-semibold">{formatNumber(aiAuditRuns)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-brand-text-muted">Cleanup sweeps</p>
                <p className="text-lg font-semibold">{formatNumber(cleanupRuns)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-brand-text-muted">Words authored</p>
                <p className="text-lg font-semibold">{formatNumber(aiWordsAuthored)}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-brand-text-secondary">
              {(aiAuditsBreakdown.length ? aiAuditsBreakdown : [{ label: 'Awaiting audits', value: 0 }]).map(item => (
                <div key={item.label} className="flex items-center justify-between rounded-lg bg-brand-bg/80 border border-brand-border/60 px-3 py-2">
                  <span>{item.label}</span>
                  <span className="font-semibold text-brand-text">{formatNumber(item.value)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Sparkline data={editingSparkline} color="#c084fc" />
            </div>
          </div>
          <div className="bg-brand-surface/80 border border-brand-border/80 rounded-2xl p-5">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-brand-text">Illustration Output Factory</h2>
                <p className="text-xs text-brand-text-secondary">Visual deliverables per sprint</p>
              </div>
              <span className="text-sm font-semibold text-brand-primary">{formatNumber(illustrationThroughput)} assets</span>
            </div>
            <p className="text-xs text-brand-text-muted mt-2">{formatNumber(marketingCreativeReady)} launch-ready marketing graphics</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {(illustrationHighlights.length ? illustrationHighlights : [{ label: 'Start generating art', value: 0 }]).map(item => (
                <div key={item.label} className="rounded-xl border border-brand-border/70 bg-brand-bg/80 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-brand-text-muted">{item.label}</p>
                  <p className="text-xl font-semibold text-brand-text">{formatNumber(item.value)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 text-[11px] text-brand-text-secondary">
              {formatNumber(marketingCampaignsGenerated)} AI campaigns generated • {formatNumber(telemetry.counters.illustration.styleGuides || 0)} active style guides
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr),minmax(0,2fr)]">
          <div className="bg-brand-surface/70 border border-brand-border/70 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-brand-text">Production pipeline health</h2>
                <p className="text-xs text-brand-text-secondary">Spot where manuscripts are slowing down</p>
              </div>
              <span className="text-xs text-brand-text-muted">{formatNumber(pipelineTotal)} total</span>
            </div>
            <div className="space-y-3">
              {pipelineStats.map(stage => (
                <div key={stage.key} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                  <div className="w-24 text-xs font-medium text-brand-text">
                    {stage.label}
                  </div>
                  <div className="flex-1 h-2 bg-brand-border/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.bar}`}
                      style={{ width: `${(stage.count / pipelineTotal) * 100}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-xs text-brand-text-secondary">
                    {stage.count || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-surface/70 border border-brand-border/70 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-brand-text">Marketing control tower</h2>
                <p className="text-xs text-brand-text-secondary">Campaigns visible across platforms</p>
              </div>
              <span className="text-xs text-brand-text-muted">{marketingRollup.campaigns} active</span>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-brand-text-secondary text-xs">Assets ready</p>
                <p className="text-2xl font-semibold">{formatNumber(marketingCreativeReady)}</p>
                <p className="text-xs text-brand-text-muted">Audiograms, trailers, social kits</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-text-secondary">Impressions</span>
                <span className="font-semibold">{formatNumber(marketingRollup.impressions)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-text-secondary">Clicks</span>
                <span className="font-semibold">{formatNumber(marketingRollup.clicks)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-text-secondary">Conversions</span>
                <span className="font-semibold">{formatNumber(marketingRollup.conversions)}</span>
              </div>
              <div className="text-xs text-emerald-300 border border-emerald-300/30 rounded-lg px-3 py-2 bg-emerald-400/5">
                Highest performing creative: {marketingCreativeReady ? 'Waveform reels' : 'Awaiting first asset'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="bg-brand-surface/70 border border-brand-border/70 rounded-2xl p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-brand-text">Platform leaders</h2>
                <p className="text-xs text-brand-text-secondary">Where listeners finish and pay</p>
              </div>
              <span className="text-xs text-brand-text-muted">Top {platformLeaders.length || 0}</span>
            </div>
            {platformLeaders.length ? (
              <div className="divide-y divide-brand-border/60 text-sm">
                {platformLeaders.map(([platform, stats]) => (
                  <div key={platform} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-brand-text capitalize">{platform}</p>
                      <p className="text-xs text-brand-text-secondary">
                        {formatNumber(stats.listens)} listens
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(stats.revenue, analyticsRollup.currency)}</p>
                      <p className="text-xs text-brand-text-secondary">{formatPercent((stats.listens / (analyticsRollup.totalListens || 1)) * 100)} of total plays</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-brand-text-secondary">Connect analytics to see platform trends.</div>
            )}
          </div>

          <div className="bg-brand-surface/70 border border-brand-border/70 rounded-2xl p-5">
            <h2 className="text-xl font-semibold text-brand-text mb-4">Quality & revision flow</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-brand-text-secondary">Open revisions</span>
                <span className="text-lg font-semibold">{openRevisions}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-text-secondary">Pending</span>
                <span className="font-semibold">{revisionBreakdown.pending}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-text-secondary">In progress</span>
                <span className="font-semibold">{revisionBreakdown['in-progress']}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-text-secondary">Resolved</span>
                <span className="font-semibold text-emerald-300">{revisionBreakdown.resolved}</span>
              </div>
              <div>
                <p className="text-xs text-brand-text-secondary mb-1">Resolution rate</p>
                <div className="w-full h-2 bg-brand-border/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${qualityResolutionRate}%` }}
                  />
                </div>
                <p className="text-[11px] text-brand-text-muted mt-1">{formatPercent(qualityResolutionRate)} cleared over last cycle</p>
              </div>
              <div className="text-xs text-brand-text-secondary border border-brand-border/70 rounded-xl px-3 py-2">
                Studio processed {formatNumber(wordCount.total)} words this session.
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,3fr)]">
          <div className="bg-brand-surface/70 border border-brand-border/70 rounded-2xl p-5">
            <h2 className="text-xl font-semibold text-brand-text mb-3">Studio alerts</h2>
            <div className="space-y-3 text-sm">
              {studioAlerts.map(alert => (
                <div
                  key={alert.label}
                  className={`rounded-xl border px-4 py-3 ${
                    alert.severity === 'warn'
                      ? 'border-red-500/50 bg-red-500/5 text-red-100'
                      : 'border-emerald-400/40 bg-emerald-400/5 text-emerald-100'
                  }`}
                >
                  <p className="font-semibold text-base">{alert.label}</p>
                  <p className="text-xs opacity-80">{alert.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-brand-surface/70 border border-brand-border/70 rounded-2xl p-5">
            <h2 className="text-xl font-semibold text-brand-text mb-3">Latest activity</h2>
            {recentTelemetryEvents.length ? (
              <div className="space-y-3 text-sm">
                {recentTelemetryEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between gap-4 border-b border-brand-border/50 pb-2 last:border-b-0">
                    <div>
                      <p className="font-semibold capitalize text-brand-text">{event.category}</p>
                      <p className="text-xs text-brand-text-secondary">
                        {event.action}
                        {event.detail ? ` · ${event.detail}` : ''}
                      </p>
                    </div>
                    <span className="text-[11px] text-brand-text-muted whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-text-secondary">Run an AI assist, illustration, or marketing task to populate the activity log.</p>
            )}
          </div>
        </div>

        <div className="bg-brand-surface/80 border border-brand-border/80 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-brand-text">Launch scenario lab</h2>
              <p className="text-xs text-brand-text-secondary">Let Gemini stress-test your go-to-market plan.</p>
            </div>
            <div className="flex items-center gap-2">
              {(['speed', 'reach', 'budget'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setScenarioPriority(option)}
                  className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wide border ${
                    scenarioPriority === option
                      ? 'bg-brand-primary/15 border-brand-primary text-brand-primary'
                      : 'border-brand-border/60 text-brand-text-secondary'
                  }`}
                >
                  {option}
                </button>
              ))}
              <button
                onClick={() => handleSimulateScenarios(scenarioPriority)}
                disabled={isSimulatingLaunch || !editor}
                className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold disabled:opacity-40"
              >
                {isSimulatingLaunch ? 'Simulating…' : 'Simulate'}
              </button>
            </div>
          </div>
          {scenarioInsights.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {scenarioInsights.map((scenario) => (
                <div key={scenario.name} className="rounded-2xl border border-brand-border/70 bg-brand-elevated/80 p-3 space-y-2 text-xs">
                  <div>
                    <p className="text-sm font-semibold text-brand-text">{scenario.name}</p>
                    <p className="text-brand-text-muted leading-snug">{scenario.summary}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-brand-text-muted">Tradeoffs</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {scenario.tradeoffs.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-brand-text-secondary">
                    <div>
                      <p className="uppercase">Speed</p>
                      <p className="text-brand-text">{scenario.metrics.timeToMarket}</p>
                    </div>
                    <div>
                      <p className="uppercase">Budget</p>
                      <p className="text-brand-text">{scenario.metrics.budgetImpact}</p>
                    </div>
                    <div>
                      <p className="uppercase">Reach</p>
                      <p className="text-brand-text">{scenario.metrics.expectedReach}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-brand-text-muted">Next moves</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {scenario.recommendations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-text-secondary">
              Choose a priority and tap Simulate to see three battle-tested launch plays with tradeoffs.
            </p>
          )}
        </div>
      </section>
    </div>
  );

  return (
    <div className={`h-screen w-screen flex flex-col font-sans ${focusMode ? 'focus-mode' : ''}`}>
        <Navbar activeView={activeView} setActiveView={setActiveView} />
        
        <div className="flex-grow flex overflow-hidden">
        {activeView === 'editing' ? (
          <>
            <LeftSidebar
                onUpload={() => document.getElementById('file-upload')?.click()}
                onOpenResearch={() => setIsResearchModalOpen(true)}
                onOpenFind={() => setIsFindReplaceModalOpen(true)}
                onToggleNavPane={() => setIsNavPaneOpen(!isNavPaneOpen)}
                onPrint={() => {}} // Handled by ReactToPrint
                onOpenGoal={() => setIsWritingGoalModalOpen(true)}
                onOpenHistory={() => setIsVersionHistoryModalOpen(true)}
                onReadAloud={handleReadAloud}
                onPublish={() => setIsPublishingModalOpen(true)}
                onOpenMarketing={() => setIsMarketingModalOpen(true)}
                onOpenWorldBible={() => setIsWorldBibleModalOpen(true)}
                onOpenExport={() => setIsExportModalOpen(true)}
                onOpenChat={handleOpenChat}
                onOpenAudiobook={() => setIsAudiobookModalOpen(true)}
                onOpenComments={() => setIsCommentsPanelOpen(true)}
            />
            <NavigationPane
              isOpen={isNavPaneOpen}
              outline={outline}
              editor={editor}
              pacingBeats={pacingBeats}
              timelineEvents={timelineEvents}
              onRunPacing={handleRunPacingAnalysis}
              onRunTimeline={handleGenerateContinuityTimeline}
              isAnalyzingPacing={isAnalyzingPacingBeats}
              isBuildingTimeline={isBuildingTimeline}
              manuscriptIndex={manuscriptIndex}
              onSyncIndex={handleBuildManuscriptIndex}
              isIndexingIndex={isIndexingManuscript}
              lastIndexedAt={lastIndexedAt}
            />
            <main className="flex-grow flex flex-col overflow-hidden relative">
                <Toolbar editor={editor} toggleFocusMode={() => setFocusMode(!focusMode)} saveStatus={saveStatus} onSave={handleSave} />
                <div className="flex-grow overflow-y-auto">
                <Editor editor={editor} ref={printRef} />
                </div>
                <StatusBar 
                  wordCount={wordCount} 
                  charCount={charCount} 
                  writingGoal={writingGoal}
                  ttsStatus={ttsStatus}
                  onTtsPlayPause={handleTtsPlayPause}
                  onTtsStop={handleTtsStop}
                  collaboratorsOnline={collaboratorsOnline}
                  openCommentCount={openCommentCount}
                  onOpenComments={() => setIsCommentsPanelOpen(true)}
                />
                {activeSuggestion && editor && (
                <SuggestionBubble
                    issue={activeSuggestion.issue}
                    editorView={editor.view}
                    onAccept={handleAcceptSuggestion}
                    onDismiss={handleDismissSuggestion}
                />
                )}
            </main>
            <AiPanel 
              onRunCommand={handleRunCommand} 
              isCommandLoading={isCommandLoading}
              history={history}
              onRunGrammarCheck={() => handleRunGrammarCheck()}
              isCheckingGrammar={isCheckingGrammar}
              grammarIssueCount={grammarIssues.length}
              isLiveAnalysisEnabled={isLiveAnalysisEnabled}
              onLiveAnalysisToggle={setIsLiveAnalysisEnabled}
              onRunConsistencyCheck={handleRunConsistencyCheck}
              isCheckingConsistency={isCheckingConsistency}
              consistencyIssues={consistencyIssues}
              onRunExpertAgent={handleRunExpertAgent}
              isExpertLoading={isExpertLoading}
              onOpenWorldBible={() => setIsWorldBibleModalOpen(true)}
              onRunShowVsTell={handleRunShowVsTell}
              isAnalyzingShowVsTell={isAnalyzingShowVsTell}
              showVsTellIssues={showVsTellIssues}
              onApplyShowVsTellSuggestion={handleApplyShowVsTellSuggestion}
              onRunFactCheck={handleRunFactCheck}
              isCheckingFacts={isCheckingFacts}
              factCheckIssues={factCheckIssues}
              factCheckSources={factCheckSources}
              onRunDialogueAnalysis={handleRunDialogueAnalysis}
              isAnalyzingDialogue={isAnalyzingDialogue}
              dialogueIssues={dialogueIssues}
              onRunProsePolish={handleRunProsePolish}
              isPolishingProse={isPolishingProse}
              prosePolishIssues={prosePolishIssues}
              onApplyProsePolishSuggestion={handleApplyProsePolishSuggestion}
              onRunSensitivityCheck={handleRunSensitivityCheck}
              isAnalyzingSensitivity={isAnalyzingSensitivity}
              sensitivityIssues={sensitivityIssues}
              onApplySensitivitySuggestion={handleApplySensitivitySuggestion}
              onRunStructuralAnalysis={handleRunStructuralAnalysis}
              isAnalyzingStructure={isAnalyzingStructure}
              structuralIssues={structuralIssues}
              onRunComplianceScan={handleRunComplianceScan}
              isRunningCompliance={isRunningCompliance}
              complianceIssues={complianceIssues}
            />
            <CommentsPanel
              isOpen={isCommentsPanelOpen}
              onClose={() => setIsCommentsPanelOpen(false)}
              threads={commentThreads}
              collaboratorsOnline={collaboratorsOnline}
              onCreateThread={handleCreateCommentThread}
              onReply={handleReplyToThread}
              onResolve={handleResolveThread}
              onReopen={handleReopenThread}
              onDelete={handleDeleteThread}
              selectionAvailable={hasCommentSelection}
            />
          </>
        ) : activeView === 'publishing' ? (
            <PublishingView
              projects={opsProjects}
              manuscript={editor?.getText() || ''}
              coverArt={coverArt}
              onGenerateBlurb={handleGenerateBlurb}
              onGenerateKeywords={handleGenerateKeywords}
              onGenerateCoverArt={handleGenerateCoverArt}
              onOpenImageEditor={handleOpenImageEditor}
              onExportManuscript={(format) => {
                if (!editor) return;
                const content =
                  format === 'html' ? editor.getHTML() : editor.getText();
                const blob = new Blob(
                  [content],
                  {
                    type:
                      format === 'html'
                        ? 'text/html;charset=utf-8'
                        : 'text/plain;charset=utf-8',
                  }
                );
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download =
                  format === 'html'
                    ? 'manuscript.html'
                    : 'manuscript.txt';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              onOpenMarketingSuite={() => setActiveView('marketing')}
              onOpenDistributionSuite={() => setActiveView('audiobooks')}
              localizationPacks={localizationPacks}
              localizedMetadata={localizedMetadata}
              onGenerateLocalizationPack={handleGenerateLocalizationPack}
              onTranslateMetadata={handleTranslateMetadata}
              isGeneratingLocalizationPack={isGeneratingLocalizationPack}
              isGeneratingLocalizedMetadata={isGeneratingLocalizedMetadata}
              costPlan={costPlan}
              onGenerateCostPlan={handleGenerateCostPlan}
              isGeneratingCostPlan={isGeneratingCostPlan}
            />
        ) : activeView === 'illustration' ? (
            <IllustrationView
                onGenerateMoodboard={handleGenerateMoodboard}
                moodboardImages={moodboardImages}
                isLoading={isGeneratingMoodboard}
                initialText={editor?.getText().substring(0, 4000) || ''}
                onGenerateCharacterConcepts={handleGenerateCharacterConcepts}
                isGeneratingConcepts={isGeneratingConcepts}
                characterConcepts={characterConcepts}
                onSetReferenceImage={handleSetCharacterReferenceImage}
                onGenerateExpression={handleGenerateExpression}
                onGeneratePose={handleGeneratePose}
                onGenerateVariation={handleGenerateVariation}
                onGenerateTurnaround={handleGenerateTurnaround}
                scenes={scenes}
                onGenerateScene={handleGenerateScene}
                onDeleteScene={handleDeleteScene}
                panels={panels}
                onCreateLayout={handleCreateLayout}
                onGeneratePanel={handleGeneratePanel}
                onAddDialogue={handleAddDialogue}
                onAddSoundEffect={handleAddSoundEffect}
                onDeleteLayout={handleDeleteLayout}
                colorPalettes={colorPalettes}
                styleGuide={styleGuide}
                onCreateStyleGuide={handleCreateStyleGuide}
                onUpdateStyleGuide={handleUpdateStyleGuide}
                onUploadReference={handleUploadReference}
                onCreatePalette={handleCreatePalette}
                onDeletePalette={handleDeletePalette}
                environments={environments}
                props={props}
                maps={maps}
                symbols={symbols}
                onGenerateMap={handleGenerateMap}
                onGenerateSymbol={handleGenerateSymbol}
                onGenerateEnvironment={handleGenerateEnvironment}
                onGenerateProp={handleGenerateProp}
                onDeleteMap={handleDeleteMap}
                onDeleteSymbol={handleDeleteSymbol}
                onDeleteEnvironment={handleDeleteEnvironment}
                onDeleteProp={handleDeleteProp}
                covers={covers}
                onGenerateHeroImage={handleGenerateHeroImage}
                onGenerateFullJacket={handleGenerateFullJacket}
                onCreateTypography={handleCreateTypography}
                onGenerateMarketingGraphic={handleGenerateMarketingGraphic}
                onDeleteCover={handleDeleteCover}
                printSpecs={printSpecs}
                onUpdatePrintSpecs={handleUpdatePrintSpecs}
                onExportAsset={handleExportAsset}
                revisions={revisions}
                onCreateRevision={handleCreateRevision}
                onUpdateRevisionStatus={handleUpdateRevisionStatus}
                onAddRevisionResponse={handleAddRevisionResponse}
                onDeleteRevision={handleDeleteRevision}
                isGeneratingIllustration={isGeneratingIllustration}
            />
        ) : activeView === 'audiobooks' ? (
            <AudiobookView
              audiobookProjects={opsProjects}
              onCreateAudiobookProject={handleCreateAudiobookProject}
              onUpdateAudiobookProject={handleUpdateAudiobookProject}
              onDeleteAudiobookProject={handleDeleteAudiobookProject}
            />
        ) : activeView === 'marketing' ? (
            marketingView
        ) : activeView === 'statistics' ? (
            statisticsView
        ) : (
            <PlaceholderView view={activeView} />
        )}
        {(activeView === 'illustration' || activeView === 'audiobooks') && (
          <button
            onClick={() => handleOpenRightsDrawer(activeView === 'illustration' ? 'illustration' : 'audio')}
            className="fixed bottom-6 right-6 z-40 px-4 py-2 rounded-full bg-brand-primary text-white text-sm shadow-lg hover:bg-brand-primary-hover"
          >
            Rights Tracker
          </button>
        )}
        </div>

        {/* Modals */}
        <ResearchModal isOpen={isResearchModalOpen} onClose={() => setIsResearchModalOpen(false)} onImportBook={handleImportBook} manuscript={editor?.getText() || ''} />
        <FindReplaceModal isOpen={isFindReplaceModalOpen} onClose={() => setIsFindReplaceModalOpen(false)} editor={editor} />
        <WritingGoalModal isOpen={isWritingGoalModalOpen} onClose={() => setIsWritingGoalModalOpen(false)} onSetGoal={setWritingGoal} currentGoal={writingGoal} />
        <GeneratedContentModal isOpen={isGeneratedContentModalOpen} onClose={() => setIsGeneratedContentModalOpen(false)} title={generatedContent.title} content={generatedContent.content} />
        <VersionHistoryModal isOpen={isVersionHistoryModalOpen} onClose={() => setIsVersionHistoryModalOpen(false)} snapshots={snapshots} onSaveSnapshot={(name) => {}} onRestoreSnapshot={(content) => {}} />
        <PublishingModal isOpen={isPublishingModalOpen} onClose={() => setIsPublishingModalOpen(false)} manuscript={editor?.getText() || ''} coverArt={coverArt} onGenerateBlurb={handleGenerateBlurb} onGenerateCoverArt={handleGenerateCoverArt} onGenerateKeywords={handleGenerateKeywords} onOpenImageEditor={handleOpenImageEditor} />
        <MarketingModal isOpen={isMarketingModalOpen} onClose={() => setIsMarketingModalOpen(false)} onGenerateCampaign={handleGenerateMarketingCampaign} campaign={marketingCampaign} isLoading={isGeneratingCampaign} onOpenVideoTrailer={() => setIsVideoTrailerModalOpen(true)}/>
        <WorldBibleModal isOpen={isWorldBibleModalOpen} onClose={() => setIsWorldBibleModalOpen(false)} worldBible={worldBible} onUpdate={setWorldBible} />
        <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExport={handleExport} onPrint={() => {}} onCleanup={handleRunCleanup} isCleaningUp={isCleaningUp}/>
        <ImageEditorModal isOpen={isImageEditorOpen} onClose={() => setIsImageEditorOpen(false)} baseImage={imageToEdit} onSave={handleSaveEditedImage} onEditImage={editImage} />
        <VideoTrailerModal isOpen={isVideoTrailerModalOpen} onClose={() => setIsVideoTrailerModalOpen(false)} manuscript={editor?.getText() || ''} onGenerateVideo={generateVideo} onGetVideoStatus={getVideoOperationStatus} onGeneratePrompt={generateVideoPrompt} />
        <ChatModal isOpen={isChatModalOpen} onClose={() => setIsChatModalOpen(false)} messages={chatMessages} onSendMessage={handleSendMessage} isLoading={isChatLoading} />
        <AudiobookModal isOpen={isAudiobookModalOpen} onClose={() => setIsAudiobookModalOpen(false)} status={audiobookStatus} audioUrl={audiobookUrl} onGenerate={handleGenerateAudiobook} />
        <RightsDrawer
          isOpen={isRightsDrawerOpen}
          onClose={() => setIsRightsDrawerOpen(false)}
          records={rightsRecords}
          filter={rightsFilter}
          onFilterChange={setRightsFilter}
          onAddRecord={handleAddRightsRecord}
          onUpdateStatus={handleUpdateRightsRecordStatus}
        />
        
        {/* Hidden print trigger */}
        <div className="hidden">
            <ReactToPrint
                trigger={() => <button id="print-trigger">Print</button>}
                content={() => printRef.current}
            />
        </div>
        <input type="file" id="file-upload" className="hidden" accept=".txt,.html,.md" />
    </div>
  );
};
