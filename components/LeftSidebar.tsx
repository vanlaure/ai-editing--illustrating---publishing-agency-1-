import React from 'react';
import {
    LightbulbIcon, SearchIcon, PrinterIcon, SettingsIcon, TargetIcon, HistoryIcon, Volume2Icon, BookUpIcon, FileUpIcon, VwaLogo, MegaphoneIcon, BookOpenIcon, DownloadIcon, MessageSquareIcon, MessagesSquareIcon, HeadphonesIcon, PanelLeftIcon
} from './icons/IconDefs';

interface LeftSidebarProps {
    onUpload: () => void;
    onOpenResearch: () => void;
    onOpenFind: () => void;
    onToggleNavPane: () => void;
    onPrint: () => void;
    onOpenGoal: () => void;
    onOpenHistory: () => void;
    onReadAloud: () => void;
    onPublish: () => void;
    onOpenMarketing: () => void;
    onOpenWorldBible: () => void;
    onOpenExport: () => void;
    onOpenChat: () => void;
    onOpenAudiobook: () => void;
    onOpenComments: () => void;
}

const SidebarButton: React.FC<{ onClick: () => void; label: string; children: React.ReactNode; }> = ({ onClick, label, children }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center w-full py-3 px-1 text-xs text-brand-text-secondary hover:bg-brand-border hover:text-brand-text rounded-md transition-colors"
        aria-label={label}
    >
        {children}
        <span className="mt-1">{label}</span>
    </button>
);

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ onUpload, onOpenResearch, onOpenFind, onToggleNavPane, onPrint, onOpenGoal, onOpenHistory, onReadAloud, onPublish, onOpenMarketing, onOpenWorldBible, onOpenExport, onOpenChat, onOpenAudiobook, onOpenComments }) => {
  return (
    <div className="w-20 bg-brand-surface p-2 flex flex-col items-center space-y-2 no-print no-focus border-r border-brand-border">
      <VwaLogo className="w-10 h-10 text-brand-primary" />
      <div className="w-full h-px bg-brand-border my-2"></div>
      <SidebarButton onClick={onUpload} label="Upload">
        <FileUpIcon className="w-6 h-6" />
      </SidebarButton>
      <SidebarButton onClick={onOpenResearch} label="Research">
        <LightbulbIcon className="w-6 h-6" />
      </SidebarButton>
      <SidebarButton onClick={onOpenWorldBible} label="World Bible">
        <BookOpenIcon className="w-6 h-6" />
      </SidebarButton>
       <SidebarButton onClick={onToggleNavPane} label="Navigate">
        <PanelLeftIcon className="w-6 h-6" />
      </SidebarButton>
      <SidebarButton onClick={onOpenChat} label="Chat">
        <MessageSquareIcon className="w-6 h-6" />
      </SidebarButton>
      <SidebarButton onClick={onOpenComments} label="Comments">
        <MessagesSquareIcon className="w-6 h-6" />
      </SidebarButton>
      <SidebarButton onClick={onOpenFind} label="Find">
        <SearchIcon className="w-6 h-6" />
      </SidebarButton>
      <SidebarButton onClick={onOpenGoal} label="Goal">
        <TargetIcon className="w-6 h-6" />
      </SidebarButton>
      <SidebarButton onClick={onOpenHistory} label="History">
        <HistoryIcon className="w-6 h-6" />
      </SidebarButton>
       <SidebarButton onClick={onReadAloud} label="Read Aloud">
        <Volume2Icon className="w-6 h-6" />
      </SidebarButton>
      <div className="flex-grow"></div>
       <SidebarButton onClick={onOpenAudiobook} label="Narrate">
        <HeadphonesIcon className="w-6 h-6" />
      </SidebarButton>
      <SidebarButton onClick={onOpenMarketing} label="Marketing">
        <MegaphoneIcon className="w-6 h-6" />
      </SidebarButton>
       <SidebarButton onClick={onOpenExport} label="Export">
        <DownloadIcon className="w-6 h-6" />
      </SidebarButton>
      <SidebarButton onClick={onPublish} label="Publish">
        <BookUpIcon className="w-6 h-6" />
      </SidebarButton>
      <SidebarButton onClick={onPrint} label="Print">
        <PrinterIcon className="w-6 h-6" />
      </SidebarButton>
      <SidebarButton onClick={() => alert('Settings not implemented.')} label="Settings">
        <SettingsIcon className="w-6 h-6" />
      </SidebarButton>
      <div className="pt-2">
        <p className="text-[10px] text-brand-text-secondary whitespace-nowrap">By Van Williams AI</p>
      </div>
    </div>
  );
};
