import React from 'react';
import { AppView } from '../types';
import { BarChartIcon, BookUpIcon, FilePenIcon, HeadphonesIcon, ImageIcon, MegaphoneIcon, VwaLogo } from './icons/IconDefs';

interface NavbarProps {
    activeView: AppView;
    setActiveView: (view: AppView) => void;
}

const NavButton: React.FC<{
    label: string;
    view: AppView;
    activeView: AppView;
    onClick: (view: AppView) => void;
    Icon: React.FC<any>;
}> = ({ label, view, activeView, onClick, Icon }) => {
    const isActive = activeView === view;
    return (
        <button
            onClick={() => onClick(view)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                isActive 
                ? 'bg-brand-primary/20 text-brand-primary' 
                : 'text-brand-text-secondary hover:bg-brand-border hover:text-brand-text'
            }`}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );
};

export const Navbar: React.FC<NavbarProps> = ({ activeView, setActiveView }) => {
    return (
        <nav className="flex-shrink-0 bg-brand-surface p-2 flex items-center justify-between no-print border-b border-brand-border">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <VwaLogo className="w-8 h-8 text-brand-primary" />
                    <span className="font-bold text-lg hidden sm:inline">AI Agency</span>
                </div>
                <div className="w-px h-6 bg-brand-border"></div>
                <div className="flex items-center gap-1">
                    <NavButton label="Editing" view="editing" activeView={activeView} onClick={setActiveView} Icon={FilePenIcon} />
                    <NavButton label="Illustration" view="illustration" activeView={activeView} onClick={setActiveView} Icon={ImageIcon} />
                    <NavButton label="Audiobooks" view="audiobooks" activeView={activeView} onClick={setActiveView} Icon={HeadphonesIcon} />
                    <NavButton label="Publishing" view="publishing" activeView={activeView} onClick={setActiveView} Icon={BookUpIcon} />
                    <NavButton label="Marketing" view="marketing" activeView={activeView} onClick={setActiveView} Icon={MegaphoneIcon} />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <NavButton label="Statistics" view="statistics" activeView={activeView} onClick={setActiveView} Icon={BarChartIcon} />
            </div>
        </nav>
    );
};