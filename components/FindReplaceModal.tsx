import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/core';
import { searchPluginKey } from '../utils/searchExtension';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({ isOpen, onClose, editor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ from: number, to: number }[]>([]);

  const updateSearch = useCallback(() => {
    if (!editor || !searchTerm) {
      setResults([]);
      editor?.view.dispatch(editor.state.tr.setMeta(searchPluginKey, { searchTerm: '' }));
      return;
    }
    editor.view.dispatch(editor.state.tr.setMeta(searchPluginKey, { searchTerm }));
    const searchState = searchPluginKey.getState(editor.state);
    setResults(searchState.results);
    setCurrentIndex(0);
  }, [editor, searchTerm]);

  useEffect(() => {
    if (isOpen) {
      updateSearch();
    } else {
      // Clear search on close
      setSearchTerm('');
      setReplaceTerm('');
      if (editor) {
        editor.view.dispatch(editor.state.tr.setMeta(searchPluginKey, { searchTerm: '' }));
      }
    }
  }, [isOpen, editor, updateSearch]);

  useEffect(() => {
    updateSearch();
  }, [searchTerm, updateSearch]);

  useEffect(() => {
    if (results.length > 0) {
      const { from, to } = results[currentIndex];
      editor?.commands.setTextSelection({ from, to });
      editor?.commands.scrollIntoView();
    }
  }, [currentIndex, results, editor]);
  
  const handleNext = () => {
    if (results.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % results.length);
    }
  };

  const handlePrev = () => {
    if (results.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + results.length) % results.length);
    }
  };

  const handleReplace = () => {
    if (results.length > 0) {
      const { from, to } = results[currentIndex];
      editor?.chain().focus().setTextSelection({ from, to }).insertContent(replaceTerm).run();
    }
  };
  
  const handleReplaceAll = () => {
    if (results.length > 0 && editor) {
        const tr = editor.state.tr;
        results.reverse().forEach(({ from, to }) => {
            tr.replaceWith(from, to, replaceTerm);
        });
        editor.view.dispatch(tr);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print" onClick={onClose}>
      <div className="bg-brand-surface rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Find & Replace</h2>
        <div className="space-y-4">
            <input type="text" placeholder="Find..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border border-brand-border rounded-md bg-brand-bg"/>
            <input type="text" placeholder="Replace with..." value={replaceTerm} onChange={e => setReplaceTerm(e.target.value)} className="w-full p-2 border border-brand-border rounded-md bg-brand-bg"/>
        </div>
        <div className="flex items-center justify-between mt-4">
            <div>
                {results.length > 0 ? (
                    <span className="text-sm text-brand-text-secondary">{currentIndex + 1} of {results.length}</span>
                ) : (
                    <span className="text-sm text-brand-text-secondary">{searchTerm ? 'No results' : ''}</span>
                )}
            </div>
            <div className="flex gap-2">
                <button onClick={handlePrev} disabled={results.length === 0} className="px-3 py-1 rounded hover:bg-brand-border disabled:opacity-50">Prev</button>
                <button onClick={handleNext} disabled={results.length === 0} className="px-3 py-1 rounded hover:bg-brand-border disabled:opacity-50">Next</button>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={handleReplace} disabled={results.length === 0} className="p-2 rounded-md bg-brand-primary text-white hover:bg-brand-primary-hover disabled:bg-gray-500">Replace</button>
            <button onClick={handleReplaceAll} disabled={results.length === 0} className="p-2 rounded-md bg-brand-primary text-white hover:bg-brand-primary-hover disabled:bg-gray-500">Replace All</button>
        </div>
      </div>
    </div>
  );
};