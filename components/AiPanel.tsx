import React, { useState } from 'react';
import { HistoryPanel } from './HistoryPanel';
import { BotIcon, CheckIcon, ChevronDownIcon, SparklesIcon, BookCheckIcon, ShieldCheckIcon, BrainCircuitIcon, ClapperboardIcon, ShieldQuestionIcon, MessagesSquareIcon, FeatherIcon, UsersIcon, SitemapIcon } from './icons/IconDefs';
import { AiCommand, HistoryItem, AI_COMMAND_OPTIONS, ConsistencyIssue, ShowVsTellIssue, FactCheckIssue, Source, DialogueIssue, ProsePolishIssue, SensitivityIssue, StructuralIssue, ComplianceIssue } from '../types';

interface AiPanelProps {
  onRunCommand: (command: AiCommand, customPrompt: string) => void;
  isCommandLoading: boolean;
  history: HistoryItem[];
  onRunGrammarCheck: () => void;
  isCheckingGrammar: boolean;
  grammarIssueCount: number;
  isLiveAnalysisEnabled: boolean;
  onLiveAnalysisToggle: (enabled: boolean) => void;
  onRunConsistencyCheck: () => void;
  isCheckingConsistency: boolean;
  consistencyIssues: ConsistencyIssue[];
  onRunExpertAgent: (prompt: string) => void;
  isExpertLoading: boolean;
  onOpenWorldBible: () => void;
  onRunShowVsTell: () => void;
  isAnalyzingShowVsTell: boolean;
  showVsTellIssues: ShowVsTellIssue[];
  onApplyShowVsTellSuggestion: (issue: ShowVsTellIssue) => void;
  onRunFactCheck: () => void;
  isCheckingFacts: boolean;
  factCheckIssues: FactCheckIssue[];
  factCheckSources: Source[];
  onRunDialogueAnalysis: () => void;
  isAnalyzingDialogue: boolean;
  dialogueIssues: DialogueIssue[];
  onRunProsePolish: () => void;
  isPolishingProse: boolean;
  prosePolishIssues: ProsePolishIssue[];
  onApplyProsePolishSuggestion: (issue: ProsePolishIssue) => void;
  onRunSensitivityCheck: () => void;
  isAnalyzingSensitivity: boolean;
  sensitivityIssues: SensitivityIssue[];
  onApplySensitivitySuggestion: (issue: SensitivityIssue) => void;
  onRunStructuralAnalysis: () => void;
  isAnalyzingStructure: boolean;
  structuralIssues: StructuralIssue[];
  onRunComplianceScan: () => void;
  isRunningCompliance: boolean;
  complianceIssues: ComplianceIssue[];
}

