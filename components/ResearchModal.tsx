import React, { useState, useEffect } from 'react';
import { BookSearchResult, PublishingOpportunity } from '../types';
import { BotIcon, LightbulbIcon, SearchIcon, SendIcon, TrendingUpIcon } from './icons/IconDefs';
import { runResearchAgent, searchPublicDomainBooks, getPublicDomainBookText, runMarketSurveyorAgent } from '../services/geminiService';

interface ResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportBook: (data: { content: string; blurb?: string; coverPrompt?: string; }) => void;
  manuscript: string;
}

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-brand-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const GENRE_OPTIONS = [
    "Science Fiction",
    "Fantasy",
    "Gothic Romance",
    "Mystery & Detective",
    "Adventure",
    "Classic Literature"
];

const TabButton: React.FC<{label:string, isActive:boolean, onClick:() => void, Icon: React.FC<any>}> = ({label, isActive, onClick, Icon}) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${isActive ? 'text-brand-primary border-brand-primary' : 'text-brand-text-secondary border-transparent hover:text-brand-text'}`}>
        <Icon className="w-5 h-5"/> {label}
    </button>
);

export const ResearchModal: React.FC<ResearchModalProps> = ({ isOpen, onClose, onImportBook, manuscript }) => {
  const [view, setView] = useState<'idea' | 'search' | 'trends'>('idea');
  
  const [ideaPrompt, setIdeaPrompt] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [importingId, setImportingId] = useState<number | string | null>(null);

  const [selectedGenre, setSelectedGenre] = useState(GENRE_OPTIONS[0]);
  const [isSurveying, setIsSurveying] = useState(false);
  const [opportunities, setOpportunities] = useState<PublishingOpportunity[]>([]);
  const [importingMessage, setImportingMessage] = useState<string | null>(null);


  useEffect(() => {
    if (isOpen) {
      // Reset state when opening
      setView('idea');
      setIdeaPrompt('');
      setAgentResponse('');
      setSearchQuery('');
      setSearchResults([]);
      setIsAgentProcessing(false);
      setIsSearching(false);
      setImportingId(null);
      setOpportunities([]);
      setIsSurveying(false);
      setImportingMessage(null);
    }
  }, [isOpen]);

  const handleGenerateIdea = async () => {
    if (!ideaPrompt.trim()) return;
    setIsAgentProcessing(true);
    setAgentResponse('');
    try {
      const response = await runResearchAgent(ideaPrompt, manuscript);
      setAgentResponse(response);
    } catch (error) {
      alert('Failed to get idea from AI agent.');
    } finally {
      setIsAgentProcessing(false);
    }
  };

  const handleRunSurveyor = async () => {
    setIsSurveying(true);
    setOpportunities([]);
    try {
      const results = await runMarketSurveyorAgent(selectedGenre);
      setOpportunities(results);
    } catch (error) {
      alert("Failed to get market analysis from AI agent.");
    } finally {
      setIsSurveying(false);
    }
  };
  
  const handleStartProject = async (opportunity: PublishingOpportunity) => {
    const opportunityId = opportunity.bookTitle;
    setImportingId(opportunityId);
    setImportingMessage(`Searching for "${opportunity.bookTitle}"...`);
    try {
        const searchResults = await searchPublicDomainBooks(opportunity.bookTitle);
        const book = searchResults.find(r => r.formats['text/plain; charset=utf-8']);

        if (!book || !book.formats['text/plain; charset=utf-8']) {
            alert(`Could not find a plain text version for "${opportunity.bookTitle}".`);
            setImportingId(null);
            setImportingMessage(null);
            return;
        }

        setImportingMessage(`Downloading manuscript...`);
        const text = await getPublicDomainBookText(book.formats['text/plain; charset=utf-8']);
        
        setImportingMessage(`Preparing editor...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // UI sugar to let user see message

        onImportBook({
            content: text,
            blurb: opportunity.blurb,
            coverPrompt: opportunity.coverPrompt,
        });

    } catch (error) {
        alert('Failed to import the project.');
        setImportingMessage(null);
    } finally {
        setImportingId(null);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearchQuery(query);
    setView('search');
    setIsSearching(true);
    setSearchResults([]);
    try {
        const results = await searchPublicDomainBooks(query);
        setSearchResults(results.filter(r => r.formats['text/plain; charset=utf-8']));
    } catch (error) {
        alert('Failed to search for books.');
    } finally {
        setIsSearching(false);
    }
  };

  const handleImport = async (book: BookSearchResult) => {
    const textUrl = book.formats['text/plain; charset=utf-8'];
    if (!textUrl) {
      alert('This book does not have a plain text version available.');
      return;
    }
    setImportingId(book.id);
    setImportingMessage(`Importing "${book.title}"...`)
    try {
      const text = await getPublicDomainBookText(textUrl);
      onImportBook({ content: text });
    } catch (error) {
      alert('Failed to import book content.');
      setImportingMessage(null);
    } finally {
      setImportingId(null);
    }
  }

  const parseBookTitleFromResponse = (): string | null => {
    const match = agentResponse.match(/\*\*Book Title:\s*(.*)\*\*/);
    return match ? match[1] : null;
  };
  
  const suggestedTitle = parseBookTitleFromResponse();


  const renderIdeaView = () => (
    <>
      <div className="flex items-center gap-3 mb-4">
          <LightbulbIcon className="w-8 h-8 text-brand-primary" />
          <div>
            <h2 id="research-modal-title" className="text-xl font-bold">AI Research Assistant</h2>
            <p className="text-sm text-brand-text-secondary">Get ideas for your next public domain project.</p>
          </div>
      </div>
      <div className="space-y-4">
        <div>
            <label htmlFor="idea-prompt" className="text-sm font-medium text-brand-text-secondary">Your Idea Prompt</label>
            <div className="mt-1 relative">
                <textarea
                    id="idea-prompt"
                    rows={3}
                    value={ideaPrompt}
                    onChange={(e) => setIdeaPrompt(e.target.value)}
                    className="w-full p-2 pr-10 border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none bg-brand-bg resize-none"
                    placeholder="e.g., 'What classic horror novel would be great to remake with modern illustrations?'"
                    disabled={isAgentProcessing}
                />
                <button
                    onClick={handleGenerateIdea}
                    disabled={isAgentProcessing || !ideaPrompt.trim()}
                    className="absolute bottom-2 right-2 p-1.5 rounded-md text-brand-primary disabled:text-brand-text-secondary hover:bg-brand-border disabled:hover:bg-transparent"
                    aria-label="Generate Idea"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
        
        {isAgentProcessing && <div className="flex items-center justify-center gap-2 text-brand-text-secondary pt-4"><LoadingSpinner /><span>Agent is thinking...</span></div>}

        {agentResponse && !isAgentProcessing && (
            <div className="bg-brand-bg rounded-md p-4 space-y-4">
                <pre className="text-sm text-brand-text-secondary whitespace-pre-wrap font-sans">{agentResponse}</pre>
                {suggestedTitle && (
                    <button
                        onClick={() => handleSearch(suggestedTitle)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover transition-colors"
                    >
                        <SearchIcon className="w-4 h-4" />
                        Search for "{suggestedTitle}"
                    </button>
                )}
            </div>
        )}
      </div>
    </>
  );

  const renderSearchView = () => (
    <>
      <div className="mb-4">
        <h2 className="text-xl font-bold">Public Domain Book Search</h2>
        <div className="relative mt-2">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                className="w-full p-2 pl-10 border border-brand-border rounded-md bg-brand-bg focus:ring-2 focus:ring-brand-primary focus:outline-none"
                placeholder="Search for a book..."
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
        </div>
      </div>
      
      {isSearching && <div className="flex items-center justify-center gap-2 text-brand-text-secondary pt-4"><LoadingSpinner /><span>Searching...</span></div>}

      {!isSearching && (
        <div className="space-y-2 overflow-y-auto max-h-[50vh]">
          {searchResults.length === 0 ? (
            <p className="text-sm text-center text-brand-text-secondary py-8">No results found.</p>
          ) : (
            searchResults.map(book => (
              <div key={book.id} className="bg-brand-bg p-3 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-semibold">{book.title}</p>
                  <p className="text-xs text-brand-text-secondary">{book.authors.map(a => a.name).join(', ')}</p>
                </div>
                <button
                    onClick={() => handleImport(book)}
                    disabled={importingId === book.id}
                    className="px-3 py-1.5 text-xs font-semibold bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover disabled:bg-gray-500 w-40 text-center"
                >
                    {importingId === book.id ? <LoadingSpinner /> : 'Import into Manuscript'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );

  const renderTrendsView = () => (
    <>
        <div className="flex items-center gap-3 mb-4">
            <TrendingUpIcon className="w-8 h-8 text-brand-primary" />
            <div>
                <h2 className="text-xl font-bold">Market Surveyor Agent</h2>
                <p className="text-sm text-brand-text-secondary">Discover data-driven publishing opportunities.</p>
            </div>
        </div>
        <div className="flex gap-4 items-end bg-brand-bg p-3 rounded-md">
            <div className="flex-grow">
                <label htmlFor="genre-select" className="text-sm font-medium text-brand-text-secondary">Select a Genre</label>
                <select id="genre-select" value={selectedGenre} onChange={e => setSelectedGenre(e.target.value)} className="w-full mt-1 p-2 border border-brand-border rounded-md bg-brand-surface">
                    {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>
            <button onClick={handleRunSurveyor} disabled={isSurveying} className="px-4 py-2 font-semibold bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover disabled:bg-gray-500 h-10">
                {isSurveying ? "Analyzing..." : "Analyze Market"}
            </button>
        </div>
        <div className="mt-4 space-y-4 overflow-y-auto max-h-[45vh] p-1">
            {isSurveying && <div className="flex items-center justify-center gap-2 text-brand-text-secondary pt-8"><LoadingSpinner /><span>Surveying market trends... this may take a moment.</span></div>}
            {opportunities.map((op, index) => (
                <div key={index} className="bg-brand-bg rounded-lg p-4 border border-brand-border">
                    <p className="text-xs uppercase font-bold text-brand-primary">{op.trend}</p>
                    <h3 className="text-lg font-semibold mt-1">{op.bookTitle}</h3>
                    <p className="text-xs text-brand-text-secondary mt-1 italic">"{op.justification}"</p>
                    
                    <div className="mt-4 space-y-3">
                        <div>
                            <p className="font-semibold text-xs text-brand-text">Enhancement Strategy:</p>
                            <div className="text-xs bg-brand-surface p-2 rounded whitespace-pre-wrap font-sans text-brand-text-secondary border border-brand-border/50">
                                {op.enhancementNotes}
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold text-xs text-brand-text">Supplementary Content Ideas:</p>
                            <div className="text-xs bg-brand-surface p-2 rounded whitespace-pre-wrap font-sans text-brand-text-secondary border border-brand-border/50">
                                {op.supplementaryContentNotes}
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold text-xs text-brand-text">New Blurb:</p>
                            <p className="text-xs max-h-20 overflow-y-auto bg-brand-surface p-2 rounded border border-brand-border/50">{op.blurb}</p>
                        </div>
                         <div>
                            <p className="font-semibold text-xs text-brand-text">Cover Art Prompt:</p>
                            <p className="text-xs italic bg-brand-surface p-2 rounded border border-brand-border/50">"{op.coverPrompt}"</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => handleStartProject(op)}
                        disabled={!!importingId}
                        className="w-full mt-4 py-2 font-semibold bg-green-600/20 text-green-400 rounded-md hover:bg-green-600/40 disabled:opacity-50"
                    >
                         {importingId === op.bookTitle ? <LoadingSpinner /> : 'Start This Project'}
                    </button>
                </div>
            ))}
        </div>
    </>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 no-print" onClick={onClose}>
        <div className="bg-brand-surface rounded-lg shadow-2xl w-full max-w-3xl flex flex-col relative" style={{height: '85vh'}}>
            {importingMessage && (
                <div className="absolute inset-0 bg-brand-surface/90 flex flex-col items-center justify-center z-20 rounded-lg">
                    <LoadingSpinner />
                    <p className="mt-4 text-lg font-semibold text-brand-text">{importingMessage}</p>
                    <p className="text-sm text-brand-text-secondary">Please wait, this may take a moment.</p>
                </div>
            )}
            <div className="flex border-b border-brand-border">
                <TabButton label="Ideation Assistant" Icon={LightbulbIcon} isActive={view === 'idea'} onClick={() => setView('idea')} />
                <TabButton label="Market Surveyor" Icon={TrendingUpIcon} isActive={view === 'trends'} onClick={() => setView('trends')} />
                <TabButton label="Manual Search" Icon={SearchIcon} isActive={view === 'search'} onClick={() => setView('search')} />
            </div>
            <div className="p-6 flex-grow overflow-hidden">
                {view === 'idea' && renderIdeaView()}
                {view === 'trends' && renderTrendsView()}
                {view === 'search' && renderSearchView()}
            </div>
        </div>
    </div>
  );
};