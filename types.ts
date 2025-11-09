





export interface HistoryItem {
  id: string;
  type: 'user' | 'agent';
  prompt: string;
  content: string;
}

export interface Collaborator {
  id: string;
  name: string;
  avatarColor?: string;
}

export type CollaboratorPresenceState = 'editing' | 'idle' | 'offline';

export interface CollaborationPresence {
  collaborator: Collaborator;
  cursorPos: number;
  lastHeartbeat: number;
  state: CollaboratorPresenceState;
}

export interface CommentAnchor {
  from: number;
  to: number;
  excerpt: string;
}

export interface CommentMessage {
  id: string;
  author: Collaborator;
  content: string;
  createdAt: string;
}

export interface CommentThread {
  id: string;
  anchor: CommentAnchor;
  status: 'open' | 'resolved';
  messages: CommentMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ManuscriptSegment {
  id: string;
  heading: string;
  summary: string;
  quote: string;
  content: string;
}

export interface ManuscriptSearchResult {
  segmentId: string;
  relevance: number;
  rationale: string;
}

export type Retailer = 'Amazon KDP' | 'Barnes & Noble' | 'Draft2Digital' | 'Apple Books' | 'Kobo Writing Life';

export interface BookSearchResult {
  id: number;
  title: string;
  authors: { name: string }[];
  formats: {
    [key:string]: string;
  };
}

export interface GrammarIssue {
    id:string;
    type: 'spelling' | 'grammar' | 'style';
    original: string;
    suggestion: string;
    explanation: string;
    context: string; // The sentence or phrase containing the issue.
}

export interface ConsistencyIssue {
    type: 'Character' | 'Plot' | 'Timeline' | 'Setting';
    description: string;
    quote: string;
}

export interface ShowVsTellIssue {
    id: string;
    quote: string;
    explanation: string;
    suggestion: string;
}

export interface FactCheckIssue {
  claim: string;
  verdict: 'Verified' | 'Needs Correction' | 'Uncertain';
  explanation: string;
  sources: Source[];
}

export interface DialogueIssue {
    quote: string;
    issue: string;
    suggestion: string;
}

export interface ProsePolishIssue {
    id: string;
    original: string;
    suggestion: string;
    explanation: string;
}

export interface SensitivityIssue {
    id: string;
    quote: string;
    issue: string;
    explanation: string;
    suggestion: string;
}

export type ManuscriptSuggestionType = 'spelling' | 'grammar' | 'style' | 'narrative' | 'polish' | 'sensitivity';

export type ManuscriptSuggestionSource = 'grammar' | 'showVsTell' | 'prosePolish' | 'sensitivity';

export interface ManuscriptSuggestion {
    id: string;
    type: ManuscriptSuggestionType;
    original: string;
    suggestion: string;
    explanation: string;
    source: ManuscriptSuggestionSource;
}

export interface StructuralIssue {
    type: 'Pacing' | 'Plot Hole' | 'Character Arc' | 'Structural Suggestion';
    description: string;
    suggestion: string;
}

export interface Source {
  title: string;
  uri: string;
}

export interface PublishingOpportunity {
  trend: string;
  bookTitle: string;
  blurb: string;
  coverPrompt: string;
  justification: string;
  enhancementNotes: string;
  supplementaryContentNotes: string;
}

export interface LocalizationPack {
  locale: string;
  localizedTitle: string;
  hook: string;
  blurb: string;
  toneNotes: string;
}

export interface LocalizedMetadata {
  locale: string;
  keywords: string[];
  categories: string[];
  audienceNotes: string;
}

export interface RetailerRequirement {
  id: string;
  retailer: Retailer | 'Google Play Books';
  category: 'Metadata' | 'Cover' | 'Manuscript' | 'Audio' | 'Marketing';
  detail: string;
  status: 'pending' | 'ready';
}

export interface SubmissionAsset {
  label: string;
  status: 'ready' | 'missing';
  notes: string;
}

export interface RetailerSubmission {
  retailer: string;
  generatedAt: string;
  assets: SubmissionAsset[];
  priorityNotes: string;
}

export type AssetRightsStatus = 'clear' | 'pending' | 'restricted';

export interface AssetRightsRecord {
  id: string;
  assetName: string;
  assetType: 'illustration' | 'audio';
  licenseType: 'exclusive' | 'non-exclusive' | 'work-for-hire' | 'royalty-share';
  expiresOn?: string;
  referenceUrl?: string;
  notes: string;
  status: AssetRightsStatus;
  createdAt: string;
}

export interface LaunchScenario {
  name: string;
  summary: string;
  tradeoffs: string[];
  metrics: {
    timeToMarket: string;
    budgetImpact: string;
    expectedReach: string;
  };
  recommendations: string[];
}

export interface ComplianceIssue {
  id: string;
  category: 'copyright' | 'trademark' | 'safety' | 'style';
  severity: 'low' | 'medium' | 'high';
  excerpt: string;
  guidance: string;
}

export interface CostPlan {
  tier: string;
  totalBudget: number;
  estimatedTimeline: string;
  summary: string;
  costBreakdown: {
    label: string;
    amount: number;
  }[];
  notes: string[];
}

export interface SocialMediaPost {
  platform: 'X' | 'Facebook' | 'Instagram';
  postContent: string;
  hashtags: string[];
  visualPrompt: string;
}

export interface MarketingCampaign {
  day: number;
  theme: string;
  posts: SocialMediaPost[];
}

export interface Character {
  id: string;
  name: string;
  description: string;
}

export interface Setting {
  id: string;
  name: string;
  description: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
}

export type KnowledgeBibleType = 'series' | 'research' | 'styleTone' | 'canon' | 'licensingIP' | 'custom';

export interface KnowledgeBibleSource {
  id: string;
  name: string;
  sourceType: 'manuscript' | 'notes' | 'lore' | 'referenceBook' | 'article' | 'contract' | 'styleGuide' | 'other';
  storageRef: string;
  bookId?: string;
  seriesId?: string;
  projectId?: string;
}

export interface SeriesWorldRule {
  id: string;
  category: string;
  description: string;
  sourceIds: string[];
}

export interface Faction {
  id: string;
  name: string;
  description: string;
  relationships?: string;
}

export interface TimelineEvent {
  id: string;
  label: string;
  description: string;
  bookId?: string;
  sequence?: number;
  impacts?: string[];
}

export interface StyleToneGuideline {
  id: string;
  scope: 'series' | 'book' | 'brand' | 'global';
  notes: string;
  examples?: string[];
  bannedPatterns?: string[];
}

export interface ResearchFact {
  id: string;
  claim: string;
  citation?: string;
  sourceId?: string;
  reliability?: 'low' | 'medium' | 'high';
  topicTags?: string[];
}

export interface LicensingRule {
  id: string;
  description: string;
  category: 'allowedUse' | 'prohibitedUse' | 'attribution' | 'territory' | 'term' | 'other';
  sourceId?: string;
}

export interface CustomKnowledgeSection {
  id: string;
  title: string;
  content: string;
}

export interface KnowledgeBible {
  id: string;
  label: string;
  type: KnowledgeBibleType;
  scope?: {
    seriesId?: string;
    bookId?: string;
    projectId?: string;
    global?: boolean;
  };
  sources: KnowledgeBibleSource[];
  seriesData?: {
    worldRules?: SeriesWorldRule[];
    characters?: Character[];
    factions?: Faction[];
    locations?: Setting[];
    itemsArtifacts?: Item[];
    timelineEvents?: TimelineEvent[];
    styleToneGuidelines?: StyleToneGuideline[];
  };
  researchData?: {
    facts: ResearchFact[];
  };
  styleToneData?: {
    guidelines: StyleToneGuideline[];
  };
  licensingData?: {
    rules: LicensingRule[];
  };
  customData?: {
    sections: CustomKnowledgeSection[];
  };
}

/**
 * Deprecated: use KnowledgeBible with type: 'series' instead.
 */
export interface WorldBible {
  characters: Character[];
  settings: Setting[];
  items: Item[];
  seriesContext: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export interface OutlineItem {
    id: string;
    level: number;
    text: string;
    pos: number;
}

export interface PacingBeat {
    id: string;
    outlineId: string;
    heading: string;
    beatType: string;
    intensity: number; // 0-100 heat score
    notes: string;
}

export interface ContinuityEvent {
    id: string;
    outlineId?: string;
    label: string;
    summary: string;
    risk: 'low' | 'medium' | 'high';
    recommendation: string;
}

export type AiCommand = 
  | 'proofread'
  | 'summarize'
  | 'improve'
  | 'shorter'
  | 'longer'
  | 'change-tone-pro'
  | 'change-tone-casual'
  | 'generate-ideas'
  | 'generate-outline'
  | 'generate-chapter'
  | 'cleanup'
  | 'translate-es'
  | 'translate-fr'
  | 'accessible-version';

export type AiCommandOption = {
  value: AiCommand;
  label: string;
  description: string;
  prompt: string;
};

export const AI_COMMAND_OPTIONS: AiCommandOption[] = [
    { value: 'proofread', label: 'Proofread', description: 'Correct spelling and grammar', prompt: 'Proofread the following text for any spelling and grammar errors, and provide only the corrected version.' },
    { value: 'summarize', label: 'Summarize', description: 'Create a concise summary', prompt: 'Summarize the following text concisely.' },
    { value: 'improve', label: 'Improve Writing', description: 'Enhance clarity and flow', prompt: 'Improve the writing in the following text to make it clearer, more engaging, and more impactful. Provide only the improved version.' },
    { value: 'shorter', label: 'Make Shorter', description: 'Condense the selection', prompt: 'Make the following text shorter and more concise without losing its core meaning. Provide only the shortened version.' },
    { value: 'longer', label: 'Make Longer', description: 'Expand on the selection', prompt: 'Expand upon the following text, adding more detail and depth while maintaining the original tone and style. Provide only the expanded version.' },
    { value: 'change-tone-pro', label: 'To Professional', description: 'Adjust tone to be more formal', prompt: 'Rewrite the following text in a more professional and formal tone. Provide only the rewritten version.' },
    { value: 'change-tone-casual', label: 'To Casual', description: 'Adjust tone to be more informal', prompt: 'Rewrite the following text in a more casual and conversational tone. Provide only the rewritten version.' },
    { value: 'generate-ideas', label: 'Brainstorm Ideas', description: 'Get new ideas for the text', prompt: 'Brainstorm a list of 5-7 creative ideas to continue or expand upon the following text.' },
    { value: 'generate-outline', label: 'Create Outline', description: 'Generate a structured outline', prompt: 'Based on the following text, create a structured outline for a larger document or story.' },
    { value: 'generate-chapter', label: 'Write Next Chapter', description: 'Draft a continuation', prompt: 'Based on the following text which is the end of a chapter, write the beginning of the next chapter. Provide only the text for the next chapter.' },
    { value: 'translate-es', label: 'Translate (Spanish)', description: 'Produce a natural Spanish version', prompt: 'Translate the following text into neutral Latin American Spanish. Maintain literary voice and ensure culturally appropriate idioms. Provide only the translated text.' },
    { value: 'translate-fr', label: 'Translate (French)', description: 'Produce a natural French version', prompt: 'Translate the following text into Parisian French suitable for trade fiction. Maintain lyrical tone and gender agreements. Provide only the translated text.' },
    { value: 'accessible-version', label: 'Accessible Reading', description: 'Simplify for accessibility', prompt: 'Rewrite the following text in plain language suitable for accessibility adaptations. Keep sentences short, define uncommon terms, and maintain respectful tone.' },
];

export type NarrationStyle = {
    value: string;
    label: string;
    description: string;
    prompt: string;
};

export const NARRATION_STYLE_OPTIONS: NarrationStyle[] = [
    {
        value: 'cinematic',
        label: 'Warm, cinematic storyteller',
        description: 'A deep, resonant voice with a measured pace, perfect for epic fiction and immersive non-fiction.',
        prompt: 'Narrate the following text in a warm, cinematic, and deeply resonant storyteller voice with a measured pace. Emphasize emotional moments with subtle shifts in tone.'
    },
    {
        value: 'booktok',
        label: 'High-energy, youth-oriented BookTok style',
        description: 'A fast-paced, expressive, and dynamic voice that captures the excitement of modern young adult fiction.',
        prompt: 'Narrate the following text in a high-energy, expressive, and dynamic voice suitable for a young adult audience. The delivery should be fast-paced and capture a sense of excitement and urgency.'
    },
    {
        value: 'educational',
        label: 'Calm, authoritative educational/commercial',
        description: 'A clear, calm, and trustworthy voice. Ideal for non-fiction, business books, and educational content.',
        prompt: 'Narrate the following text in a calm, clear, and authoritative voice. The delivery should be professional and trustworthy, suitable for educational or commercial content.'
    },
    {
        value: 'performance',
        label: 'Dynamic full-cast performance',
        description: 'A single, highly versatile voice that creates distinct character voices and delivers narration with dramatic flair.',
        prompt: 'Narrate the following text in a dynamic performance style. Use a versatile voice to create distinct vocal profiles for different characters and deliver the narration with a sense of dramatic flair.'
    }
];

export type AppView = 'editing' | 'illustration' | 'audiobooks' | 'publishing' | 'marketing' | 'statistics';

export interface MoodboardImage {
  prompt: string;
  imageUrl: string;
}

export interface CharacterConcept {
  id: string;
  name: string;
  description: string;
  referenceImageUrl: string | null;
  conceptImages: string[];
  expressionLibrary?: CharacterExpression[];
  poseSets?: CharacterPose[];
  variations?: CharacterVariation[];
  turnaround?: CharacterTurnaround;
}

export interface CharacterExpression {
  id: string;
  emotion: string;
  imageUrl: string;
  notes?: string;
}

export interface CharacterPose {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export interface CharacterVariation {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export interface CharacterTurnaround {
  front: string;
  side: string;
  back: string;
  threeFourth: string;
}

export interface SceneIllustration {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  sceneType: 'chapter-opener' | 'key-moment' | 'background' | 'battle' | 'emotional' | 'dream';
  chapter?: number;
  notes?: string;
}

export interface PanelLayout {
  id: string;
  title: string;
  description: string;
  layoutType: 'comic' | 'manga' | 'webtoon' | 'graphic-novel';
  pageNumber: number;
  panels: Panel[];
  notes?: string;
}

export interface Panel {
  id: string;
  order: number;
  imageUrl?: string;
  dialogue?: string;
  caption?: string;
  soundEffects?: string;
  sketch?: string;
  cameraAngle?: 'close-up' | 'medium' | 'wide' | 'birds-eye' | 'worms-eye' | 'over-shoulder' | 'dutch-angle';
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: PaletteColor[];
  purpose: 'global' | 'chapter' | 'character' | 'environment';
  notes?: string;
}

export interface PaletteColor {
  name: string;
  hex: string;
  usage: string;
}

export interface StyleGuide {
  id: string;
  artStyle: 'anime' | 'realism' | 'painterly' | 'graphic-novel' | 'watercolor' | 'manga' | 'webtoon' | 'custom';
  lighting: 'film' | 'painterly' | 'comic' | 'natural';
  linework?: 'heavy' | 'light' | 'variable' | 'none';
  referenceImages: string[];
  globalPalette?: ColorPalette;
  notes?: string;
}

export interface EnvironmentDesign {
  id: string;
  name: string;
  description: string;
  environmentType: 'architectural' | 'natural' | 'urban' | 'fantasy' | 'scifi' | 'cultural';
  imageUrl: string;
  mood?: string;
  moodImages?: string[];
  notes?: string;
}

export interface PropDesign {
  id: string;
  name: string;
  description: string;
  propType: 'weapon' | 'vehicle' | 'technology' | 'artifact' | 'clothing' | 'other';
  imageUrl: string;
  scale?: string;
  materials?: string;
  loreNotes?: string;
}

export interface IllustrationSeeds {
  moodboardExcerpt: string;
  characterName: string;
  characterDescription: string;
  sceneTitle: string;
  sceneDescription: string;
  sceneType: SceneIllustration['sceneType'];
  layoutTitle: string;
  layoutDescription: string;
  layoutType: PanelLayout['layoutType'];
  panelPrompt?: string;
  paletteId?: string;
}

export interface MapDesign {
  id: string;
  name: string;
  description: string;
  mapType: 'world' | 'region' | 'city' | 'dungeon' | 'battle';
  imageUrl: string;
  scale?: string;
  style?: 'decorative' | 'realistic' | 'sketch';
  notes?: string;
}

export interface SymbolDesign {
  id: string;
  name: string;
  description: string;
  symbolType: string;
  faction?: string;
  imageUrl: string;
  meaning?: string;
  usage?: string;
}

export interface CoverDesign {
  id: string;
  title: string;
  heroImageUrl?: string;
  fullJacketUrl?: string;
  typography?: TypographyDesign;
  spine?: string;
  back?: string;
  bleed?: boolean;
}

export interface TypographyDesign {
  titleFont: string;
  titleStyle: string;
  authorFont: string;
  colorScheme: string[];
}

export interface PrintSpecs {
  format: 'kdp' | 'ingramSpark' | 'offset' | 'custom';
  trimSize: string;
  bleed: string;
  dpi: number;
  colorMode: 'RGB' | 'CMYK';
  pageCount?: number;
}

export interface RevisionFeedback {
  id: string;
  assetId: string;
  assetType: string;
  assetTitle?: string;
  comment: string;
  status: 'pending' | 'in-progress' | 'resolved';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  resolvedAt?: Date;
  responses?: RevisionResponse[];
}

export interface RevisionResponse {
  id: string;
  feedbackId: string;
  author: 'author' | 'artist';
  message: string;
  createdAt: Date;
}

export interface IllustrationProject {
  id: string;
  name: string;
  styleGuide: StyleGuide;
  characters: CharacterConcept[];
  scenes: SceneIllustration[];
  panels: PanelLayout[];
  environments: EnvironmentDesign[];
  props: PropDesign[];
  maps: MapDesign[];
  symbols: SymbolDesign[];
  covers: CoverDesign[];
  palettes: ColorPalette[];
  printSpecs?: PrintSpecs;
  revisionHistory: RevisionFeedback[];
}

// ============================================
// AUDIOBOOK PRODUCTION SYSTEM TYPES
// ============================================

// A) Manuscript Script Conversion
export interface NarrationScript {
  id: string;
  manuscriptId: string;
  title: string;
  scenes: SceneSegment[];
  pronunciationDictionary: PronunciationEntry[];
  characterVoiceTags: CharacterVoiceTag[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SceneSegment {
  id: string;
  sceneNumber: number;
  chapterNumber?: number;
  emotionalBeat: string;
  timingNotes?: string;
  content: string;
  toneCues: ToneCue[];
  breathMarks: BreathMark[];
}

export interface ToneCue {
  position: number;
  emotion: 'softly' | 'serious' | 'wounded' | 'smiling' | 'tense' | 'joyful' | 'angry' | 'fearful' | 'surprised' | 'custom';
  customEmotion?: string;
  intensity?: 'subtle' | 'moderate' | 'strong';
}

export interface BreathMark {
  position: number;
  duration: number; // milliseconds
  type: 'natural' | 'dramatic' | 'silence';
}

export interface PronunciationEntry {
  word: string;
  phonetic: string;
  ipa?: string;
  notes?: string;
}

export interface CharacterVoiceTag {
  characterName: string;
  voiceStyle: string;
  age: 'child' | 'teen' | 'young-adult' | 'adult' | 'elder';
  accent?: string;
  tempo: 'slow' | 'moderate' | 'fast';
  personality: string;
  voiceActorId?: string;
  aiVoiceModelId?: string;
}

// B) Voice Talent System
export type NarratorType = 'human' | 'ai' | 'hybrid';
export type ContractType = 'flat-rate' | 'hourly' | 'revenue-share' | 'royalty-share';
export type VoiceGender = 'male' | 'female' | 'neutral';
export type VoiceAge = 'young' | 'middle-aged' | 'mature' | 'senior';
export type VoiceStyle = 'warm' | 'neutral' | 'dark' | 'bright' | 'dramatic' | 'documentary' | 'energetic' | 'sultry' | 'authoritative';

export interface EmotionalProsody {
  pitch: number; // -20 to 20
  speed: number; // 0.5 to 2.0
  stability: number; // 0 to 100
  clarity: number; // 0 to 100
  style: number; // 0 to 100 (style exaggeration)
}

export interface VoiceTalent {
  id: string;
  name: string;
  type: NarratorType;
  gender: VoiceGender;
  ageRange: VoiceAge;
  voiceStyle: VoiceStyle;
  demoReelUrl?: string;
  genres: string[];
  genreSpecialties: string[];
  voiceCharacteristics: {
    tone: 'warm' | 'neutral' | 'dark' | 'bright' | 'dramatic' | 'documentary';
    clarity: number; // 1-10
    emotionalRange: number; // 1-10
  };
  contractType: ContractType;
  ratePerFinishedHour?: number;
  hourlyRate?: number;
  availability?: string;
  rating?: number;
  reviewCount?: number;
  experienceYears?: number;
  languagesCovered?: string[];
  accentVariants?: string[];
}

export interface AIVoiceModel {
  id: string;
  name: string;
  modelName: string;
  provider: 'elevenlabs' | 'google' | 'azure' | 'aws' | 'custom';
  modelId: string;
  voiceId?: string;
  voiceType: 'storyteller' | 'documentary' | 'youthful' | 'dramatic' | 'character';
  gender: VoiceGender;
  ageRange: VoiceAge;
  voiceStyle: VoiceStyle;
  emotionalProsodySupport: boolean;
  prosodyControls?: EmotionalProsody;
  languagesSupported: string[];
  costPerCharacter?: number;
  costPerThousandChars?: number;
  emotionalRange?: string[];
}

export interface CharacterVoiceAssignmentConfig {
  characterName: string;
  voiceType: 'human' | 'ai';
  voiceId: string;
}

export interface HybridPerformanceConfig {
  id: string;
  name: string;
  narratorVoice: VoiceTalent | AIVoiceModel;
  characterVoiceAssignments: CharacterVoiceAssignmentConfig[];
  useAIForNarration: boolean;
  useAIForDialogue: boolean;
  blendingStyle: 'distinct' | 'seamless' | 'cinematic';
  totalEstimatedCost: number;
  dialogueHandling?: 'distinct-voices' | 'narrator-performs' | 'mixed';
  characterVoices?: Map<string, VoiceTalent | AIVoiceModel>;
}

// C) Recording Session Pipeline
export interface RecordingSession {
  id: string;
  scriptId: string;
  talentId: string;
  sessionDate: Date;
  sessionType: 'human' | 'ai-generation' | 'hybrid';
  calibration?: StudioCalibration;
  recordings: RecordingTake[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'review-needed';
  totalDuration?: number; // minutes
  completionPercentage: number;
}

export interface StudioCalibration {
  roomEQ: string;
  noiseFloor: number; // dB
  micType: string;
  preampSettings: string;
  calibrationDate: Date;
}

export interface RecordingTake {
  id: string;
  sceneId: string;
  takeNumber: number;
  audioUrl: string;
  duration: number; // seconds
  quality: 'draft' | 'good' | 'final';
  notes?: string;
  timestamp: Date;
  retakesNeeded?: string[];
}

export interface PunchAndRollMarker {
  timestamp: number;
  reason: string;
  resolved: boolean;
}

// D) Audio Editing & Mastering
export interface AudioEditingProject {
  id: string;
  sessionId: string;
  rawAudioUrl: string;
  editedAudioUrl?: string;
  masteredAudioUrl?: string;
  edits: AudioEdit[];
  masteringSettings: MasteringSettings;
  qcChecks: QualityCheck[];
  status: 'raw' | 'editing' | 'mastering' | 'qc' | 'approved';
}

export interface AudioEdit {
  id: string;
  timestamp: number;
  editType: 'de-click' | 'de-sibilance' | 'noise-reduction' | 'breath-removal' | 'silence-adjustment' | 'eq' | 'compression';
  settings: Record<string, any>;
  applied: boolean;
}

export interface MasteringSettings {
  targetLoudness: number; // LUFS
  peakLimit: number; // dBFS
  eqPreset: 'cinematic-warm' | 'neutral-academic' | 'dark-intimate' | 'bright-youthful' | 'custom';
  compressionRatio: number;
  customEQ?: {
    low: number;
    mid: number;
    high: number;
  };
}

export interface QualityCheck {
  id: string;
  checkType: 'timing' | 'pronunciation' | 'tone-drift' | 'noise' | 'pacing' | 'emotional-consistency';
  status: 'pass' | 'fail' | 'warning';
  issues: string[];
  timestamp: Date;
  autoDetected: boolean;
}

// E) Cinematic Audiobook Features
export interface CinematicAudiobook {
  id: string;
  baseAudiobookId: string;
  fullCastVoices: CharacterVoiceAssignment[];
  soundscapes: Soundscape[];
  musicCues: MusicCue[];
  spatialAudioEnabled: boolean;
  mixedAudioUrl?: string;
}

export interface CharacterVoiceAssignment {
  characterName: string;
  voiceActorId: string;
  voiceSample: string;
  sceneAppearances: string[]; // scene IDs
}

export interface Soundscape {
  id: string;
  name: string;
  description: string;
  audioUrl: string;
  sceneIds: string[];
  volume: number; // 0-100
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
}

export interface MusicCue {
  id: string;
  name: string;
  musicUrl: string;
  sceneId: string;
  timestamp: number;
  duration: number;
  volume: number;
  mood: string;
  fadeIn?: number;
  fadeOut?: number;
}

// F) Format & Output Packaging
export interface AudiobookOutput {
  id: string;
  projectId: string;
  formats: AudioFormat[];
  metadata: AudiobookMetadata;
  coverArt: CoverArtAsset;
  chapterMarkers: ChapterMarker[];
  exportSettings: ExportSettings;
  status: 'generating' | 'ready' | 'published';
}

export interface AudioFormat {
  format: 'M4B' | 'MP3' | 'WAV' | 'FLAC' | 'AAC' | 'DAISY';
  bitrate?: number; // kbps
  sampleRate: number; // Hz
  bitDepth?: number; // for WAV
  fileUrl?: string;
  fileSize?: number; // MB
  duration: number; // seconds
}

export interface AudiobookMetadata {
  title: string;
  subtitle?: string;
  author: string;
  narrator: string;
  publisher: string;
  publishDate: Date;
  isbn?: string;
  asin?: string;
  language: string;
  genre: string[];
  description: string;
  copyright: string;
  series?: {
    name: string;
    position: number;
  };
}

export interface CoverArtAsset {
  imageUrl: string;
  dimensions: string; // e.g., "3000x3000"
  format: 'jpg' | 'png';
}

export interface ChapterMarker {
  chapterNumber: number;
  title: string;
  timestamp: number; // seconds
}

export interface ExportSettings {
  targetPlatforms: ('audible' | 'spotify' | 'apple' | 'google' | 'library')[];
  qualityPreset: 'standard' | 'high' | 'archival';
  includeChapterMarkers: boolean;
  normalizeAudio: boolean;
}

// G) Distribution Pipeline
export interface DistributionPipeline {
  id: string;
  audiobookId: string;
  platforms: PlatformDistribution[];
  royaltyConfig: RoyaltyConfiguration;
  status: 'preparing' | 'uploading' | 'review' | 'live' | 'failed';
  launchDate?: Date;
}

export interface PlatformDistribution {
  platform: 'audible' | 'acx' | 'spotify' | 'apple' | 'google' | 'overdrive' | 'hoopla' | 'findaway';
  status: 'pending' | 'uploaded' | 'processing' | 'approved' | 'live' | 'rejected';
  platformId?: string;
  uploadDate?: Date;
  liveDate?: Date;
  pricing: PricingTier;
  rejectionReason?: string;
}

export interface PricingTier {
  currency: string;
  retailPrice: number;
  wholesalePrice?: number;
  subscriptionTier?: 'included' | 'premium' | 'exclusive';
}

export interface RoyaltyConfiguration {
  model: 'royalty-share' | 'exclusive' | 'non-exclusive' | 'flat-rate';
  royaltyRate?: number; // percentage
  flatFee?: number;
  revenueShare?: {
    author: number;
    narrator: number;
    producer: number;
  };
}

// H) Marketing Assets
export interface AudiobookMarketingCampaign {
  id: string;
  audiobookId: string;
  launchDate: Date;
  assets: MarketingAsset[];
  emailCampaign?: EmailCampaign;
  reviewerOutreach?: ReviewerOutreach;
  analyticsTracking: MarketingAnalytics;
}

export interface MarketingAsset {
  id: string;
  type: 'waveform-video' | 'character-voice-teaser' | 'bts-narrator-clip' | 'visual-quote' | 'trailer';
  title: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'twitter' | 'all';
  assetUrl: string;
  duration?: number; // seconds
  createdDate: Date;
  performanceMetrics?: {
    views: number;
    engagement: number;
    clicks: number;
  };
}

export interface EmailCampaign {
  sequences: EmailSequence[];
  recipientLists: string[];
  trackingEnabled: boolean;
}

export interface EmailSequence {
  sequenceNumber: number;
  subject: string;
  content: string;
  sendDate: Date;
  targetAudience: 'pre-order' | 'launch' | 'follow-up' | 'review-request';
}

export interface ReviewerOutreach {
  targetReviewers: Reviewer[];
  pitchTemplate: string;
  reviewCopiesSent: number;
  reviewsReceived: number;
}

export interface Reviewer {
  name: string;
  platform: string;
  email: string;
  genre: string[];
  audienceSize: number;
  contacted: boolean;
  responded: boolean;
  reviewLink?: string;
}

export interface MarketingAnalytics {
  campaignId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  costPerAcquisition?: number;
  returnOnInvestment?: number;
}

// I) Royalty & Analytics Dashboard
export interface AudiobookAnalytics {
  audiobookId: string;
  period: {
    start: Date;
    end: Date;
  };
  listeningMetrics: ListeningMetrics;
  revenueMetrics: RevenueMetrics;
  platformBreakdown: PlatformMetrics[];
  chapterAnalytics: ChapterAnalytics[];
}

export interface ListeningMetrics {
  totalListens: number;
  totalListeningHours: number;
  averageCompletionRate: number; // percentage
  averageListeningSessionDuration: number; // minutes
  returningListeners: number;
  newListeners: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  royaltyEarnings: number;
  platformFees: number;
  netProfit: number;
  currency: string;
  payoutSchedule: Date[];
}

export interface PlatformMetrics {
  platform: string;
  listens: number;
  revenue: number;
  averageRating?: number;
  reviewCount?: number;
}

export interface ChapterAnalytics {
  chapterNumber: number;
  completionRate: number;
  averageListenTime: number;
  skipRate: number;
  replayRate: number;
  popularityScore: number;
}

// Audiobook Project Container
export interface AudiobookProject {
  id: string;
  title: string;
  author: string;
  manuscriptId?: string;
  narrationScript?: NarrationScript;
  voiceTalent?: VoiceTalent[];
  aiVoiceModels?: AIVoiceModel[];
  recordingSessions: RecordingSession[];
  editingProjects: AudioEditingProject[];
  cinematicFeatures?: CinematicAudiobook;
  outputs: AudiobookOutput[];
  distribution?: DistributionPipeline;
  marketing?: AudiobookMarketingCampaign;
  analytics?: AudiobookAnalytics;
  pricing: 'starter' | 'professional' | 'cinematic';
  status: 'planning' | 'scripting' | 'recording' | 'editing' | 'mastering' | 'distribution' | 'live';
  createdAt: Date;
  updatedAt: Date;
}

// Pricing tiers with detailed breakdown
export interface AudiobookPricingTier {
  tier: 'starter' | 'professional' | 'cinematic';
  name: string;
  description: string;
  features: string[];
  pricePerFinishedHour: {
    human: {
      min: number;
      max: number;
    };
    ai: {
      min: number;
      max: number;
    };
    hybrid?: {
      min: number;
      max: number;
    };
  };
  includes: {
    scriptPrep: boolean;
    multipleVoices: boolean;
    soundDesign: boolean;
    musicScore: boolean;
    spatialAudio: boolean;
    marketingKit: boolean;
    distribution: string[];
  };
}

export const AUDIOBOOK_PRICING_TIERS: AudiobookPricingTier[] = [
  {
    tier: 'starter',
    name: 'Professional Single-Narrator Audiobook',
    description: 'Clean, professional audiobook output without cinematic extras',
    features: [
      'Single professional or AI narrator',
      'Basic script prep',
      'Full editing & mastering',
      'MP3 + M4B formats',
      'Cover resizing for audiobook',
      'ACX/Audible compliant'
    ],
    pricePerFinishedHour: {
      human: { min: 1200, max: 3800 },
      ai: { min: 480, max: 1200 }
    },
    includes: {
      scriptPrep: true,
      multipleVoices: false,
      soundDesign: false,
      musicScore: false,
      spatialAudio: false,
      marketingKit: false,
      distribution: ['audible', 'spotify', 'apple', 'google']
    }
  },
  {
    tier: 'professional',
    name: 'Hybrid Performance + Character Voices',
    description: 'Multiple voice styles and expanded emotional experience',
    features: [
      'Character voice variations',
      'Enhanced emotional SSML tuning',
      'Optional light music transitions',
      'Engaging, vivid listening experience',
      'Distinguished dialogue',
      'Scene mood elevation'
    ],
    pricePerFinishedHour: {
      human: { min: 4200, max: 9500 },
      ai: { min: 2940, max: 6650 },
      hybrid: { min: 3360, max: 6175 }
    },
    includes: {
      scriptPrep: true,
      multipleVoices: true,
      soundDesign: true,
      musicScore: true,
      spatialAudio: false,
      marketingKit: true,
      distribution: ['audible', 'spotify', 'apple', 'google', 'library']
    }
  },
  {
    tier: 'cinematic',
    name: 'Full Cast Dramatic Production',
    description: 'Closest to Netflix / Audible Originals / Graphic Audio drama',
    features: [
      'Full cast of voices',
      'Music score composed or licensed',
      'Soundscapes / Atmosphere layers',
      'Spatial audio mixing',
      'Trailer + marketing launch kit',
      'BookTok-ready viral content',
      'Movie-like immersion'
    ],
    pricePerFinishedHour: {
      human: { min: 12000, max: 60000 },
      ai: { min: 8400, max: 42000 },
      hybrid: { min: 10200, max: 51000 }
    },
    includes: {
      scriptPrep: true,
      multipleVoices: true,
      soundDesign: true,
      musicScore: true,
      spatialAudio: true,
      marketingKit: true,
      distribution: ['audible', 'spotify', 'apple', 'google', 'library', 'findaway']
    }
  }
];