const AssistantPanel: React.FC<{ onRunCommand: AiPanelProps['onRunCommand'], isLoading: boolean }> = ({ onRunCommand, isLoading }) => {
  const [selectedCommand, setSelectedCommand] = useState<AiCommand>('proofread');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectedOption = AI_COMMAND_OPTIONS.find(opt => opt.value === selectedCommand);

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-sm font-medium text-brand-text-secondary block mb-1">Select an Action</label>
        <div className="relative">
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full bg-brand-bg border border-brand-border rounded-md p-2 flex justify-between items-center text-left">
                <div>
                    <p className="font-semibold text-sm">{selectedOption?.label}</p>
                    <p className="text-xs text-brand-text-secondary">{selectedOption?.description}</p>
                </div>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-brand-surface border border-brand-border rounded-md shadow-lg">
                    {AI_COMMAND_OPTIONS.map(option => (
                        <div key={option.value} onClick={() => { setSelectedCommand(option.value); setIsDropdownOpen(false); }} className="p-2 hover:bg-brand-border cursor-pointer flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-sm">{option.label}</p>
                                <p className="text-xs text-brand-text-secondary">{option.description}</p>
                            </div>
                            {selectedCommand === option.value && <CheckIcon className="w-4 h-4 text-brand-primary"/>}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
      <div>
        <label htmlFor="custom-prompt" className="text-sm font-medium text-brand-text-secondary block mb-1">Or, write a custom prompt</label>
        <textarea id="custom-prompt" rows={3} value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} className="w-full p-2 border border-brand-border rounded-md bg-brand-bg resize-none" placeholder="e.g., 'Turn this into a poem'" />
      </div>
      <button onClick={() => onRunCommand(selectedCommand, customPrompt)} disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-2 font-semibold bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover disabled:bg-gray-500">
        {isLoading ? ( <><svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...</> ) : ( <><SparklesIcon className="w-5 h-5" /> Run AI Command</> )}
      </button>
    </div>
  );
};

const EditorPanelTabButton: React.FC<{label:string, isActive:boolean, onClick:() => void}> = ({label, isActive, onClick}) => (
    <button onClick={onClick} className={`px-3 py-2 text-sm font-semibold border-b-2 transition-colors ${isActive ? 'text-brand-primary border-brand-primary' : 'text-brand-text-secondary border-transparent hover:text-brand-text'}`}>
        {label}
    </button>
);

type EditorPanelProps = Pick<AiPanelProps, 
    'onRunGrammarCheck' | 'isCheckingGrammar' | 'grammarIssueCount' | 'isLiveAnalysisEnabled' | 
    'onLiveAnalysisToggle' | 'onRunConsistencyCheck' | 'isCheckingConsistency' | 'consistencyIssues' | 
    'onRunShowVsTell' | 'isAnalyzingShowVsTell' | 'showVsTellIssues' | 'onApplyShowVsTellSuggestion' | 
    'onRunFactCheck' | 'isCheckingFacts' | 'factCheckIssues' | 'factCheckSources' | 
    'onRunDialogueAnalysis' | 'isAnalyzingDialogue' | 'dialogueIssues' | 'onRunProsePolish' | 
    'isPolishingProse' | 'prosePolishIssues' | 'onApplyProsePolishSuggestion' | 'onRunSensitivityCheck' | 
    'isAnalyzingSensitivity' | 'sensitivityIssues' | 'onApplySensitivitySuggestion' | 
    'onRunStructuralAnalysis' | 'isAnalyzingStructure' | 'structuralIssues' |
    'onRunComplianceScan' | 'isRunningCompliance' | 'complianceIssues'
>;

const EditorPanel: React.FC<EditorPanelProps> = ({ 
    onRunGrammarCheck, isCheckingGrammar, grammarIssueCount, isLiveAnalysisEnabled, onLiveAnalysisToggle, 
    onRunConsistencyCheck, isCheckingConsistency, consistencyIssues, onRunShowVsTell, isAnalyzingShowVsTell, 
    showVsTellIssues, onApplyShowVsTellSuggestion, onRunFactCheck, isCheckingFacts, factCheckIssues, 
    factCheckSources, onRunDialogueAnalysis, isAnalyzingDialogue, dialogueIssues, onRunProsePolish, 
    isPolishingProse, prosePolishIssues, onApplyProsePolishSuggestion, onRunSensitivityCheck, 
    isAnalyzingSensitivity, sensitivityIssues, onApplySensitivitySuggestion, onRunStructuralAnalysis, 
    isAnalyzingStructure, structuralIssues, onRunComplianceScan, isRunningCompliance, complianceIssues 
}) => {
    const [activeTab, setActiveTab] = useState('grammar');

    return (
        <div className="p-4 space-y-4">
            <div className="flex border-b border-brand-border -mx-4 px-1 justify-around">
                <EditorPanelTabButton label="Grammar" isActive={activeTab === 'grammar'} onClick={() => setActiveTab('grammar')} />
                <EditorPanelTabButton label="Structure" isActive={activeTab === 'structure'} onClick={() => setActiveTab('structure')} />
                <EditorPanelTabButton label="Narrative" isActive={activeTab === 'narrative'} onClick={() => setActiveTab('narrative')} />
                <EditorPanelTabButton label="Polish" isActive={activeTab === 'polish'} onClick={() => setActiveTab('polish')} />
                <EditorPanelTabButton label="Review" isActive={activeTab === 'review'} onClick={() => setActiveTab('review')} />
            </div>

            {activeTab === 'grammar' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-brand-bg p-3 rounded-md">
                        <label htmlFor="live-analysis" className="text-sm font-medium">Live Analysis</label>
                        <button role="switch" aria-checked={isLiveAnalysisEnabled} onClick={() => onLiveAnalysisToggle(!isLiveAnalysisEnabled)} id="live-analysis" className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isLiveAnalysisEnabled ? 'bg-brand-primary' : 'bg-brand-border'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isLiveAnalysisEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <div className="bg-brand-bg p-3 rounded-md">
                        <div className="flex justify-between items-center">
                            <p className="text-sm">Issues Found: <span className="font-bold text-lg">{grammarIssueCount}</span></p>
                            <button onClick={onRunGrammarCheck} disabled={isCheckingGrammar} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-brand-surface hover:bg-brand-border disabled:opacity-50 border border-brand-border">
                                {isCheckingGrammar ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Checking...</> : <><BookCheckIcon className="w-4 h-4"/>Check Document</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'structure' && (
                 <div className="space-y-4">
                    <button onClick={onRunStructuralAnalysis} disabled={isAnalyzingStructure} className="w-full flex items-center justify-center gap-2 py-2 font-semibold bg-brand-primary/20 text-brand-primary rounded-md hover:bg-brand-primary/30 disabled:opacity-50">
                       {isAnalyzingStructure ? <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Analyzing...</> : <><SitemapIcon className="w-5 h-5" /> Analyze Manuscript Structure</>}
                    </button>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {structuralIssues.length > 0 ? (
                            structuralIssues.map((issue, index) => (
                                <div key={index} className="bg-brand-bg p-3 rounded-md text-sm">
                                    <p className="font-semibold text-brand-text mb-1 flex items-center gap-2">
                                        <span className="text-brand-primary/80 text-xs font-bold py-0.5 px-1.5 bg-brand-border rounded">{issue.type}</span>
                                    </p>
                                    <p className="text-brand-text-secondary text-xs mb-2">{issue.description}</p>
                                    <div className="bg-brand-surface p-2 rounded-md border border-brand-border/50">
                                      <p className="text-xs text-green-400 font-semibold mb-1">Suggestion:</p>
                                      <p className="text-xs text-brand-text">{issue.suggestion}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            !isAnalyzingStructure && <p className="text-sm text-center text-brand-text-secondary pt-4">No structural issues found. Run an analysis to get developmental feedback.</p>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'narrative' && (
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={onRunShowVsTell} disabled={isAnalyzingShowVsTell} className="w-full flex items-center justify-center gap-2 py-2 font-semibold bg-brand-primary/20 text-brand-primary rounded-md hover:bg-brand-primary/30 disabled:opacity-50">
                           {isAnalyzingShowVsTell ? <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></> : <><ClapperboardIcon className="w-5 h-5" /></>}
                           <span className="text-xs">Show vs. Tell</span>
                        </button>
                        <button onClick={onRunDialogueAnalysis} disabled={isAnalyzingDialogue} className="w-full flex items-center justify-center gap-2 py-2 font-semibold bg-brand-primary/20 text-brand-primary rounded-md hover:bg-brand-primary/30 disabled:opacity-50">
                           {isAnalyzingDialogue ? <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></> : <><MessagesSquareIcon className="w-5 h-5" /></>}
                           <span className="text-xs">Dialogue</span>
                        </button>
                    </div>
                    <div className="space-y-2 max-h-[24rem] overflow-y-auto pr-1">
                        {showVsTellIssues.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase text-brand-text-secondary">Show vs. Tell Issues</h4>
                                {showVsTellIssues.map((issue, index) => (
                                    <div key={index} className="bg-brand-bg p-3 rounded-md text-sm space-y-2">
                                        <blockquote className="border-l-2 border-red-500/50 pl-2 text-xs italic text-brand-text-secondary/80">
                                            <strong>Telling:</strong> "{issue.quote}"
                                        </blockquote>
                                        <p className="text-brand-text-secondary text-xs">{issue.explanation}</p>
                                        <div className="bg-brand-surface p-2 rounded-md border border-brand-border/50">
                                            <p className="text-xs text-green-400 font-semibold mb-1">Suggestion:</p>
                                            <p className="text-xs text-brand-text">"{issue.suggestion}"</p>
                                        </div>
                                        <button onClick={() => onApplyShowVsTellSuggestion(issue)} className="w-full text-xs mt-1 py-1 rounded bg-brand-border hover:bg-brand-primary/20">Apply Suggestion</button>
                                    </div>
                                ))}
                            </div>
                        )}
                         {dialogueIssues.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase text-brand-text-secondary mt-4">Dialogue Issues</h4>
                                {dialogueIssues.map((issue, index) => (
                                    <div key={index} className="bg-brand-bg p-3 rounded-md text-sm space-y-2">
                                        <blockquote className="border-l-2 border-yellow-500/50 pl-2 text-xs italic text-brand-text-secondary/80">"{issue.quote}"</blockquote>
                                        <p className="font-semibold text-xs text-yellow-400">{issue.issue}</p>
                                        <p className="text-brand-text-secondary text-xs">{issue.suggestion}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {(isAnalyzingShowVsTell || isAnalyzingDialogue) && <p className="text-sm text-center text-brand-text-secondary pt-4">Analyzing narrative...</p>}
                        {!isAnalyzingShowVsTell && !isAnalyzingDialogue && showVsTellIssues.length === 0 && dialogueIssues.length === 0 && <p className="text-sm text-center text-brand-text-secondary pt-4">No narrative issues found.</p>}
                    </div>
                </div>
            )}
            
            {activeTab === 'polish' && (
                <div className="space-y-4">
                    <button onClick={onRunProsePolish} disabled={isPolishingProse} className="w-full flex items-center justify-center gap-2 py-2 font-semibold bg-brand-primary/20 text-brand-primary rounded-md hover:bg-brand-primary/30 disabled:opacity-50">
                        {isPolishingProse ? <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Analyzing...</> : <><FeatherIcon className="w-5 h-5" /> Run Prose Polish</>}
                    </button>
                    <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
                        {prosePolishIssues.length > 0 ? (
                            prosePolishIssues.map((issue, index) => (
                                <div key={index} className="bg-brand-bg p-3 rounded-md text-sm space-y-2">
                                    <blockquote className="border-l-2 border-red-500/50 pl-2 text-xs italic text-brand-text-secondary/80">
                                        <strong>Original:</strong> "{issue.original}"
                                    </blockquote>
                                    <p className="text-brand-text-secondary text-xs font-semibold">{issue.explanation}</p>
                                    <div className="bg-brand-surface p-2 rounded-md border border-brand-border/50">
                                        <p className="text-xs text-green-400 font-semibold mb-1">Suggestion:</p>
                                        <p className="text-xs text-brand-text">"{issue.suggestion}"</p>
                                    </div>
                                    <button onClick={() => onApplyProsePolishSuggestion(issue)} className="w-full text-xs mt-1 py-1 rounded bg-brand-border hover:bg-brand-primary/20">Apply Suggestion</button>
                                </div>
                            ))
                        ) : (
                            !isPolishingProse && <p className="text-sm text-center text-brand-text-secondary pt-4">No prose polishing suggestions found.</p>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'review' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={onRunFactCheck} disabled={isCheckingFacts} className="w-full flex items-center justify-center gap-2 py-2 font-semibold bg-brand-primary/20 text-brand-primary rounded-md hover:bg-brand-primary/30 disabled:opacity-50">
                            {isCheckingFacts ? <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></> : <><ShieldQuestionIcon className="w-5 h-5" /></>}
                            <span className="text-xs">Fact-Check</span>
                        </button>
                        <button onClick={onRunSensitivityCheck} disabled={isAnalyzingSensitivity} className="w-full flex items-center justify-center gap-2 py-2 font-semibold bg-brand-primary/20 text-brand-primary rounded-md hover:bg-brand-primary/30 disabled:opacity-50">
                            {isAnalyzingSensitivity ? <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></> : <><UsersIcon className="w-5 h-5" /></>}
                            <span className="text-xs">Sensitivity</span>
                        </button>
                        <button onClick={onRunComplianceScan} disabled={isRunningCompliance} className="w-full flex items-center justify-center gap-2 py-2 font-semibold bg-brand-primary/20 text-brand-primary rounded-md hover:bg-brand-primary/30 disabled:opacity-50">
                            {isRunningCompliance ? <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></> : <><ShieldCheckIcon className="w-5 h-5" /></>}
                            <span className="text-xs">Compliance</span>
                        </button>
                    </div>
                    <div className="space-y-2 max-h-[24rem] overflow-y-auto pr-1">
                        {factCheckIssues.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase text-brand-text-secondary">Fact-Check Results</h4>
                                {factCheckIssues.map((issue, index) => {
                                    const verdictColor = {
                                        'Verified': 'text-green-400',
                                        'Needs Correction': 'text-yellow-400',
                                        'Uncertain': 'text-gray-400',
                                    }[issue.verdict];
                                    return (
                                    <div key={index} className="bg-brand-bg p-3 rounded-md text-sm space-y-2">
                                        <blockquote className="border-l-2 border-brand-primary/50 pl-2 text-xs italic text-brand-text-secondary/80">
                                            <strong>Claim:</strong> "{issue.claim}"
                                        </blockquote>
                                        <p className={`font-semibold text-xs ${verdictColor}`}>{issue.verdict}</p>
                                        <p className="text-brand-text-secondary text-xs">{issue.explanation}</p>
                                    </div>
                                )})}
                                {factCheckSources.length > 0 && (
                                    <div className="bg-brand-bg p-3 rounded-md text-sm space-y-2 mt-2 border-t border-brand-border/50">
                                        <h4 className="font-semibold text-xs text-brand-text-secondary">Sources Consulted:</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {factCheckSources.map((source, index) => (
                                                <li key={index} className="text-xs">
                                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate" title={source.title}>
                                                        {source.title || source.uri}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                         {sensitivityIssues.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase text-brand-text-secondary mt-4">Sensitivity & Inclusivity</h4>
                                {sensitivityIssues.map((issue, index) => (
                                    <div key={index} className="bg-brand-bg p-3 rounded-md text-sm space-y-2">
                                        <blockquote className="border-l-2 border-purple-400/50 pl-2 text-xs italic text-brand-text-secondary/80">
                                            "{issue.quote}"
                                        </blockquote>
                                        <p className="font-semibold text-xs text-purple-300">{issue.issue}</p>
                                        <p className="text-brand-text-secondary text-xs">{issue.explanation}</p>
                                        <div className="bg-brand-surface p-2 rounded-md border border-brand-border/50">
                                            <p className="text-xs text-green-400 font-semibold mb-1">Suggestion:</p>
                                            <p className="text-xs text-brand-text">"{issue.suggestion}"</p>
                                        </div>
                                        <button onClick={() => onApplySensitivitySuggestion(issue)} className="w-full text-xs mt-1 py-1 rounded bg-brand-border hover:bg-brand-primary/20">Apply Suggestion</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {complianceIssues.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase text-brand-text-secondary mt-4">Compliance Flags</h4>
                                {complianceIssues.map((issue) => (
                                    <div key={issue.id} className="bg-brand-bg p-3 rounded-md text-sm space-y-2 border border-brand-border/40">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold capitalize">{issue.category}</span>
                                            <span className={`px-2 py-0.5 rounded-full uppercase text-[10px] ${
                                                issue.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                                issue.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-emerald-500/20 text-emerald-300'
                                            }`}>{issue.severity}</span>
                                        </div>
                                        <blockquote className="border-l-2 border-brand-border/70 pl-2 text-xs italic text-brand-text-secondary/80">"{issue.excerpt}"</blockquote>
                                        <p className="text-[11px] text-brand-text-secondary">{issue.guidance}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                         {(isCheckingFacts || isAnalyzingSensitivity || isRunningCompliance) && <p className="text-sm text-center text-brand-text-secondary pt-4">Analyzing document...</p>}
                         {!isCheckingFacts && !isAnalyzingSensitivity && !isRunningCompliance && factCheckIssues.length === 0 && sensitivityIssues.length === 0 && complianceIssues.length === 0 && <p className="text-sm text-center text-brand-text-secondary pt-4">No review issues found.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

const ExpertPanel: React.FC<Pick<AiPanelProps, 'onRunExpertAgent' | 'isExpertLoading' | 'onOpenWorldBible'>> =
({ onRunExpertAgent, isExpertLoading, onOpenWorldBible }) => {
    const [prompt, setPrompt] = useState('');

    return (
        <div className="p-4 space-y-4">
            <div>
                <h3 className="text-sm font-medium text-brand-text-secondary mb-1">1. Build Your World Bible</h3>
                <p className="text-xs text-brand-text-secondary mb-2">The Expert Agent uses your World Bible for context. Add characters, settings, and items for the deepest analysis.</p>
                <button onClick={onOpenWorldBible} className="w-full text-sm text-center p-2 border-2 border-dashed border-brand-border rounded-md hover:border-brand-primary hover:bg-brand-primary/10">
                    Open World Bible
                </button>
            </div>
            <div>
                <h3 className="text-sm font-medium text-brand-text-secondary mb-1">2. Ask an Expert Question</h3>
                <p className="text-xs text-brand-text-secondary mb-2">Ask a question that requires knowledge of both your manuscript and the World Bible.</p>
                <textarea
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full p-2 border border-brand-border rounded-md bg-brand-bg resize-none"
                    placeholder="e.g., 'Does the description of Captain Eva's starship in Chapter 5 match the specs in the World Bible?'"
                />
            </div>
            <button onClick={() => onRunExpertAgent(prompt)} disabled={isExpertLoading || !prompt} className="w-full flex items-center justify-center gap-2 py-2 font-semibold bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover disabled:bg-gray-500">
                {isExpertLoading ? (
                    <><svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...</>
                ) : (
                    <><BrainCircuitIcon className="w-5 h-5" /> Run Expert Agent</>
                )}
            </button>
        </div>
    );
};

const AiPanelTabButton: React.FC<{label:string, isActive:boolean, onClick:() => void, Icon: React.FC<any>}> = ({label, isActive, onClick, Icon}) => (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-semibold border-b-2 transition-colors ${isActive ? 'text-brand-primary border-brand-primary' : 'text-brand-text-secondary border-transparent hover:text-brand-text'}`}>
        <Icon className="w-5 h-5"/> {label}
    </button>
);

export const AiPanel: React.FC<AiPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState('Assistant');

  return (
    <div className="w-80 bg-brand-surface flex flex-col no-print no-focus border-l border-brand-border">
        <div className="flex items-center gap-3 p-4 border-b border-brand-border">
            <BotIcon className="w-8 h-8 text-brand-primary" />
            <div>
                <h2 className="text-lg font-bold">AI Manuscript Studio</h2>
                <p className="text-xs text-brand-text-secondary">Your creative co-pilot</p>
            </div>
        </div>
        
        <div className="flex border-b border-brand-border">
            <AiPanelTabButton label="Assistant" Icon={SparklesIcon} isActive={activeTab === 'Assistant'} onClick={() => setActiveTab('Assistant')} />
            <AiPanelTabButton label="Editor" Icon={BookCheckIcon} isActive={activeTab === 'Editor'} onClick={() => setActiveTab('Editor')} />
            <AiPanelTabButton label="Expert" Icon={BrainCircuitIcon} isActive={activeTab === 'Expert'} onClick={() => setActiveTab('Expert')} />
        </div>

        <div className="flex-grow overflow-y-auto">
            {activeTab === 'Assistant' && <AssistantPanel onRunCommand={props.onRunCommand} isLoading={props.isCommandLoading} />}
            {activeTab === 'Editor' && <EditorPanel {...props} />}
            {activeTab === 'Expert' && <ExpertPanel onRunExpertAgent={props.onRunExpertAgent} isExpertLoading={props.isExpertLoading} onOpenWorldBible={props.onOpenWorldBible} />}
        </div>
        
        <div className="flex-shrink-0">
            <HistoryPanel history={props.history} />
        </div>
    </div>
  );
};
