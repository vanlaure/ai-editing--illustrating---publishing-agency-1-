import React from 'react';
import { Editor } from '@tiptap/core';
import {
  BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon,
  Heading1Icon, Heading2Icon, ListIcon, ListOrderedIcon,
  QuoteIcon, UndoIcon, RedoIcon, MaximizeIcon, SaveIcon
} from './icons/IconDefs';

interface ToolbarProps {
  editor: Editor | null;
  toggleFocusMode: () => void;
  saveStatus: 'saved' | 'dirty' | 'saving';
  onSave: () => void;
}

const ToolbarButton: React.FC<{ onClick: () => void; isActive?: boolean; children: React.ReactNode; disabled?: boolean; }> = ({ onClick, isActive, children, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-md hover:bg-brand-border transition-colors ${isActive ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-text-secondary'} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
  >
    {children}
  </button>
);

export const Toolbar: React.FC<ToolbarProps> = ({ editor, toggleFocusMode, saveStatus, onSave }) => {
  if (!editor) {
    return null;
  }

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'dirty':
        return 'Unsaved';
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
    }
  };

  return (
    <div className="bg-brand-surface p-2 flex items-center space-x-1 no-print border-b border-brand-border">
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
        <BoldIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
        <ItalicIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}>
        <UnderlineIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}>
        <StrikethroughIcon className="w-5 h-5" />
      </ToolbarButton>
      <div className="w-px h-6 bg-brand-border mx-1"></div>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>
        <Heading1Icon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>
        <Heading2Icon className="w-5 h-5" />
      </ToolbarButton>
      <div className="w-px h-6 bg-brand-border mx-1"></div>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
        <ListIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
        <ListOrderedIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')}>
        <QuoteIcon className="w-5 h-5" />
      </ToolbarButton>
      <div className="w-px h-6 bg-brand-border mx-1"></div>
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>
        <UndoIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>
        <RedoIcon className="w-5 h-5" />
      </ToolbarButton>
      <div className="flex-grow"></div>
       <div className="flex items-center gap-2 text-sm text-brand-text-secondary mr-2">
        <span className={`transition-opacity duration-300 ${saveStatus === 'saving' ? 'animate-pulse' : ''}`}>{getSaveStatusText()}</span>
        <ToolbarButton onClick={onSave} disabled={saveStatus !== 'dirty'} isActive={saveStatus === 'dirty'}>
            <SaveIcon className="w-5 h-5" />
        </ToolbarButton>
      </div>
      <ToolbarButton onClick={toggleFocusMode}>
        <MaximizeIcon className="w-5 h-5" />
      </ToolbarButton>
    </div>
  );
};